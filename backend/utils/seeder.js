import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Note from '../models/Note.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import StudyGroup from '../models/StudyGroup.js';
import Message from '../models/Message.js';
import PeerPost from '../models/PeerPost.js';
import Achievement from '../models/Achievement.js';
import { ACHIEVEMENTS_LIST } from '../services/gamificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const seedSampleData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has data. Skipping sample seed.');
      return;
    }

    console.log('🌱 Seeding initial sample data for Pocket Mentor...');

    // 1. Seed Achievements
    for (const ach of ACHIEVEMENTS_LIST) {
      await Achievement.findOneAndUpdate(
        { slug: ach.slug },
        { ...ach, criteriaType: 'streak', threshold: 1 },
        { upsert: true }
      );
    }

    // 2. Seed Demo User
    const demoUser = await User.create({
      name: 'Alex Rivera',
      email: 'demo@pocketmentor.com',
      password: 'password123',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      college: 'MIT School of Engineering',
      course: 'Computer Science',
      year: '3rd Year',
      dailyStreak: 5,
      longestStreak: 7,
      totalPoints: 340,
      achievements: [
        {
          slug: 'first_note',
          title: 'First Note 📚',
          description: 'Uploaded your first set of study notes',
          icon: '📚',
          unlockedAt: new Date(Date.now() - 5 * 86400000),
        },
        {
          slug: 'streak_3',
          title: '3-Day Fire 🔥',
          description: 'Maintained a 3-day learning streak',
          icon: '🔥',
          unlockedAt: new Date(Date.now() - 2 * 86400000),
        },
        {
          slug: 'quiz_champion',
          title: 'Quiz Champion 🎯',
          description: 'Scored 100% on a study quiz',
          icon: '🎯',
          unlockedAt: new Date(Date.now() - 1 * 86400000),
        }
      ],
    });

    // 2b. Second user for peer teaching demo
    const peerUser = await User.create({
      name: 'Sophia Chen',
      email: 'sophia@pocketmentor.com',
      password: 'password123',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
      college: 'Stanford Online',
      course: 'Software Systems',
      year: '4th Year',
      dailyStreak: 12,
      longestStreak: 15,
      totalPoints: 520,
      achievements: [],
    });

    // 3. Seed Sample Note
    const osNote = await Note.create({
      title: 'Operating Systems & Process Management',
      content: `An Operating System (OS) is system software that manages computer hardware, software resources, and provides common services for computer programs.
Key responsibilities include:
1. Process Management: Handles creation, scheduling, and termination of processes. Includes CPU scheduling algorithms like Round Robin, FCFS, and Shortest Job First.
2. Memory Management: Coordinates RAM allocation through paging, segmentation, and virtual memory.
3. File System: Organizes files hierarchically and manages access permissions.
4. Device Management: Coordinates device drivers and I/O buffering.
Real-world examples: Linux kernel, Windows NT, macOS Darwin, Android OS.
Deadlock occurs when four conditions are met: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.`,
      subject: 'Computer Science',
      topic: 'Operating Systems',
      user: demoUser._id,
      summary: `### 📌 Overview: Operating Systems
An Operating System is the primary software bridge orchestrating computer hardware and software operations.

### 🔑 Core Takeaways
- **Process Management**: Schedules execution via CPU scheduling (Round Robin, FCFS, SJF).
- **Memory & Storage**: Employs virtual memory, paging, and hierarchical file systems.
- **Deadlock Conditions**: Mutual exclusion, hold-and-wait, no preemption, circular wait.

### 💡 Examples
Linux, Windows, macOS, Android.`,
      quickRevision: {
        topic: 'Operating Systems',
        overview: 'System software managing hardware and software resources while orchestrating execution.',
        keyPoints: [
          'Process scheduling: Round Robin, FCFS, SJF',
          'Memory coordination: Paging, virtual memory, cache',
          'File management: Hierarchical directories & permissions',
          'Deadlock: 4 Coffman conditions to prevent'
        ],
        examples: ['Linux Kernel', 'Windows NT', 'macOS Darwin'],
        durationSeconds: 60,
      },
    });

    // 4. Seed Sample Flashcards
    await Flashcard.create([
      {
        question: 'What are the 4 Coffman conditions required for a Deadlock?',
        answer: '1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait',
        topic: 'Operating Systems',
        difficulty: 'medium',
        user: demoUser._id,
        note: osNote._id,
        reviewCount: 3,
        lastReviewed: new Date(),
      },
      {
        question: 'What is the purpose of Virtual Memory in an OS?',
        answer: 'Virtual memory allows an OS to execute processes that may not be completely in physical RAM by using secondary storage as an extension of main memory via paging.',
        topic: 'Operating Systems',
        difficulty: 'easy',
        user: demoUser._id,
        note: osNote._id,
        reviewCount: 2,
        lastReviewed: new Date(),
      },
      {
        question: 'What is the key difference between Process and Thread?',
        answer: 'A Process is an executing program with its own dedicated memory address space. A Thread is a lightweight sub-execution unit within a process that shares memory and resources with other threads of the same process.',
        topic: 'Operating Systems',
        difficulty: 'medium',
        user: demoUser._id,
        note: osNote._id,
        reviewCount: 4,
        lastReviewed: new Date(),
      },
      {
        question: 'What is Context Switching?',
        answer: 'The mechanism of storing the current state of a CPU process so that it can be restored and resume execution later, enabling multi-tasking.',
        topic: 'Operating Systems',
        difficulty: 'hard',
        user: demoUser._id,
        note: osNote._id,
        reviewCount: 1,
        lastReviewed: new Date(),
      },
    ]);

    // 5. Seed Sample Quiz
    await Quiz.create({
      title: 'Operating Systems Quick Check',
      topic: 'Operating Systems',
      subject: 'Computer Science',
      createdBy: demoUser._id,
      note: osNote._id,
      questions: [
        {
          question: 'Which CPU scheduling algorithm gives each process a small unit of CPU time (time quantum)?',
          options: ['Shortest Job First', 'Round Robin', 'First-Come First-Served', 'Priority Scheduling'],
          correctAnswer: 'Round Robin',
          explanation: 'Round Robin is a preemptive scheduling algorithm that assigns each process a fixed time slice.',
          questionType: 'mcq',
          topic: 'Operating Systems',
        },
        {
          question: 'True or False: A thread has its own separate memory address space completely isolated from its parent process.',
          options: ['True', 'False'],
          correctAnswer: 'False',
          explanation: 'False. Threads within the same process share the process memory and resources, having only their own stack and registers.',
          questionType: 'true_false',
          topic: 'Operating Systems',
        },
        {
          question: 'In Operating Systems, ______ is a condition where two or more processes are unable to proceed because each is waiting for the other to release resources.',
          options: ['Deadlock', 'Fragmentation', 'Thrashing', 'Paging'],
          correctAnswer: 'Deadlock',
          explanation: 'Deadlock occurs when processes are blocked in a circular wait condition.',
          questionType: 'fill_blank',
          topic: 'Operating Systems',
        },
        {
          question: 'Which of the following is NOT one of Coffman\'s four deadlock conditions?',
          options: ['Mutual Exclusion', 'Hold and Wait', 'Dynamic Reallocation', 'Circular Wait'],
          correctAnswer: 'Dynamic Reallocation',
          explanation: 'The four conditions are Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait.',
          questionType: 'mcq',
          topic: 'Operating Systems',
        }
      ],
    });

    // 6. Seed Study Group
    const group = await StudyGroup.create({
      name: 'Full-Stack Developers 🚀',
      description: 'Discussing React, Node.js, MERN stack, database design, and mock technical interviews.',
      subject: 'Web Development',
      admin: demoUser._id,
      members: [demoUser._id, peerUser._id],
      groupCode: 'DEV2026',
    });

    await Message.create([
      {
        group: group._id,
        sender: peerUser._id,
        message: 'Welcome everyone to the Full-Stack study group! Feel free to ask questions about React hooks, async patterns, and MongoDB queries.',
      },
      {
        group: group._id,
        sender: demoUser._id,
        message: 'Excited to be here! Working through process management notes and interactive flashcards today.',
      }
    ]);

    // 7. Seed Peer Post
    const peerPost = await PeerPost.create({
      title: 'Can someone explain the difference between useEffect and useLayoutEffect in React?',
      question: 'I understand both are hooks for side effects, but when should I actually reach for useLayoutEffect instead of useEffect?',
      topic: 'React Hooks',
      subject: 'Web Development',
      author: demoUser._id,
      tags: ['react', 'hooks', 'frontend'],
      answers: [
        {
          author: peerUser._id,
          content: 'Great question! `useEffect` runs asynchronously AFTER the render is committed to the screen, so it doesn\'t block browser painting (ideal for API calls, timers, subscriptions).\n\n`useLayoutEffect` runs synchronously immediately after DOM mutations but BEFORE the browser paints. You should only use it when you need to read layout (e.g. element dimensions, scroll positions) and make DOM changes synchronously to prevent visual flickering.',
          helpfulVotes: [demoUser._id],
          loveVotes: [demoUser._id],
          isBestAnswer: true,
          createdAt: new Date(),
        }
      ],
    });

    console.log('✅ Sample data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error.message);
  }
};
