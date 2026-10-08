import type { Chapter } from '@/types';
import { makeChapter, type ChapterSeed } from './builders';
import { AP_STATE_BOARD_SEED } from './ap-state-board-seed';

// ==============================================================================
// AP STATE BOARD (SCERT ANDHRA PRADESH) - CLASS IX MATHEMATICS
// Full syllabus tables live in ./ap-state-board-seed.ts, transcribed from
//   9_Maths_SEM-1_Textbook.pdf  (Semester 1, Chapters 1-6)
//   9_Maths_SEM-2_Textbook.pdf  (Semester 2, Chapters 7-12)
//
// Chapter and topic IDs keep the values used by the previous curriculum so
// existing progress rows, assessment snapshots and routes keep resolving.
// ==============================================================================

export const AP_STATE_BOARD_CHAPTERS: Chapter[] = AP_STATE_BOARD_SEED.map(makeChapter);