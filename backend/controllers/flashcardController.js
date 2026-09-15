import Flashcard from '../models/Flashcard.js';
import Note from '../models/Note.js';
import { generateFlashcards, validateAndCleanFlashcards } from '../services/aiService.js';
import { awardPointsAndCheckAchievements } from '../services/gamificationService.js';

export const generateFlashcardsFromNote = async (req, res) => {
  try {
    const { noteId, content, topic, count } = req.body;
    let textToUse = content;
    let topicToUse = topic || 'General';

    let noteObj = null;
    if (noteId) {
      noteObj = await Note.findOne({ _id: noteId, user: req.user._id });
      if (noteObj) {
        textToUse = noteObj.content;
        topicToUse = noteObj.topic || noteObj.title || topicToUse;
      }
    }

    if (!textToUse || !textToUse.trim()) {
      return res.status(400).json({ message: 'No content provided to generate flashcards.' });
    }

    // Dynamic initial count based on content length (no arbitrary 5-question limit)
    const requestedCount = count
      ? Math.max(1, parseInt(count, 10))
      : Math.min(Math.max(6, Math.ceil(textToUse.length / 200)), 16);

    // Fetch existing cards for this note to prevent duplicates if any already exist
    const existingCards = noteObj
      ? await Flashcard.find({ note: noteObj._id, user: req.user._id })
      : [];
    const existingQuestions = existingCards.map(c => c.question).filter(Boolean);

    const generated = await generateFlashcards(textToUse, topicToUse, {
      count: requestedCount,
      existingQuestions,
    });

    // Strict server-side validation before saving to MongoDB
    const validatedCards = validateAndCleanFlashcards(generated, textToUse, topicToUse, existingQuestions);

    if (validatedCards.length === 0) {
      if (existingCards.length > 0) {
        return res.json({
          message: 'No more unique questions can be generated from this note.',
          newCards: [],
          exhausted: true,
          totalCards: existingCards.length,
        });
      }
      return res.status(422).json({ message: 'Failed to extract valid, unique flashcard pairs from provided content.' });
    }

    const createdFlashcards = await Promise.all(
      validatedCards.map(card => 
        Flashcard.create({
          question: card.question,
          answer: card.answer,
          topic: card.topic || topicToUse,
          difficulty: card.difficulty || 'medium',
          options: card.options || [],
          correctAnswer: card.correctAnswer || undefined,
          questionType: card.questionType || 'standard',
          user: req.user._id,
          note: noteObj ? noteObj._id : null,
        })
      )
    );

    return res.status(201).json(createdFlashcards);
  } catch (error) {
    console.error('Generate flashcards error:', error);
    return res.status(500).json({ message: error.message || 'Failed to generate flashcards' });
  }
};

/**
 * Generate More Flashcards endpoint
 * Appends new, unique flashcards without deleting previous ones
 */
