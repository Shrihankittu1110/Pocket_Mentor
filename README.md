#  Pocket Mentor – AI-Powered Student Learning & Revision Platform

> **Turn Your Notes Into Smarter Learning** — A gamified, full-stack AI-powered learning web application built on the **MERN Stack** (MongoDB, Express, React, Node.js) with real-time Socket.io collaboration, AI-driven study generation, and Web Speech API voice synthesis & recognition.

---

## 🎯 Overview

**Pocket Mentor** empowers students to convert lecture transcripts, handwritten slides, PDFs, DOCX files, or pasted notes into interactive, high-retention study resources:
- 📚 **AI-Powered Topic Summaries**: Structured Markdown with key definitions and takeaways.
- ⚡ **60-Second Quick Revisions**: Timed countdown summaries designed for lightning-fast exam review.
- 🧠 **Interactive 3D Flashcards**: Interactive flipping cards with spaced repetition ratings (`Easy` / `Hard`).
- ❓ **Smart Quiz Arena**: Multiple-choice, True/False, and Fill-in-the-blank questions with instant feedback and audio chimes.
- 🔄 **Revise-Again Recommendations**: AI diagnostic highlighting weak topics with 1-click retry flows.
- 🔥 **Daily Learning Streaks & XP System**: Habit-forming streak engine with celebratory milestones and levels.
- 🔊 **Voice Learning System**: Text-to-Speech (TTS) audio narration of questions, answers, and summaries.
- 🎙️ **Hands-Free Voice Controls**: Speech Recognition (STT) commands (*"Next"*, *"Repeat"*, *"Show Answer"*, *"Easy"*, *"Option A"*).
- 👥 **Real-Time Study Groups**: Live collaborative rooms powered by **Socket.io** with live typing indicators.
- 👨‍🏫 **Peer Teaching & Mentoring Hub**: Student Q&A where peers explain topics, vote on helpful answers, and earn **+25 Mentor Points**.

---

## 💻 Technology Stack

### Frontend
- **React.js (Vite)** with JavaScript (ES Modules)
- **Tailwind CSS** with custom interactive 3D buttons, badges, and responsive layouts
- **Framer Motion** for smooth transitions and card flip interactions
- **Web Speech API**:
  - `SpeechSynthesis` for natural voice read-aloud
  - `SpeechRecognition` for hands-free voice commands
- **Web Audio API**: Real-time harmonic synthesizer for zero-latency game chimes (+10 XP ding, flip swoosh, fanfare, streak flame)
- **Lucide React** for modern UI icons
- **Socket.io Client** for instant study group messaging
- **Canvas Confetti** for celebratory milestone bursts

### Backend
- **Node.js** & **Express.js** REST API
- **MongoDB** with **Mongoose ODM**
- **JSON Web Tokens (JWT)** & **bcryptjs** for secure authentication
- **Multer** file upload pipeline supporting `.txt`, `.pdf` (`pdf-parse`), and `.docx` (`mammoth`)
- **Socket.io Server** for bidirectional real-time rooms
- **AI Service Layer**: Google Gemini API (`@google/generative-ai`) with intelligent rule-based/NLP fallback generator (works 100% offline or without API key!)

---

## 🏗️ Project Structure

```text
Pocket-Mentor/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # VoiceControls, VoiceCommandIndicator, Confetti
│   │   │   └── layout/           # Navbar, Sidebar, BottomNav (mobile)
│   │   ├── context/              # AuthContext, SocketContext, SoundContext
│   │   ├── hooks/                # useSpeechSynthesis, useSpeechRecognition
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Hero, 6-step engine, feature cards, live demo
│   │   │   ├── LoginPage.jsx     # Auth with 1-click Demo Login
│   │   │   ├── RegisterPage.jsx  # Student onboarding with 100 bonus XP
│   │   │   ├── DashboardPage.jsx # Streaks, daily goal progress, statistics
│   │   │   ├── NotesPage.jsx     # Upload (paste or PDF/DOCX) & AI tools
│   │   │   ├── QuickRevisionPage.jsx # 60-second timer revision with audio
│   │   │   ├── FlashcardsPage.jsx    # 3D interactive flip cards & voice commands
│   │   │   ├── QuizPage.jsx          # Interactive quiz arena & revise-again
│   │   │   ├── StudyGroupsPage.jsx   # Real-time Socket.io chat rooms
│   │   │   ├── PeerTeachingPage.jsx  # Student Q&A and mentor voting
│   │   │   ├── ProgressPage.jsx      # Weekly charts, weak/strong analytics
│   │   │   ├── MyLearningPage.jsx    # Consolidated searchable study library
│   │   │   └── ProfilePage.jsx       # Student profile, level rank, badges
│   │   ├── services/             # Axios API client with auth interceptors
│   │   ├── utils/                # Web Audio API sound synthesizer
│   │   ├── App.jsx               # Routes & protected route guards
│   │   ├── index.css             # 3D styling & animations
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/
│   ├── config/                   # db.js (MongoDB), socket.js (Socket.io)
│   ├── controllers/              # auth, note, flashcard, quiz, group, peer, progress
│   ├── middleware/               # authMiddleware, uploadMiddleware, errorHandler
│   ├── models/                   # User, Note, Flashcard, Quiz, QuizResult, StudyGroup, Message, PeerPost, Achievement
│   ├── routes/                   # authRoutes, noteRoutes, flashcardRoutes, quizRoutes, groupRoutes, peerRoutes, progressRoutes
│   ├── services/                 # aiService (Gemini + fallback), textExtractionService, gamificationService
│   ├── utils/                    # seeder.js (preloaded demo notes, cards, quizzes)
│   ├── uploads/                  # Local storage for documents
│   ├── server.js                 # Server entry point
│   ├── .env                      # Environment config
│   └── package.json
│
└── README.md
```

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
- **Node.js** v18+ installed
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

