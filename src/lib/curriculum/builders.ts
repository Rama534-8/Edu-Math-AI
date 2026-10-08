import type { Chapter, Question, Topic } from '@/types';

// ==============================================================================
// Shared builders used by the board curriculum tables (CBSE + AP State Board).
// Kept separate from curriculum-data.ts so the board modules can use them
// without a circular import. Not part of the public API.
// ==============================================================================

export type { Var, TopicSeed, ChapterSeed };

type Var = { symbol: string; meaning: string };

type TopicSeed = {
  id: string;
  title: string;
  titleTelugu: string;
  description: string;
  descriptionTelugu: string;
  sectionRef?: string;
  concepts: string[];
  conceptsTelugu: string[];
  learningObjectives: string[];
  learningObjectivesTelugu: string[];
  formulas?: { title: string; titleTelugu?: string; latex: string; description: string; descriptionTelugu?: string; variables: Var[] }[];
  workedExample?: {
    question: string;
    questionTelugu?: string;
    steps: { explanation: string; latex?: string }[];
    finalAnswer: string;
  };
  estimatedHours?: number;
};

/** Build a single Topic (with one lesson) from curriculum-derived content. */
export function makeTopic(chapterId: string, order: number, seed: TopicSeed) {
  const formulas = (seed.formulas ?? []).map((f, i) => ({
    id: `f-${seed.id}-${i + 1}`,
    title: f.title,
    titleTelugu: f.titleTelugu,
    latex: f.latex,
    description: f.description,
    descriptionTelugu: f.descriptionTelugu,
    variables: f.variables,
    chapterId,
    topicId: seed.id,
  }));

  const conceptHtml = [
    `<h4>${seed.title}</h4>`,
    `<p>${seed.description}</p>`,
    seed.concepts.length
      ? `<p><strong>Key concepts</strong></p><ul>${seed.concepts.map((c) => `<li>${c}</li>`).join('')}</ul>`
      : '',
    formulas.length
      ? `<p><strong>Key formula${formulas.length > 1 ? 's' : ''}</strong></p><ul>${formulas
          .map((f) => `<li>${f.title}: \\(${f.latex}\\)</li>`)
          .join('')}</ul>`
      : '',
  ].join('\n');

  const conceptTeluguHtml = [
    `<h4>${seed.titleTelugu}</h4>`,
    `<p>${seed.descriptionTelugu}</p>`,
    seed.conceptsTelugu.length
      ? `<p><strong>ముఖ్య భావాలు</strong></p><ul>${seed.conceptsTelugu.map((c) => `<li>${c}</li>`).join('')}</ul>`
      : '',
    formulas.length
      ? `<p><strong>ముఖ్య సూత్రం</strong></p><ul>${formulas.map((f) => `<li>${f.titleTelugu ?? f.title}: \\(${f.latex}\\)</li>`).join('')}</ul>`
      : '',
  ].join('\n');

  const examples = seed.workedExample
    ? [
        {
          id: `ex-${seed.id}-1`,
          question: seed.workedExample.question,
          questionTelugu: seed.workedExample.questionTelugu,
          steps: seed.workedExample.steps.map((s, i) => ({
            stepNumber: i + 1,
            explanation: s.explanation,
            latex: s.latex,
          })),
          finalAnswer: seed.workedExample.finalAnswer,
        },
      ]
    : [];

  const lesson = {
    id: `l-${seed.id}-1`,
    topicId: seed.id,
    chapterId,
    title: seed.title,
    titleTelugu: seed.titleTelugu,
    learningObjectives: seed.learningObjectives,
    conceptHtml,
    conceptTeluguHtml,
    formulas,
    examples,
    importantQuestions: [] as Question[],
    revisionNotes: [
      ...seed.concepts,
      ...(formulas.length ? [`Remember: ${formulas[0].title} = \\(${formulas[0].latex}\\)`] : []),
    ],
  };

  return {
    id: seed.id,
    chapterId,
    title: seed.title,
    titleTelugu: seed.titleTelugu,
    description: seed.description,
    descriptionTelugu: seed.descriptionTelugu,
    order,
    lessons: [lesson],
    formulas,
    concepts: seed.concepts,
    conceptsTelugu: seed.conceptsTelugu,
    learningObjectives: seed.learningObjectives,
    learningObjectivesTelugu: seed.learningObjectivesTelugu,
    examples,
    sectionRef: seed.sectionRef,
    estimatedHours: seed.estimatedHours ?? 2,
  };
}

type ChapterSeed = {
  id: string;
  chapterNumber: number;
  title: string;
  titleTelugu: string;
  description: string;
  descriptionTelugu: string;
  board: 'CBSE' | 'AP_STATE_BOARD';
  estimatedHours: number;
  iconName: string;
  unitNumber?: number;
  unitLabel?: string;
  unitLabelTelugu?: string;
  curriculumSource: string;
  learningOutcomes: string[];
  learningOutcomesTelugu: string[];
  topics: TopicSeed[];
};

/**
 * Compact positional builder for a syllabus topic.
 * The official key-concept lists are long, so this keeps the curriculum tables
 * readable while still producing the full TopicSeed shape.
 *
 * `extra` may carry formulas / workedExample / estimatedHours.
 */
export function t(
  id: string,
  sectionRef: string,
  title: string,
  titleTelugu: string,
  description: string,
  descriptionTelugu: string,
  concepts: string[],
  conceptsTelugu: string[],
  learningObjectives: string[],
  learningObjectivesTelugu: string[],
  extra?: Partial<TopicSeed>
): TopicSeed {
  return {
    id,
    sectionRef,
    title,
    titleTelugu,
    description,
    descriptionTelugu,
    concepts,
    conceptsTelugu,
    learningObjectives,
    learningObjectivesTelugu,
    ...extra,
  };
}

/** Build a Chapter from a syllabus table (topics come straight from the source). */
export function makeChapter(seed: ChapterSeed) {
  const topics = seed.topics.map((t, i) => makeTopic(seed.id, i + 1, t));
  return {
    id: seed.id,
    chapterNumber: seed.chapterNumber,
    title: seed.title,
    titleTelugu: seed.titleTelugu,
    description: seed.description,
    descriptionTelugu: seed.descriptionTelugu,
    board: seed.board,
    grade: 9,
    totalTopics: topics.length,
    estimatedHours: seed.estimatedHours,
    iconName: seed.iconName,
    unitNumber: seed.unitNumber,
    unitLabel: seed.unitLabel,
    unitLabelTelugu: seed.unitLabelTelugu,
    curriculumSource: seed.curriculumSource,
    learningOutcomes: seed.learningOutcomes,
    learningOutcomesTelugu: seed.learningOutcomesTelugu,
    topics,
  };
}