export const generateMoreFlashcards = async (req, res) => {
  try {
    const { noteId, content, topic, count, existingCardIds } = req.body;
    let textToUse = content;
    let topicToUse = topic || 'General';
    let noteObj = null;

    if (noteId) {
      noteObj = await Note.findOne({ _id: noteId, user: req.user._id });
      if (noteObj) {
        textToUse = noteObj.content;
        topicToUse = noteObj.topic || noteObj.title || topicToUse;
      }
    }

    if (!textToUse || !textToUse.trim()) {
      return res.status(400).json({ message: 'No content available to generate additional flashcards.' });
    }

    // Retrieve all existing flashcards for this note and user to avoid duplicate questions
    const existingCards = await Flashcard.find({
      user: req.user._id,
      ...(noteObj ? { note: noteObj._id } : {}),
    });

    const existingQuestions = existingCards.map(c => c.question).filter(Boolean);

    // Number of new cards to generate
    const requestedCount = Math.max(1, parseInt(count, 10) || 5);

    // AI generation with existing questions context
    const generated = await generateFlashcards(textToUse, topicToUse, {
      existingQuestions,
      count: requestedCount,
    });

    // Strict validation & deduplication against existing deck
    const validatedCards = validateAndCleanFlashcards(
      generated,
      textToUse,
      topicToUse,
      existingQuestions
    );

    if (validatedCards.length === 0) {
      return res.json({
        message: 'No more unique questions can be generated from this note.',
        newCards: [],
        exhausted: true,
        totalCards: existingCards.length,
      });
    }

    const createdFlashcards = await Promise.all(
      validatedCards.map(card =>
        Flashcard.create({
          question: card.question,
          answer: card.answer,
          topic: card.topic || topicToUse,
          difficulty: card.difficulty || 'medium',
          options: card.options || [],
          correctAnswer: card.correctAnswer || undefined,
          questionType: card.questionType || 'standard',
          user: req.user._id,
          note: noteObj ? noteObj._id : null,
        })
      )
    );

    // Award +10 XP points for expanding study deck
    const gamification = await awardPointsAndCheckAchievements(req.user._id, 10, 'generate_more_flashcards');

    return res.status(201).json({
      message: `${createdFlashcards.length} new flashcard${createdFlashcards.length === 1 ? '' : 's'} generated.`,
      newCards: createdFlashcards,
      exhausted: false,
      totalCards: existingCards.length + createdFlashcards.length,
      gamification,
    });
  } catch (error) {
    console.error('Generate more flashcards error:', error);
    return res.status(500).json({ message: error.message || 'Failed to generate additional flashcards' });
  }
};

export const getFlashcards = async (req, res) => {
  try {
    const { topic, difficulty, noteId } = req.query;
    const query = { user: req.user._id };

    if (topic && topic !== 'All') {
      query.topic = topic;
    }
    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }
    if (noteId) {
      query.note = noteId;
    }

    const cards = await Flashcard.find(query).sort({ createdAt: -1 });
    return res.json(cards);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch flashcards' });
  }
};

export const updateFlashcardDifficulty = async (req, res) => {
  try {
    const { difficulty } = req.body; // 'easy', 'medium', or 'hard'
    const card = await Flashcard.findOne({ _id: req.params.id, user: req.user._id });

    if (!card) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      card.difficulty = difficulty;
    }

    card.reviewCount += 1;
    card.lastReviewed = new Date();
    await card.save();

    // Award +5 XP points for flashcard practice
    const gamification = await awardPointsAndCheckAchievements(req.user._id, 5, 'flashcard_review');

    return res.json({ card, gamification });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update flashcard' });
  }
};

export const createFlashcard = async (req, res) => {
  try {
    const { question, answer, topic, difficulty, options, correctAnswer, questionType } = req.body;

    if (!question || !question.trim() || !answer || !answer.trim()) {
      return res.status(400).json({ message: 'Question and answer are required.' });
    }

    const cleanQ = question.trim();
    const cleanA = answer.trim();

    if (cleanQ.toLowerCase() === cleanA.toLowerCase()) {
      return res.status(400).json({ message: 'Question and answer cannot be identical.' });
    }

    // MCQ validation if options are passed
    let cleanOptions = [];
    let cleanCorrect = correctAnswer;
    let type = questionType || 'standard';

    if (Array.isArray(options) && options.length >= 2) {
      cleanOptions = Array.from(new Set(options.map(o => (o || '').toString().trim()).filter(Boolean)));
      if (cleanOptions.length >= 2) {
        type = 'mcq';
        cleanCorrect = (cleanCorrect || cleanA).toString().trim();
        if (!cleanOptions.some(opt => opt.toLowerCase() === cleanCorrect.toLowerCase())) {
          return res.status(400).json({ message: 'MCQ correct answer must match one of the provided options.' });
        }
      }
    }

    const card = await Flashcard.create({
      question: cleanQ,
      answer: cleanA,
      topic: topic?.trim() || 'General',
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
      options: cleanOptions,
      correctAnswer: cleanCorrect,
      questionType: type,
      user: req.user._id,
    });

    return res.status(201).json(card);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create flashcard' });
  }
};

export const deleteFlashcard = async (req, res) => {
  try {
    const card = await Flashcard.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!card) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }
    return res.json({ message: 'Flashcard deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete flashcard' });
  }
};
