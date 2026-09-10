import Flashcard from '../models/Flashcard.js';
import Note from '../models/Note.js';
import { generateFlashcards } from '../services/aiService.js';
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

    if (!textToUse) {
      return res.status(400).json({ message: 'No content provided to generate flashcards.' });
    }

    const generated = await generateFlashcards(textToUse, topicToUse, count || 6);

    const createdFlashcards = await Promise.all(
      generated.map(card => 
        Flashcard.create({
          question: card.question,
          answer: card.answer,
          topic: card.topic || topicToUse,
          difficulty: card.difficulty || 'medium',
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
    const { difficulty } = req.body; // 'easy' or 'hard'
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
    const { question, answer, topic, difficulty } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const card = await Flashcard.create({
      question,
      answer,
      topic: topic || 'General',
      difficulty: difficulty || 'medium',
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
