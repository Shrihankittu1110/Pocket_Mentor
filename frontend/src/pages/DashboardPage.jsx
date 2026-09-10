import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  BookOpen,
  Layers,
  HelpCircle,
  Star,
  Trophy,
  Upload,
  Zap,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [progRes, notesRes] = await Promise.all([
          api.get('/progress'),
          api.get('/notes?limit=4'),
        ]);
        setProgressData(progRes.data);
        setRecentNotes(notesRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: 'Current Streak',
      value: `${progressData?.dailyStreak || user?.dailyStreak || 1} Days`,
      icon: Flame,
      color: 'text-mentor-orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      title: 'Notes Studied',
      value: progressData?.notesCount ?? 0,
      icon: BookOpen,
      color: 'text-mentor-blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Flashcards Mastered',
      value: progressData?.flashcardsCount ?? 0,
      icon: Layers,
      color: 'text-mentor-purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Quizzes Completed',
      value: progressData?.quizzesCompleted ?? 0,
      icon: HelpCircle,
      color: 'text-mentor-red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    {
      title: 'Total Points',
      value: `${progressData?.totalPoints || user?.totalPoints || 0} XP`,
      icon: Star,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      title: 'Achievements',
      value: progressData?.achievements?.length ?? user?.achievements?.length ?? 0,
      icon: Trophy,
      color: 'text-mentor-green',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
  ];

  const todayCompleted = progressData?.todayProgress?.completed ?? 3;
  const todayTarget = progressData?.todayProgress?.target ?? 5;
  const todayPct = progressData?.todayProgress?.percentage ?? 60;

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* 1. Welcome Greeting Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 sm:p-8 shadow-duo-lg">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Study Station</span>
          </div>
          <h1 className="font-fun text-3xl sm:text-4xl font-black">
            Hello, {user?.name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-emerald-100 text-base sm:text-lg max-w-xl font-medium">
            Ready to learn something new today? Turn your class notes into quick 60-second reviews and test your skills!
          </p>
        </div>

        {/* Mascot decoration */}
        <div className="absolute right-4 -bottom-4 text-7xl sm:text-8xl opacity-25 sm:opacity-60 select-none pointer-events-none">
          🎓
        </div>
      </div>

      {/* 2. Daily Goal Progress Bar */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h2 className="font-fun text-lg font-bold text-slate-900">Today's Daily Goal</h2>
          </div>
          <span className="font-fun font-bold text-sm text-mentor-green bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {todayCompleted} / {todayTarget} Activities Completed
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-mentor-green to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${todayPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Complete {Math.max(0, todayTarget - todayCompleted)} more study activity today to earn +20 Streak Bonus XP!
        </p>
      </div>

      {/* 3. Dashboard Statistics Cards */}
      <div>
        <h2 className="font-fun text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span>📊 Learning Statistics</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`rounded-3xl p-4 border-2 ${item.borderColor} ${item.bgColor} flex flex-col justify-between shadow-sm transition hover:shadow-duo hover:scale-[1.02]`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 truncate">{item.title}</p>
                  <p className="font-fun text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Quick Actions */}
      <div>
        <h2 className="font-fun text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span>⚡ Quick Actions</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            to="/notes?action=upload"
            className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-duo hover:border-emerald-400 flex flex-col items-center text-center gap-2 transition group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-mentor-green flex items-center justify-center group-hover:scale-110 transition">
              <Upload className="w-5 h-5" />
            </div>
            <span className="font-fun font-bold text-xs sm:text-sm text-slate-800">Upload Notes</span>
          </Link>

          <Link
            to="/flashcards"
            className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-duo hover:border-purple-400 flex flex-col items-center text-center gap-2 transition group"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-100 text-mentor-purple flex items-center justify-center group-hover:scale-110 transition">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-fun font-bold text-xs sm:text-sm text-slate-800">Create Flashcards</span>
          </Link>

          <Link
            to="/quiz"
            className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-duo hover:border-rose-400 flex flex-col items-center text-center gap-2 transition group"
          >
            <div className="w-11 h-11 rounded-xl bg-rose-100 text-mentor-red flex items-center justify-center group-hover:scale-110 transition">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span className="font-fun font-bold text-xs sm:text-sm text-slate-800">Take Quiz</span>
          </Link>

          <Link
            to="/quick-revision"
            className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-duo hover:border-amber-400 flex flex-col items-center text-center gap-2 transition group"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-fun font-bold text-xs sm:text-sm text-slate-800">Quick Revision</span>
          </Link>

          <Link
            to="/groups"
            className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-duo hover:border-cyan-400 flex flex-col items-center text-center gap-2 transition group col-span-2 sm:col-span-1"
          >
            <div className="w-11 h-11 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
            <span className="font-fun font-bold text-xs sm:text-sm text-slate-800">Join Study Group</span>
          </Link>
        </div>
      </div>

      {/* 5. Recent Notes & Study Station */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-fun text-xl font-bold text-slate-900">📚 Recent Notes & Materials</h2>
            <p className="text-xs text-slate-500 font-medium">Continue where you left off or generate new revisions</p>
          </div>
          <Link
            to="/notes"
            className="text-xs font-bold text-mentor-green hover:underline flex items-center gap-1"
          >
            <span>View All Notes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentNotes.length === 0 ? (
          <div className="text-center py-10 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <span className="text-4xl">📝</span>
            <p className="text-sm font-bold text-slate-700">No notes uploaded yet</p>
            <p className="text-xs text-slate-400">Paste your class notes or upload a PDF to get started!</p>
            <Link to="/notes?action=upload" className="inline-block px-4 py-2 text-xs font-bold rounded-xl btn-duo-green">
              Upload First Note (+20 XP)
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentNotes.map((note) => (
              <div
                key={note._id}
                className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 hover:bg-white hover:border-emerald-300 hover:shadow-duo transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                    <span className="text-mentor-green bg-emerald-50 px-2 py-0.5 rounded">
                      {note.topic || 'General'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-fun font-bold text-slate-800 text-base truncate">
                    {note.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {note.content}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                  <Link
                    to={`/quick-revision?noteId=${note._id}`}
                    className="flex-1 text-center py-1.5 px-2 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-duo-sm hover:brightness-105"
                  >
                    ⚡ 60s Revise
                  </Link>
                  <Link
                    to={`/flashcards?noteId=${note._id}`}
                    className="flex-1 text-center py-1.5 px-2 bg-purple-500 text-white rounded-xl text-xs font-bold shadow-duo-sm hover:brightness-105"
                  >
                    🧠 Flashcards
                  </Link>
                  <Link
                    to={`/quiz?noteId=${note._id}`}
                    className="flex-1 text-center py-1.5 px-2 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-duo-sm hover:brightness-105"
                  >
                    ❓ Quiz
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default DashboardPage;
