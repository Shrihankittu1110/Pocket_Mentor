# 🎓 Pocket Mentor – AI-Powered Student Learning & Revision Platform
## Full-Stack MERN Architecture | Real-Time WebSockets | Web Speech & Audio APIs | AI-Driven Active Recall

> **Turn Your Notes Into Smarter Learning** — A gamified, full-stack AI-powered learning web application built on the **MERN Stack** (MongoDB, Express.js, React.js, Node.js) with real-time **Socket.io** collaboration, AI-driven study resource synthesis (**Google Gemini** + offline NLP fallback), and browser-native **Web Speech API** voice synthesis & recognition.

---

## 📑 Table of Contents
1. [Problem Statement](#1--problem-statement)
2. [Proposed Solution](#2--proposed-solution)
3. [Key Features](#3--key-features)
4. [Technologies Used](#4-️-technologies-used)
5. [Implementation Details](#5-️-implementation-details)
   - [System Architecture](#51-system-architecture)
   - [Database Schema Architecture](#52-database-schema-architecture)
   - [AI & Document Processing Pipeline](#53-ai--document-processing-pipeline)
   - [Real-Time Collaboration & Private Group Isolation](#54-real-time-collaboration--private-group-isolation)
   - [Hands-Free Voice Interaction & Audio Engine](#55-hands-free-voice-interaction--audio-engine)
   - [Zero-Baseline Gamification & Activity Tracking](#56-zero-baseline-gamification--activity-tracking)
6. [Quick Start & Installation](#6--quick-start--installation)
7. [Demo Student Credentials](#7--demo-student-credentials)
8. [API Documentation Summary](#8--api-documentation-summary)
9. [Future Scope](#9--future-scope--roadmap)
10. [References & Bibliography](#10--references--bibliography)

---

## 1. 🛑 Problem Statement

### 1.1 Academic Cognitive Overload & The Retention Deficit
Higher education students face severe cognitive overload, managing hundreds of lecture slides, textbook chapters, and unstructured notes across multiple subjects each semester. Traditional study habits rely heavily on **passive rereading and highlighter marking**, creating an **"Illusion of Competence"** where students feel familiar with the material during review but suffer severe memory decay (Ebbinghaus Forgetting Curve) during high-stakes exams.

### 1.2 Fragmented Educational Tools
Existing study software is deeply fragmented:
- **Note apps** (Notion, Google Docs, Apple Notes) are passive text repositories lacking automated revision or active recall testing.
- **Flashcard apps** (Anki, Quizlet) require laborious manual card creation, resulting in high setup friction.
- **Communication apps** (WhatsApp, Discord) lack structured study tools, distracting learners with unrelated chat noise.

### 1.3 Time Constraints in Pre-Exam Cramming
Students frequently have only 5 to 10 minutes between lectures or immediately prior to exams to refresh high-yield concepts. There exists no unified tool that dynamically synthesizes lengthy documents into **60-second timed micro-revisions** with core definitions and formulas.

### 1.4 Accessibility Barriers for Auditory & Motor-Impaired Learners
Students suffering from visual fatigue, dyslexia, or physical motor limitations lack native read-aloud narration and hands-free voice control options across their personal study materials, inhibiting flexible learning on the move.

---

## 2. 💡 Proposed Solution

**Pocket Mentor** unifies document processing, AI synthesis, spaced repetition, hands-free voice interaction, and real-time peer collaboration into a single, cohesive ecosystem:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Pocket Mentor Ecosystem                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌───────────────┐          ┌──────────────────┐          ┌───────────────┐
│ Active Study  │          │ Voice & Audio    │          │ Social Study  │
│ • 60s Timed   │          │ • Speech-to-Text │          │ • Private Code│
│   Revision    │          │ • Text-to-Speech │          │   Study Rooms │
│ • 3D Cards    │          │ • Harmonic Zero- │          │ • Public Peer │
│ • Smart Quiz  │          │   Latency Chimes │          │   Q&A Forum   │
└───────────────┘          └──────────────────┘          └───────────────┘
       ▲                            ▲                            ▲
       └────────────────────────────┼────────────────────────────┘
                                    │
                         ┌──────────────────────┐
                         │ Zero-Baseline XP &   │
                         │ Daily Streak Engine  │
                         └──────────────────────┘
```

1. **Automated Active Recall Engine**: Upload raw text, PDFs, or DOCX files. Pocket Mentor extracts the content and automatically derives structured summaries, 3D interactive flashcards, and diagnostic quizzes.
2. **60-Second Micro-Revision**: Generates timed countdown review sheets designed for lightning-fast memory reinforcement right before exams.
3. **Adaptive Quiz Arena & "Revise Again" Diagnostics**: Identifies conceptual weak points from incorrect answers and auto-generates 1-click targeted remedial review sessions.
4. **Hands-Free Auditory Learning**: Utilizes the browser-native **Web Speech API** (`SpeechSynthesis` and `SpeechRecognition`) to read cards aloud and respond to spoken navigation commands (*"Option A"*, *"Show Answer"*, *"Next"*, *"Repeat"*).
5. **Private Study Groups & Peer Teaching Hub**:
   - **Private Study Groups**: Isolated study channels restricted to group creators and peers who possess the secret 6-character access code, powered by **Socket.io**.
   - **Peer Teaching Hub**: Open community Q&A where students teach peers, vote on helpful answers, and earn **+25 Mentor XP** using the Feynman Learning Technique.
6. **Legitimate Zero-Baseline Gamification**: All metrics begin strictly at `0` for new accounts. Logins, quizzes, and notes genuinely advance the student's streak, weekly rhythm chart, and rank levels.

---

## 3. ✨ Key Features

| Module | Core Capability | Educational Value |
|---|---|---|
| **Multi-Format Ingestion** | Ingests text, `.txt`, `.pdf` (`pdf-parse`), and `.docx` (`mammoth`). | Automates study resource generation from existing lecture materials. |
| **60s Timed Revision** | Countdown timer with condensed definitions, formulas, and bullet summaries. | Perfect for fast pre-exam cramming with high memory retention. |
| **Interactive 3D Flashcards** | Realistic 3D card flips with audio pronunciation and spaced repetition ratings. | Boosts active recall with visual, auditory, and tactile feedback. |
| **Smart Quiz Arena** | Multiple choice, True/False, and fill-in-the-blank questions with explanations. | Instant objective assessment with zero grading delays. |
| **Revise-Again Diagnostics** | Tags weak topics and generates 1-click remedial quizzes. | Directs student focus precisely to concepts they missed. |
| **Private Study Groups** | Isolated rooms joined via unique 6-character access codes with live chat. | Enables private group collaboration without public chat dilution. |
| **Peer Teaching Hub** | Platform-wide community Q&A where students post questions and vote on answers. | Fosters peer-to-peer mentoring and deeper conceptual retention. |
| **Hands-Free Voice Assistant** | Web Speech API text-to-speech + speech-to-text voice commands. | Enables hands-free auditory study while commuting or relaxing. |
| **Procedural Harmonic Sound** | Web Audio API harmonic synthesizer generating zero-latency chimes. | Delivers immediate cognitive positive reinforcement without audio lag. |
| **Zero-Baseline Analytics** | 7-day activity rhythm chart, daily goal trackers, and streak counters. | Authentic progress tracking based on legitimate student actions. |

---

## 4. 🛠️ Technologies Used

### Frontend Architecture
- **React.js 18 (Vite Bundler)**: Single Page Application with fast HMR and modular component architecture.
- **Tailwind CSS**: Custom 3D interactive elevations (`shadow-duo`), micro-interaction scale/hover states, and responsive layouts.
- **Framer Motion**: Smooth page transitions and 3D card flipping animations.
- **Web Speech API**:
  - `SpeechSynthesis`: Text-to-speech audio narration with pitch, rate, and voice controls.
  - `SpeechRecognition`: Hands-free voice recognition grammar parsing.
- **Web Audio API (`AudioContext`)**: Real-time harmonic frequency synthesis (C5, E5, G5, C6) for zero-latency game chimes without static audio assets.
- **Socket.io Client**: Real-time WebSocket connection for chat messages, typing indicators, and peer question alerts.
- **Lucide React**: Modern, accessible vector icon suite.

### Backend Architecture
- **Node.js & Express.js**: Asynchronous event-driven REST API with modular controllers and protected routes.
- **MongoDB & Mongoose ODM**: Flexible NoSQL document database modeling user progress, notes, flashcards, quizzes, study groups, and community questions.
- **Socket.io Server**: Real-time bidirectional WebSocket server managing private room subscriptions and community broadcasts.
- **Multer Storage Engine**: File upload handling with strict MIME-type validation.
- **Document Extractors**:
  - `pdf-parse`: Extracts plain text streams from PDF lecture slides.
  - `mammoth`: Extracts raw text and HTML formatting from `.docx` files.
- **Security & Cryptography**:
  - `bcryptjs`: Adaptive password hashing with 10 salt rounds.
  - `jsonwebtoken` (JWT): Stateless bearer token authorization.

### AI & NLP Pipeline
- **Google Generative AI SDK (`@google/generative-ai`)**: Gemini API integration generating high-context topic breakdowns, flashcards, and conceptual quizzes.
- **Autonomous Rule-Based NLP Fallback Generator**: Custom rule-based natural language parser extracting definitions, key concepts, and quiz questions offline. Guarantees 100% platform availability even without third-party API keys or internet connection.

---

## 5. ⚙️ Implementation Details

### 5.1 System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Client Layer (Browser SPA)                      │
│   React 18 + Tailwind CSS + Web Speech API + Web Audio Synthesizer     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS REST / WSS WebSockets
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     API Gateway & Middleware Layer                     │
│    Express.js + CORS + JWT Guard + Multer Storage + Error Handler      │
└───────────┬───────────────────────┬────────────────────────┬───────────┘
            │                       │                        │
            ▼                       ▼                        ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  Controller Logic    │ │   Socket.io Gateway  │ │   AI & Ingestion     │
│ • authController     │ │ • join_group (room)  │ │ • Gemini API Engine  │
│ • noteController     │ │ • send_message       │ │ • Rule Fallback NLP  │
│ • flashcardController│ │ • typing / stop_type │ │ • pdf-parse / mammoth│
│ • quizController     │ │ • new_peer_question  │ └──────────────────────┘
│ • groupController    │ └──────────────────────┘
│ • peerController     │
│ • progressController │
└───────────┬──────────┘
            │
            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Data Layer (MongoDB Atlas)                      │
│   Users | Notes | Flashcards | Quizzes | Groups | Messages | Posts     │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Database Schema Architecture
- **`User`**: Account credentials, profile metadata, `dailyStreak`, `longestStreak`, `lastActiveDate`, `loginDates` array, `totalPoints`, and `achievements`.
- **`Note`**: Document references, raw text content, AI-generated structured Markdown summary, and 60-second revision bullet points.
- **`Flashcard`**: Question/definition pairings, mastery ratings (`easy` vs `hard`), review counts, and review timestamps.
- **`Quiz` & `QuizResult`**: Question arrays, options, correct answers, explanations, score percentages, and tagged weak topics for remediation.
- **`StudyGroup` & `Message`**: Channel title, subject, creator/admin ID, member IDs array, unique 6-character `groupCode`, and chat message logs.
- **`PeerPost`**: Community questions, subject/topic tags, author ID, answers array with helpful/love votes, and best-answer designation.

### 5.3 AI & Document Processing Pipeline
1. When a student uploads a file via `POST /api/notes`, Multer receives the file stream.
2. If `.pdf`, `pdf-parse` extracts raw text; if `.docx`, `mammoth` extracts raw text; if raw text, it is ingested directly.
3. If an `AI_API_KEY` is present, the server queries Google Gemini (`gemini-1.5-flash`) with structured prompts requiring clean JSON payloads.
4. If the Gemini API is unreachable or no key is provided, the built-in deterministic NLP engine extracts sentences containing definition anchors (*"is defined as"*, *"refers to"*, *"consists of"*) to generate clean flashcards and quizzes offline.

### 5.4 Real-Time Collaboration & Private Group Isolation
- **Private Channel Isolation**: `getGroups` queries `{ $or: [{ admin: req.user._id }, { members: req.user._id }] }`. Other users cannot see groups they have not created or joined.
- **Code-Based Entry**: Students join using the 6-character alphanumeric code via `POST /api/groups/join`.
- **Socket.io Rooms**: Sockets join room `groupId` via `socket.join(groupId)`. Messages sent within a group are emitted exclusively to that room (`socket.to(groupId).emit(...)`).

### 5.5 Hands-Free Voice Interaction & Audio Engine
- **Voice Commands**: While voice mode is enabled, `SpeechRecognition` matches user speech against a command dictionary (`next`, `show answer`, `flip`, `repeat`, `easy`, `hard`, `option a`, `option b`, `option c`, `option d`).
- **Zero-Latency Harmonic Audio**: Procedurally generates sound waves using the browser's `AudioContext` oscillator nodes (Pentatonic chord frequencies: C5, E5, G5, C6) with exponential gain falloffs, eliminating the network latency of loading external `.mp3` files.

### 5.6 Zero-Baseline Gamification & Activity Tracking
- New user accounts start strictly at `0` across all metrics (0 streak, 0 XP, 0 notes, 0 quizzes).
- When a user logs in on a given day (e.g. Thursday), their session itself is recorded as `+1 activity` towards the daily goal ($1/5$ completed), rendering an active bar for Thursday on the weekly rhythm chart.
- The daily streak automatically increments by $+1$ and awards $+20$ XP when consecutive active days are detected ($\Delta_{\text{days}} = 1$).

---

## 6. ⚡ Quick Start & Installation

### Prerequisites
- **Node.js** v18+ installed
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

### Backend Setup
```bash
cd backend
npm install
```

Create/verify `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/pocket-mentor
JWT_SECRET=pocket_mentor_super_secret_jwt_key_2026_production_secure
CLIENT_URL=http://localhost:5173
AI_API_KEY=your_optional_gemini_api_key
```

Start the backend:
```bash
npm start
```
*Backend runs on `http://localhost:5000` and automatically seeds demo data on initial launch.*

### Frontend Setup
In another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.


## 7. 📡 API Documentation Summary

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate & retrieve JWT token | No |
| `GET` | `/api/auth/profile` | Retrieve profile metadata & streak | Yes |
| `PUT` | `/api/auth/profile` | Update profile college, course, year | Yes |
| `POST` | `/api/notes` | Upload note (paste or TXT/PDF/DOCX) | Yes |
| `GET` | `/api/notes` | List notes with search & subject filter | Yes |
| `POST` | `/api/notes/:id/summary` | Generate AI structured Markdown summary | Yes |
| `POST` | `/api/notes/:id/quick-revision` | Generate 60-second quick revision | Yes |
| `POST` | `/api/flashcards/generate` | Auto-generate flashcard deck from note | Yes |
| `GET` | `/api/flashcards` | List flashcards with topic filter | Yes |
| `PUT` | `/api/flashcards/:id` | Rate recall (`easy` / `hard`) & earn XP | Yes |
| `POST` | `/api/quizzes/generate` | Auto-generate MCQ/True-False/Fill-in quiz | Yes |
| `GET` | `/api/quizzes` | List available quizzes | Yes |
| `POST` | `/api/quizzes/:id/submit` | Submit answers, calculate score, diagnose weak topics | Yes |
| `POST` | `/api/groups` | Create private study group (+25 XP) | Yes |
| `GET` | `/api/groups` | List user's created/joined groups | Yes |
| `POST` | `/api/groups/join` | Join private group by 6-character code | Yes |
| `GET` | `/api/groups/:id/messages` | Get group chat message history | Yes |
| `POST` | `/api/groups/:id/message` | Send message (broadcasted via Socket.io) | Yes |
| `GET` | `/api/peer/questions` | Community peer teaching Q&A feed | Yes |
| `POST` | `/api/peer/questions` | Post question for peer help (+10 XP) | Yes |
| `POST` | `/api/peer/questions/:id/answers` | Teach peer student with explanation (+25 XP) | Yes |
| `POST` | `/api/peer/questions/:pId/answers/:aId/vote` | Vote "Helpful" 👍 or "Great Explanation" ❤️ | Yes |
| `POST` | `/api/peer/questions/:pId/answers/:aId/best` | Mark "Best Answer" ⭐ (+50 XP) | Yes |
| `GET` | `/api/progress` | Dashboard statistics & daily goal progress | Yes |
| `GET` | `/api/progress/analytics` | Weekly 7-day activity chart & topic analytics | Yes |

---

## 8. 🚀 Future Scope & Roadmap

1. **SuperMemo SM-2 Spaced Repetition**: Implement algorithmic interval scheduling ($I(n) = I(n-1) \times EF$) to dynamically space flashcard reviews over weeks and months.
2. **WebRTC P2P Video/Audio Study Rooms**: Upgrade study channels into live audio/video co-working spaces with collaborative whiteboards.
3. **Handwritten Lecture Note OCR**: Ingest phone camera snapshots of lecture boards and notebooks using Tesseract.js or Cloud Vision API.
4. **Inter-College Campus Leaderboards**: Introduce university-wide leaderboards where campuses compete for weekly study streaks.
5. **Direct LMS Integration**: Seamless synchronization with Canvas, Google Classroom, and Blackboard to auto-import course syllabi.
6. **Cross-Platform Native Mobile Application**: Package client using React Native / Capacitor with offline SQLite caching.

---

## 9. 📚 References & Bibliography

### Academic Literature
1. **Ebbinghaus, H.** (1885). *Memory: A Contribution to Experimental Psychology*. Teachers College, Columbia University. (The Forgetting Curve & Spaced Learning).
2. **Karpicke, J. D., & Blunt, J. R.** (2011). "Retrieval Practice Produces More Learning than Elaborative Studying with Concept Mapping." *Science*, 331(6018), 772–775. (Active Recall Efficacy).
3. **Feynman, R. P.** (1965). *The Feynman Lectures on Physics*. Addison-Wesley. (Pedagogical foundation of Peer Teaching).
4. **Deterding, S., Dixon, D., Khaled, R., & Nacke, L.** (2011). "From game design elements to gamefulness: defining 'gamification'". *MindTrek '11 Proceedings*, 9–15. (Gamification Dynamics).

### Technical Documentation & Standards
5. **React Documentation**: *React 18 & Concurrent Features*. [https://react.dev/](https://react.dev/)
6. **MongoDB Inc.**: *Mongoose ODM v8 Specification & Aggregation Pipeline*. [https://mongoosejs.com/](https://mongoosejs.com/)
7. **W3C Speech API Community Group**: *Web Speech API Specification*. [https://wicg.github.io/speech-api/](https://wicg.github.io/speech-api/)
8. **W3C Audio Working Group**: *Web Audio API Specification*. [https://www.w3.org/TR/webaudio/](https://www.w3.org/TR/webaudio/)
9. **Socket.io Documentation**: *Bidirectional Real-Time Communication*. [https://socket.io/docs/v4/](https://socket.io/docs/v4/)
10. **Google DeepMind**: *Google Gemini API Documentation for Generative AI*. [https://ai.google.dev/docs](https://ai.google.dev/docs)
11. **Vercel & Render**: *Deployment and Routing Guides for MERN Applications*. [https://vercel.com/docs](https://vercel.com/docs) / [https://render.com/docs](https://render.com/docs)

---
*For the standalone project report submission file, see [`Documentation - Project Report.md`](file:///d:/Pocket%20Mentor-MERN/Documentation%20-%20Project%20Report.md).*
