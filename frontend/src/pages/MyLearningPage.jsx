import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Layers,
  HelpCircle,
  Clock,
  Search,
  ArrowRight,
  Sparkles,
  Zap,
  BookmarkCheck
} from 'lucide-react';
import api from '../services/api';

export const MyLearningPage = () => {
  const [activeTab, setActiveTab] = useState('notes'); // 'notes', 'flashcards', 'quizzes', 'history'
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [nRes, fRes, qRes, rRes] = await Promise.all([
          api.get('/notes'),
          api.get('/flashcards'),
          api.get('/quizzes'),
          api.get('/quizzes/results'),
        ]);
        setNotes(nRes.data || []);
        setFlashcards(fRes.data || []);
        setQuizzes(qRes.data || []);
        setQuizResults(rRes.data || []);
      } catch (err) {
        console.error('Failed to load learning library:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.topic && n.topic.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredFlashcards = flashcards.filter(f =>
    f.question.toLowerCase().includes(search.toLowerCase()) ||
    (f.topic && f.topic.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(search.toLowerCase()) ||
    (q.topic && q.topic.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-mentor-blue text-xs font-black uppercase mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Personal Study Repository</span>
          </div>
          <h1 className="font-fun text-3xl font-black text-slate-900">
            📚 My Learning Library
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            All your generated summaries, flashcard decks, quizzes, and revision logs
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all learning materials..."
            className="w-full pl-10 pr-4 py-2 bg-white border-2 border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-mentor-green"
          />
        </div>
      </div>

      {/* Library Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'notes', label: `My Notes (${notes.length})`, icon: BookOpen },
          { id: 'flashcards', label: `Flashcards (${flashcards.length})`, icon: Layers },
          { id: 'quizzes', label: `Quizzes (${quizzes.length})`, icon: HelpCircle },
          { id: 'history', label: `Revision History (${quizResults.length})`, icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-mentor-green border-t-transparent rounded-full animate-spin"></div>
          <p className="font-fun text-slate-500 font-bold mt-2">Loading library...</p>
        </div>
      ) : activeTab === 'notes' ? (
        
        /* Notes Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              No notes match your search.
            </div>
          ) : (
            filteredNotes.map((n) => (
              <div key={n._id} className="bg-white rounded-3xl border-2 border-slate-200 p-5 space-y-3 shadow-sm hover:border-emerald-300 transition">
                <span className="text-[11px] font-black uppercase text-mentor-green bg-emerald-50 px-2.5 py-0.5 rounded-md">
                  {n.topic}
                </span>
                <h3 className="font-fun text-base font-bold text-slate-900 line-clamp-1">{n.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{n.content}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <Link to={`/quick-revision?noteId=${n._id}`} className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> 60s Revise
                  </Link>
                  <Link to={`/flashcards?noteId=${n._id}`} className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> Flashcards
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

      ) : activeTab === 'flashcards' ? (

        /* Flashcards Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFlashcards.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              No flashcards match your search.
            </div>
          ) : (
            filteredFlashcards.map((f) => (
              <div key={f._id} className="bg-white rounded-3xl border-2 border-slate-200 p-5 space-y-2.5 shadow-sm hover:border-purple-300 transition">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-400">
                  <span className="text-mentor-purple bg-purple-50 px-2 py-0.5 rounded">{f.topic}</span>
                  <span className="capitalize">{f.difficulty}</span>
                </div>
                <p className="font-fun text-sm font-bold text-slate-900">{f.question}</p>
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">{f.answer}</p>
              </div>
            ))
          )}
        </div>

      ) : activeTab === 'quizzes' ? (

        /* Quizzes Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              No quizzes match your search.
            </div>
          ) : (
            filteredQuizzes.map((q) => (
              <div key={q._id} className="bg-white rounded-3xl border-2 border-slate-200 p-5 space-y-3 shadow-sm hover:border-rose-300 transition">
                <span className="text-[11px] font-black uppercase text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md">
                  {q.topic}
                </span>
                <h3 className="font-fun text-base font-bold text-slate-900">{q.title}</h3>
                <p className="text-xs text-slate-500">{q.questions?.length || 5} Interactive Questions</p>
                <Link
                  to={`/quiz?id=${q._id}`}
                  className="block text-center py-2 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-duo-sm hover:brightness-105"
                >
                  Start Quiz
                </Link>
              </div>
            ))
          )}
        </div>

      ) : (

        /* History Tab */
        <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
          {quizResults.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              No quiz history recorded yet. Complete a quiz to see your performance log!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {quizResults.map((r) => (
                <div key={r._id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                  <div className="space-y-1">
                    <p className="font-fun font-bold text-slate-900 text-base">
                      {r.quiz?.title || 'Knowledge Quiz'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>Topic: {r.quiz?.topic || 'General'}</span>
                      <span>•</span>
                      <span>{new Date(r.completedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-fun font-black text-xl text-mentor-green">
                        {r.score}%
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{r.correctAnswers} / {r.totalQuestions} Correct</p>
                    </div>

                    <Link
                      to={`/quiz?id=${r.quiz?._id || ''}`}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                    >
                      Retake
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      )}

    </div>
  );
};

export default MyLearningPage;
