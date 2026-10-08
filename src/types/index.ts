// ==============================================================================
// EduMathAI - Core Type Definitions
// ==============================================================================

export type UserRole = 'STUDENT' | 'TEACHER' | 'PARENT' | 'SCHOOL_ADMIN' | 'PLATFORM_ADMIN';

export type BoardType = 'AP_STATE_BOARD' | 'CBSE';
export type MediumType = 'ENGLISH' | 'TELUGU';

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  profilePicture?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile extends UserProfile {
  role: 'STUDENT';
  grade: number; // e.g., 9
  class?: string;
  board: BoardType;
  medium: MediumType;
  parentGuardianName?: string | null;
  studentCode?: string;
  linkedParentCount?: number;
  schoolId?: string;
  schoolName?: string;
  section?: string;
  rollNumber?: string;
  learningGoals: string[];
  onboardingCompleted: boolean;
  baselineCompleted: boolean;
  baselineScore?: number;
  baselineAccuracy?: number;
  baselineCompletedAt?: string;
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string;
  questionsSolved: number;
  totalStudyMinutes: number;
}

export interface TeacherProfile extends UserProfile {
  role: 'TEACHER';
  schoolId?: string;
  schoolName?: string;
  subjectsTaught: string[];
  assignedClasses: string[]; // class IDs
}

export interface ParentProfile extends UserProfile {
  role: 'PARENT';
  linkedStudentIds: string[]; // Array of student UIDs
}

export interface SchoolAdminProfile extends UserProfile {
  role: 'SCHOOL_ADMIN';
  schoolId: string;
  schoolName: string;
}

// -----------------------------------------------------------------------------
// Curriculum Hierarchy
// -----------------------------------------------------------------------------

/** Curriculum unit/semester grouping. CBSE uses 6 Units (I–VI);
 *  AP State Board splits Class IX into Semester 1 and Semester 2. */
export type CurriculumUnitType = 'UNIT' | 'SEMESTER';

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  titleTelugu?: string;
  description: string;
  descriptionTelugu?: string;
  board: BoardType;
  grade: number;
  totalTopics: number;
  topics: Topic[];
  iconName?: string;
  estimatedHours: number;
  /** CBSE unit (I–VI) or AP semester (1–2) this chapter belongs to. */
  unitNumber?: number;
  unitLabel?: string;
  unitLabelTelugu?: string;
  /** Free-form official curriculum reference, e.g. "UNIT II: ALGEBRA". */
  curriculumSource?: string;
  /** Learning outcomes published for this chapter in the official syllabus. */
  learningOutcomes?: string[];
  learningOutcomesTelugu?: string[];
}

export interface Topic {
  id: string;
  chapterId: string;
  title: string;
  titleTelugu?: string;
  description: string;
  descriptionTelugu?: string;
  order: number;
  lessons: Lesson[];
  formulas?: FormulaItem[];
  /** Short concept statements shown in the topic panel. */
  concepts?: string[];
  conceptsTelugu?: string[];
  /** Curriculum-derived learning objectives for this topic. */
  learningObjectives?: string[];
  learningObjectivesTelugu?: string[];
  /** Worked examples attached directly to the topic. */
  examples?: WorkedExample[];
  /** Board-specific questions attached directly to the topic. */
  questions?: Question[];
  /** Official section reference, e.g. "2.4" from the board textbook. */
  sectionRef?: string;
  estimatedHours?: number;
}

export interface Lesson {
  id: string;
  topicId: string;
  chapterId: string;
  title: string;
  titleTelugu?: string;
  learningObjectives: string[];
  conceptHtml: string;
  conceptTeluguHtml?: string;
  formulas: FormulaItem[];
  examples: WorkedExample[];
  importantQuestions: Question[];
  revisionNotes: string[];
  isDemoSample?: boolean;
}

export interface FormulaItem {
  id: string;
  title: string;
  titleTelugu?: string;
  latex: string;
  description: string;
  descriptionTelugu?: string;
  variables: { symbol: string; meaning: string }[];
  chapterId: string;
  topicId?: string;
}

export interface WorkedExample {
  id: string;
  question: string;
  questionTelugu?: string;
  steps: {
    stepNumber: number;
    explanation: string;
    latex?: string;
    subHint?: string;
  }[];
  finalAnswer: string;
}

// -----------------------------------------------------------------------------
// Questions & Assessment Types
// -----------------------------------------------------------------------------

export type QuestionType = 'MCQ' | 'NUMERICAL' | 'SHORT_ANSWER' | 'TRUE_FALSE' | 'FILL_BLANK';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuestionOption {
  id: string;
  text: string;
  textTelugu?: string;
  latex?: string;
}

