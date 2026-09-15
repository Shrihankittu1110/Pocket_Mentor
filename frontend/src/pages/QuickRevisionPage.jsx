import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Layers,
  BookOpen,
  HelpCircle,
  Lightbulb
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
  const [regenerating, setRegenerating] = useState(false);
  const [activePointIndex, setActivePointIndex] = useState(null);

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
      if (note.quickRevision && (note.quickRevision.points?.length === 15 || note.quickRevision.keyPoints?.length > 0)) {
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

  const handleRegenerateQuickRevision = async () => {
    if (!selectedNoteId) return;
    setRegenerating(true);
    stop();
    try {
      const { data } = await api.post(`/notes/${selectedNoteId}/quick-revision`);
      if (data.quickRevision) {
        setCurrentRevision(data.quickRevision);
        setNotesList(prev =>
          prev.map(n => n._id === selectedNoteId ? { ...n, quickRevision: data.quickRevision } : n)
        );
        setTimeLeft(60);
        setTimerActive(false);
        if (playCorrect) playCorrect();
      }
    } catch (err) {
      console.error('Failed to regenerate quick revision:', err);
    } finally {
      setRegenerating(false);
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
      if (playFanfare) playFanfare();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [understoodPoints, setUnderstoodPoints] = useState(new Set());

  const toggleUnderstood = (idx) => {
    setUnderstoodPoints(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
        if (playCorrect) playCorrect();
      }
      return next;
    });
  };

  const getFullSpeechScript = () => {
    if (!currentRevision) return '';
    if (currentRevision.points && currentRevision.points.length > 0) {
      const pointsText = currentRevision.points
        .map(p => `${p.title}. ${p.content} ${p.takeaway ? `Takeaway: ${p.takeaway}` : ''}`)
        .join('. ');
      return `${currentRevision.topic}. ${currentRevision.overview}. Fifteen Revision Points: ${pointsText}.`;
    }
    return `${currentRevision.topic}. ${currentRevision.overview}. Key points: ${currentRevision.keyPoints?.join('. ')}.`;
  };

  const startReading = () => {
    setTimerActive(true);
    const script = getFullSpeechScript();
    if (script) speak(script, { rate: speechSpeed });
  };

  const pauseReading = () => {
    setTimerActive(false);
    pause();
  };

  const restartReading = () => {
    setTimeLeft(60);
    setTimerActive(true);
    const script = getFullSpeechScript();
    if (script) speak(script, { rate: speechSpeed });
  };

  const speakSinglePoint = (point, idx) => {
    setActivePointIndex(idx);
    const script = `${point.title}. ${point.content} ${point.formula ? `Formula: ${point.formula}.` : ''} ${point.takeaway ? `Key takeaway: ${point.takeaway}` : ''}`;
    speak(script, { rate: speechSpeed });
  };

  const progressCirclePct = ((60 - timeLeft) / 60) * 100;

  const getCategoryBadgeStyle = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('definition')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (cat.includes('formula') || cat.includes('equation')) return 'bg-amber-50 text-amber-800 border-amber-300';
    if (cat.includes('mechanism')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (cat.includes('workflow') || cat.includes('process')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (cat.includes('comparison')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (cat.includes('takeaway') || cat.includes('exam')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (cat.includes('application')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Convert raw keyPoints into normalized structured points if points array missing
  const allPoints = currentRevision?.points && currentRevision.points.length > 0
    ? currentRevision.points
    : (currentRevision?.keyPoints || []).map((kp, idx) => {
        const parts = kp.split(':');
        const title = parts.length > 1 ? parts[0].trim() : `Point ${idx + 1}`;
        const content = parts.length > 1 ? parts.slice(1).join(':').trim() : kp;
        return {
          number: idx + 1,
          title: title.startsWith('0') || title.startsWith('1') ? title : `${String(idx + 1).padStart(2, '0')} · ${title}`,
          content: content,
          formula: '',
          takeaway: '',
          category: idx === 0 ? 'Definition' : idx >= 13 ? 'Exam Takeaway' : 'Core Concept'
        };
      });

  const pointsList = allPoints.filter(p => {
    if (selectedCategory === 'all') return true;
    const cat = (p.category || '').toLowerCase();
    if (selectedCategory === 'definitions') return cat.includes('definition') || cat.includes('concept');
    if (selectedCategory === 'mechanisms') return cat.includes('mechanism') || cat.includes('process') || cat.includes('workflow') || cat.includes('algorithm');
    if (selectedCategory === 'formulas') return cat.includes('formula') || cat.includes('equation') || (p.formula && p.formula.trim().length > 0);
    if (selectedCategory === 'takeaways') return cat.includes('takeaway') || cat.includes('exam') || cat.includes('trap');
    return true;
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black uppercase mb-1">
            <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
            <span>Rapid Speed Revision · 15 Points</span>
          </div>
          <h1 className="font-fun text-3xl font-black text-slate-900 flex items-center gap-2">
            <span>⚡ 60-Second Quick Revision</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            15 high-value revision points intelligently distilled across the entire document
          </p>
        </div>

        {/* Note Selector Dropdown & Regenerate Action */}
        <div className="flex flex-wrap items-end gap-2 w-full sm:w-auto">
          {notesList.length > 0 && (
            <div className="w-full sm:w-64">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Select Study Note
              </label>
              <select
                value={selectedNoteId}
                onChange={(e) => handleSelectNote(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 shadow-sm"
              >
                {notesList.map((n) => (
                  <option key={n._id} value={n._id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleRegenerateQuickRevision}
            disabled={regenerating || loading || !selectedNoteId}
            className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs border border-amber-300 flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            title="Re-analyze full document and generate fresh 15 revision points"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            <span>{regenerating ? 'Regenerating...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-slate-200 shadow-sm">
          <div className="inline-block w-9 h-9 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-fun font-bold text-slate-700 mt-3 text-base">Distilling 15 High-Value Revision Points...</p>
          <p className="text-xs text-slate-400 mt-1">Analyzing definitions, mechanisms, formulas, and exam takeaways</p>
        </div>
      ) : !currentRevision ? (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-12 text-center space-y-4">
          <span className="text-5xl">⚡</span>
          <h2 className="font-fun text-2xl font-bold text-slate-800">No notes available</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Upload a document to generate a structured 15-point 60-second revision guide.
          </p>
          <Link to="/notes?action=upload" className="inline-block px-6 py-3 rounded-2xl btn-duo-green text-xs font-black">
            Upload Notes
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Top 60s Control Banner with Timer Ring & Master Voice */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 bg-white rounded-3xl border-2 border-amber-300 p-6 shadow-duo-orange flex flex-col sm:flex-row items-center justify-between gap-6">
            
            {/* Circular Countdown Timer */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
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
                <div className="flex items-center gap-2">
                  <span className="font-fun text-lg font-bold text-slate-900">
                    {timerActive ? '60s Rapid Mode Active' : timeLeft === 0 ? '🎉 60 Seconds Complete!' : 'Ready for Rapid Revision'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-mono text-[11px] font-black">
                    15 Points
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {timeLeft === 0 
                    ? 'Great speed revision! Test yourself with flashcards or quiz below.' 
                    : 'Read all 15 points or listen with audio to complete your rapid review.'}
                </p>
              </div>
            </div>

            {/* Action Buttons & Speed Selector */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Speech Speed Pill */}
              <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-black uppercase text-amber-700 px-1.5">Speed:</span>
                {[1.0, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setSpeechSpeed(speed)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all ${
                      speechSpeed === speed
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-amber-100'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!timerActive ? (
                  <button
                    onClick={startReading}
                    className="px-5 py-3 rounded-2xl btn-duo-orange text-sm font-black flex items-center gap-2 shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{timeLeft === 60 ? 'Start 60s Revision' : 'Resume'}</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseReading}
                    className="px-5 py-3 rounded-2xl bg-amber-100 text-amber-900 border-2 border-amber-300 text-sm font-black flex items-center gap-2 hover:bg-amber-200"
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
                  onSpeak={startReading}
                  onPause={pause}
                  onResume={resume}
                  onStop={stop}
                  onRepeat={repeat}
                  label="Listen All"
                  compact={true}
                />
              </div>
            </div>

          </div>

          {/* Document Overview Banner & Category Filter Tabs */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                  Topic: {currentRevision.topic}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Full Document Coverage (15 Key Points)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{understoodPoints.size} / {allPoints.length} Mastered</span>
                </span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  ⚡ ~4s per point target
                </span>
              </div>
            </div>
            
            <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed bg-amber-50/50 p-4 rounded-2xl border border-amber-100/80">
              {currentRevision.overview}
            </p>

            {/* Category Filter Tabs */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Filter:</span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({allPoints.length})
              </button>
              <button
                onClick={() => setSelectedCategory('definitions')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedCategory === 'definitions'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Definitions
              </button>
              <button
                onClick={() => setSelectedCategory('mechanisms')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedCategory === 'mechanisms'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Mechanisms & Processes
              </button>
              <button
                onClick={() => setSelectedCategory('formulas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedCategory === 'formulas'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Formulas
              </button>
              <button
                onClick={() => setSelectedCategory('takeaways')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedCategory === 'takeaways'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Exam Tips & Traps
              </button>
            </div>
          </div>

          {/* 15 Revision Point Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-fun text-xl font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                <span>15 High-Value Revision Points</span>
              </h2>
              <span className="text-xs font-extrabold text-slate-400">
                Showing {pointsList.length} of {allPoints.length} Points
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pointsList.map((pt, idx) => {
                const pointIdx = pt.number ? pt.number - 1 : idx;
                const isUnderstood = understoodPoints.has(pointIdx);

                return (
                  <div
                    key={idx}
                    className={`bg-white rounded-2xl border-2 p-5 space-y-3 transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                      isUnderstood
                        ? 'border-emerald-400 bg-emerald-50/20'
                        : activePointIndex === idx
                        ? 'border-amber-400 ring-2 ring-amber-200 bg-amber-50/20'
                        : 'border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Top Row: Number Badge, Category Pill, Understood Toggle & Audio Button */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-7 h-7 rounded-xl font-mono font-black text-xs flex items-center justify-center shadow-xs ${
                            isUnderstood ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {String(pt.number || idx + 1).padStart(2, '0')}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getCategoryBadgeStyle(pt.category)}`}>
                            {pt.category || 'Core Concept'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleUnderstood(pointIdx)}
                            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                              isUnderstood
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                            title={isUnderstood ? 'Marked as understood' : 'Click to mark understood'}
                          >
                            <CheckCircle2 className={`w-4 h-4 ${isUnderstood ? 'text-emerald-600 fill-emerald-100' : ''}`} />
                            <span className="hidden sm:inline text-[11px]">{isUnderstood ? 'Mastered' : 'Mark'}</span>
                          </button>

                          <button
                            onClick={() => speakSinglePoint(pt, idx)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Read this point aloud"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-fun text-base font-black text-slate-900 leading-snug">
                        {pt.title}
                      </h3>

                      {/* Content Explanation (2-4 sentences) */}
                      <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                        {pt.content}
                      </p>

                      {/* Formula Callout Box (when present) */}
                      {pt.formula && pt.formula.trim() !== '' && (
                        <div className="mt-2 p-2.5 bg-slate-900 rounded-xl text-amber-300 font-mono text-xs border border-slate-800 flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Formula:</span>
                          <span className="truncate">{pt.formula}</span>
                        </div>
                      )}
                    </div>

                    {/* Key Takeaway Banner */}
                    {pt.takeaway && pt.takeaway.trim() !== '' && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-50/80 px-2.5 py-1.5 rounded-xl border border-amber-200/60">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{pt.takeaway}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-World Examples & Applications */}
          {currentRevision.examples && currentRevision.examples.length > 0 && (
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 space-y-3 shadow-sm">
              <h3 className="font-fun text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-mentor-green" />
                <span>💡 Practical Applications & Real-World Examples</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentRevision.examples.map((ex, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold"
                  >
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps: Flashcards & Quiz CTA */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="font-fun font-bold text-slate-800 text-sm block">
                Finished the 60-Second Revision?
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Solidify what you just revised with active recall flashcards or an instant quiz.
              </span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/flashcards?noteId=${selectedNoteId}`}
                className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-mentor-purple font-extrabold text-xs rounded-xl border border-purple-200 flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span>Practice Flashcards</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to={`/quiz?noteId=${selectedNoteId}`}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-mentor-red font-extrabold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span>Take Quiz</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default QuickRevisionPage;
