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
  Smile,
  Frown,
  Mic,
  MicOff,
  BookOpen
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [xpToast, setXpToast] = useState(null);

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

  const currentCard = cards[currentIndex] || null;

  // Handle Card Flip
  const handleFlip = useCallback(() => {
    playFlip();
    setIsFlipped(prev => !prev);
  }, [playFlip]);

  // Handle Navigation
  const handleNext = useCallback(() => {
    if (cards.length === 0) return;
    playFlip();
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % cards.length);
  }, [cards.length, playFlip]);

  const handlePrev = useCallback(() => {
    if (cards.length === 0) return;
    playFlip();
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + cards.length) % cards.length);
  }, [cards.length, playFlip]);

  // Handle Shuffle
  const handleShuffle = () => {
    playFlip();
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Mark Difficulty & Award XP
  const handleRateCard = async (difficulty) => {
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
      setCards(prev => prev.map((c, i) => i === currentIndex ? { ...c, difficulty } : c));
      handleNext();
    } catch (err) {
      console.error('Failed to rate card:', err);
    }
  };

  // Text-to-Speech Speak Current Side
  const handleReadAloud = () => {
    if (!currentCard) return;
    const textToSpeak = isFlipped ? currentCard.answer : currentCard.question;
    speak(textToSpeak);
  };

  // Hands-Free Voice Commands Handler
  const handleVoiceCommand = useCallback((command) => {
    if (command === 'next') handleNext();
    else if (command === 'previous') handlePrev();
    else if (command === 'flip') handleFlip();
    else if (command === 'easy') handleRateCard('easy');
    else if (command === 'hard') handleRateCard('hard');
    else if (command === 'repeat') handleReadAloud();
  }, [handleNext, handlePrev, handleFlip, handleRateCard]);

  const { isListening, toggleListening, lastCommand } = useSpeechRecognition(handleVoiceCommand);

  // Auto-play mode loop
  useEffect(() => {
    let timer = null;
    if (autoPlay && cards.length > 0) {
      timer = setTimeout(() => {
        if (!isFlipped) {
          handleFlip();
        } else {
          handleNext();
        }
      }, 3500);
    }
    return () => clearTimeout(timer);
  }, [autoPlay, isFlipped, cards.length, handleFlip, handleNext]);

  // Keyboard shortcut listener (Space to flip, arrows to navigate)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev]);

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

        <div className="flex items-center gap-2">
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

      {/* Voice Assistant Command Bar */}
      <VoiceCommandIndicator
        isListening={isListening}
        onToggleListening={toggleListening}
        lastCommand={lastCommand}
        availableCommands={["Flip", "Next", "Previous", "Easy", "Hard", "Repeat"]}
      />

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
      ) : (
        <div className="space-y-6">
          
          {/* Progress Bar & Counter (3 / 10) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="font-fun text-sm font-black text-slate-800">
                Flashcard {currentIndex + 1} / {cards.length}
              </span>
              <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">
                {currentCard?.topic || 'General'}
              </span>
            </div>

            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-mentor-purple rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
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
          <div className="perspective-1000 w-full min-h-[320px] sm:min-h-[360px] relative">
            <div
              onClick={handleFlip}
              className={`relative w-full min-h-[320px] sm:min-h-[360px] rounded-3xl border-4 transition-transform duration-500 transform-style-3d cursor-pointer select-none shadow-xl ${
                isFlipped ? 'rotate-y-180 border-purple-400 bg-purple-50/20' : 'border-slate-200 bg-white hover:border-purple-300'
              }`}
            >
              
              {/* FRONT OF CARD (Question) */}
              <div className="absolute inset-0 backface-hidden p-8 flex flex-col justify-between rounded-3xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                    Question
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(currentCard.question);
                      }}
                      className="p-2 rounded-xl bg-purple-50 text-mentor-purple hover:bg-purple-100 transition"
                      title="Read Question"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-400">
                      Difficulty: {currentCard.difficulty}
                    </span>
                  </div>
                </div>

                <div className="text-center my-auto px-4">
                  <p className="font-fun text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                    {currentCard.question}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Click anywhere or press Spacebar to Flip</span>
                </div>
              </div>

              {/* BACK OF CARD (Answer) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 p-8 flex flex-col justify-between rounded-3xl bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                    Answer
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(currentCard.answer);
                    }}
                    className="p-2 rounded-xl bg-emerald-50 text-mentor-green hover:bg-emerald-100 transition"
                    title="Read Answer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center my-auto px-4">
                  <p className="font-medium text-lg sm:text-xl text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {currentCard.answer}
                  </p>
                </div>

                <div className="text-center text-xs font-bold text-mentor-purple">
                  Rate your recall below to boost your knowledge score!
                </div>
              </div>

            </div>
          </div>

          {/* Flashcard Bottom Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            
            {/* Prev / Next buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-3 rounded-2xl btn-duo-white font-bold"
                title="Previous card (Left Arrow)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleFlip}
                className="px-6 py-3 rounded-2xl btn-duo-purple font-black text-sm flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                <span>{isFlipped ? "Show Question" : "Reveal Answer"}</span>
              </button>
              <button
                onClick={handleNext}
                className="p-3 rounded-2xl btn-duo-white font-bold"
                title="Next card (Right Arrow)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Spaced Repetition Rating: Hard vs Easy */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRateCard('hard')}
                className="px-4 py-2.5 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 text-xs font-black shadow-duo-sm hover:bg-red-100 active:translate-y-0.5 flex items-center gap-1.5"
              >
                <Frown className="w-4 h-4" />
                <span>😓 Hard</span>
              </button>
              <button
                onClick={() => handleRateCard('easy')}
                className="px-4 py-2.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-800 text-xs font-black shadow-duo-sm hover:bg-emerald-100 active:translate-y-0.5 flex items-center gap-1.5"
              >
                <Smile className="w-4 h-4" />
                <span>😊 Easy (+5 XP)</span>
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default FlashcardsPage;