export interface Question {
  id: string;
  chapterId: string;
  topicId: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  questionText: string;
  questionTextTelugu?: string;
  latex?: string;
  imageUrl?: string;
  options?: QuestionOption[];
  correctAnswer: string; // Stored securely; stripped before sending to client during test
  correctAnswerExplanation: string;
  correctAnswerExplanationTelugu?: string;
  hint1: string;
  hint2?: string;
  marks: number;
  status?: 'DRAFT' | 'APPROVED';
  createdRole?: UserRole;
  isDemoSample?: boolean;
  /** Board this question belongs to. Optional so pre-existing banks keep working. */
  board?: BoardType;
  /** Instruction medium(s) this question is published in. Defaults to English. */
  medium?: MediumType;
}

// Strip sensitive answers for active tests
export type ClientActiveQuestion = Omit<Question, 'correctAnswer' | 'correctAnswerExplanation'>;

export type MistakeCategory =
  | 'CONCEPT_ERROR'
  | 'CALCULATION_ERROR'
  | 'SIGN_ERROR'
  | 'FORMULA_ERROR'
  | 'READING_ERROR'
  | 'UNIT_ERROR'
  | 'LOGIC_ERROR'
  | 'CARELESS_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface MistakeRecord {
  id: string;
  studentId: string;
  questionId: string;
  chapterId: string;
  topicId: string;
  studentAnswer: string;
  correctAnswer: string;
  mistakeCategory: MistakeCategory;
  whatWentWrong: string;
  whyItHappened: string;
  correctApproach: string;
  conceptToRevise: string;
  similarQuestionId?: string;
  resolved: boolean;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Assessments & Quizzes
// -----------------------------------------------------------------------------

export type AssessmentType = 'BASELINE' | 'TOPIC_QUIZ' | 'CHAPTER_QUIZ' | 'DAILY_QUIZ' | 'MOCK_EXAM' | 'RETEST';

export interface QuizMetadata {
  id: string;
  title: string;
  titleTelugu?: string;
  description: string;
  type: AssessmentType;
  board: BoardType;
  grade: number;
  chapterId?: string;
  topicId?: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  passingPercentage: number;
  isImmutableBaseline?: boolean;
}

export interface StudentAnswerSubmission {
  questionId: string;
  studentAnswer: string;
  timeSpentSeconds: number;
  markedForReview?: boolean;
}

export interface EvaluatedQuestionResult {
  questionId: string;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  marksAwarded: number;
  maxMarks: number;
  explanation: string;
  mistakeCategory?: MistakeCategory;
  timeSpentSeconds: number;
  chapterId: string;
  topicId: string;
}

