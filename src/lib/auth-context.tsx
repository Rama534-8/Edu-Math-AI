'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AssessmentSnapshot,
  BoardType,
  MediumType,
  StudentProfile,
  UserProfile,
  UserRole,
  LeaderboardItem,
  StreakDay,
} from '@/types';

// =============================================================================
// Types
// =============================================================================

interface RegisterParams {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  phone?: string;
  parentGuardianName?: string;
  className?: string;
  board?: string;
  medium?: string;
  schoolName?: string;
  inviteCode?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  studentProfile: StudentProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string, selectedRole: UserRole) => Promise<boolean>;
  register: (params: RegisterParams) => Promise<boolean>;
  logout: () => Promise<void>;
  completeOnboarding: (board: BoardType, medium: MediumType, learningGoals: string[]) => Promise<void>;
  updateProfile: (fields: Partial<{
    displayName: string;
    parentGuardianName: string;
    phoneNumber: string;
    board: string;
    medium: string;
    className: string;
  }>) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<string>;
  deleteProfilePicture: () => Promise<void>;
  saveAssessmentSnapshot: (snapshot: AssessmentSnapshot) => Promise<void>;
  getAssessmentSnapshots: () => AssessmentSnapshot[];
  getLatestAssessmentSnapshot: () => AssessmentSnapshot | null;
  getBaselineSnapshot: () => AssessmentSnapshot | null;
  getLatestComparableSnapshot: () => AssessmentSnapshot | null;
  addXP: (amount: number) => Promise<void>;
  addStudyMinutes: (mins: number) => Promise<void>;
  recordActivity: (activityType: 'PRACTICE' | 'QUIZ' | 'LESSON' | 'REVISION') => Promise<void>;
  getLeaderboard: () => LeaderboardItem[];
  getStreakCalendar: () => StreakDay[];
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// Helper — build streak calendar from lastActiveDate + streakDays
// =============================================================================

function buildStreakCalendar(lastActiveDate: string | undefined, streakDays: number): StreakDay[] {
  const today = new Date();
  const cal: StreakDay[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    let isActive = false;

    if (lastActiveDate && streakDays > 0) {
      const lastDate = new Date(lastActiveDate);
      const diffDays = Math.floor(
        (lastDate.getTime() - d.getTime()) / (1000 * 3600 * 24)
      );
      if (diffDays >= 0 && diffDays < streakDays) {
        isActive = true;
      }
    }
    cal.push({
      date: dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isActive,
    });
  }
  return cal;
}

