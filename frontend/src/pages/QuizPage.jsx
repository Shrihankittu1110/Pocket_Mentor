import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  Volume2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Flame,
  Star,
  Clock,
  Sparkles,
  Trophy,
  Zap,
  Layers,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { triggerConfetti } from '../components/common/ConfettiCelebration';
import VoiceCommandIndicator from '../components/common/VoiceCommandIndicator';

export const QuizPage = () => {
  const [searchParams] = useSearchParams();
  const quizIdParam = searchParams.get('id');
  const noteIdParam = searchParams.get('noteId');
  const navigate = useNavigate();

  const { user, awardPoints } = useAuth();
  const { playCorrect, playWrong, playFanfare, playStreakFlame } = useSound();
  const { speak, stop, isSpeaking } = useSpeechSynthesis();

  const [quizzesList, setQuizzesList] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [userAnswersList, setUserAnswersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Time elapsed counter
  const [startTime, setStartTime] = useState(Date.now());
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResultSummary, setQuizResultSummary] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/quizzes');
        setQuizzesList(data);

        if (data.length > 0) {
          let chosen = data[0];
          if (quizIdParam) {
            chosen = data.find(q => q._id === quizIdParam) || data[0];
          } else if (noteIdParam) {
            chosen = data.find(q => q.note === noteIdParam) || data[0];
          }
          setActiveQuiz(chosen);
        }
      } catch (err) {
        console.error('Failed to load quizzes:', err);
      } finally {
        setLoading(false);
        setStartTime(Date.now());
      }
    };

    fetchQuizzes();
  }, [quizIdParam, noteIdParam]);

  const currentQuestion = activeQuiz?.questions?.[currentQIndex] || null;

  // Read current question & options aloud
  const readQuestionAloud = useCallback(() => {
    if (!currentQuestion) return;
    let text = `Question: ${currentQuestion.question}. `;
    if (currentQuestion.options && currentQuestion.options.length > 0) {
      text += `Options are: ${currentQuestion.options.map((opt, i) => `Option ${String.fromCharCode(65 + i)}: ${opt}`).join('. ')}.`;
    }
    speak(text);
  }, [currentQuestion, speak]);

  // Voice Command integration
  const handleVoiceCommand = useCallback((cmd, rawText) => {
    if (cmd === 'start_quiz' || cmd === 'repeat') {
      readQuestionAloud();
    } else if (cmd === 'option_a' && currentQuestion?.options?.[0]) {
      setSelectedAnswer(currentQuestion.options[0]);
    } else if (cmd === 'option_b' && currentQuestion?.options?.[1]) {
      setSelectedAnswer(currentQuestion.options[1]);
    } else if (cmd === 'option_c' && currentQuestion?.options?.[2]) {
      setSelectedAnswer(currentQuestion.options[2]);
    } else if (cmd === 'option_d' && currentQuestion?.options?.[3]) {
      setSelectedAnswer(currentQuestion.options[3]);
    } else if (cmd === 'true') {
      setSelectedAnswer('True');
    } else if (cmd === 'false') {
      setSelectedAnswer('False');
    } else if (cmd === 'next' && isAnswerChecked) {
      handleNextQuestion();
    }
  }, [currentQuestion, isAnswerChecked, readQuestionAloud]);

  const { isListening, toggleListening, lastCommand } = useSpeechRecognition(handleVoiceCommand);

  // Check Answer Button
  const handleCheckAnswer = () => {
    if (!selectedAnswer || isAnswerChecked) return;

    const correct = (currentQuestion.correctAnswer || '').toString().trim().toLowerCase();
    const selected = selectedAnswer.toString().trim().toLowerCase();
    const isCorrect = selected === correct || (
      currentQuestion.questionType === 'fill_blank' && correct.includes(selected) && selected.length > 2
    );

    setIsAnswerChecked(true);

    if (isCorrect) {
      playCorrect();
      awardPoints(10);
      speak(`Correct! Great job! ${currentQuestion.explanation || ''}`);
    } else {
      playWrong();
      speak(`Not quite. The correct answer is: ${currentQuestion.correctAnswer}. ${currentQuestion.explanation || ''}`);
    }

    // Record answer
    setUserAnswersList(prev => [
      ...prev,
      {
        questionIndex: currentQIndex,
        selectedAnswer,
        isCorrect,
      }
    ]);
  };

  // Next Question or Finish Quiz
  const handleNextQuestion = async () => {
    stop();
    if (currentQIndex + 1 < activeQuiz.questions.length) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedAnswer('');
      setIsAnswerChecked(false);
    } else {
      // Completed! Submit to server
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      try {
        const { data } = await api.post(`/quizzes/${activeQuiz._id}/submit`, {
          answers: userAnswersList,
          timeTaken,
        });
        setQuizResultSummary(data);
        setQuizCompleted(true);
        triggerConfetti();
        playFanfare();
        playStreakFlame();
      } catch (err) {
        console.error('Failed to submit quiz:', err);
      }
    }
  };

  // Restart Quiz
  const handleRestartQuiz = () => {
    setCurrentQIndex(0);
    setSelectedAnswer('');
    setIsAnswerChecked(false);
    setUserAnswersList([]);
    setQuizCompleted(false);
    setQuizResultSummary(null);
    setStartTime(Date.now());
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Interactive Challenge Arena</span>
          </div>
          <h1 className="font-fun text-3xl font-black text-slate-900">
            ❓ Interactive Quiz
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Test comprehension, earn points, and reinforce weak topics
          </p>
        </div>

        {/* Quiz Selector */}
        {quizzesList.length > 0 && !quizCompleted && (
          <select
            value={activeQuiz?._id || ''}
            onChange={(e) => {
              const q = quizzesList.find(item => item._id === e.target.value);
              if (q) {
                setActiveQuiz(q);
                handleRestartQuiz();
              }
            }}
            className="px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-400"
          >
            {quizzesList.map(q => (
              <option key={q._id} value={q._id}>
                {q.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Voice Assistant Indicator */}
      {!quizCompleted && (
        <VoiceCommandIndicator
          isListening={isListening}
          onToggleListening={toggleListening}
          lastCommand={lastCommand}
          availableCommands={["Option A/B/C/D", "True", "False", "Repeat", "Next"]}
        />
      )}

      {loading ? (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-slate-200">
          <div className="inline-block w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-fun font-bold text-slate-600 mt-2">Loading quiz questions...</p>
        </div>
      ) : !activeQuiz ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4">
          <span className="text-5xl">❓</span>
          <h2 className="font-fun text-2xl font-bold text-slate-800">No Quizzes Generated Yet</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Upload notes to automatically generate a smart quiz with instant scoring and recommendations!
          </p>
          <Link to="/notes" className="inline-block px-6 py-3 rounded-2xl btn-duo-green text-xs font-black">
            Go to My Notes
          </Link>
        </div>
      ) : quizCompleted && quizResultSummary ? (
        
        /* 🏆 QUIZ RESULTS SUMMARY & REVISE AGAIN VIEW */
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 space-y-8 shadow-xl animate-in zoom-in-95 duration-200">
          
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white mx-auto flex items-center justify-center text-4xl shadow-duo-orange">
              🎉
            </div>
            <h2 className="font-fun text-3xl sm:text-4xl font-black text-slate-900">
              Quiz Complete!
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              You've proven your knowledge and kept your momentum strong!
            </p>
          </div>

          {/* Daily Streak Maintained Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-mentor-orange fill-mentor-orange animate-flame" />
              <div>
                <p className="font-fun font-bold text-amber-900 text-base">
                  🔥 Streak Maintained!
                </p>
                <p className="text-xs text-amber-700 font-medium">
                  {user?.dailyStreak || 1} Days in a row! Don't break your streak tomorrow.
                </p>
              </div>
            </div>
            <span className="font-fun font-black text-mentor-green text-sm bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm">
              +{quizResultSummary.pointsAwarded || 50} XP Awarded
            </span>
          </div>

          {/* Score Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase">Score</p>
              <p className="font-fun text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {quizResultSummary.correctCount} / {quizResultSummary.totalQuestions}
              </p>
            </div>
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-emerald-600 uppercase">Accuracy</p>
              <p className="font-fun text-2xl sm:text-3xl font-black text-mentor-green mt-1">
                {quizResultSummary.scorePercentage}%
              </p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-blue-600 uppercase">Points Won</p>
              <p className="font-fun text-2xl sm:text-3xl font-black text-mentor-blue mt-1">
                +{quizResultSummary.pointsAwarded}
              </p>
            </div>
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-purple-600 uppercase">Time</p>
              <p className="font-fun text-2xl sm:text-3xl font-black text-mentor-purple mt-1">
                {quizResultSummary.result?.timeTaken || 24}s
              </p>
            </div>
          </div>

          {/* 🔄 REVISE AGAIN FEATURE: Weak Topics Analysis */}
          <div className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔄</span>
              <div>
                <h3 className="font-fun text-lg font-bold text-slate-900">
                  Topics You Should Revise
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  AI diagnostic based on missed questions in this session
                </p>
              </div>
            </div>

            {quizResultSummary.weakTopics && quizResultSummary.weakTopics.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {quizResultSummary.weakTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-red-100 text-red-800 border border-red-200 text-xs font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{topic}</span>
                    </span>
                  ))}
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5 mt-3">
                  <p className="font-bold text-slate-800">💡 Personalized Recommendations:</p>
                  {quizResultSummary.recommendations?.map((rec, idx) => (
                    <p key={idx} className="leading-relaxed text-slate-600">• {rec}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-mentor-green shrink-0" />
                <span>Flawless performance! Zero weak topics detected. You've thoroughly mastered this content.</span>
              </div>
            )}

            {/* Action Buttons for Revise Again */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={handleRestartQuiz}
                className="px-5 py-2.5 rounded-xl btn-duo-green text-xs font-black flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Quiz</span>
              </button>

              <Link
                to={`/flashcards?noteId=${activeQuiz.note || ''}`}
                className="px-5 py-2.5 rounded-xl btn-duo-purple text-xs font-black flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Practice Weak Flashcards</span>
              </Link>

              <Link
                to={`/quick-revision?noteId=${activeQuiz.note || ''}`}
                className="px-5 py-2.5 rounded-xl btn-duo-orange text-xs font-black flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Revise Topic in 60s</span>
              </Link>
            </div>
          </div>

        </div>

      ) : (

        /* ❓ ACTIVE QUIZ QUESTION ARENA */
        <div className="space-y-6">
          
          {/* Question Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="font-fun text-sm font-black text-slate-800">
                Question {currentQIndex + 1} of {activeQuiz.questions.length}
              </span>
              <span className="text-mentor-green font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                +10 XP on Correct
              </span>
            </div>

            <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-mentor-red rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 space-y-6 shadow-md">
            
            <div className="flex items-start justify-between gap-4">
              <span className="text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
                {currentQuestion.questionType === 'true_false' ? 'True / False' : currentQuestion.questionType === 'fill_blank' ? 'Fill in the Blank' : 'Multiple Choice'}
              </span>

              <button
                onClick={readQuestionAloud}
                className="p-2 rounded-xl bg-blue-50 text-mentor-blue hover:bg-blue-100 transition flex items-center gap-1 text-xs font-bold"
                title="Read question and options aloud"
              >
                <Volume2 className="w-4 h-4" />
                <span>Listen</span>
              </button>
            </div>

            <h2 className="font-fun text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {currentQuestion.question}
            </h2>

            {/* Options List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options?.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const isCorrectOpt = option === currentQuestion.correctAnswer;
                
                let btnStyle = 'bg-white border-2 border-slate-200 hover:border-rose-300 text-slate-700';

                if (isSelected && !isAnswerChecked) {
                  btnStyle = 'bg-rose-50 border-2 border-rose-500 text-rose-900 shadow-duo-red';
                } else if (isAnswerChecked) {
                  if (isCorrectOpt) {
                    btnStyle = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-900 font-bold shadow-duo-green';
                  } else if (isSelected && !isCorrectOpt) {
                    btnStyle = 'bg-red-50 border-2 border-red-500 text-red-900 font-bold shadow-duo-red';
                  } else {
                    btnStyle = 'bg-slate-50 border-2 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerChecked}
                    onClick={() => setSelectedAnswer(option)}
                    className={`p-4 rounded-2xl text-left text-sm font-semibold transition flex items-center justify-between ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </div>

                    {isAnswerChecked && isCorrectOpt && (
                      <CheckCircle2 className="w-5 h-5 text-mentor-green shrink-0" />
                    )}
                    {isAnswerChecked && isSelected && !isCorrectOpt && (
                      <XCircle className="w-5 h-5 text-mentor-red shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback Banner */}
            {isAnswerChecked && (
              <div
                className={`p-4 rounded-2xl border-2 animate-in fade-in slide-in-from-bottom-2 duration-150 ${
                  selectedAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                    : 'bg-red-50 border-red-400 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {selectedAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase() ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-mentor-green" />
                      <span className="font-fun font-black text-base text-emerald-800">🎉 Correct! Great job! +10 XP</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-mentor-red" />
                      <span className="font-fun font-black text-base text-red-800">❌ Not Quite</span>
                    </>
                  )}
                </div>

                <p className="text-xs font-bold mt-1">
                  Correct Answer: <span className="font-extrabold">{currentQuestion.correctAnswer}</span>
                </p>
                {currentQuestion.explanation && (
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {currentQuestion.explanation}
                  </p>
                )}
              </div>
            )}

            {/* Action Bar (Check Answer / Continue) */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
              {!isAnswerChecked ? (
                <button
                  disabled={!selectedAnswer}
                  onClick={handleCheckAnswer}
                  className={`px-8 py-3.5 rounded-2xl text-sm font-black transition ${
                    selectedAnswer
                      ? 'btn-duo-green'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Check Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-8 py-3.5 rounded-2xl btn-duo-green text-sm font-black flex items-center gap-2"
                >
                  <span>{currentQIndex + 1 < activeQuiz.questions.length ? 'Next Question' : 'View Results'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default QuizPage;
