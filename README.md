# EduMathAI 🧠✨

**AI-Powered Mathematics Learning Platform for Class 9 Students**

> *Learn Mathematics Smarter with AI*

[![Next.js](https://img.shields.io/badge/Next.js-16.3.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Ready-orange?logo=firebase)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-8B5CF6?logo=google)](https://ai.google.dev/)

---

## 📌 Project Overview

**EduMathAI** is a complete, production-quality, AI-powered mathematics learning platform designed specifically for **Class 9 students** following:

- 🏫 **AP State Board** (Andhra Pradesh SCERT)
- 📚 **CBSE** (National Curriculum Framework)
- 🌐 **English Medium**
- 🇮🇳 **Telugu Medium** (bilingual support)

### Core Learning Cycle

```
Assess → Learn → Ask AI → Practice → Detect Mistakes → Revise → Retest → Measure Improvement
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+

### 1. Clone / Download
```bash
cd d:/EduMathAI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment (Optional but recommended for full AI features)
```bash
# Copy the template
cp .env.example .env.local

# Edit .env.local and add your Gemini API key:
# GEMINI_API_KEY=your_key_here
# Get a free key at: https://aistudio.google.com/app/apikey
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** The app works fully in **Demo Mode** without any API keys. All student data, progress, and assessments persist locally via `localStorage`.

---

## 🎯 Key Features

### For Judges / Hackathon Reviewers

| Feature | Description | Route |
|--------|-------------|-------|
| 🏠 **Landing Page** | Stunning hero section with feature overview | `/` |
| 🔐 **Quick Login** | One-click demo persona switching | `/auth/login` |
| 📊 **Student Dashboard** | XP, streaks, learning metrics, quick actions | `/student/dashboard` |
| 📝 **Baseline Assessment** | 20-min diagnostic with timed quiz | `/student/baseline` |
| 📖 **Learn Lessons** | Chapter browser + bilingual lessons (EN/తె) | `/student/learn` |
| 💪 **Practice Engine** | Adaptive questions with hints & confetti | `/student/practice` |
| 🧠 **AI Maths Tutor** | Hint → Step → Solution progression | `/student/ai-tutor` |
| 🕵️ **AI Mistake Detective** | Root-cause analysis of student errors ⭐ | `/student/mistake-detective` |
| 📷 **AI Image Solver** | Photograph a math problem, get solution | `/student/ai-solver` |
| 📈 **Before & After Impact** | Measurable learning improvement evidence ⭐⭐⭐ | `/student/before-after` |
| 📄 **Progress Report (PDF)** | Printable academic improvement certificate | `/student/before-after/report` |
| 📅 **AI Study Planner** | Exam-date-aware adaptive study schedule | `/student/study-planner` |
| 🏆 **Achievements & XP** | Gamification with badges and level system | `/student/achievements` |
| 📐 **Formula Notebook** | LaTeX-rendered formula reference by chapter | `/student/formulas` |
| 🔁 **Smart Revision** | AI-prioritized weak-topic revision | `/student/revision` |
| ✍️ **Handwritten Checker** | Upload handwritten answers for AI marking | `/student/handwritten-checker` |
| 💬 **AI Math Chatbot** | Floating chatbot for instant math help | Floating UI (all pages) |

### Teacher Dashboard
| Feature | Route |
|--------|-------|
| Teacher Dashboard | `/teacher/dashboard` |
| Class Management | `/teacher/classes` |
| Student Analytics | `/teacher/students` |
| AI Question Generator | `/teacher/ai-assistant` |
| Question Bank | `/teacher/questions` |

---

## 🏗️ Architecture

### Tech Stack
```
Frontend:  Next.js 16 (App Router) + React 19 + TypeScript 5
Styling:   Tailwind CSS v4 + Custom CSS Design System
AI:        Google Gemini API (via @google/genai SDK)
Auth/DB:   Firebase (client SDK with localStorage fallback)
Math:      KaTeX (LaTeX formula rendering)
UI:        lucide-react icons + canvas-confetti
```

### Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── ai/tutor/         # AI Maths Tutor endpoint
│   │   ├── ai/solver/        # AI Image Solver endpoint
│   │   ├── ai/mistake-detective/ # AI Error Analyst endpoint
│   │   ├── ai/chat/          # AI Chatbot endpoint
│   │   ├── ai/handwritten-checker/ # Handwriting OCR endpoint
│   │   └── evaluate-quiz/    # Deterministic quiz evaluation
│   ├── auth/                 # Login, Register, Forgot Password
│   ├── student/              # 22 student-facing pages
│   └── teacher/              # 5 teacher-facing pages
├── components/
│   ├── layout/               # Navbar, Sidebar, Header, Footer, RoleGuard
│   └── ui/                   # Button, Card, Badge, Modal, Input, MathRenderer...
├── lib/
│   ├── ai-service.ts         # AI service layer (Gemini + fallback)
│   ├── auth-context.tsx      # Authentication + global state provider
│   ├── curriculum-data.ts    # Class 9 Math curriculum (AP/CBSE, EN/తె)
│   ├── deterministic-evaluator.ts # Score calculation engine
│   └── firebase.ts           # Firebase client initialization
└── types/
    └── index.ts              # Complete TypeScript type definitions
```

---

## 🤖 AI Integration

### Gemini API Features
All AI features gracefully degrade to intelligent local fallbacks when no API key is present:

| AI Service | Endpoint | Capability |
|-----------|---------|-----------|
| **AI Maths Tutor** | `POST /api/ai/tutor` | Hint → Explanation → Step-by-step → Final Answer |
| **AI Mistake Detective** | `POST /api/ai/mistake-detective` | 10-category error classification + repair strategy |
| **AI Image Solver** | `POST /api/ai/solver` | Multimodal: reads photos of math problems |
| **AI Handwriting Checker** | `POST /api/ai/handwritten-checker` | OCR + marks handwritten solutions |
| **AI Math Chatbot** | `POST /api/ai/chat` | Conversational math help, floating UI |

### Setting Up Your API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a free API key
3. Add to `.env.local`: `GEMINI_API_KEY=your_key`
4. Restart the dev server

---

## 📊 Unique Differentiators

### 1. Before & After Impact Evidence
The **hallmark feature**: mathematically verifiable proof of learning. Students:
1. Take a **Baseline Assessment** (diagnostic, 20 questions, timed)
2. Learn through AI-powered lessons, practice, mistake detection
3. Take a **Comparable Retest** (same difficulty, parallel form)
4. View a **side-by-side comparison** with delta scores, accuracy improvement, topic-level mastery gains
5. Generate a **printable PDF report** with official metrics

### 2. AI Mistake Detective
Unlike generic AI tutors, EduMathAI performs **root-cause error analysis**:
- Categorizes mistakes into 10 types (CONCEPT_ERROR, CALCULATION_ERROR, SIGN_ERROR, etc.)
- Identifies the specific incorrect belief causing the mistake
- Provides targeted remediation exercises
- Generates a "similar question" for immediate retest

### 3. Bilingual Support (English + Telugu)
- All chapter titles, objectives, and key terms in both languages
- AI Tutor responds in English, Telugu (తెలుగు), or Simple English
- Formula notebook in both mediums

### 4. Deterministic Evaluation Engine
All scores are **100% deterministically calculated** — no AI hallucination in scoring:
- Score, accuracy, time efficiency (per question)
- Topic-level mastery percentages
- Before-After delta computation
- Mistake type frequency analysis

---

## 🎨 Design System

- **Color Palette:** Indigo/Purple/Pink gradient brand + semantic semantic slate neutrals
- **Typography:** Geist Sans (body) + Geist Mono (code/math)
- **Dark Mode:** Automatic OS-preference detection
- **Animations:** Smooth micro-animations, slide-up reveals, shimmer loaders
- **Glassmorphism:** Frosted-glass cards on hero sections
- **Responsive:** Mobile-first, tested from 320px to 4K

---

## 🔐 Authentication & Demo Mode

### Quick Demo (No Sign-up Required)
Go to `/auth/login` and click any demo persona button:
- 🎓 **Student (Rahul)** — Full student experience with pre-populated data
- 👩‍🏫 **Teacher (Lakshmi)** — Teacher dashboard & analytics
- 👨‍👧 **Parent (Suresh)** — Parent monitoring view
- 🏫 **School Admin** — School-level analytics
- ⚡ **Platform Admin** — Platform-wide overview

### Firebase Integration
When Firebase credentials are added to `.env.local`, the app automatically uses:
- Firebase Authentication (email/password + social)
- Cloud Firestore for persistent user data
- Firebase Analytics

Without credentials, all state is persisted to `localStorage`.

---

## 🧪 Running Tests & Build

```bash
# Type check
npx tsc --noEmit

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

---

## 📋 Curriculum Coverage

### AP State Board / CBSE Class 9 Mathematics
| # | Chapter | Topics |
|---|---------|--------|
| 1 | Real Numbers & Exponents | Rational/Irrational, Number Line, Laws of Exponents |
| 2 | Polynomials & Factorization | Algebraic Identities, Factor Theorem, Remainder Theorem |
| 3 | Linear Equations in Two Variables | Graphical & Algebraic Methods |
| 4 | Coordinate Geometry | Cartesian Plane, Distance Formula, Section Formula |
| 5 | Lines and Angles | Parallel Lines, Transversals, Angle Sum Property |
| 6 | Triangles | Congruence, Inequalities, Proof Techniques |
| 7 | Quadrilaterals | Properties, Mid-Point Theorem |
| 8 | Circles | Chord Properties, Tangent Theorems |
| 9 | Heron's Formula | Area of Triangles & Quadrilaterals |
| 10 | Surface Areas & Volumes | Cuboid, Cylinder, Cone, Sphere |

---

## 📝 License

Built for educational hackathon purposes. All AI content generated via Google Gemini API.

---

*Made with ❤️ for Class 9 Math Students across India*
