import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { generateStudentCode, getDb } from '@/lib/db';
import { provisionUserSchool } from '@/lib/school';
import { createSession, COOKIE_NAME, SESSION_DURATION_DAYS } from '@/lib/session';

const PHONE_REGEX = /^[6-9]\d{9}$/; // Indian mobile number

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, confirmPassword, role, phone, className, board, medium, parentGuardianName, schoolName } = body;

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required.' }, { status: 400 });
    }

    if (role === 'PLATFORM_ADMIN') {
      const inviteCode = body.inviteCode;
      const expectedCode = process.env.ADMIN_INVITE_CODE;
      
      if (!expectedCode) {
        return NextResponse.json({ error: 'Platform Administrator registration is currently unavailable.' }, { status: 503 });
      }
      
      if (!inviteCode || inviteCode !== expectedCode) {
        return NextResponse.json({ error: 'Invalid or missing platform admin invite code.' }, { status: 403 });
      }
    } else if (role === 'SCHOOL_ADMIN') {
      const inviteCode = body.inviteCode;
      const expectedCode = process.env.SCHOOL_ADMIN_INVITE_CODE;
      
      if (!expectedCode) {
        return NextResponse.json({ error: 'School Administrator registration is currently unavailable.' }, { status: 503 });
      }
      
      if (!inviteCode || inviteCode !== expectedCode) {
        return NextResponse.json({ error: 'Invalid or missing school admin invite code.' }, { status: 403 });
      }
    } else if (!['STUDENT', 'TEACHER', 'PARENT'].includes(role)) {
      return NextResponse.json({ error: 'This role cannot be created through public registration.' }, { status: 403 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (role === 'STUDENT') {
      if (typeof parentGuardianName !== 'string' || !parentGuardianName.trim()) {
        return NextResponse.json({ error: 'Parent or guardian name is required for students.' }, { status: 400 });
      }
      if (!phone) {
        return NextResponse.json({ error: 'Phone number is required for students.' }, { status: 400 });
      }
      const cleanPhone = phone.replace(/[\s\-\+]/g, '');
      if (!PHONE_REGEX.test(cleanPhone)) {
        return NextResponse.json({ error: 'Please enter a valid 10-digit Indian mobile number.' }, { status: 400 });
      }
      if (!board || !medium) {
        return NextResponse.json({ error: 'Board and medium are required for students.' }, { status: 400 });
      }
    }
    // Every school-scoped role needs a school so Teacher / School Admin modules can
    // resolve `users.school_id`. Platform admins stay platform-wide.
    if (role !== 'PLATFORM_ADMIN' && (!schoolName || !schoolName.trim())) {
      return NextResponse.json({ error: 'School name is required.' }, { status: 400 });
    }

    const db = getDb();

    // Check email uniqueness
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return NextResponse.json({ error: 'This email address is already registered. Please sign in.' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // Insert user
    db.prepare(
      'INSERT INTO users (id, email, password, role, status) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, email.toLowerCase().trim(), passwordHash, role, 'ACTIVE');

    // Insert profile based on role
    if (role === 'STUDENT') {
      const cleanPhone = phone.replace(/[\s\-\+]/g, '');
      db.prepare(`
        INSERT INTO student_profiles
          (uid, display_name, phone_number, class_name, board, medium, parent_guardian_name, student_code, school_name, xp, level, streak_days, questions_solved, total_study_minutes, onboarding_completed, baseline_completed, learning_goals)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, 0, 0, 0, 0, 0, '[]')
      `).run(
        userId,
        name.trim(),
        cleanPhone,
        className || 'Class 9',
        board || 'CBSE',
        medium || 'ENGLISH',
        parentGuardianName.trim(),
        generateStudentCode(db),
        schoolName.trim()
      );
    } else if (role === 'TEACHER') {
      db.prepare(
        'INSERT INTO teacher_profiles (uid, display_name, phone_number) VALUES (?, ?, ?)'
      ).run(userId, name.trim(), phone || null);
    }

    // Attach the account to a school (creating the class/section scaffolding the
    // Teacher, Attendance and Reports modules depend on).
    provisionUserSchool(db, userId, {
      schoolName,
      role,
      className: className || 'Class 9',
    });

    // Create session
    const token = await createSession(userId, email.toLowerCase().trim(), role);

    const res = NextResponse.json({ 
      success: true, 
      user: { id: userId, email: email.toLowerCase().trim(), role },
      message: 'Account created successfully.' 
    }, { status: 201 });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('[Register API] Error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
