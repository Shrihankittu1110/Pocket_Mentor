import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Flame,
  Volume2,
  Brain,
  CheckCircle2,
  Users,
  GraduationCap,
  Zap,
  BarChart,
  Layers,
  HelpCircle,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Github
} from 'lucide-react';
import { useSound } from '../context/SoundContext';
import Logo from '../components/common/Logo';

export const LandingPage = () => {
  const { playFlip, playCorrect } = useSound();
  const [demoFlipped, setDemoFlipped] = useState(false);
  const [demoQuizSelected, setDemoQuizSelected] = useState(null);

  const handleFlipCard = () => {
    playFlip();
    setDemoFlipped(!demoFlipped);
  };

  const handleQuizAnswer = (idx) => {
    setDemoQuizSelected(idx);
    if (idx === 1) {
      playCorrect();
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fa]">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-mentor-green text-sm font-extrabold shadow-sm">
                <Sparkles className="w-4 h-4" />
                <span>The Smart AI Platform for College Notes & Exams</span>
              </div>

              <h1 className="font-fun text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                Turn Your Notes Into <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-mentor-green via-emerald-500 to-teal-500">
                  Smarter Learning.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 font-medium">
                Pocket Mentor transforms messy class slides, PDFs, and notes into 60-second quick revisions, interactive 3D flashcards, smart quizzes, and voice-assisted revision sessions powered by AI.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 text-lg font-extrabold rounded-2xl btn-duo-green flex items-center justify-center gap-3"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#features"
                  className="w-full sm:w-auto px-8 py-4 text-lg font-extrabold rounded-2xl btn-duo-white flex items-center justify-center gap-2"
                >
                  <span>Explore Features</span>
                </a>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-mentor-green" /> Free for Students
                </span>
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-mentor-orange" /> Daily Learning Streaks
                </span>
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-mentor-blue" /> Voice Learning
                </span>
              </div>
            </div>

            {/* Right Hero Interactive Demo Box */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-md bg-gradient-to-b from-emerald-500/10 to-teal-500/5 p-6 rounded-3xl border-2 border-emerald-300 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                    Interactive Live Demo
                  </span>
                  <span className="text-xs font-bold text-slate-500">Try Clicking Card!</span>
                </div>

                {/* Flip Flashcard Preview */}
                <div
                  onClick={handleFlipCard}
                  className="cursor-pointer h-52 bg-white rounded-2xl border-2 border-slate-200 p-6 flex flex-col justify-between shadow-duo hover:border-emerald-400 transition"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>{demoFlipped ? "Answer (Back)" : "Question (Front)"}</span>
                    <Volume2 className="w-4 h-4 text-mentor-blue" />
                  </div>
                  <div className="text-center font-fun text-xl font-bold text-slate-800 px-2">
                    {demoFlipped
                      ? "React is a declarative JavaScript library for building fast, component-driven user interfaces!"
                      : "What is React.js?"}
                  </div>
                  <div className="text-center text-xs font-extrabold text-mentor-green">
                    {demoFlipped ? "🎉 Great Recall! (Click to flip back)" : "👆 Click to Flip & Reveal Answer"}
                  </div>
                </div>

                {/* Interactive Mini Quiz Preview */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
                  <p className="text-xs font-bold text-slate-500">Mini Quiz: Which database is document-based?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["PostgreSQL", "MongoDB", "Redis", "SQLite"].map((opt, i) => (
                      <button
                        key={opt}
                        onClick={() => handleQuizAnswer(i)}
                        className={`p-2.5 text-xs font-bold rounded-xl border text-left transition ${
                          demoQuizSelected === i
                            ? i === 1
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-duo-green'
                              : 'bg-red-50 border-red-400 text-red-700 shadow-duo-red'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {opt} {demoQuizSelected === i && (i === 1 ? '✅ +10 XP' : '❌')}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. How It Works Section */}
      <section className="py-20 bg-[#f7f9fa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-mentor-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Simple 6-Step Engine
            </span>
            <h2 className="font-fun text-3xl sm:text-4xl font-black text-slate-900">
              How Pocket Mentor Works
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              From messy class notes to complete exam mastery in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { step: '1', title: 'Upload Notes', desc: 'Paste text or upload PDF / DOCX / TXT notes', icon: '📝' },
              { step: '2', title: 'AI Understands', desc: 'Gemini NLP parses definitions & concepts', icon: '🤖' },
              { step: '3', title: 'Get Summary', desc: 'Generate structured & 60-second revisions', icon: '📚' },
              { step: '4', title: 'Flashcards', desc: 'Flip 3D spaced repetition cards with audio', icon: '🧠' },
              { step: '5', title: 'Take Quiz', desc: 'Interactive MCQs, True/False & instant feedback', icon: '❓' },
              { step: '6', title: 'Track Progress', desc: 'Maintain streaks, earn XP, conquer weak spots', icon: '🔥' },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-3xl p-5 border-2 border-slate-200 hover:border-emerald-400 hover:shadow-duo transition flex flex-col items-center text-center space-y-2 relative"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mb-1 shadow-sm">
                  {item.icon}
                </div>
                <span className="text-[11px] font-black uppercase text-mentor-green bg-emerald-50 px-2 py-0.5 rounded-md">
                  Step {item.step}
                </span>
                <h3 className="font-fun font-bold text-slate-800 text-base">{item.title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-mentor-purple bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Powerful Learning Toolkit
            </span>
            <h2 className="font-fun text-3xl sm:text-4xl font-black text-slate-900">
              Built Like a Game, Crafted for Top Grades
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Everything students need to retain information, prepare for midterms, and enjoy studying.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'AI Summary & 60s Revision',
                desc: 'Generate instant key definitions, bullet points, and timed 60-second power summaries.',
                icon: Zap,
                color: 'bg-amber-500',
                border: 'hover:border-amber-400'
              },
              {
                title: '3D Interactive Flashcards',
                desc: 'Interactive 3D card flips with spaced repetition ratings, shuffle, and auto-play.',
                icon: Layers,
                color: 'bg-purple-500',
                border: 'hover:border-purple-400'
              },
              {
                title: 'Smart Gamified Quiz Arena',
                desc: 'MCQs, True/False, Fill in Blanks with real-time feedback, sound effects, and XP rewards.',
                icon: HelpCircle,
                color: 'bg-rose-500',
                border: 'hover:border-rose-400'
              },
              {
                title: 'Voice & Hands-Free Learning',
                desc: 'Read-aloud audio with Web Speech API plus speech recognition for voice commands like "Next" and "Reveal".',
                icon: Volume2,
                color: 'bg-blue-500',
                border: 'hover:border-blue-400'
              },
              {
                title: 'Daily Streak & XP Levels',
                desc: 'Stay consistent with daily streak flames, milestone achievements, and knowledge points.',
                icon: Flame,
                color: 'bg-orange-500',
                border: 'hover:border-orange-400'
              },
              {
                title: 'Real-Time Study Groups',
                desc: 'Collaborate with classmates in live chat rooms powered by Socket.io and share study materials.',
                icon: Users,
                color: 'bg-cyan-500',
                border: 'hover:border-cyan-400'
              },
              {
                title: 'Peer Teaching Hub',
                desc: 'Ask difficult questions, post peer explanations, vote helpful answers, and earn mentor points.',
                icon: GraduationCap,
                color: 'bg-indigo-500',
                border: 'hover:border-indigo-400'
              },
              {
                title: 'Progress & Weak Areas',
                desc: 'Weekly activity charts, accuracy percentage, and intelligent Revise-Again recommendations.',
                icon: BarChart,
                color: 'bg-teal-500',
                border: 'hover:border-teal-400'
              },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className={`bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm transition hover:shadow-duo ${feat.border}`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${feat.color} text-white flex items-center justify-center mb-4 shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-fun text-lg font-bold text-slate-800 mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Student Community Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <span className="text-xs font-extrabold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full text-emerald-100">
                Peer-to-Peer Learning
              </span>
              <h2 className="font-fun text-4xl sm:text-5xl font-black leading-tight">
                Learn Together. Teach Others. Master Anything.
              </h2>
              <p className="text-emerald-100 text-lg leading-relaxed">
                The best way to understand a concept is to explain it to someone else. Pocket Mentor rewards students who teach their peers with Helpful Mentor badges and bonus knowledge points.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
                  <p className="font-fun text-3xl font-black">100%</p>
                  <p className="text-xs text-emerald-100 font-semibold">Active Collaboration</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
                  <p className="font-fun text-3xl font-black">+25 XP</p>
                  <p className="text-xs text-emerald-100 font-semibold">Per Helpful Peer Answer</p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-800 text-base font-extrabold rounded-2xl shadow-duo hover:bg-emerald-50 transition"
                >
                  <span>Join The Study Community</span>
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Mock Community Card */}
            <div className="bg-white text-slate-800 rounded-3xl p-6 border-2 border-white/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                    👨‍🏫
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Peer Teaching Forum</p>
                    <p className="text-[11px] text-slate-500">Topic: Computer Science</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Answered ⭐
                </span>
              </div>

              <p className="font-bold text-sm text-slate-900">
                "Can someone explain why MongoDB uses BSON instead of raw JSON?"
              </p>

              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Sophia Chen (4th Year)</span>
                  <span className="text-emerald-600 font-extrabold">👍 14 Helpful Votes</span>
                </div>
                <p>
                  BSON (Binary JSON) extends JSON to support additional data types like Date and raw Binary, and allows fast traversal via internal length prefixes.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-1">
                <span>Earned +25 Mentor XP</span>
                <span className="text-mentor-green">Unlocked "Helpful Mentor" Badge</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-3">
              <Logo size="sm" badge="" />
              <span className="text-xs text-slate-400 font-medium">© 2026 MERN Platform</span>
            </div>

            <div className="flex items-center gap-6 text-sm font-bold text-slate-600">
              <a href="#features" className="hover:text-mentor-green transition">Features</a>
              <Link to="/login" className="hover:text-mentor-green transition">Sign In</Link>
              <Link to="/register" className="hover:text-mentor-green transition">Register</Link>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-slate-900 transition">
                <Github className="w-4 h-4" /> GitHub
              </a>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
