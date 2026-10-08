import type { Chapter, Question, QuizMetadata } from '@/types';
import { makeChapter } from './curriculum/builders';
import { CBSE_CHAPTERS } from './curriculum/cbse';
import { AP_STATE_BOARD_CHAPTERS } from './curriculum/ap-state-board';

// ==============================================================================
// EduMathAI - Class 9 Mathematics Curriculum (aggregator)
//
// SOURCES OF TRUTH
//   1. CBSE : scratch/pdf_output.txt
//            (CBSE Class IX 2026-27 official syllabus - 6 Units, 15 chapters, 80 marks)
//   2. AP   : 9_Maths_SEM-1_Textbook.pdf / 9_Maths_SEM-2_Textbook.pdf
//            (SCERT Andhra Pradesh, Class IX Mathematics, Semester 1 & 2)
//
// Chapter/topic IDs from the previous curriculum-data.ts are preserved so that
// progress records, assessment snapshots and existing routes keep resolving.
//
// Exports preserved for backwards compatibility:
//   CLASS_9_CHAPTERS, SAMPLE_QUESTIONS_BANK,
//   BASELINE_QUIZ_METADATA, COMPARABLE_POST_ASSESSMENT_METADATA
// ==============================================================================

// ==============================================================================
// CBSE CLASS IX MATHEMATICS - 2026-27 OFFICIAL CURRICULUM
// Full syllabus tables live in ./curriculum/cbse.ts
// AP State Board (SCERT AP) tables live in ./curriculum/ap-state-board.ts
// ==============================================================================

export const CLASS_9_CHAPTERS: Chapter[] = [...CBSE_CHAPTERS, ...AP_STATE_BOARD_CHAPTERS];


// ==============================================================================
// Comprehensive Question Bank (Diagnostic Baseline & Practice Items)
// ==============================================================================

