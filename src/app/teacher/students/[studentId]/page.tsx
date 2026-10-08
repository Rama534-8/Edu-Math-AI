'use client';

import StudentDetailView from '@/components/student/StudentDetailView';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

export default function TeacherStudentDetailPage() {
  return <StudentDetailView allowedRoles={ROLES} />;
}