### 2. Backend Setup
```bash
cd backend
npm install
```

Create/check `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/pocket-mentor
JWT_SECRET=pocket_mentor_super_secret_jwt_key_2026_production_secure
CLIENT_URL=http://localhost:5173
AI_API_KEY=your_optional_gemini_api_key
```
*(Note: If `AI_API_KEY` is omitted, the built-in smart NLP generator takes over automatically).*

Start the backend:
```bash
npm start
```
*Backend starts on `http://localhost:5000` and automatically seeds demo data on first launch!*

### 3. Frontend Setup
In another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🔑 Demo Student Credentials

For instant evaluation without filling forms:
- **Email:** `demo@pocketmentor.com`
- **Password:** `password123`
- *Or simply click the **"⚡ One-Click Demo Student Login"** button on the Login page.*

---

## 📡 API Documentation Summary

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new student (+100 starter XP) | No |
| `POST` | `/api/auth/login` | Authenticate & retrieve JWT token | No |
| `GET` | `/api/auth/profile` | Get current user profile & streak | Yes |
| `PUT` | `/api/auth/profile` | Update profile college, course, year | Yes |
| `POST` | `/api/notes` | Upload note (paste text or TXT/PDF/DOCX) | Yes |
| `GET` | `/api/notes` | List notes with search & subject filter | Yes |
| `POST` | `/api/notes/:id/summary` | Generate AI structured Markdown summary | Yes |
| `POST` | `/api/notes/:id/quick-revision` | Generate 60-second quick revision | Yes |
| `POST` | `/api/flashcards/generate` | Auto-generate flashcard deck from notes | Yes |
| `GET` | `/api/flashcards` | List flashcards with topic filter | Yes |
| `PUT` | `/api/flashcards/:id` | Rate recall (`easy` / `hard`) & earn +5 XP | Yes |
| `POST` | `/api/quizzes/generate` | Auto-generate MCQ/True-False/Fill-Blank quiz | Yes |
| `GET` | `/api/quizzes` | List available quizzes | Yes |
| `POST` | `/api/quizzes/:id/submit` | Submit answers, calculate score, diagnose weak topics | Yes |
| `POST` | `/api/groups` | Create real-time study group (+25 XP) | Yes |
| `GET` | `/api/groups` | List study groups | Yes |
| `POST` | `/api/groups/join` | Join group by unique 6-digit code | Yes |
| `GET` | `/api/groups/:id/messages` | Get group chat message stream | Yes |
| `POST` | `/api/groups/:id/message` | Send message (broadcasted via Socket.io) | Yes |
| `GET` | `/api/peer/questions` | Peer teaching Q&A feed | Yes |
| `POST` | `/api/peer/questions` | Post question for peer help (+10 XP) | Yes |
| `POST` | `/api/peer/questions/:id/answers` | Teach peer student with explanation (+25 XP) | Yes |
| `POST` | `/api/peer/questions/:pId/answers/:aId/vote` | Vote "Helpful" 👍 or "Great Explanation" ❤️ | Yes |
| `POST` | `/api/peer/questions/:pId/answers/:aId/best` | Mark "Best Answer" ⭐ (+50 XP) | Yes |
| `GET` | `/api/progress` | Get dashboard statistics & today's progress | Yes |
| `GET` | `/api/progress/analytics` | Weekly 7-day study chart, weak/strong topics | Yes |

---

## 📱 Responsive Experience

Pocket Mentor is built from the ground up to support all viewports:
- **Mobile (320px - 425px)**: Bottom Navigation Bar (`Home`, `Learn`, `Cards`, `Groups`, `Profile`) + compact touch controls.
- **Tablet (768px - 1024px)**: Adaptive grid cards and collapsible mobile drawer.
- **Desktop & Laptop (1280px - 1920px)**: Left persistent sidebar with live streak flame counter, 3D action cards, and expanded side-by-side chat views.

---

## 🚀 Future Roadmap & Enhancements

- 🤖 **AI Chat Mentor**: 24/7 personal tutor bot for deep Socratic dialogues.
- 📹 **Video Study Rooms**: WebRTC peer-to-peer live camera study rooms.
- 🏆 **Global College Leaderboards**: Compete with students from other universities for the #1 weekly streak.
- 📄 **Direct PDF Annotator**: In-browser document highlighting with 1-click card generation from selected text.
- 🌙 **OLED Dark Mode**: Contrast-friendly nighttime theme for late night cramming.
