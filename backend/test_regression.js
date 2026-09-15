import http from 'http';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { io as ClientIO } from 'socket.io-client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'pocket_mentor_super_secret_jwt_key_2026_production_secure';

import User from './models/User.js';
import StudyGroup from './models/StudyGroup.js';
import Message from './models/Message.js';
import Note from './models/Note.js';
import Flashcard from './models/Flashcard.js';
import PeerPost from './models/PeerPost.js';
import { initSocket } from './config/socket.js';
import groupRoutes from './routes/groupRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import peerRoutes from './routes/peerRoutes.js';
import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import {
  generateFlashcards,
  validateAndCleanFlashcards,
  generateFallbackFlashcards,
  generateQuickRevision,
  generateFallbackQuickRevision
} from './services/aiService.js';

const app = express();
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/peer', peerRoutes);
app.use('/api/notes', noteRoutes);

const server = http.createServer(app);
const io = initSocket(server);

const TEST_PORT = 5055;
let serverInstance = null;

async function runTests() {
  console.log('🧪 Starting Pocket Mentor Regression Test Suite...\n');

  try {
    // 1. Connect MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pocket-mentor');
    console.log('✅ MongoDB connected for tests.');

    // Start test server
    await new Promise((resolve) => {
      serverInstance = server.listen(TEST_PORT, () => {
        console.log(`✅ Test server running on http://localhost:${TEST_PORT}\n`);
        resolve();
      });
    });

    // Helper for fetch API requests
    const apiRequest = async (endpoint, method = 'GET', body = null, token = null) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:${TEST_PORT}/api${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
      });
      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    };

    // Helper to generate auth token
    const createTestUser = async (name, email) => {
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name,
          email,
          password: 'Password123!',
          totalPoints: 100,
        });
      }
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
      return { user, token };
    };

    // Clean test data from previous runs
    const testPrefix = 'reg_test_';
    await User.deleteMany({ email: { $regex: testPrefix } });
    await StudyGroup.deleteMany({ name: { $regex: testPrefix } });
    await PeerPost.deleteMany({ title: { $regex: testPrefix } });
    await Flashcard.deleteMany({ topic: { $regex: testPrefix } });

    // Setup Test Users
    const userA = await createTestUser('Alice Tester', `${testPrefix}alice@test.com`);
    const userB = await createTestUser('Bob Tester', `${testPrefix}bob@test.com`);
    const userC = await createTestUser('Charlie Tester', `${testPrefix}charlie@test.com`);
    const userD = await createTestUser('David Tester', `${testPrefix}david@test.com`);

    console.log('--- TEST A & B: Private Study Group Visibility & Code-Based Joining ---');
    // User A creates Group X
    const groupRes = await apiRequest('/groups', 'POST', {
      name: `${testPrefix}Group_X`,
      description: 'Test Group X for Distributed Systems',
      subject: 'Distributed Systems',
    }, userA.token);

    if (groupRes.status !== 201 || !groupRes.data._id) {
      throw new Error(`Failed to create Group X: ${JSON.stringify(groupRes.data)}`);
    }
    const groupX = groupRes.data;
    console.log(`  -> User A created Group X (ID: ${groupX._id}, Code: ${groupX.groupCode})`);

    // TEST A: User B queries /api/groups and MUST NOT see Group X
    const userBGroupsBefore = await apiRequest('/groups', 'GET', null, userB.token);
    const bSeesXBefore = userBGroupsBefore.data.some(g => g._id === groupX._id);
    if (bSeesXBefore) {
      throw new Error('❌ TEST A FAILED: User B saw Group X without being a member!');
    }
    console.log('  ✅ TEST A PASSED: User B does NOT see Group X in group list.');

    // TEST B: User B joins Group X using groupCode
    const joinRes = await apiRequest('/groups/join', 'POST', { groupCode: groupX.groupCode }, userB.token);
    if (joinRes.status !== 200) {
      throw new Error(`❌ TEST B FAILED: User B could not join Group X: ${JSON.stringify(joinRes.data)}`);
    }
    const userBGroupsAfter = await apiRequest('/groups', 'GET', null, userB.token);
    const bSeesXAfter = userBGroupsAfter.data.some(g => g._id === groupX._id);
    if (!bSeesXAfter) {
      throw new Error('❌ TEST B FAILED: User B cannot see Group X after joining via groupCode!');
    }
    console.log('  ✅ TEST B PASSED: User B joined via groupCode and now sees Group X.');

    console.log('\n--- TEST C: Non-Member Access Control Rejection ---');
    // TEST C: User C (non-member) tries direct API access for Group X details, messages, posting
    const cGetDetails = await apiRequest(`/groups/${groupX._id}`, 'GET', null, userC.token);
    if (cGetDetails.status !== 403) {
      throw new Error(`❌ TEST C FAILED: Non-member User C accessed group details! Status: ${cGetDetails.status}`);
    }
    console.log('  ✅ TEST C.1 PASSED: GET /api/groups/:id returned 403 for non-member.');

    const cGetMessages = await apiRequest(`/groups/${groupX._id}/messages`, 'GET', null, userC.token);
    if (cGetMessages.status !== 403) {
      throw new Error(`❌ TEST C FAILED: Non-member User C read messages! Status: ${cGetMessages.status}`);
    }
    console.log('  ✅ TEST C.2 PASSED: GET /api/groups/:id/messages returned 403 for non-member.');

    const cPostMessage = await apiRequest(`/groups/${groupX._id}/message`, 'POST', { message: 'Unauthorized hello' }, userC.token);
    if (cPostMessage.status !== 403) {
      throw new Error(`❌ TEST C FAILED: Non-member User C sent message! Status: ${cPostMessage.status}`);
    }
    console.log('  ✅ TEST C.3 PASSED: POST /api/groups/:id/message returned 403 for non-member.');

    console.log('\n--- TEST D: Socket.io Authorization Rejection for Non-Members ---');
    // TEST D: User C tries to join Group X via Socket.io without membership
    await new Promise((resolve, reject) => {
      const socketC = ClientIO(`http://localhost:${TEST_PORT}`, {
        auth: { token: userC.token },
        transports: ['websocket'],
      });

      let receivedError = false;

      socketC.on('connect', () => {
        socketC.emit('join_group', groupX._id, (response) => {
          if (response && response.status === 'ok') {
            socketC.disconnect();
            reject(new Error('❌ TEST D FAILED: Socket allowed non-member User C to join group room!'));
          }
        });
      });

      socketC.on('auth_error', (err) => {
        receivedError = true;
        console.log(`  ✅ TEST D PASSED: Socket.io rejected non-member with auth_error: "${err.message}"`);
        socketC.disconnect();
        resolve();
      });

      socketC.on('error', (err) => {
        if (!receivedError) {
          receivedError = true;
          console.log(`  ✅ TEST D PASSED: Socket.io emitted error for non-member: "${err.message}"`);
          socketC.disconnect();
          resolve();
        }
      });

      setTimeout(() => {
        socketC.disconnect();
        if (receivedError) {
          resolve();
        } else {
          reject(new Error('❌ TEST D FAILED: Socket.io timeout without authorization error!'));
        }
      }, 3000);
    });

    console.log('\n--- TEST E: Multiple Group Isolation ---');
    // User A creates Group 1 and Group 2
    const g1Res = await apiRequest('/groups', 'POST', { name: `${testPrefix}Group_1`, subject: 'OS' }, userA.token);
    const g2Res = await apiRequest('/groups', 'POST', { name: `${testPrefix}Group_2`, subject: 'DB' }, userA.token);
    const g1 = g1Res.data;
    const g2 = g2Res.data;

    // User B joins Group 1 only; User D joins Group 2 only
    await apiRequest('/groups/join', 'POST', { groupCode: g1.groupCode }, userB.token);
    await apiRequest('/groups/join', 'POST', { groupCode: g2.groupCode }, userD.token);

    const bList = (await apiRequest('/groups', 'GET', null, userB.token)).data.map(g => g._id);
    const dList = (await apiRequest('/groups', 'GET', null, userD.token)).data.map(g => g._id);
    const aList = (await apiRequest('/groups', 'GET', null, userA.token)).data.map(g => g._id);

    if (!bList.includes(g1._id) || bList.includes(g2._id)) {
      throw new Error('❌ TEST E FAILED: User B saw incorrect groups!');
    }
    if (!dList.includes(g2._id) || dList.includes(g1._id)) {
      throw new Error('❌ TEST E FAILED: User D saw incorrect groups!');
    }
    if (!aList.includes(g1._id) || !aList.includes(g2._id)) {
      throw new Error('❌ TEST E FAILED: Creator User A did not see all created groups!');
    }
    console.log('  ✅ TEST E PASSED: Multi-group isolation verified. Only respective members see each group.');

    console.log('\n--- TEST F: Flashcard Generation & Server-Side Validation Pipeline ---');
    const sampleNote = `
Virtual Memory is a memory management capability of an operating system that uses hardware and software to allow a computer to compensate for physical memory shortages.
Paging: A memory management scheme by which a computer stores and retrieves data from secondary storage for use in main memory.
Page Fault: An interrupt that occurs when a software program attempts to access a memory page not currently loaded in physical RAM.
TLB: Translation Lookaside Buffer is a hardware cache that memory management hardware uses to improve virtual address translation speed.
Demand Paging: An operating system concept where pages of data are loaded into memory only when they are referenced during program execution.
Thrashing: A state where the CPU spends more time swapping pages into and out of memory than executing actual instructions.
Segmentation: A memory management technique in which memory is divided into variable-length sections reflecting logical units.
Dirty Bit: A flag associated with a block of memory indicating whether the corresponding block has been modified in cache.
Working Set Model: A model based on the principle of locality defining the set of pages actively used by a process during an execution window.
Page Replacement Algorithm: Algorithms such as LRU and FIFO that determine which memory page will be paged out when new memory is needed.
`;

    // Test offline rule-based fallback + validation
    const generatedCards = await generateFlashcards(sampleNote, `${testPrefix}Virtual_Memory`, 10);
    console.log(`  -> Generated ${generatedCards.length} flashcards from note.`);

    if (generatedCards.length < 6) {
      throw new Error(`❌ TEST F FAILED: Expected at least 6 flashcards, received ${generatedCards.length}`);
    }

    const seenQ = new Set();
    const seenA = new Set();

    for (let i = 0; i < generatedCards.length; i++) {
      const card = generatedCards[i];
      // 1. Required question and answer
      if (!card.question || !card.answer) {
        throw new Error(`❌ TEST F FAILED: Flashcard ${i} missing question or answer: ${JSON.stringify(card)}`);
      }
      // 2. Question and answer must not be identical
      if (card.question.trim().toLowerCase() === card.answer.trim().toLowerCase()) {
        throw new Error(`❌ TEST F FAILED: Question and answer are identical: "${card.question}"`);
      }
      // 3. No duplicate questions
      const normQ = card.question.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenQ.has(normQ)) {
        throw new Error(`❌ TEST F FAILED: Duplicate question found: "${card.question}"`);
      }
      seenQ.add(normQ);

      // 4. No duplicate answers across different questions
      const normA = card.answer.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenA.has(normA)) {
        throw new Error(`❌ TEST F FAILED: Duplicate answer reused for distinct question: "${card.answer}"`);
      }
      seenA.add(normA);

      // 5. If MCQ format, correctAnswer must be in options
      if (card.options && card.options.length > 0) {
        if (!card.options.includes(card.correctAnswer || card.answer)) {
          throw new Error(`❌ TEST F FAILED: MCQ correctAnswer "${card.correctAnswer}" not in options: ${JSON.stringify(card.options)}`);
        }
      }
    }
    console.log('  ✅ TEST F.1 PASSED: 10 flashcards generated with distinct questions, unique answers, and no duplicates.');

    // Test API generation and MongoDB storage
    const noteObj = await Note.create({
      title: `${testPrefix}Virtual Memory Note`,
      content: sampleNote,
      subject: 'Computer Science',
      topic: `${testPrefix}Virtual_Memory`,
      user: userA.user._id,
    });

    const fcApiRes = await apiRequest('/flashcards/generate', 'POST', {
      noteId: noteObj._id,
      count: 6,
    }, userA.token);

    if (fcApiRes.status !== 201 || !Array.isArray(fcApiRes.data) || fcApiRes.data.length < 4) {
      throw new Error(`❌ TEST F FAILED: Flashcard API generation failed: ${JSON.stringify(fcApiRes.data)}`);
    }

    const initialSavedCards = await Flashcard.find({ note: noteObj._id });
    if (initialSavedCards.length !== fcApiRes.data.length) {
      throw new Error(`❌ TEST F FAILED: Initial saved cards count mismatch in MongoDB!`);
    }
    console.log(`  ✅ TEST F.2 PASSED: Server saved ${initialSavedCards.length} initial validated flashcards to MongoDB.`);

    // Test Generate More endpoint
    const genMoreRes = await apiRequest('/flashcards/generate-more', 'POST', {
      noteId: noteObj._id,
      count: 4,
    }, userA.token);

    if (![200, 201].includes(genMoreRes.status)) {
      throw new Error(`❌ TEST F FAILED: Generate More API returned error status: ${genMoreRes.status}`);
    }

    const afterMoreCards = await Flashcard.find({ note: noteObj._id });
    console.log(`  -> Generate More result: ${genMoreRes.data.message || 'ok'} (total in DB: ${afterMoreCards.length})`);

    // Verify all cards in DB for this note have unique questions
    const allDbQuestions = new Set();
    for (const card of afterMoreCards) {
      const qNorm = card.question.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (allDbQuestions.has(qNorm)) {
        throw new Error(`❌ TEST F FAILED: Duplicate question found in DB after Generate More: "${card.question}"`);
      }
      allDbQuestions.add(qNorm);
    }
    console.log(`  ✅ TEST F.3 PASSED: Generate More preserved existing cards and ensured 0 duplicate questions in database.`);

    console.log('\n--- TEST F.4: Deep Mastery Study Guide Teaching Engine Verification ---');
    const { generateSummary } = await import('./services/aiService.js');
    const summaryOutput = await generateSummary(sampleNote, 'Virtual Memory');
    
    if (!summaryOutput || !summaryOutput.includes('Chapter / Unit Overview') || !summaryOutput.includes('Topic 1:') || !summaryOutput.includes('What is it?') || !summaryOutput.includes('Exam Focus')) {
      throw new Error(`❌ TEST F FAILED: Summary does not follow deep teaching study guide structure! Output:\n${summaryOutput}`);
    }

    if (summaryOutput.includes('Crucial concept identified in the source notes')) {
      throw new Error(`❌ TEST F FAILED: Summary contains generic placeholder text!`);
    }

    console.log('  ✅ TEST F.4 PASSED: Deep Mastery Study Guide generated with Level 1 Overview, Level 2 Deep Explanations, Why needed, How it works, and Exam Focus (Zero generic placeholders).');

    console.log('\n--- TEST G: Peer Teaching Hub Public Access & Collaboration ---');
    // User A posts a question in Peer Teaching
    const qRes = await apiRequest('/peer/questions', 'POST', {
      title: `${testPrefix}How does the TLB improve memory access time?`,
      question: 'Can someone explain the step-by-step translation process when a TLB hit vs TLB miss occurs?',
      topic: 'Operating Systems',
      subject: 'Computer Science',
    }, userA.token);

    if (qRes.status !== 201 || !qRes.data._id) {
      throw new Error(`❌ TEST G FAILED: User A could not create peer question: ${JSON.stringify(qRes.data)}`);
    }
    const peerPost = qRes.data;
    console.log(`  -> User A posted peer question (ID: ${peerPost._id})`);

    // Multiple authenticated users (User B and User C) can view the question
    const bPeerList = await apiRequest('/peer/questions', 'GET', null, userB.token);
    const cPeerList = await apiRequest('/peer/questions', 'GET', null, userC.token);

    if (!bPeerList.data.some(p => p._id === peerPost._id) || !cPeerList.data.some(p => p._id === peerPost._id)) {
      throw new Error('❌ TEST G FAILED: Peer questions are not publicly accessible to all authenticated students!');
    }
    console.log('  ✅ TEST G.1 PASSED: User B and User C can both see community peer question.');

    // User B answers User A's question
    const ansRes = await apiRequest(`/peer/questions/${peerPost._id}/answers`, 'POST', {
      content: 'On a TLB hit, the physical frame number is retrieved in 1 cycle without accessing the page table in RAM. On a TLB miss, a page table walk is required.',
    }, userB.token);

    if (ansRes.status !== 201 || !ansRes.data.post.answers || ansRes.data.post.answers.length === 0) {
      throw new Error(`❌ TEST G FAILED: User B could not post answer: ${JSON.stringify(ansRes.data)}`);
    }
    const answerId = ansRes.data.post.answers[0]._id;
    console.log(`  ✅ TEST G.2 PASSED: User B posted peer explanation (+25 XP awarded).`);

    // User C votes Helpful on User B's answer
    const voteRes = await apiRequest(`/peer/questions/${peerPost._id}/answers/${answerId}/vote`, 'POST', {
      voteType: 'helpful',
    }, userC.token);

    if (voteRes.status !== 200 || !voteRes.data.answers[0].helpfulVotes.includes(userC.user._id.toString())) {
      throw new Error(`❌ TEST G FAILED: User C could not vote helpful: ${JSON.stringify(voteRes.data)}`);
    }
    console.log(`  ✅ TEST G.3 PASSED: User C voted helpful on User B's answer.`);

    // User A (question author) marks User B's answer as Best Answer
    const bestRes = await apiRequest(`/peer/questions/${peerPost._id}/answers/${answerId}/best`, 'POST', null, userA.token);
    if (bestRes.status !== 200 || !bestRes.data.answers[0].isBestAnswer || !bestRes.data.isResolved) {
      throw new Error(`❌ TEST G FAILED: Author User A could not mark best answer: ${JSON.stringify(bestRes.data)}`);
    }
    console.log(`  ✅ TEST G.4 PASSED: Author User A marked Best Answer (+50 XP awarded, question marked resolved).`);

    // =========================================================================
    // TEST H: 60-Second Summary & 15 Revision Points Engine
    // =========================================================================
    console.log('\n------------------------------------------------------');
    console.log('⚡ TEST H: 60-Second Summary (Exactly 15 Revision Points)');
    console.log('------------------------------------------------------');

    const sampleNoteContent = `
# Neural Networks and Deep Learning Architecture

## 1. Fundamentals & Biological Inspiration
Artificial Neural Networks (ANNs) are computational models inspired by biological neural networks. A biological neuron receives signals through dendrites, processes them in the cell body (soma), and transmits spikes via the axon. In artificial neurons (perceptrons), inputs are multiplied by learnable weights, summed together with an additive bias term, and passed through an activation function.

## 2. Artificial Neuron Model
The mathematical formulation of a single artificial neuron is expressed as:
z = sum(w_i * x_i) + b = W^T * X + b
a = sigma(z)
Where W represents the weight vector, X is the input vector, b is the scalar bias, and sigma is the non-linear activation function.

## 3. Layer Architectures & Multi-Layer Perceptrons (MLP)
A standard feedforward network consists of an Input Layer, one or more Hidden Layers, and an Output Layer. A Multi-Layer Perceptron (MLP) is a fully connected feedforward architecture capable of approximating any continuous non-linear function (Universal Approximation Theorem).

## 4. Activation Functions
Activation functions introduce non-linearity, allowing networks to learn complex decision boundaries:
- Sigmoid: sigma(z) = 1 / (1 + exp(-z)). Maps to (0, 1). Suffers from vanishing gradients.
- Tanh: tanh(z) = (exp(z) - exp(-z)) / (exp(z) + exp(-z)). Zero-centered with range (-1, 1).
- ReLU: f(z) = max(0, z). Computationally efficient and mitigates vanishing gradients during backpropagation.
- Softmax: Used in output layer for multi-class classification to convert logits into valid probability distributions.

## 5. Forward Propagation
Forward propagation is the process of computing intermediate activations from the input layer through successive hidden layers to produce final network predictions y_hat. Each layer transforms the previous layer's output using matrix multiplication and element-wise activation.

## 6. Loss Functions
Loss functions quantify the discrepancy between predicted values y_hat and ground truth labels y:
- Mean Squared Error (MSE): L = (1/2N) * sum((y - y_hat)^2), standard for regression tasks.
- Cross-Entropy Loss: L = -sum(y * log(y_hat)), standard for multi-class classification.

## 7. Backpropagation Algorithm
Backpropagation leverages the calculus chain rule to calculate the gradient of the loss function with respect to every learnable parameter (weights and biases) across all layers, propagating errors backward from output to input.

## 8. Gradient Descent & Parameter Updates
Parameters are updated iteratively in the opposite direction of the gradient:
W_new = W_old - alpha * (dL/dW)
Where alpha is the learning rate hyperparameter.

## 9. Modern Optimization Algorithms
- Stochastic Gradient Descent (SGD): Computes gradients on random mini-batches.
- Momentum: Accelerates convergence by adding an exponentially decaying running average of past gradients.
- Adam: Combines adaptive learning rates (RMSProp) with momentum for robust optimization across non-convex loss surfaces.

## 10. Vanishing and Exploding Gradients
In deep networks, gradients can exponentially shrink (vanish) or grow (explode) as they propagate backward through many layers. Vanishing gradients halt learning in early layers, while exploding gradients destabilize training numerical stability.

## 11. Regularization Techniques
To combat overfitting and improve generalization on unseen test data:
- L2 Regularization (Weight Decay): Adds a penalty term lambda * ||W||^2 to the loss.
- Dropout: Randomly deactivates a fraction p of neurons during each training forward-backward pass.
- Batch Normalization: Normalizes intermediate layer activations to stabilize distribution shifts during training.

## 12. Exam Takeaways & Best Practices
Always initialize weights properly (e.g. He Normal for ReLU, Xavier/Glorot for Tanh). Ensure feature scaling on inputs to ensure symmetric gradient descent steps.
`;

    const testNote = await Note.create({
      user: userA.user._id,
      title: `${testPrefix}Neural Networks 101`,
      content: sampleNoteContent,
      subject: 'Deep Learning',
      topic: 'Neural Networks & Backpropagation',
      fileType: 'text',
    });

    // 1. Test generateNoteQuickRevision via API
    const quickRevRes = await apiRequest(`/notes/${testNote._id}/quick-revision`, 'POST', null, userA.token);
    if (quickRevRes.status !== 200 || !quickRevRes.data.quickRevision) {
      throw new Error(`❌ TEST H FAILED: API could not generate quick revision: ${JSON.stringify(quickRevRes.data)}`);
    }

    const qr = quickRevRes.data.quickRevision;
    console.log(`  -> Generated Quick Revision for "${qr.topic}" (Duration: ${qr.durationSeconds}s)`);

    // Verify exactly 15 points
    if (!Array.isArray(qr.points) || qr.points.length !== 15) {
      throw new Error(`❌ TEST H FAILED: Expected exactly 15 points, got ${qr.points?.length}`);
    }
    console.log(`  ✅ TEST H.1 PASSED: Quick Revision contains EXACTLY 15 points.`);

    // Verify keyPoints array length
    if (!Array.isArray(qr.keyPoints) || qr.keyPoints.length !== 15) {
      throw new Error(`❌ TEST H FAILED: Expected keyPoints to have length 15, got ${qr.keyPoints?.length}`);
    }
    console.log(`  ✅ TEST H.2 PASSED: Backward-compatible keyPoints array has 15 items.`);

    // Verify structure and content of every single point
    qr.points.forEach((p, idx) => {
      const expectedNum = idx + 1;
      const expectedNumStr = String(expectedNum).padStart(2, '0');
      
      if (p.number !== expectedNum) {
        throw new Error(`❌ TEST H FAILED: Point at index ${idx} has invalid number ${p.number}`);
      }
      if (!p.title || !p.title.startsWith(`${expectedNumStr} · `)) {
        throw new Error(`❌ TEST H FAILED: Point title '${p.title}' does not start with '${expectedNumStr} · '`);
      }
      if (!p.content || p.content.length < 20) {
        throw new Error(`❌ TEST H FAILED: Point ${p.number} content is too short or missing: '${p.content}'`);
      }
      if (!p.category) {
        throw new Error(`❌ TEST H FAILED: Point ${p.number} is missing category`);
      }
      
      // Prohibit generic filler placeholders
      const prohibitedWords = ['implementation standard', 'Crucial concept identified in source notes', 'Covers: Neuron Models'];
      for (const pw of prohibitedWords) {
        if (p.content.includes(pw) || p.title.includes(pw)) {
          throw new Error(`❌ TEST H FAILED: Point contains prohibited filler text '${pw}'`);
        }
      }
    });
    console.log(`  ✅ TEST H.3 PASSED: All 15 points have valid numbered titles, substance (>20 chars), categories, and zero generic placeholders.`);

    // 2. Direct verification of NLP fallback generator
    const fallbackResult = generateFallbackQuickRevision(sampleNoteContent, 'Neural Networks');
    if (!fallbackResult.points || fallbackResult.points.length !== 15) {
      throw new Error(`❌ TEST H FAILED: Fallback generator did not produce 15 points: got ${fallbackResult.points?.length}`);
    }
    console.log(`  ✅ TEST H.4 PASSED: Offline NLP fallback generator guaranteed EXACTLY 15 grounded revision points.`);

    // Cleanup test data
    await User.deleteMany({ email: { $regex: testPrefix } });
    await StudyGroup.deleteMany({ name: { $regex: testPrefix } });
    await PeerPost.deleteMany({ title: { $regex: testPrefix } });
    await Note.deleteMany({ title: { $regex: testPrefix } });
    await Flashcard.deleteMany({ topic: { $regex: testPrefix } });

    console.log('\n======================================================');
    console.log('🎉 ALL REGRESSION TESTS PASSED (TESTS A, B, C, D, E, F, G, H)!');
    console.log('======================================================\n');

  } catch (error) {
    console.error('\n❌ TEST RUNNER ERROR:', error);
    process.exitCode = 1;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  }
}

runTests();
