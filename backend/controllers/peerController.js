import PeerPost from '../models/PeerPost.js';
import { awardPointsAndCheckAchievements } from '../services/gamificationService.js';

export const getQuestions = async (req, res) => {
  try {
    const { search, topic, subject } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { question: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
      ];
    }
    if (topic && topic !== 'All') query.topic = topic;
    if (subject && subject !== 'All') query.subject = subject;

    const posts = await PeerPost.find(query)
      .populate('author', 'name email profileImage')
      .populate('answers.author', 'name email profileImage')
      .sort({ createdAt: -1 });

    return res.json(posts);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch peer posts' });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const { title, question, topic, subject, tags } = req.body;

    if (!title || !question) {
      return res.status(400).json({ message: 'Title and question details are required' });
    }

    const post = await PeerPost.create({
      title,
      question,
      topic: topic || 'General',
      subject: subject || 'Computer Science',
      tags: tags || [],
      author: req.user._id,
      answers: [],
    });

    // Award +10 XP for asking an active question
    await awardPointsAndCheckAchievements(req.user._id, 10, 'peer_question');

    const populated = await PeerPost.findById(post._id).populate('author', 'name email profileImage');
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to post question' });
  }
};

export const answerQuestion = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Answer content cannot be empty' });
    }

    const post = await PeerPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newAnswer = {
      author: req.user._id,
      content: content.trim(),
      helpfulVotes: [],
      loveVotes: [],
      isBestAnswer: false,
      createdAt: new Date(),
    };

    post.answers.push(newAnswer);
    await post.save();

    // Award +25 XP points for teaching another student!
    const gamification = await awardPointsAndCheckAchievements(req.user._id, 25, 'peer_answer');

    const updated = await PeerPost.findById(post._id)
      .populate('author', 'name email profileImage')
      .populate('answers.author', 'name email profileImage');

    return res.status(201).json({ post: updated, gamification });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to add answer' });
  }
};

export const voteAnswer = async (req, res) => {
  try {
    const { postId, answerId } = req.params;
    const { voteType } = req.body; // 'helpful' or 'love'

    const post = await PeerPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const answer = post.answers.id(answerId);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const userId = req.user._id.toString();
    const voteArray = voteType === 'love' ? answer.loveVotes : answer.helpfulVotes;
    const alreadyVotedIndex = voteArray.findIndex(id => id.toString() === userId);

    if (alreadyVotedIndex > -1) {
      voteArray.splice(alreadyVotedIndex, 1);
    } else {
      voteArray.push(req.user._id);

      // Reward the author of the helpful answer with +25 XP!
      if (answer.author.toString() !== userId) {
        await awardPointsAndCheckAchievements(answer.author, 25, 'helpful_vote');
      }
    }

    await post.save();

    const updated = await PeerPost.findById(postId)
      .populate('author', 'name email profileImage')
      .populate('answers.author', 'name email profileImage');

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to vote' });
  }
};

export const markBestAnswer = async (req, res) => {
  try {
    const { postId, answerId } = req.params;
    const post = await PeerPost.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the question author can mark the best answer' });
    }

    post.answers.forEach(ans => {
      ans.isBestAnswer = ans._id.toString() === answerId;
    });
    post.isResolved = true;
    await post.save();

    // Reward best answer author with +50 XP
    const targetAnswer = post.answers.id(answerId);
    if (targetAnswer) {
      await awardPointsAndCheckAchievements(targetAnswer.author, 50, 'best_answer');
    }

    const updated = await PeerPost.findById(postId)
      .populate('author', 'name email profileImage')
      .populate('answers.author', 'name email profileImage');

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to mark best answer' });
  }
};
