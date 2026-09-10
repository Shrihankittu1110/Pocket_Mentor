import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import api from '../services/api';
import { useSound } from '../context/SoundContext';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import VoiceControls from '../components/common/VoiceControls';

export const QuickRevisionPage = () => {
  const [searchParams] = useSearchParams();
  const noteId = searchParams.get('noteId');
  const { playCorrect, playFanfare } = useSound();
  const { speak, pause, resume, stop, repeat, isSpeaking, isPaused } = useSpeechSynthesis();

  const [notesList, setNotesList] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(noteId || '');
  const [currentRevision, setCurrentRevision] = useState(null);
  const [loading, setLoading] = useState(true);

  // 60-second Timer state
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const { data } = await api.get('/notes');
        setNotesList(data);
        if (data.length > 0) {
          const target = noteId ? data.find(n => n._id === noteId) || data[0] : data[0];
          setSelectedNoteId(target._id);
          fetchQuickRevision(target);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load notes for quick revision:', err);
        setLoading(false);
      }
    };

    loadNotes();
  }, [noteId]);

  const fetchQuickRevision = async (note) => {
    setLoading(true);
    try {
      if (note.quickRevision && note.quickRevision.keyPoints?.length > 0) {
        setCurrentRevision(note.quickRevision);
      } else {
        const { data } = await api.post(`/notes/${note._id}/quick-revision`);
        setCurrentRevision(data.quickRevision);
      }
    } catch (err) {
      console.error('Quick revision error:', err);
    } finally {
      setLoading(false);
      setTimeLeft(60);
      setTimerActive(false);
    }
  };

  const handleSelectNote = (id) => {
    setSelectedNoteId(id);
    const target = notesList.find(n => n._id === id);
    if (target) {
      stop();
      fetchQuickRevision(target);
    }
  };

  // Timer countdown
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      playFanfare();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startReading = () => {
    setTimerActive(true);
    if (currentRevision) {
      const speechScript = `${currentRevision.topic}. ${currentRevision.overview}. Key points: ${currentRevision.keyPoints.join('. ')}. Examples: ${currentRevision.examples.join(', ')}.`;
      speak(speechScript);
    }
  };

  const pauseReading = () => {
    setTimerActive(false);
    pause();
  };

  const restartReading = () => {
    setTimeLeft(60);
    setTimerActive(true);
    if (currentRevision) {
      const speechScript = `${currentRevision.topic}. ${currentRevision.overview}. Key points: ${currentRevision.keyPoints.join('. ')}. Examples: ${currentRevision.examples.join(', ')}.`;
      speak(speechScript);
    }
  };

  const progressCirclePct = ((60 - timeLeft) / 60) * 100;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black uppercase mb-1">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Duolingo Speed Mode</span>
          </div>
          <h1 className="font-fun text-3xl font-black text-slate-900 flex items-center gap-2">
            <span>⚡ 60-Second Quick Revision</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Short, punchy, high-impact review designed for lightning fast retention
          </p>
        </div>

        {/* Note Selector Dropdown */}
        {notesList.length > 0 && (
          <div className="w-full sm:w-64">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Select Study Topic
            </label>
            <select
              value={selectedNoteId}
              onChange={(e) => handleSelectNote(e.target.value)}
              className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500"
            >
              {notesList.map((n) => (
                <option key={n._id} value={n._id}>
                  {n.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-slate-200">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-fun font-bold text-slate-600 mt-2">Distilling 60-second revision guide...</p>
        </div>
      ) : !currentRevision ? (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-12 text-center space-y-4">
          <span className="text-5xl">⚡</span>
          <h2 className="font-fun text-2xl font-bold text-slate-800">No notes available</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Upload your first note to generate an interactive 60-second revision guide.
          </p>
          <Link to="/notes?action=upload" className="inline-block px-6 py-3 rounded-2xl btn-duo-green text-xs font-black">
            Upload Notes
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Top 60s Control Banner with Timer Ring */}
          <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 shadow-duo-orange flex flex-col sm:flex-row items-center justify-between gap-6">
            
            {/* Circular Countdown Timer */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#fed7aa"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#ff9600"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray="201"
                    strokeDashoffset={201 - (201 * progressCirclePct) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-fun">
                  <span className="text-xl font-black text-amber-900">{timeLeft}</span>
                  <span className="text-[9px] font-extrabold uppercase text-amber-600 -mt-1">SEC</span>
                </div>
              </div>

              <div>
                <span className="font-fun text-lg font-bold text-slate-900 block">
                  {timerActive ? 'Revision in Progress' : timeLeft === 0 ? '🎉 60 Seconds Complete!' : 'Ready to Start'}
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  {timeLeft === 0 ? 'Excellent focus! Read again or test with quiz.' : 'Read through the key concepts before the clock runs out.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              {!timerActive ? (
                <button
                  onClick={startReading}
                  className="px-5 py-3 rounded-2xl btn-duo-orange text-sm font-black flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{timeLeft === 60 ? 'Start Reading' : 'Resume'}</span>
                </button>
              ) : (
                <button
                  onClick={pauseReading}
                  className="px-5 py-3 rounded-2xl bg-amber-100 text-amber-800 border-2 border-amber-300 text-sm font-black flex items-center gap-2 hover:bg-amber-200"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={restartReading}
                className="px-4 py-3 rounded-2xl btn-duo-white text-xs font-black flex items-center gap-1.5"
                title="Restart 60s"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Read Again</span>
              </button>

              <VoiceControls
                isSpeaking={isSpeaking}
                isPaused={isPaused}
                onSpeak={() => {
                  const speechScript = `${currentRevision.topic}. ${currentRevision.overview}. Key points: ${currentRevision.keyPoints.join('. ')}. Examples: ${currentRevision.examples.join(', ')}.`;
                  speak(speechScript);
                }}
                onPause={pause}
                onResume={resume}
                onStop={stop}
                onRepeat={repeat}
                label="Listen"
                compact={true}
              />
            </div>

          </div>

          {/* Structured Revision Card */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
            
            {/* Topic Badge & Title */}
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                60-Second Summary
              </span>
              <h2 className="font-fun text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                Topic: {currentRevision.topic}
              </h2>
              <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed bg-amber-50/70 p-4 rounded-2xl border border-amber-100">
                {currentRevision.overview}
              </p>
            </div>

            {/* Main Functions & Core Bullet Points */}
            <div className="space-y-3">
              <h3 className="font-fun text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>🔑 Core Takeaways & Functions</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentRevision.keyPoints?.map((pt, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-mentor-green shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Real World Examples */}
            {currentRevision.examples && currentRevision.examples.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="font-fun text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>💡 Real-World Examples</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentRevision.examples.map((ex, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Next Step Links */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-400">
                Mastered this 60s summary? Put your memory to the test!
              </span>
              <div className="flex items-center gap-2">
                <Link
                  to={`/flashcards?noteId=${selectedNoteId}`}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-mentor-purple font-extrabold text-xs rounded-xl border border-purple-200 flex items-center gap-1.5"
                >
                  <span>Practice Flashcards</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to={`/quiz?noteId=${selectedNoteId}`}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-mentor-red font-extrabold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5"
                >
                  <span>Take Quiz</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default QuickRevisionPage;
