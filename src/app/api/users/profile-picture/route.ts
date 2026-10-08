import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'profile');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, and WEBP images are allowed.' }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File size must be under 5MB.' }, { status: 400 });
    }

    // Determine extension
    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    const ext = extMap[file.type] || '.jpg';
    const filename = `${session.userId}_${uuidv4()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const publicUrl = `/uploads/profile/${filename}`;

    // Delete old profile picture if exists
    const db = getDb();
    let oldPicture: string | null = null;
    if (session.role === 'STUDENT') {
      const row = db.prepare('SELECT profile_picture FROM student_profiles WHERE uid = ?').get(session.userId) as { profile_picture: string | null } | undefined;
      oldPicture = row?.profile_picture || null;
    } else if (session.role === 'TEACHER') {
      const row = db.prepare('SELECT profile_picture FROM teacher_profiles WHERE uid = ?').get(session.userId) as { profile_picture: string | null } | undefined;
      oldPicture = row?.profile_picture || null;
    }

    if (oldPicture) {
      const oldPath = path.join(process.cwd(), 'public', oldPicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Write new file
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(bytes));

    // Update DB
    if (session.role === 'STUDENT') {
      db.prepare('UPDATE student_profiles SET profile_picture = ? WHERE uid = ?').run(publicUrl, session.userId);
    } else if (session.role === 'TEACHER') {
      db.prepare('UPDATE teacher_profiles SET profile_picture = ? WHERE uid = ?').run(publicUrl, session.userId);
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('[Profile Picture Upload] Error:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSessionFromRequest();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const db = getDb();
    let oldPicture: string | null = null;

    if (session.role === 'STUDENT') {
      const row = db.prepare('SELECT profile_picture FROM student_profiles WHERE uid = ?').get(session.userId) as { profile_picture: string | null } | undefined;
      oldPicture = row?.profile_picture || null;
      db.prepare('UPDATE student_profiles SET profile_picture = NULL WHERE uid = ?').run(session.userId);
    } else if (session.role === 'TEACHER') {
      const row = db.prepare('SELECT profile_picture FROM teacher_profiles WHERE uid = ?').get(session.userId) as { profile_picture: string | null } | undefined;
      oldPicture = row?.profile_picture || null;
      db.prepare('UPDATE teacher_profiles SET profile_picture = NULL WHERE uid = ?').run(session.userId);
    }

    if (oldPicture) {
      const oldPath = path.join(process.cwd(), 'public', oldPicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Profile Picture Delete] Error:', error);
    return NextResponse.json({ error: 'Delete failed.' }, { status: 500 });
  }
}
