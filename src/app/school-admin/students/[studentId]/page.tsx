'use client';

import StudentDetailView from '@/components/student/StudentDetailView';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

export default function SchoolAdminStudentDetailPage() {
  return <StudentDetailView allowedRoles={ROLES} />;
}