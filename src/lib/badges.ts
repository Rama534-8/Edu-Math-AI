// Central definition of all badges in EduMathAI.
// Add new badges here — the API will auto-award them.

export interface BadgeDef {
  code: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  category: 'ASSESSMENT' | 'EXAM' | 'STREAK' | 'PRACTICE' | 'REVISION' | 'MILESTONE';
}

export const ALL_BADGES: BadgeDef[] = [
  {
    code: 'FIRST_QUIZ',
    title: 'First Steps',
    description: 'Complete your very first assessment',
    icon: '🎯',
    xpReward: 100,
    category: 'ASSESSMENT',
  },
  {
    code: 'PASSING_RESULT',
    title: 'Passing Grade',
    description: 'Earn a PASS on any assessment',
    icon: '✅',
    xpReward: 150,
    category: 'ASSESSMENT',
  },
  {
    code: 'RETEST_CHAMPION',
    title: 'Retest Champion',
    description: 'Complete a weak-topic retest',
    icon: '🔁',
    xpReward: 75,
    category: 'ASSESSMENT',
  },
  {
    code: 'THREE_PASSES',
    title: 'Hat Trick',
    description: 'Pass 3 assessments',
    icon: '🎩',
    xpReward: 200,
    category: 'ASSESSMENT',
  },
  {
    code: 'ACCURACY_80',
    title: 'Sharp Mind',
    description: 'Score 80%+ accuracy on any assessment',
    icon: '🎓',
    xpReward: 250,
    category: 'ASSESSMENT',
  },
  {
    code: 'ACCURACY_100',
    title: 'Perfect Score',
    description: 'Score 100% on any assessment',
    icon: '💯',
    xpReward: 500,
    category: 'ASSESSMENT',
  },
  {
    code: 'Q50',
    title: '50 Questions Solved',
    description: 'Answer 50 assessment questions',
    icon: '📝',
    xpReward: 75,
    category: 'PRACTICE',
  },
  {
    code: 'Q100',
    title: '100 Questions Solved',
    description: 'Answer 100 assessment questions',
    icon: '✏️',
    xpReward: 150,
    category: 'PRACTICE',
  },
  {
    code: 'Q500',
    title: '500 Questions Solved',
    description: 'Answer 500 assessment questions',
    icon: '📚',
    xpReward: 500,
    category: 'PRACTICE',
  },
  {
    code: 'STREAK_3',
    title: '3-Day Streak',
    description: 'Study 3 days in a row',
    icon: '🔥',
    xpReward: 100,
    category: 'STREAK',
  },
  {
    code: 'STREAK_7',
    title: 'Week Warrior',
    description: 'Study 7 days in a row',
    icon: '⚡',
    xpReward: 250,
    category: 'STREAK',
  },
  {
    code: 'STREAK_30',
    title: 'Monthly Legend',
    description: 'Study 30 days in a row',
    icon: '🏆',
    xpReward: 1000,
    category: 'STREAK',
  },
  {
    code: 'STUDY_PLAN_FIRST',
    title: 'Planner Pro',
    description: 'Generate your first AI study plan',
    icon: '🗓️',
    xpReward: 50,
    category: 'MILESTONE',
  },
  {
    code: 'BASELINE_COMPLETE',
    title: 'Baseline Setter',
    description: 'Complete your baseline assessment',
    icon: '📊',
    xpReward: 100,
    category: 'MILESTONE',
  },
  {
    code: 'LEVEL_5',
    title: 'Level 5 Achiever',
    description: 'Reach Level 5',
    icon: '⭐',
    xpReward: 300,
    category: 'MILESTONE',
  },
  {
    code: 'MOCK_EXAM_FIRST',
    title: 'Exam Taker',
    description: 'Complete your first mock exam',
    icon: '📋',
    xpReward: 100,
    category: 'EXAM',
  },
  {
    code: 'MOCK_EXAM_PASS',
    title: 'Mock Exam Passer',
    description: 'Pass a mock exam with 40%+ score',
    icon: '🎉',
    xpReward: 200,
    category: 'EXAM',
  },
  {
    code: 'MOCK_EXAM_5',
    title: 'Exam Warrior',
    description: 'Complete 5 mock exams',
    icon: '🛡️',
    xpReward: 400,
    category: 'EXAM',
  },
  {
    code: 'FIRST_LESSON',
    title: 'First Lesson',
    description: 'Complete your very first lesson',
    icon: '📖',
    xpReward: 50,
    category: 'MILESTONE',
  },
  {
    code: 'CHAPTER_COMPLETE',
    title: 'Chapter Champion',
    description: 'Complete every lesson in a chapter',
    icon: '👑',
    xpReward: 300,
    category: 'MILESTONE',
  },
  {
    code: 'FIVE_LESSONS',
    title: 'Lesson Explorer',
    description: 'Complete 5 lessons',
    icon: '🧭',
    xpReward: 120,
    category: 'MILESTONE',
  },
  {
    code: 'REVISION_FIRST',
    title: 'First Revision',
    description: 'Complete your first smart revision session',
    icon: '🔁',
    xpReward: 100,
    category: 'REVISION',
  },
  {
    code: 'REVISION_5',
    title: 'Consistent Reviewer',
    description: 'Complete 5 smart revision sessions',
    icon: '📚',
    xpReward: 250,
    category: 'REVISION',
  },
  {
    code: 'REVISION_STREAK',
    title: 'Revision Streak',
    description: 'Maintain a 3-day revision streak',
    icon: '🔥',
    xpReward: 300,
    category: 'REVISION',
  },
];

export function getBadge(code: string): BadgeDef | undefined {
  return ALL_BADGES.find((b) => b.code === code);
}
