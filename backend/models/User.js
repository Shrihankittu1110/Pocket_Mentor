import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  profileImage: {
    type: String,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Student',
  },
  college: {
    type: String,
    default: 'Tech University',
    trim: true,
  },
  course: {
    type: String,
    default: 'Computer Science',
    trim: true,
  },
  year: {
    type: String,
    default: '3rd Year',
    trim: true,
  },
  dailyStreak: {
    type: Number,
    default: 1,
  },
  longestStreak: {
    type: Number,
    default: 1,
  },
  lastActiveDate: {
    type: Date,
    default: Date.now,
  },
  totalPoints: {
    type: Number,
    default: 100, // Welcome bonus
  },
  achievements: [
    {
      slug: String,
      title: String,
      description: String,
      icon: String,
      unlockedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