export interface AssessmentSnapshot {
  id: string;
  studentId: string;
  quizId: string;
  quizTitle: string;
  type: AssessmentType;
  board: BoardType;
  grade: number;
  chapterId?: string;
  topicId?: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  score: number;
  maxScore: number;
  percentage: number;
  accuracy: number;
  timeSpentSeconds: number;
  passThreshold?: number;
  resultStatus?: 'PASS' | 'FAIL';
  recommendedNextAction?: string;
  weakChapters?: string[];
  isRetest?: boolean;
  attemptNumber?: number;
  previousAttemptId?: string | null;
  retestAvailable?: boolean;
  mistakeBreakdown: Record<MistakeCategory, number>;
  topicPerformance: {
    topicId: string;
    topicName: string;
    total: number;
    correct: number;
    accuracy: number;
  }[];
  strongAreas: string[];
  weakAreas: string[];
  commonMistakes: MistakeCategory[];
  evaluatedQuestions: EvaluatedQuestionResult[];
  isBaseline: boolean;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Before & After Measurable Improvement Model
// -----------------------------------------------------------------------------

export interface MetricComparison {
  metricName: string;
  beforeValue: number;
  currentValue: number;
  delta: number; // in percentage points or count
  unit: string;
  isPositive: boolean;
}

export interface BeforeAfterComparison {
  studentId: string;
  baselineSnapshot: AssessmentSnapshot;
  latestSnapshot: AssessmentSnapshot;
  comparableCriteriaMet: boolean;
  comparisonReason: string;
  scoreChangePercentagePoints: number; // e.g. 48% -> 78% is +30 percentage points
  accuracyChangePercentagePoints: number;
  mistakeReductionCount: number;
  solvedQuestionsCount: number;
  timeEfficiencyImprovementSeconds: number;
  improvedTopics: {
    topicId: string;
    topicName: string;
    beforeAccuracy: number;
    currentAccuracy: number;
    gainPercentagePoints: number;
  }[];
  topicsStillNeedingPractice: string[];
  metrics: MetricComparison[];
  generatedAt: string;
}

// -----------------------------------------------------------------------------
// AI Services & Chatbot
// -----------------------------------------------------------------------------

export interface LeaderboardItem {
  id: string;
  displayName: string;
  xp: number;
  streak: number;
  questions: number;
  rank: number;
}

export interface StreakDay {
  date: string;
  dayName: string;
  isActive: boolean;
}

export interface AIMessage {
  id: string;
  sender: 'student' | 'ai' | 'system';
  content: string;
  contentTelugu?: string;
  latex?: string;
  stepType?: 'HINT' | 'SUB_HINT' | 'STEP_BY_STEP' | 'FINAL_SOLUTION' | 'SIMILAR_PRACTICE' | 'MISTAKE_EXPLANATION';
  suggestedPrompts?: string[];
  timestamp: string;
}

export interface AIConversation {
  id: string;
  studentId: string;
  title: string;
  contextChapterId?: string;
  contextTopicId?: string;
  contextQuestionId?: string;
  language: 'ENGLISH' | 'TELUGU' | 'SIMPLE_ENGLISH';
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface MistakeAnalysisResult {
  mistakeCategory: MistakeCategory;
  categoryLabel: string;
  whatWentWrong: string;
  whyItHappened: string;
  correctApproach: string;
  conceptToRevise: string;
  workedCorrectionSteps: string[];
  similarPracticeQuestion: Question;
}

export interface HandwrittenCheckResult {
  isLegible: boolean;
  extractedQuestionText?: string;
  detectedSteps: {
    stepIndex: number;
    rawText: string;
    latexForm?: string;
    isCorrect: boolean;
    mistakeType?: MistakeCategory;
    feedback: string;
  }[];
  overallStatus: 'CORRECT' | 'PARTIAL' | 'INCORRECT';
  finalVerdict: string;
  recommendedRevisionTopic: string;
}

// -----------------------------------------------------------------------------
// Gamification & Daily Goals
// -----------------------------------------------------------------------------

export interface AchievementBadge {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  category: 'QUIZ' | 'STREAK' | 'MASTERY' | 'MISTAKE_SOLVER' | 'IMPROVEMENT';
  unlockedAt?: string;
}

export interface DailyGoalItem {
  id: string;
  title: string;
  targetCount: number;
  currentCount: number;
  unit: string;
  isCompleted: boolean;
  xpValue: number;
}

// -----------------------------------------------------------------------------
// Assignments & Teacher/Parent Management
// -----------------------------------------------------------------------------

export interface Assignment {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  title: string;
  description: string;
  type: 'HOMEWORK' | 'PRACTICE' | 'QUIZ' | 'REVISION';
  chapterId: string;
  topicId?: string;
  questionIds: string[];
  totalMarks: number;
  dueDate: string;
  assignedStudentIds: string[];
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  status: 'ASSIGNED' | 'STARTED' | 'SUBMITTED' | 'GRADED';
  score?: number;
  maxScore: number;
  submittedAt?: string;
  feedback?: string;
}

export interface FormulaNote {
  id: string;
  studentId: string;
  formulaId: string;
  formulaTitle: string;
  latex: string;
  personalNotes: string;
  isFavorite: boolean;
  updatedAt: string;
}

export interface StudyPlanDay {
  dayNumber: number;
  date: string;
  focusTopics: string[];
  targetQuestions: number;
  revisionItem: string;
  estimatedMinutes: number;
  status: 'PENDING' | 'DONE';
}

export interface StudyPlan {
  id: string;
  studentId: string;
  targetExamDate: string;
  targetScoreGoal: number;
  availableDailyMinutes: number;
  weakTopicsFocus: string[];
  dailyPlans: StudyPlanDay[];
  generatedAt: string;
}

// -----------------------------------------------------------------------------
// AI Service Param Types
// -----------------------------------------------------------------------------

export interface AskTutorParams {
  topicTitle: string;
  studentQuestion: string;
  stepRequested: 'HINT' | 'ADDITIONAL_HINT' | 'STEP_BY_STEP' | 'FINAL_SOLUTION' | 'SIMILAR_PRACTICE' | 'SIMILAR_QUESTION';
  language?: 'ENGLISH' | 'TELUGU' | 'SIMPLE_ENGLISH';
}

export interface AnalyzeMistakeParams {
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  topicTitle?: string;
  language?: 'ENGLISH' | 'TELUGU' | 'SIMPLE_ENGLISH';
}

// -----------------------------------------------------------------------------
// AI Question Paper Generator (Teacher)
// -----------------------------------------------------------------------------

/** Question kinds a generated paper may contain (paper-scoped, not quiz bank). */
export type PaperQuestionType = 'MCQ' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'NUMERICAL';

/** Paper difficulty: single level or mixed. */
export type PaperDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';

/** Paper language: English or Telugu. */
export type PaperLanguage = 'ENGLISH' | 'TELUGU';

export interface PaperQuestion {
  number: number;
  type: PaperQuestionType;
  chapterId: string;
  question: string;
  /** Exactly 4 options for MCQ; absent for other types. */
  options?: string[];
  /** Model answer / marking scheme. */
  answer?: string;
  marks: number;
}

export interface QuestionPaper {
  id: string;
  title: string;
  board: BoardType;
  className: string;
  subject: string;
  language: PaperLanguage;
  difficulty: PaperDifficulty;
  chapters: { id: string; title: string }[];
  instructions: string[];
  questions: PaperQuestion[];
  totalMarks: number;
  generatedAt: string;
}
