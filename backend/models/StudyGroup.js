import mongoose from 'mongoose';

const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  subject: {
    type: String,
    default: 'General Study',
    trim: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  groupCode: {
    type: String,
    uppercase: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto generate group code if not set
studyGroupSchema.pre('save', function (next) {
  if (!this.groupCode) {
    this.groupCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);
export default StudyGroup;
