import type { Chapter } from '@/types';
import { makeChapter, type ChapterSeed } from './builders';

// ==============================================================================
// CBSE CLASS IX MATHEMATICS - 2026-27 OFFICIAL CURRICULUM
// Source of truth: scratch/pdf_output.txt ("COURSE STRUCTURE CLASS IX")
//
//   Unit I   Number System .............. 07 marks (12 periods)
//   Unit II  Algebra ................... 20 marks (66 periods)
//   Unit III Coordinate Geometry ....... 04 marks ( 6 periods)
//   Unit IV  Geometry .................. 25 marks (69 periods)
//   Unit V   Mensuration ............... 14 marks (27 periods)
//   Unit VI  Statistics and Probability 10 marks (24 periods)
//
// Chapters and topics keep the IDs used by the previous curriculum so existing
// progress rows, assessment snapshots and routes keep resolving. Topic titles
// and learning outcomes are taken from the official "Key Concepts" and
// "The student will be able to" lists published for each unit.
// ==============================================================================

import { CBSE_SEED } from './cbse-seed';

export const CBSE_CHAPTERS: Chapter[] = CBSE_SEED.map(makeChapter);
