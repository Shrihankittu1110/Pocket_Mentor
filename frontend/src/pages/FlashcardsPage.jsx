import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCw,
  Sparkles,
  Plus,
  Smile,
  Frown,
  Mic,
  MicOff,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import VoiceCommandIndicator from '../components/common/VoiceCommandIndicator';

export const FlashcardsPage = () => {
  const [searchParams] = useSearchParams();
  const noteId = searchParams.get('noteId');
  const { awardPoints } = useAuth();
  const { playFlip, playCorrect, playWrong } = useSound();
  const { speak, stop, isSpeaking } = useSpeechSynthesis();

  const [cards, setCards] = useState([]);
  const [filterDifficulty, setFilterDifficulty] = useState('all'); // 'all' | 'learning' | 'mastered'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [xpToast, setXpToast] = useState(null);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/flashcards', {
        params: { noteId: noteId || undefined },
      });
      setCards(data);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.error('Failed to load flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [noteId]);

  // Filtered Cards based on difficulty filter
  const displayedCards = cards.filter(card => {
    if (filterDifficulty === 'mastered') return card.difficulty === 'easy';
    if (filterDifficulty === 'learning') return card.difficulty === 'hard' || card.difficulty === 'medium';
    return true;
  });

  const currentCard = displayedCards[currentIndex] || null;

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [filterDifficulty]);

  // Handle Generate More Flashcards
  const handleGenerateMore = async () => {
    const activeNoteId = noteId || currentCard?.note || cards.find(c => c.note)?.note;
    if (!activeNoteId) {
      setFeedbackToast({
        type: 'info',
        message: 'No associated note found. Please open flashcards from a note in your library.',
      });
      setTimeout(() => setFeedbackToast(null), 4000);
      return;
    }

    try {
      setGeneratingMore(true);
      setFeedbackToast(null);

      const { data } = await api.post('/flashcards/generate-more', {
        noteId: activeNoteId,
        topic: currentCard?.topic || undefined,
        count: 6,
      });

      if (data.newCards && data.newCards.length > 0) {
        setCards(prev => [...prev, ...data.newCards]);
        awardPoints(10);
        playCorrect();
        setFeedbackToast({
          type: 'success',
          message: data.message || `${data.newCards.length} new flashcards generated.`,
        });
      } else if (data.exhausted || (data.newCards && data.newCards.length === 0)) {
        setFeedbackToast({
          type: 'info',
          message: data.message || 'No more unique questions can be generated from this note.',
        });
      }
    } catch (err) {
      console.error('Failed to generate more flashcards:', err);
      setFeedbackToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to generate additional flashcards',
      });
    } finally {
      setGeneratingMore(false);
      setTimeout(() => {
        setFeedbackToast(null);
      }, 4500);
    }
  };

  // Handle Card Flip
  const handleFlip = useCallback(() => {
    playFlip();
    setIsFlipped(prev => !prev);
  }, [playFlip]);

  // Handle Navigation
  const handleNext = useCallback(() => {
    if (displayedCards.length === 0) return;
    playFlip();
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % displayedCards.length);
  }, [displayedCards.length, playFlip]);

  const handlePrev = useCallback(() => {
    if (displayedCards.length === 0) return;
    playFlip();
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + displayedCards.length) % displayedCards.length);
  }, [displayedCards.length, playFlip]);

  // Handle Shuffle
  const handleShuffle = () => {
    playFlip();
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Text-to-Speech Speak Current Side
  const handleReadAloud = useCallback(() => {
    if (!currentCard) return;
    const textToSpeak = isFlipped ? currentCard.answer : currentCard.question;
    speak(textToSpeak);
  }, [currentCard, isFlipped, speak]);

  // Mark Difficulty & Award XP
  const handleRateCard = useCallback(async (difficulty) => {
    if (!currentCard) return;

    if (difficulty === 'easy') {
      playCorrect();
      awardPoints(5);
      setXpToast('+5 XP! Mastered! 🎉');
      setTimeout(() => setXpToast(null), 1800);
    } else {
      playWrong();
      setXpToast('Marked for Review 😓');
      setTimeout(() => setXpToast(null), 1800);
    }

    try {
      await api.put(`/flashcards/${currentCard._id}`, { difficulty });
      setCards(prev => prev.map(c => c._id === currentCard._id ? { ...c, difficulty } : c));
      handleNext();
    } catch (err) {
      console.error('Failed to rate card:', err);
    }
  }, [currentCard, awardPoints, playCorrect, playWrong, handleNext]);

  // Hands-Free Voice Commands Handler
  const handleVoiceCommand = useCallback((command) => {
    if (command === 'next') handleNext();
    else if (command === 'previous') handlePrev();
    else if (command === 'flip') handleFlip();
    else if (command === 'easy') handleRateCard('easy');
    else if (command === 'hard') handleRateCard('hard');
    else if (command === 'repeat') handleReadAloud();
  }, [handleNext, handlePrev, handleFlip, handleRateCard, handleReadAloud]);

  const { isListening, toggleListening, lastCommand } = useSpeechRecognition(handleVoiceCommand);

  // Auto-play mode loop
  useEffect(() => {
    let timer = null;
    if (autoPlay && displayedCards.length > 0) {
      timer = setTimeout(() => {
        if (!isFlipped) {
          handleFlip();
        } else {
          handleNext();
        }
      }, 3500);
    }
    return () => clearTimeout(timer);
  }, [autoPlay, isFlipped, displayedCards.length, handleFlip, handleNext]);

  // Comprehensive Keyboard Shortcuts:
  // Space/Enter = Flip, Right Arrow/N = Next, Left Arrow/P = Prev, 1/E = Easy, 2/H = Hard, R = Read aloud, S = Shuffle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight' || e.key.toLowerCase() === 'n') {
        handleNext();
      } else if (e.code === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
        handlePrev();
      } else if (e.key === '1' || e.key.toLowerCase() === 'e') {
        handleRateCard('easy');
      } else if (e.key === '2' || e.key.toLowerCase() === 'h') {
        handleRateCard('hard');
      } else if (e.key.toLowerCase() === 'r') {
        handleReadAloud();
      } else if (e.key.toLowerCase() === 's') {
        handleShuffle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleRateCard, handleReadAloud]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-black uppercase mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Recall Deck</span>
          </div>
          <h1 className="font-fun text-3xl font-black text-slate-900">
            🧠 Study Flashcards
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Interactive 3D flashcards with voice read-aloud and spaced repetition
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Generate More Button in Header */}
          {(noteId || cards.some(c => c.note)) && (
            <button
              onClick={handleGenerateMore}
              disabled={generatingMore}
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-duo-sm active:translate-y-0.5 transition flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              title="Generate additional unique questions from the source note"
            >
              {generatingMore ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+ Generate More</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              autoPlay
                ? 'bg-amber-500 text-white border-amber-600 shadow-duo-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {autoPlay ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Auto-Play</span>
          </button>

          <button
            onClick={handleShuffle}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
            title="Shuffle deck"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      {/* Dynamic Feedback Notification Banner */}
      {feedbackToast && (
        <div
          className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all duration-300 animate-fadeIn ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : feedbackToast.type === 'error'
              ? 'bg-red-50 border-red-300 text-red-950'
              : 'bg-indigo-50 border-indigo-200 text-indigo-950'
          }`}
        >
          {feedbackToast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
          {feedbackToast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          {feedbackToast.type === 'info' && <Info className="w-5 h-5 text-indigo-600 shrink-0" />}
          <p className="text-xs sm:text-sm font-bold flex-1">{feedbackToast.message}</p>
          <button
            onClick={() => setFeedbackToast(null)}
            className="text-xs font-bold px-2 py-1 rounded-lg hover:bg-black/5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Voice Assistant Command Bar */}
      <VoiceCommandIndicator
        isListening={isListening}
        onToggleListening={toggleListening}
        lastCommand={lastCommand}
        availableCommands={["Flip", "Next", "Previous", "Easy", "Hard", "Repeat"]}
      />

      {/* Deck Filter Tabs & Stats Bar */}
      {cards.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border-2 border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setFilterDifficulty('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                filterDifficulty === 'all'
                  ? 'bg-mentor-purple text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({cards.length})
            </button>
            <button
              onClick={() => setFilterDifficulty('learning')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                filterDifficulty === 'learning'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Learning ({cards.filter(c => c.difficulty !== 'easy').length})
            </button>
            <button
              onClick={() => setFilterDifficulty('mastered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                filterDifficulty === 'mastered'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Mastered ({cards.filter(c => c.difficulty === 'easy').length})
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>⌨️ Keyboard Supported</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-slate-200">
          <div className="inline-block w-8 h-8 border-4 border-mentor-purple border-t-transparent rounded-full animate-spin"></div>
          <p className="font-fun font-bold text-slate-600 mt-2">Loading flashcards...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4">
          <span className="text-5xl">🧠</span>
          <h2 className="font-fun text-2xl font-bold text-slate-800">No Flashcards Available</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Generate flashcards directly from any note in your library with one click!
          </p>
          <Link to="/notes" className="inline-block px-6 py-3 rounded-2xl btn-duo-green text-xs font-black">
            Go to My Notes
          </Link>
        </div>
      ) : displayedCards.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-10 text-center space-y-3">
          <span className="text-4xl">✨</span>
          <h3 className="font-fun text-xl font-bold text-slate-800">No cards in this category</h3>
          <p className="text-xs text-slate-500">
            {filterDifficulty === 'mastered' ? 'Rate cards as Easy to add them to Mastered.' : 'All cards are currently mastered!'}
          </p>
          <button
            onClick={() => setFilterDifficulty('all')}
            className="px-4 py-2 rounded-xl bg-purple-100 text-purple-800 text-xs font-bold hover:bg-purple-200"
          >
            Show All Cards
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Progress Bar & Counter (3 / 10) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="font-fun text-sm font-black text-slate-800">
                Flashcard {currentIndex + 1} / {displayedCards.length}
              </span>
              <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200 font-bold">
                {currentCard?.topic || 'General'}
              </span>
            </div>

            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-mentor-purple rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${((currentIndex + 1) / displayedCards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* XP Floating Toast */}
          {xpToast && (
            <div className="text-center">
              <span className="inline-block bg-mentor-green text-white text-xs font-black px-4 py-1.5 rounded-full shadow-duo-sm animate-bounceShort">
                {xpToast}
              </span>
            </div>
          )}

          {/* 3D Flipping Flashcard Container */}
          <div className="perspective-1000 w-full min-h-[300px] sm:min-h-[360px] relative">
            <div
              onClick={handleFlip}
              className={`relative w-full min-h-[300px] sm:min-h-[360px] rounded-3xl border-4 transition-transform duration-500 transform-style-3d cursor-pointer select-none shadow-xl ${
                isFlipped ? 'rotate-y-180 border-purple-400 bg-purple-50/20' : 'border-slate-200 bg-white hover:border-purple-300'
              }`}
            >
              
              {/* FRONT OF CARD (Question) */}
              <div className="absolute inset-0 backface-hidden p-5 sm:p-8 flex flex-col justify-between rounded-3xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                    Question
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(currentCard?.question || '');
                      }}
                      className="p-2 rounded-xl bg-purple-50 text-mentor-purple hover:bg-purple-100 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                      title="Read Question (R)"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      currentCard?.difficulty === 'easy'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentCard?.difficulty === 'hard'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {currentCard?.difficulty || 'medium'}
                    </span>
                  </div>
                </div>

                <div className="text-center my-auto px-2 sm:px-4 py-2">
                  <p className="font-fun text-lg sm:text-2xl md:text-3xl font-bold text-slate-900 leading-snug break-words">
                    {currentCard?.question}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Tap to Flip · Space / Enter</span>
                </div>
              </div>

              {/* BACK OF CARD (Answer) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 p-5 sm:p-8 flex flex-col justify-between rounded-3xl bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                    Answer
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(currentCard?.answer || '');
                    }}
                    className="p-2 rounded-xl bg-emerald-50 text-mentor-green hover:bg-emerald-100 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                    title="Read Answer (R)"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center my-auto px-2 sm:px-4 py-2 overflow-y-auto max-h-[170px] sm:max-h-[220px]">
                  <p className="font-medium text-sm sm:text-lg md:text-xl text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                    {currentCard?.answer}
                  </p>
                </div>

                <div className="text-center text-xs font-bold text-mentor-purple">
                  Rate your recall below: Press 1 (Easy) or 2 (Hard)
                </div>
              </div>

            </div>
          </div>

          {/* Flashcard Bottom Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            
            {/* Prev / Next buttons */}
            <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <button
                onClick={handlePrev}
                className="p-3 rounded-2xl btn-duo-white font-bold min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Previous card (Left Arrow / P)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleFlip}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl btn-duo-purple font-black text-sm flex items-center justify-center gap-2 min-h-[44px]"
              >
                <RotateCw className="w-4 h-4" />
                <span>{isFlipped ? "Show Question" : "Reveal Answer"}</span>
              </button>
              <button
                onClick={handleNext}
                className="p-3 rounded-2xl btn-duo-white font-bold min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Next card (Right Arrow / N)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Spaced Repetition Rating: Hard vs Easy */}
            <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleRateCard('hard')}
                className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 text-xs font-black shadow-duo-sm hover:bg-red-100 active:translate-y-0.5 flex items-center justify-center gap-1.5 min-h-[44px]"
                title="Rate Hard (2 or H)"
              >
                <Frown className="w-4 h-4" />
                <span>😓 Hard (2)</span>
              </button>
              <button
                onClick={() => handleRateCard('easy')}
                className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-800 text-xs font-black shadow-duo-sm hover:bg-emerald-100 active:translate-y-0.5 flex items-center justify-center gap-1.5 min-h-[44px]"
                title="Rate Easy (1 or E)"
              >
                <Smile className="w-4 h-4" />
                <span>😊 Easy +5 XP (1)</span>
              </button>
            </div>

          </div>

          {/* Keyboard Shortcut Indicator Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 py-2 text-[11px] font-bold text-slate-500 bg-slate-100/80 rounded-2xl border border-slate-200 px-4">
            <span className="text-slate-400 font-extrabold uppercase text-[10px]">Shortcuts:</span>
            <span className="px-2 py-0.5 bg-white rounded-md border border-slate-300 text-slate-700 font-mono">Space/Enter</span>
            <span>Flip</span>
            <span className="text-slate-300">•</span>
            <span className="px-2 py-0.5 bg-white rounded-md border border-slate-300 text-slate-700 font-mono">→ / N</span>
            <span>Next</span>
            <span className="text-slate-300">•</span>
            <span className="px-2 py-0.5 bg-white rounded-md border border-slate-300 text-slate-700 font-mono">← / P</span>
            <span>Prev</span>
            <span className="text-slate-300">•</span>
            <span className="px-2 py-0.5 bg-white rounded-md border border-slate-300 text-slate-700 font-mono">1 / E</span>
            <span>Easy</span>
            <span className="text-slate-300">•</span>
            <span className="px-2 py-0.5 bg-white rounded-md border border-slate-300 text-slate-700 font-mono">2 / H</span>
            <span>Hard</span>
            <span className="text-slate-300">•</span>
            <span className="px-2 py-0.5 bg-white rounded-md border border-slate-300 text-slate-700 font-mono">R</span>
            <span>Audio Read</span>
            <span className="text-slate-300">•</span>
            <span className="px-2 py-0.5 bg-white rounded-md border border-slate-300 text-slate-700 font-mono">S</span>
            <span>Shuffle</span>
          </div>

          {/* Generate More Deck Expansion Section */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 rounded-3xl border-2 border-purple-200/90 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm mt-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-fun font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span>Want more practice from this note?</span>
                  <span className="text-[10px] bg-purple-200 text-purple-800 font-extrabold px-2 py-0.5 rounded-full uppercase">AI Powered</span>
                </h4>
                <p className="text-xs text-slate-600 font-medium">
                  Analyzes uncovered concepts, formulas, and mechanisms to build additional unique flashcards without duplicates.
                </p>
              </div>
            </div>

            <button
              onClick={handleGenerateMore}
              disabled={generatingMore}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs bg-mentor-purple hover:bg-purple-700 text-white active:translate-y-0.5 transition flex items-center justify-center gap-2 shadow-duo-sm shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generatingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating New Cards...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>+ Generate More</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default FlashcardsPage;