export const SAMPLE_QUESTIONS_BANK: Question[] = [
  {
    id: 'q-baseline-1',
    chapterId: 'ch-real-numbers',
    topicId: 'top-rn-1',
    type: 'MCQ',
    difficulty: 'EASY',
    questionText: 'Which of the following numbers is an irrational number?',
    questionTextTelugu: 'క్రింది వాటిలో ఏది కరణీయ సంఖ్య?',
    latex: '\\text{Options: } \\sqrt{4}, \\; \\sqrt{9}, \\; \\sqrt{7}, \\; \\frac{22}{7}',
    options: [
      { id: 'opt-a', text: '√4 (which equals 2)' },
      { id: 'opt-b', text: '√7' },
      { id: 'opt-c', text: '√9 (which equals 3)' },
      { id: 'opt-d', text: '0.3333... (1/3)' },
    ],
    correctAnswer: 'opt-b',
    correctAnswerExplanation: '√7 cannot be written as a ratio of integers p/q; its decimal expansion is non-terminating and non-repeating, making it irrational.',
    hint1: 'Recall that square root of a non-perfect square prime number is irrational.',
    hint2: '√4 = 2 and √9 = 3 are integers, and 0.333... = 1/3 is rational.',
    marks: 1,
    status: 'APPROVED',
    isDemoSample: true,
  },
  {
    id: 'q-baseline-2',
    chapterId: 'ch-polynomials',
    topicId: 'top-poly-1',
    type: 'NUMERICAL',
    difficulty: 'MEDIUM',
    questionText: 'If 2x + 5 = 15, find the value of x.',
    questionTextTelugu: '2x + 5 = 15 అయితే, x విలువను కనుగొనండి.',
    latex: '2x + 5 = 15 \\implies x = ?',
    correctAnswer: '5',
    correctAnswerExplanation: 'Subtract 5 from both sides: 2x = 15 - 5 = 10. Divide by 2: x = 10 / 2 = 5.',
    hint1: 'First isolate the term with x by subtracting 5 from 15.',
    hint2: 'Common mistake: Do not add 5 to 15! When moving +5 across the equals sign, it becomes -5.',
    marks: 2,
    status: 'APPROVED',
    isDemoSample: true,
  },
  {
    id: 'q-baseline-3',
    chapterId: 'ch-polynomials',
    topicId: 'top-poly-1',
    type: 'MCQ',
    difficulty: 'MEDIUM',
    questionText: 'What is the zero of the linear polynomial p(x) = 3x - 12?',
    questionTextTelugu: 'p(x) = 3x - 12 అనే రేఖీయ బహుపది యొక్క శూన్యం ఎంత?',
    latex: 'p(x) = 3x - 12',
    options: [
      { id: 'opt-a', text: '-4' },
      { id: 'opt-b', text: '4' },
      { id: 'opt-c', text: '12' },
      { id: 'opt-d', text: '0' },
    ],
    correctAnswer: 'opt-b',
    correctAnswerExplanation: 'Set p(x) = 0: 3x - 12 = 0 => 3x = 12 => x = 4.',
    hint1: 'To find the zero of a polynomial, set p(x) = 0 and solve for x.',
    hint2: 'Watch the sign: -12 moves to right as +12.',
    marks: 1,
    status: 'APPROVED',
    isDemoSample: true,
  },
  {
    id: 'q-baseline-4',
    chapterId: 'ch-lines-angles',
    topicId: 'top-la-1',
    type: 'NUMERICAL',
    difficulty: 'EASY',
    questionText: 'If two angles form a linear pair and one angle is 65°, what is the measure of the other angle in degrees?',
    questionTextTelugu: 'రెండు కోణాలు రేఖీయ యుగ్మము ఏర్పరచగా, ఒక కోణం 65° అయితే రెండవ కోణం ఎంత?',
    latex: '\\angle 1 + \\angle 2 = 180^\\circ, \\quad \\angle 1 = 65^\\circ',
    correctAnswer: '115',
    correctAnswerExplanation: 'Sum of angles in a linear pair is 180°. Other angle = 180° - 65° = 115°.',
    hint1: 'A linear pair on a straight line always adds up to 180 degrees.',
    hint2: 'Calculate 180 - 65 carefully.',
    marks: 2,
    status: 'APPROVED',
    isDemoSample: true,
  },
  {
    id: 'q-baseline-5',
    chapterId: 'ch-coordinate-geometry',
    topicId: 'top-cg-1',
    type: 'MCQ',
    difficulty: 'EASY',
    questionText: 'In which quadrant does the point (-3, 5) lie?',
    questionTextTelugu: '(-3, 5) బిందువు ఏ పాదములో ఉంటుంది?',
    latex: 'P(-3, 5)',
    options: [
      { id: 'opt-a', text: 'Quadrant I (+, +)' },
      { id: 'opt-b', text: 'Quadrant II (-, +)' },
      { id: 'opt-c', text: 'Quadrant III (-, -)' },
      { id: 'opt-d', text: 'Quadrant IV (+, -)' },
    ],
    correctAnswer: 'opt-b',
    correctAnswerExplanation: 'In point (-3, 5), x is negative and y is positive, which corresponds to Quadrant II.',
    hint1: 'Check signs of x and y: x < 0 and y > 0.',
    marks: 1,
    status: 'APPROVED',
    isDemoSample: true,
  },
  {
    id: 'q-baseline-6',
    chapterId: 'ch-herons-formula',
    topicId: 'top-heron-1',
    type: 'NUMERICAL',
    difficulty: 'MEDIUM',
    questionText: 'Find the semi-perimeter (s) of a triangle with sides 6 cm, 8 cm, and 10 cm.',
    questionTextTelugu: '6 సెం.మీ, 8 సెం.మీ, మరియు 10 సెం.మీ భుజాలు గల త్రిభుజం యొక్క అర్ధ చుట్టుకొలత (s) ఎంత?',
    latex: 's = \\frac{a + b + c}{2}',
    correctAnswer: '12',
    correctAnswerExplanation: 's = (6 + 8 + 10) / 2 = 24 / 2 = 12 cm.',
    hint1: 'Add all three sides to find perimeter, then divide by 2.',
    marks: 2,
    status: 'APPROVED',
    isDemoSample: true,
  },
  {
    id: 'q-baseline-7',
    chapterId: 'ch-surface-areas',
    topicId: 'top-sa-1',
    type: 'TRUE_FALSE',
    difficulty: 'EASY',
    questionText: 'True or False: The curved surface area of a cylinder with base radius r and height h is 2πrh.',
    questionTextTelugu: 'నిజమా/కాదా: భూ వ్యాసార్ధం r, ఎత్తు h గల స్తూపం ప్రక్కతల వైశాల్యం 2πrh.',
    latex: '\\text{CSA of cylinder} = 2\\pi rh',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'true',
    correctAnswerExplanation: 'The curved surface area of a right circular cylinder is indeed 2πrh.',
    hint1: 'Think of unrolling the curved surface into a rectangle of length 2πr and width h.',
    marks: 1,
    status: 'APPROVED',
    isDemoSample: true,
  },
  {
    id: 'q-baseline-8',
    chapterId: 'ch-probability',
    topicId: 'top-prob-1',
    type: 'MCQ',
    difficulty: 'EASY',
    questionText: 'A coin is tossed 100 times and head occurs 45 times. What is the empirical probability of getting a tail?',
    questionTextTelugu: 'ఒక నాణేన్ని 100 సార్లు ఎగురవేసినప్పుడు బొమ్మ 45 సార్లు పడింది. బొరుసు పడే ప్రయోగాత్మక సంభావ్యత ఎంత?',
    latex: 'P(\\text{Tail}) = \\frac{100 - 45}{100}',
    options: [
      { id: 'opt-a', text: '0.45' },
      { id: 'opt-b', text: '0.55' },
      { id: 'opt-c', text: '0.50' },
      { id: 'opt-d', text: '0.10' },
    ],
    correctAnswer: 'opt-b',
    correctAnswerExplanation: 'Number of tails = 100 - 45 = 55. Probability = 55 / 100 = 0.55.',
    hint1: 'First find the number of times tail occurs (Total - Heads).',
    marks: 1,
    status: 'APPROVED',
    isDemoSample: true,
  },
  {
    id: 'q-baseline-9',
    chapterId: 'ch-real-numbers',
    topicId: 'top-rn-1',
    type: 'SHORT_ANSWER',
    difficulty: 'MEDIUM',
    questionText: 'Simplify: (3 + √3)(3 - √3).',
    questionTextTelugu: 'సూక్ష్మీకరించండి: (3 + √3)(3 - √3).',
    latex: '(a + b)(a - b) = a^2 - b^2',
    correctAnswer: '6',
    correctAnswerExplanation: 'Apply identity (a+b)(a-b) = a^2 - b^2 => (3)^2 - (√3)^2 = 9 - 3 = 6.',
    hint1: 'Use the algebraic difference of squares formula: (a+b)(a-b) = a^2 - b^2.',
    marks: 2,
    status: 'APPROVED',
    isDemoSample: true,
  },
  {
    id: 'q-baseline-10',
    chapterId: 'ch-polynomials',
    topicId: 'top-poly-1',
    type: 'MCQ',
    difficulty: 'HARD',
    questionText: 'If x + y + z = 0, what is the value of x³ + y³ + z³?',
    questionTextTelugu: 'x + y + z = 0 అయితే, x³ + y³ + z³ విలువ ఎంత?',
    latex: 'x^3 + y^3 + z^3 = ?',
    options: [
      { id: 'opt-a', text: '0' },
      { id: 'opt-b', text: '3xyz' },
      { id: 'opt-c', text: '-3xyz' },
      { id: 'opt-d', text: 'xyz' },
    ],
    correctAnswer: 'opt-b',
    correctAnswerExplanation: 'Using identity x³ + y³ + z³ - 3xyz = (x+y+z)(x²+y²+z²-xy-yz-zx). When x+y+z=0, the RHS is 0, so x³ + y³ + z³ = 3xyz.',
    hint1: 'Recall the special cubic identity when sum of variables equals zero.',
    marks: 2,
    status: 'APPROVED',
    isDemoSample: true,
  },
];

