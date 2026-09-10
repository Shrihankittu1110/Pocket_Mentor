import Quiz from '../models/Quiz.js';
import QuizResult from '../models/QuizResult.js';
import Note from '../models/Note.js';
import { generateQuiz, analyzeWeakTopics, generateStudyRecommendations } from '../services/aiService.js';
import { awardPointsAndCheckAchievements } from '../services/gamificationService.js';

export const generateQuizFromNote = async (req, res) => {
  try {
    const { noteId, content, topic, count } = req.body;
    let textToUse = content;
    let topicToUse = topic || 'General';
    let subjectToUse = 'General';

    let noteObj = null;
    if (noteId) {
      noteObj = await Note.findOne({ _id: noteId, user: req.user._id });
      if (noteObj) {
        textToUse = noteObj.content;
        topicToUse = noteObj.topic || noteObj.title || topicToUse;
        subjectToUse = noteObj.subject || subjectToUse;
      }
    }

    if (!textToUse) {
      return res.status(400).json({ message: 'No content provided to generate quiz.' });
    }

    const quizData = await generateQuiz(textToUse, topicToUse, count || 5);

    const newQuiz = await Quiz.create({
      title: quizData.title || `${topicToUse} Quiz`,
      topic: topicToUse,
      subject: subjectToUse,
      createdBy: req.user._id,
      note: noteObj ? noteObj._id : null,
      questions: quizData.questions,
    });

    return res.status(201).json(newQuiz);
  } catch (error) {
    console.error('Generate quiz error:', error);
    return res.status(500).json({ message: error.message || 'Failed to generate quiz' });
  }
};

export const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      $or: [{ createdBy: req.user._id }, { createdBy: null }]
    }).sort({ createdAt: -1 });
    return res.json(quizzes);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch quizzes' });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    return res.json(quiz);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch quiz' });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { answers, timeTaken } = req.body; // answers: [{ questionIndex, selectedAnswer }]
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    let correctCount = 0;
    const evaluatedAnswers = quiz.questions.map((q, idx) => {
      const studentSubmission = (answers || []).find(a => a.questionIndex === idx) || {};
      const selected = (studentSubmission.selectedAnswer || '').toString().trim().toLowerCase();
      const correct = (q.correctAnswer || '').toString().trim().toLowerCase();
      
      const isCorrect = selected === correct || (
        q.questionType === 'fill_blank' && correct.includes(selected) && selected.length > 2
      );

      if (isCorrect) correctCount += 1;

      return {
        questionIndex: idx,
        questionText: q.question,
        selectedAnswer: studentSubmission.selectedAnswer || 'Not answered',
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic || quiz.topic,
      };
    });

    const totalQuestions = quiz.questions.length;
    const wrongCount = totalQuestions - correctCount;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    // Identify weak topics
    const weakTopics = analyzeWeakTopics(evaluatedAnswers);
    const recommendations = generateStudyRecommendations(weakTopics);

    // Calculate XP Points
    // +10 per correct answer, +50 for quiz completion
    const pointsAwarded = (correctCount * 10) + 50;
    const eventType = scorePercentage === 100 ? 'quiz_perfect' : 'quiz_completed';

    const quizResult = await QuizResult.create({
      user: req.user._id,
      quiz: quiz._id,
      score: scorePercentage,
      totalQuestions,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      timeTaken: timeTaken || 0,
      weakTopics,
      userAnswers: evaluatedAnswers,
    });

    // Update streak & award points
    const gamification = await awardPointsAndCheckAchievements(req.user._id, pointsAwarded, eventType);

    return res.status(201).json({
      result: quizResult,
      scorePercentage,
      correctCount,
      wrongCount,
      totalQuestions,
      pointsAwarded,
      weakTopics,
      recommendations,
      gamification,
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    return res.status(500).json({ message: error.message || 'Failed to submit quiz' });
  }
};

export const getQuizResults = async (req, res) => {
  try {
    const results = await QuizResult.find({ user: req.user._id })
      .populate('quiz', 'title topic subject')
      .sort({ completedAt: -1 })
      .limit(20);
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch quiz results' });
  }
};
