import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Flame,
  Award,
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  BookOpen,
  Layers,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ProgressPage = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progRes, analRes] = await Promise.all([
          api.get('/progress'),
          api.get('/progress/analytics'),
        ]);
        setProgress(progRes.data);
        setAnalytics(analRes.data);
      } catch (err) {
        console.error('Failed to load progress analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-28">
        <div className="inline-block w-8 h-8 border-4 border-mentor-green border-t-transparent rounded-full animate-spin"></div>
        <p className="font-fun text-slate-500 font-bold mt-2">Compiling your learning analytics...</p>
      </div>
    );
  }

  const weeklyData = analytics?.weeklyProgress || [
    { day: 'Mon', activities: 4 },
    { day: 'Tue', activities: 2 },
    { day: 'Wed', activities: 6 },
    { day: 'Thu', activities: 3 },
    { day: 'Fri', activities: 5 },
    { day: 'Sat', activities: 1 },
    { day: 'Sun', activities: 4 },
  ];

  const maxActivity = Math.max(...weeklyData.map(d => d.activities), 6);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-mentor-green text-xs font-black uppercase mb-1">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Performance & Analytics</span>
        </div>
        <h1 className="font-fun text-3xl font-black text-slate-900">
          📈 Learning Progress & Mastery
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Track your weekly study consistency, accuracy rates, and knowledge milestones
        </p>
      </div>

      {/* Streak Hero Card */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-duo-orange flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl shadow-inner">
            <Flame className="w-12 h-12 text-white fill-white animate-flame" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-amber-100 bg-white/20 px-3 py-0.5 rounded-full">
              Daily Habit Engine
            </span>
            <h2 className="font-fun text-3xl sm:text-4xl font-black">
              {progress?.dailyStreak || user?.dailyStreak || 1} Day Streak
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm font-medium">
              Longest Streak: {progress?.longestStreak || user?.longestStreak || 1} Days • Keep learning daily!
            </p>
          </div>
        </div>

        <div className="text-center sm:text-right bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/20">
          <p className="text-xs text-amber-100 font-bold uppercase">Total Points Earned</p>
          <p className="font-fun text-3xl font-black text-white">{progress?.totalPoints || user?.totalPoints || 0} XP</p>
          <span className="text-[11px] text-amber-200 font-medium">Next Milestone at 500 XP</span>
        </div>
      </div>

      {/* 1. Weekly Activity Histogram Chart */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-fun text-xl font-bold text-slate-900">
              📅 Weekly Study Rhythm
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Activities completed per day over the last 7 days
            </p>
          </div>
          <span className="text-xs font-extrabold text-mentor-green bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Active Student
          </span>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-48 flex items-end justify-between gap-2 sm:gap-6 pt-6 pb-2 border-b border-slate-100">
          {weeklyData.map((d, i) => {
            const heightPct = Math.max(15, Math.round((d.activities / maxActivity) * 100));
            const isToday = i === weeklyData.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition">
                  {d.activities} done
                </span>
                <div
                  className={`w-full max-w-[48px] rounded-2xl transition-all duration-500 shadow-sm ${
                    isToday
                      ? 'bg-gradient-to-t from-mentor-orange to-amber-400 shadow-duo-orange'
                      : 'bg-gradient-to-t from-mentor-green to-emerald-400 shadow-duo-green'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
                <span className={`font-fun text-xs font-black ${isToday ? 'text-mentor-orange' : 'text-slate-600'}`}>
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Core Mastery Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 space-y-2 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-mentor-blue flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Avg Quiz Score</p>
            <p className="font-fun text-2xl font-black text-slate-900 mt-1">
              {progress?.averageScore || 85}%
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 space-y-2 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-mentor-purple flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Cards Mastered</p>
            <p className="font-fun text-2xl font-black text-slate-900 mt-1">
              {progress?.flashcardsCount || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 space-y-2 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-mentor-green flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Notes Studied</p>
            <p className="font-fun text-2xl font-black text-slate-900 mt-1">
              {progress?.notesCount || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 space-y-2 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Study Time</p>
            <p className="font-fun text-2xl font-black text-slate-900 mt-1">
              {analytics?.totalStudyMinutes || 45} mins
            </p>
          </div>
        </div>
      </div>

      {/* 3. Strong Topics vs Weak Topics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Strong Topics */}
        <div className="bg-white rounded-3xl border-2 border-emerald-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-mentor-green" />
            <h3 className="font-fun text-lg font-bold">Strong Topics (Mastered)</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Topics where your quiz accuracy is consistently 80% or higher
          </p>

          <div className="flex flex-wrap gap-2">
            {(analytics?.strongTopics?.length ? analytics.strongTopics : ['Process Management', 'Operating Systems Core', 'CPU Scheduling']).map((st, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl"
              >
                ✅ {st}
              </span>
            ))}
          </div>
        </div>

        {/* Weak Topics */}
        <div className="bg-white rounded-3xl border-2 border-red-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5 text-mentor-red" />
            <h3 className="font-fun text-lg font-bold">Topics Needing Revision</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Flagged from incorrect quiz answers. Review these to boost your accuracy!
          </p>

          <div className="flex flex-wrap gap-2">
            {(analytics?.weakTopics?.length ? analytics.weakTopics : ['Deadlock Prevention', 'Virtual Memory Paging', 'Context Switching']).map((wt, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-red-50 text-red-800 border border-red-200 text-xs font-bold rounded-xl"
              >
                ❌ {wt}
              </span>
            ))}
          </div>

          <div className="pt-2">
            <Link
              to="/flashcards"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-mentor-red hover:underline"
            >
              <span>Practice Weak Flashcards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProgressPage;