export const BASELINE_QUIZ_METADATA: QuizMetadata = {
  id: 'baseline-diagnostic-class9',
  title: 'Class 9 Mathematics Baseline Diagnostic Assessment',
  titleTelugu: '9వ తరగతి గణిత ప్రాథమిక నిర్ధారణ మూల్యాంకనం (Baseline)',
  description: 'Official diagnostic assessment covering Number Systems, Polynomials, Geometry, Heron\'s formula, Surface areas, and Probability to identify starting performance and learning gaps.',
  type: 'BASELINE',
  board: 'CBSE',
  grade: 9,
  totalQuestions: 10,
  totalMarks: 15,
  durationMinutes: 20,
  passingPercentage: 40,
  isImmutableBaseline: true,
};

// Comparable Follow-up Quiz for Before & After Measurable Retest
export const COMPARABLE_POST_ASSESSMENT_METADATA: QuizMetadata = {
  id: 'comparable-post-retest-class9',
  title: 'Class 9 Mathematics Mastery Retest (Comparable Follow-up)',
  titleTelugu: '9వ తరగతి గణిత నైపుణ్య పునర్-మూల్యాంకనం (Retest)',
  description: 'Standardized assessment identical in difficulty distribution, marks, and topic weighting to accurately measure Before vs After improvement.',
  type: 'RETEST',
  board: 'CBSE',
  grade: 9,
  totalQuestions: 10,
  totalMarks: 15,
  durationMinutes: 20,
  passingPercentage: 40,
  isImmutableBaseline: false,
};