// =============================================================================
// Provider
// =============================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [snapshots, setSnapshots] = useState<AssessmentSnapshot[]>([]);
  const [streakCalendar, setStreakCalendar] = useState<StreakDay[]>([]);

  // ---------------------------------------------------------------------------
  // Load current user from session on mount
  // ---------------------------------------------------------------------------
  const loadCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (!res.ok) {
        setUser(null);
        setStudentProfile(null);
        return;
      }
      const data = await res.json();
      if (data.user) {
        const profile = data.user as UserProfile;
        setUser(profile);

        if (profile.role === 'STUDENT') {
          const sp = data.user as StudentProfile;
          setStudentProfile(sp);
          setStreakCalendar(buildStreakCalendar(sp.lastActiveDate, sp.streakDays ?? 0));
          await loadSnapshots();
        } else {
          setStudentProfile(null);
        }
        await fetchLeaderboard();
      } else {
        setUser(null);
        setStudentProfile(null);
      }
    } catch (error) {
      console.error('[AuthContext] Failed to load user:', error);
      setUser(null);
      setStudentProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
     
    loadCurrentUser();
  }, [loadCurrentUser]);

  // ---------------------------------------------------------------------------
  // Leaderboard
  // ---------------------------------------------------------------------------
  async function fetchLeaderboard() {
    try {
      const res = await fetch('/api/users/profile?type=leaderboard', { credentials: 'same-origin' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.leaderboard) setLeaderboard(data.leaderboard);
    } catch (e) {
      console.error('[AuthContext] Failed to fetch leaderboard:', e);
    }
  }

  // ---------------------------------------------------------------------------
  // Snapshots
  // ---------------------------------------------------------------------------
  async function loadSnapshots() {
    try {
      const res = await fetch('/api/users/snapshots', { credentials: 'same-origin' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.snapshots) {
        setSnapshots(data.snapshots);
      }
    } catch (e) {
      console.error('[AuthContext] Failed to load snapshots:', e);
    }
  }

  // ---------------------------------------------------------------------------
  // Auth actions
  // ---------------------------------------------------------------------------
  const login = async (email: string, password: string, selectedRole: UserRole): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, selectedRole }),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }
      await loadCurrentUser();
      return true;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (params: RegisterParams): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      await loadCurrentUser();
      return true;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch (e) {
      console.error('[AuthContext] Logout error:', e);
    }
    setUser(null);
    setStudentProfile(null);
    setSnapshots([]);
    setStreakCalendar([]);
    setLeaderboard([]);
  };

  // ---------------------------------------------------------------------------
  // Profile actions
  // ---------------------------------------------------------------------------
  const updateProfile = async (fields: Partial<{
    displayName: string;
    parentGuardianName: string;
    phoneNumber: string;
    board: string;
    medium: string;
    className: string;
  }>) => {
    const res = await fetch('/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
      credentials: 'same-origin',
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Profile update failed.');
    }
    // Reload user to reflect changes
    await loadCurrentUser();
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/users/profile-picture', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed.');
    await loadCurrentUser();
    return data.url;
  };

  const deleteProfilePicture = async (): Promise<void> => {
    const res = await fetch('/api/users/profile-picture', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Delete failed.');
    }
    await loadCurrentUser();
  };

  // ---------------------------------------------------------------------------
  // Onboarding
  // ---------------------------------------------------------------------------
  const completeOnboarding = async (board: BoardType, medium: MediumType, learningGoals: string[]) => {
    await updateProfile({ board, medium });
    await fetch('/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboardingCompleted: true, learningGoals }),
      credentials: 'same-origin',
    });
    await loadCurrentUser();
  };

  // ---------------------------------------------------------------------------
  // Gamification
  // ---------------------------------------------------------------------------
  const saveAssessmentSnapshot = async (snapshot: AssessmentSnapshot) => {
    setSnapshots((current) => current.some((item) => item.id === snapshot.id)
      ? current.map((item) => item.id === snapshot.id ? snapshot : item)
      : [...current, snapshot]);
    await loadCurrentUser();
  };

  const addXP = async (amount: number) => {
    if (!studentProfile || !user) return;
    const newXP = (studentProfile.xp ?? 0) + amount;
    const newLevel = Math.floor(newXP / 1000) + 1;
    setStudentProfile({ ...studentProfile, xp: newXP, level: newLevel });
    try {
      await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xp: newXP, level: newLevel }),
        credentials: 'same-origin',
      });
      await fetchLeaderboard();
    } catch (e) {
      console.error('[AuthContext] Failed to add XP:', e);
    }
  };

  const addStudyMinutes = async (mins: number) => {
    if (!studentProfile || !user) return;
    const newTotal = (studentProfile.totalStudyMinutes ?? 0) + mins;
    setStudentProfile({ ...studentProfile, totalStudyMinutes: newTotal });
    try {
      await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalStudyMinutes: newTotal }),
        credentials: 'same-origin',
      });
    } catch (e) {
      console.error('[AuthContext] Failed to add study minutes:', e);
    }
  };

  const recordActivity = async (activityType: 'PRACTICE' | 'QUIZ' | 'LESSON' | 'REVISION') => {
    if (!studentProfile || !user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastActive = studentProfile.lastActiveDate?.split('T')[0];

      let newStreak = studentProfile.streakDays ?? 0;
      let newlyActiveToday = false;

      if (!lastActive) {
        newStreak = 1;
        newlyActiveToday = true;
      } else if (lastActive !== today) {
        const diff = Math.floor(
          (new Date(today).getTime() - new Date(lastActive).getTime()) / (1000 * 3600 * 24)
        );
        newStreak = diff === 1 ? newStreak + 1 : 1;
        newlyActiveToday = true;
      }

      const newQS =
        activityType === 'PRACTICE' || activityType === 'QUIZ'
          ? (studentProfile.questionsSolved ?? 0) + 1
          : studentProfile.questionsSolved ?? 0;

      const updatedProfile = {
        ...studentProfile,
        streakDays: newStreak,
        lastActiveDate: new Date().toISOString(),
        questionsSolved: newQS,
      };

      setStudentProfile(updatedProfile);
      if (newlyActiveToday) {
        setStreakCalendar(buildStreakCalendar(updatedProfile.lastActiveDate, newStreak));
      }

      await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streakDays: newStreak,
          lastActiveDate: updatedProfile.lastActiveDate,
          questionsSolved: newQS,
        }),
        credentials: 'same-origin',
      });
    } catch (e) {
      console.error('[AuthContext] Failed to record activity:', e);
    }
  };

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------
  const getAssessmentSnapshots = () => snapshots;
  const getLatestAssessmentSnapshot = () =>
    [...snapshots].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
  const getBaselineSnapshot = () =>
    snapshots.find((s) => s.isBaseline || s.type === 'BASELINE') || null;
  const getLatestComparableSnapshot = () => {
    const sorted = [...snapshots].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    // A comparable retest is a NEW attempt on the same standardized quiz that
    // is not itself the immutable baseline snapshot.
    const baseline = sorted.find((s) => s.isBaseline || s.type === 'BASELINE') ?? null;
    const retests = sorted.filter(
      (s) =>
        (!s.isBaseline && s.type !== 'BASELINE') &&
        (s.type === 'RETEST' ||
          s.quizId === 'comparable-post-retest-class9' ||
          (baseline !== null && s.quizId === baseline.quizId))
    );
    if (retests.length > 0) return retests[0];
    const regulars = sorted.filter((s) => !s.isBaseline && s.type !== 'BASELINE');
    // Only count this as "comparable" if there actually is a baseline to compare against.
    if (!baseline || regulars.length === 0) return null;
    return regulars[0];
  };
  const getLeaderboard = () => leaderboard;
  const getStreakCalendar = () => streakCalendar;

  const resetPassword = async (email: string): Promise<void> => {
    console.log(`[Auth] Password reset requested for: ${email}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------
  return (
    <AuthContext.Provider
      value={{
        user,
        studentProfile,
        role: user?.role || null,
        isLoading,
        login,
        register,
        logout,
        completeOnboarding,
        updateProfile,
        uploadProfilePicture,
        deleteProfilePicture,
        saveAssessmentSnapshot,
        getAssessmentSnapshots,
        getLatestAssessmentSnapshot,
        getBaselineSnapshot,
        getLatestComparableSnapshot,
        addXP,
        addStudyMinutes,
        recordActivity,
        getLeaderboard,
        getStreakCalendar,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
