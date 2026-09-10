import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ACHIEVEMENTS_LIST } from '../services/gamificationService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'pocket_mentor_super_secret_jwt_key_2026_production_secure', {
    expiresIn: '30d',
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, college, course, year } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      college: college || 'Tech University',
      course: course || 'Computer Science',
      year: year || '3rd Year',
      totalPoints: 100, // 100 Starter XP
      achievements: [],
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        college: user.college,
        course: user.course,
        year: user.year,
        dailyStreak: user.dailyStreak,
        longestStreak: user.longestStreak,
        totalPoints: user.totalPoints,
        achievements: user.achievements,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: error.message || 'Error registering user' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.profileImage && user.profileImage.includes('bottts')) {
      user.profileImage = user.profileImage.replace('bottts', 'avataaars');
      await user.save();
    }

    const token = generateToken(user._id);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        college: user.college,
        course: user.course,
        year: user.year,
        dailyStreak: user.dailyStreak,
        longestStreak: user.longestStreak,
        totalPoints: user.totalPoints,
        achievements: user.achievements,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: error.message || 'Error logging in' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Auto-migrate robot avatar to friendly human avatar if needed
    if (user.profileImage && user.profileImage.includes('bottts')) {
      user.profileImage = user.profileImage.replace('bottts', 'avataaars');
      await user.save();
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error fetching profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, college, course, year, profileImage } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (college) user.college = college;
    if (course) user.course = course;
    if (year) user.year = year;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      college: user.college,
      course: user.course,
      year: user.year,
      dailyStreak: user.dailyStreak,
      longestStreak: user.longestStreak,
      totalPoints: user.totalPoints,
      achievements: user.achievements,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error updating profile' });
  }
};
