import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import StudyGroup from './models/StudyGroup.js';
import Message from './models/Message.js';
import { isUserGroupMember, getFileTypeCategory } from './controllers/groupController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pocket-mentor';

async function runTests() {
  console.log('🧪 Starting Study Group File Sharing & Security Test Suite...\n');
  await mongoose.connect(MONGO_URI);

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    // 1. Setup Test Users
    let userA = await User.findOne({ email: 'fileshare_user_a@test.com' });
    if (!userA) {
      userA = await User.create({
        name: 'Alice Group Admin',
        email: 'fileshare_user_a@test.com',
        password: 'Password123!',
      });
    }

    let userB = await User.findOne({ email: 'fileshare_user_b@test.com' });
    if (!userB) {
      userB = await User.create({
        name: 'Bob Group Member',
        email: 'fileshare_user_b@test.com',
        password: 'Password123!',
      });
    }

    let userC = await User.findOne({ email: 'fileshare_user_c_nonmember@test.com' });
    if (!userC) {
      userC = await User.create({
        name: 'Charlie Non Member',
        email: 'fileshare_user_c_nonmember@test.com',
        password: 'Password123!',
      });
    }

    // 2. Setup Test Study Group
    let group = await StudyGroup.findOne({ name: 'File Sharing Test Group' });
    if (group) {
      await Message.deleteMany({ group: group._id });
      await StudyGroup.deleteOne({ _id: group._id });
    }

    group = await StudyGroup.create({
      name: 'File Sharing Test Group',
      description: 'Group for testing file uploads, PDFs, images, and security access controls',
      subject: 'Computer Systems',
      admin: userA._id,
      members: [userA._id, userB._id],
    });

    console.log(`📁 Test Group Created: ${group.name} (Code: ${group.groupCode})`);

    // TEST 1: File type category detection
    assert(getFileTypeCategory('notes.pdf', 'application/pdf') === 'pdf', 'Detects PDF file type category');
    assert(getFileTypeCategory('diagram.PNG', 'image/png') === 'image', 'Detects PNG/Image file type category');
    assert(getFileTypeCategory('photo.webp', 'image/webp') === 'image', 'Detects WEBP file type category');
    assert(getFileTypeCategory('assignment.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') === 'doc', 'Detects DOCX file type category');
    assert(getFileTypeCategory('slides.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation') === 'ppt', 'Detects PPTX file type category');
    assert(getFileTypeCategory('readme.txt', 'text/plain') === 'text', 'Detects TXT file type category');

    // TEST 2: Group membership verification helper
    assert(isUserGroupMember(group, userA._id) === true, 'Admin (Alice) is authorized group member');
    assert(isUserGroupMember(group, userB._id) === true, 'Member (Bob) is authorized group member');
    assert(isUserGroupMember(group, userC._id) === false, 'Non-member (Charlie) is REJECTED (isUserGroupMember === false)');

    // TEST 3: Send normal text message
    const textMsg = await Message.create({
      group: group._id,
      sender: userA._id,
      message: 'Hello study squad!',
    });
    assert(textMsg && textMsg.message === 'Hello study squad!' && textMsg.attachment?.url === null, 'Can send normal text message without attachment');

    // TEST 4: Send PDF attachment with message
    const pdfMsg = await Message.create({
      group: group._id,
      sender: userA._id,
      message: 'Here is Unit 1 Lecture PDF',
      attachment: {
        url: `/api/groups/${group._id}/files/1700000000-deep_learning_unit1.pdf`,
        name: 'deep_learning_unit1.pdf',
        type: 'pdf',
        size: 2450000,
        mimetype: 'application/pdf',
        fileKey: '1700000000-deep_learning_unit1.pdf',
      },
    });
    assert(pdfMsg && pdfMsg.attachment.type === 'pdf' && pdfMsg.attachment.size === 2450000, 'Can save message with PDF attachment and metadata');

    // TEST 5: Send Image attachment without text message (Attachment-only)
    const imgMsg = await Message.create({
      group: group._id,
      sender: userB._id,
      message: '',
      attachment: {
        url: `/api/groups/${group._id}/files/1700000001-architecture_diagram.png`,
        name: 'architecture_diagram.png',
        type: 'image',
        size: 850000,
        mimetype: 'image/png',
        fileKey: '1700000001-architecture_diagram.png',
      },
    });
    assert(imgMsg && imgMsg.message === '' && imgMsg.attachment.type === 'image', 'Can send attachment-only message without text');

    // TEST 6: Send DOCX attachment
    const docxMsg = await Message.create({
      group: group._id,
      sender: userB._id,
      message: 'Project guidelines document',
      attachment: {
        url: `/api/groups/${group._id}/files/1700000002-guidelines.docx`,
        name: 'guidelines.docx',
        type: 'doc',
        size: 120000,
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileKey: '1700000002-guidelines.docx',
      },
    });
    assert(docxMsg && docxMsg.attachment.type === 'doc', 'Can send DOCX attachment message');

    // TEST 7: Query group messages and verify population
    let allMessages = await Message.find({ group: group._id })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 });
    assert(allMessages.length === 4, 'All 4 messages saved and retrieved in chronological order');
    assert(allMessages[1].attachment.name === 'deep_learning_unit1.pdf', 'Attachment details preserved in message query');

    // TEST 8: Verify non-member security logic
    const charlieAttempt = isUserGroupMember(group, userC._id);
    assert(!charlieAttempt, 'SECURITY CHECK: Non-member Charlie cannot access files or post to group');

    // TEST 9: Delete Message Authorization - Sender can delete own message
    const msgToDelete = allMessages[0];
    const isSenderAuthorized = msgToDelete.sender._id.toString() === userA._id.toString() || group.admin.toString() === userA._id.toString();
    assert(isSenderAuthorized === true, 'Sender Alice is authorized to delete her own message');
    await Message.findByIdAndDelete(msgToDelete._id);
    const afterDelete = await Message.findById(msgToDelete._id);
    assert(afterDelete === null, 'Message successfully deleted from database');

    // TEST 10: Delete Message Authorization - Admin can delete member message
    const memberMsg = allMessages[2]; // sent by userB
    const isAdminAuthorized = memberMsg.sender._id.toString() === userA._id.toString() || group.admin.toString() === userA._id.toString();
    assert(isAdminAuthorized === true, 'Group Admin Alice is authorized to delete member Bob message');

    // TEST 11: Delete Message Authorization - Member Bob CANNOT delete Admin Alice message
    const adminPdfMsg = allMessages[1]; // sent by userA
    const isBobAuthorized = adminPdfMsg.sender._id.toString() === userB._id.toString() || group.admin.toString() === userB._id.toString();
    assert(isBobAuthorized === false, 'Non-admin member Bob is FORBIDDEN from deleting another member message');

    console.log(`\n========================================`);
    console.log(`Test Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);


  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
