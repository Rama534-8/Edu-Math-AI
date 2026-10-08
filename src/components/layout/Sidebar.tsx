'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  PenTool,
  HelpCircle,
  Award,
  Sparkles,
  Camera,
  FileCheck,
  Bot,
  Calendar,
  BarChart3,
  TrendingUp,
  FileText,
  BookmarkCheck,
  User,
  Settings,
  Users,
  Building,
  LogOut,
  ShieldCheck,
  Zap,
  UserCog,
  ClipboardList,
  CalendarCheck,
  Bell,
  Megaphone,
  School,
  Mic,
  Target,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { role, studentProfile, logout } = useAuth();

  const studentNavGroups = [
    {
      group: 'Core Learning',
      items: [
        { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
        { label: 'Syllabus Hierarchy', path: '/student/syllabus', icon: BookOpen },
        { label: 'Learn Lessons', path: '/student/learn', icon: GraduationCap },
        { label: 'Practice Engine', path: '/student/practice', icon: PenTool },
        { label: 'Quizzes', path: '/student/quizzes', icon: HelpCircle },
        { label: 'Smart Revision', path: '/student/revision', icon: Zap },
        { label: 'Mock Exams', path: '/student/mock-exams', icon: ClipboardList },
        { label: 'Exam Preparation', path: '/student/exam-prep', icon: Sparkles, badge: 'New' },
        { label: 'Assignments', path: '/student/assignments', icon: BookmarkCheck },
      ],
    },
    {
      group: 'AI Math Accelerators ⭐',
      items: [
        { label: 'AI Maths Tutor', path: '/student/ai-tutor', icon: Bot, badge: 'Tutor' },
        { label: 'AI Image Solver', path: '/student/ai-solver', icon: Camera, badge: 'Vision' },
        { label: 'AI Mistake Detective', path: '/student/mistake-detective', icon: Sparkles, badge: 'Key Differentiator', highlight: true },
        { label: 'Handwritten Checker', path: '/student/handwritten-checker', icon: FileCheck },
        { label: 'Smart AI Chatbot', path: '/student/ai-chatbot', icon: Bot },
        { label: 'Voice Math Assistant', path: '/student/voice-assistant', icon: Mic, badge: 'New' },
        { label: 'Weakness Insights & Path', path: '/student/insights', icon: Target, badge: 'New' },
      ],
    },
    {
      group: 'Adaptivity & Evidence ⭐⭐⭐',
      items: [
        { label: 'AI Study Planner', path: '/student/study-planner', icon: Calendar },
        { label: 'Progress & Mastery', path: '/student/progress', icon: BarChart3 },
        { label: 'Before & After Impact', path: '/student/before-after', icon: TrendingUp, highlight: true, badge: 'Main Feature' },
        { label: 'Progress Report (PDF)', path: '/student/before-after/report', icon: FileText },
        { label: 'Formula Notebook', path: '/student/formulas', icon: BookmarkCheck },
        { label: 'Saved & Bookmarks', path: '/student/bookmarks', icon: Bell },
        { label: 'Achievements & XP', path: '/student/achievements', icon: Award },
      ],
    },
    {
      group: 'Account',
      items: [
        { label: 'My Profile', path: '/student/profile', icon: User },
        { label: 'Settings', path: '/student/settings', icon: Settings },
      ],
    },
  ];

  const teacherNavItems = [
    { label: 'Teacher Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'Students Directory', path: '/teacher/students', icon: Users },
    { label: 'Classes & Sections', path: '/teacher/classes', icon: Building },
    { label: 'Curriculum', path: '/teacher/curriculum', icon: BookOpen },
    { label: 'Question Bank', path: '/teacher/questions', icon: HelpCircle },
    { label: 'Quizzes & Tests', path: '/teacher/quizzes', icon: FileCheck },
    { label: 'Assignments Manager', path: '/teacher/assignments', icon: BookmarkCheck },
    { label: 'Attendance', path: '/teacher/attendance', icon: CalendarCheck },
    { label: 'Student Progress', path: '/teacher/student-progress', icon: BarChart3 },
    { label: 'Announcements', path: '/teacher/announcements', icon: Bell },
    { label: 'Class Analytics', path: '/teacher/analytics', icon: TrendingUp },
    { label: 'Before & After Class Insights', path: '/teacher/before-after', icon: TrendingUp },
    { label: 'AI Question Generator', path: '/teacher/ai-assistant', icon: Sparkles },
    { label: 'Question Paper Generator', path: '/teacher/question-paper-generator', icon: FileText, badge: 'AI' },
    { label: 'Profile & Settings', path: '/teacher/profile', icon: User },
  ];

  const parentNavItems = [
    { label: 'Parent Dashboard', path: '/parent/dashboard', icon: LayoutDashboard },
    { label: 'My Children', path: '/parent/children', icon: Users },
    { label: 'Learning Progress', path: '/parent/progress', icon: BarChart3 },
    { label: 'Study Activity Log', path: '/parent/activity', icon: Calendar },
    { label: 'Before & After Report', path: '/parent/before-after', icon: TrendingUp },
    { label: 'Parent Settings', path: '/parent/settings', icon: Settings },
  ];

  const schoolAdminNavItems = [
    { label: 'School Dashboard', path: '/school-admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/school-admin/students', icon: GraduationCap },
    { label: 'Classes & Sections', path: '/school-admin/classes', icon: Building },
    { label: 'Faculty & Teachers', path: '/school-admin/teachers', icon: Users },
    { label: 'Teacher Assignments', path: '/admin/teacher-assignments', icon: UserCog },
    { label: 'Curriculum', path: '/school-admin/curriculum', icon: BookOpen },
    { label: 'Assignments', path: '/school-admin/assignments', icon: BookmarkCheck },
    { label: 'Quizzes', path: '/school-admin/quizzes', icon: FileCheck },
    { label: 'Attendance', path: '/school-admin/attendance', icon: CalendarCheck },
    { label: 'Reports', path: '/school-admin/reports', icon: BarChart3 },
    { label: 'Announcements', path: '/school-admin/announcements', icon: Megaphone },
    { label: 'School Profile', path: '/school-admin/school-profile', icon: School },
    { label: 'Settings', path: '/school-admin/settings', icon: Settings },
  ];

  const platformAdminNavItems = [
    { label: 'Admin Command Center', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'User Roles & Access', path: '/admin/users', icon: ShieldCheck },
    { label: 'Teacher Assignments', path: '/admin/teacher-assignments', icon: UserCog },
    { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { label: 'Curriculum & Boards', path: '/admin/curriculum', icon: BookOpen },
    { label: 'AI Content Moderation', path: '/admin/ai-moderation', icon: Sparkles },
    { label: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  const renderNavList = () => {
    if (role === 'TEACHER') {
      return (
        <div className="space-y-1">
          {teacherNavItems.map((item) => (
            <NavLink key={item.path} item={item} currentPath={pathname} />
          ))}
        </div>
      );
    }
    if (role === 'PARENT') {
      return (
        <div className="space-y-1">
          {parentNavItems.map((item) => (
            <NavLink key={item.path} item={item} currentPath={pathname} />
          ))}
        </div>
      );
    }
    if (role === 'SCHOOL_ADMIN') {
      return (
        <div className="space-y-1">
          {schoolAdminNavItems.map((item) => (
            <NavLink key={item.path} item={item} currentPath={pathname} />
          ))}
        </div>
      );
    }
    if (role === 'PLATFORM_ADMIN') {
      return (
        <div className="space-y-1">
          {platformAdminNavItems.map((item) => (
            <NavLink key={item.path} item={item} currentPath={pathname} />
          ))}
        </div>
      );
    }

    // Default Student Navigation
    return (
      <div className="space-y-6">
        {studentNavGroups.map((grp) => (
          <div key={grp.group}>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-blue-400/70">
              {grp.group}
            </div>
            <div className="space-y-1">
              {grp.items.map((item) => (
                <NavLink key={item.path} item={item} currentPath={pathname} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-blue-900/60 bg-[#0d1b2e] flex flex-col h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      {/* Student Quick Bio Pill */}
      {role === 'STUDENT' && studentProfile && (
        <div className="p-4 mx-3 my-3 rounded-xl bg-gradient-to-br from-blue-800/40 to-blue-900/40 border border-blue-700/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white truncate">
              {studentProfile.displayName}
            </span>
            <Badge variant="purple" size="sm">
              Lvl {studentProfile.level}
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-blue-300">
            <span>{studentProfile.board} • Grade {studentProfile.grade}</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">⚡ {studentProfile.xp} XP</span>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 px-3 py-2">{renderNavList()}</div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-blue-900/60">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-blue-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out / Switch Persona</span>
        </button>
      </div>
    </aside>
  );
};

const NavLink: React.FC<{
  item: {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    highlight?: boolean;
  };
  currentPath: string;
}> = ({ item, currentPath }) => {
  const Icon = item.icon;
  const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');

  return (
    <Link
      href={item.path}
      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
        isActive
          ? item.highlight
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20'
            : 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-600/30'
          : item.highlight
          ? 'text-blue-400 hover:bg-blue-500/10 font-semibold'
          : 'text-blue-200/70 hover:bg-blue-800/40 hover:text-blue-100'
      }`}
    >
      <div className="flex items-center gap-2.5 truncate">
        <Icon
          className={`w-4 h-4 flex-shrink-0 ${
            isActive
              ? item.highlight
                ? 'text-white'
                : 'text-blue-400'
              : 'text-blue-400/50 group-hover:text-blue-300'
          }`}
        />
        <span className="truncate">{item.label}</span>
      </div>
      {item.badge && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
            isActive && item.highlight
              ? 'bg-white/20 text-white'
              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
          }`}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
};
