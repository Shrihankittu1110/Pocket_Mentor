import dotenv from 'dotenv';
import { aggregateTopicPerformance } from './controllers/progressController.js';
import { analyzeWeakTopics } from './services/aiService.js';

dotenv.config();

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
}

async function runMutualExclusivityTests() {
  console.log('🧪 Starting Strong & Weak Topics Mutual Exclusivity Test Suite...\n');

  // --- UNIT TESTS FOR AGGREGATOR & LOGIC ---

  console.log('--- TEST 1: Topic with 80% accuracy ---');
  const resultsCase1 = [
    {
      userAnswers: [
        { topic: 'Deep Learning', isCorrect: true },
        { topic: 'Deep Learning', isCorrect: true },
        { topic: 'Deep Learning', isCorrect: true },
        { topic: 'Deep Learning', isCorrect: true },
        { topic: 'Deep Learning', isCorrect: false },
      ],
    },
  ];
  const agg1 = aggregateTopicPerformance(resultsCase1);
  assert(agg1.strongTopics.includes('Deep Learning'), 'Deep Learning (80%) should be in strongTopics');
  assert(!agg1.weakTopics.includes('Deep Learning'), 'Deep Learning (80%) MUST NOT be in weakTopics');
  assert(agg1.topics[0].accuracy === 80, 'Accuracy should be 80%');
  console.log('  ✅ TEST 1 PASSED: 80% accuracy topic is Strong ONLY.');

  console.log('\n--- TEST 2: Topic with 60% accuracy ---');
  const resultsCase2 = [
    {
      userAnswers: [
        { topic: 'Database Normalization', isCorrect: true },
        { topic: 'Database Normalization', isCorrect: true },
        { topic: 'Database Normalization', isCorrect: true },
        { topic: 'Database Normalization', isCorrect: false },
        { topic: 'Database Normalization', isCorrect: false },
      ],
    },
  ];
  const agg2 = aggregateTopicPerformance(resultsCase2);
  assert(!agg2.strongTopics.includes('Database Normalization'), 'Database Normalization (60%) MUST NOT be in strongTopics');
  assert(agg2.weakTopics.includes('Database Normalization'), 'Database Normalization (60%) should be in weakTopics');
  assert(agg2.topics[0].accuracy === 60, 'Accuracy should be 60%');
  console.log('  ✅ TEST 2 PASSED: 60% accuracy topic is Weak ONLY.');

  console.log('\n--- TEST 3: Topic with 75% accuracy (threshold) ---');
  const resultsCase3 = [
    {
      userAnswers: [
        { topic: 'Operating Systems', isCorrect: true },
        { topic: 'Operating Systems', isCorrect: true },
        { topic: 'Operating Systems', isCorrect: true },
        { topic: 'Operating Systems', isCorrect: false },
      ],
    },
  ];
  const agg3 = aggregateTopicPerformance(resultsCase3);
  assert(agg3.strongTopics.includes('Operating Systems'), 'Operating Systems (75%) should be in strongTopics');
  assert(!agg3.weakTopics.includes('Operating Systems'), 'Operating Systems (75%) MUST NOT be in weakTopics');
  assert(agg3.topics[0].accuracy === 75, 'Accuracy should be 75%');
  console.log('  ✅ TEST 3 PASSED: 75% threshold topic is Strong ONLY.');

  console.log('\n--- TEST 4: Topic with 90% accuracy (1 question missed out of 10) ---');
  const answersCase4 = Array.from({ length: 10 }, (_, i) => ({
    topic: 'Neural Networks',
    isCorrect: i < 9, // 9 correct, 1 incorrect
  }));
  const weakFromQuiz = analyzeWeakTopics(answersCase4);
  assert(!weakFromQuiz.includes('Neural Networks'), 'analyzeWeakTopics should NOT flag a 90% topic as weak for single quiz');
  const agg4 = aggregateTopicPerformance([{ userAnswers: answersCase4 }]);
  assert(agg4.strongTopics.includes('Neural Networks'), 'Neural Networks (90%) should be in strongTopics');
  assert(!agg4.weakTopics.includes('Neural Networks'), 'Neural Networks (90%) MUST NOT be in weakTopics');
  console.log('  ✅ TEST 4 PASSED: 90% accuracy with 1 missed question is Strong ONLY.');

  console.log('\n--- TEST 5: No quiz attempts ---');
  const agg5 = aggregateTopicPerformance([]);
  assert(agg5.strongTopics.length === 0, 'strongTopics should be empty for 0 attempts');
  assert(agg5.weakTopics.length === 0, 'weakTopics should be empty for 0 attempts');
  assert(agg5.topics.length === 0, 'topics should be empty for 0 attempts');
  console.log('  ✅ TEST 5 PASSED: Zero attempts produces empty lists.');

  console.log('\n--- TEST 6: Multiple attempts transition (Weak -> Strong on Improvement) ---');
  // Attempt 1: 6/10 (60%), Attempt 2: 7/10 (70%), Attempt 3: 8/10 (80%) -> Total: 21/30 = 70%
  const attempts123 = [
    { userAnswers: Array.from({ length: 10 }, (_, i) => ({ topic: 'Compilers', isCorrect: i < 6 })) },
    { userAnswers: Array.from({ length: 10 }, (_, i) => ({ topic: 'Compilers', isCorrect: i < 7 })) },
    { userAnswers: Array.from({ length: 10 }, (_, i) => ({ topic: 'Compilers', isCorrect: i < 8 })) },
  ];
  const agg6a = aggregateTopicPerformance(attempts123);
  assert(agg6a.topics[0].accuracy === 70, 'Compilers accuracy should be 70% (21/30)');
  assert(!agg6a.strongTopics.includes('Compilers'), 'Compilers (70%) MUST NOT be in strongTopics');
  assert(agg6a.weakTopics.includes('Compilers'), 'Compilers (70%) should be in weakTopics');
  console.log('  -> Initial 3 attempts: 70% overall -> Correctly in Weak ONLY.');

  // Student studies and does Attempt 4: 10/10 (100%) -> Total: 31/40 = 77.5% -> 78%
  const attemptsWith4 = [
    ...attempts123,
    { userAnswers: Array.from({ length: 10 }, () => ({ topic: 'Compilers', isCorrect: true })) },
  ];
  const agg6b = aggregateTopicPerformance(attemptsWith4);
  assert(agg6b.topics[0].accuracy === 78, 'Compilers accuracy should now be 78% (31/40)');
  assert(agg6b.strongTopics.includes('Compilers'), 'Compilers (78%) should now be in strongTopics');
  assert(!agg6b.weakTopics.includes('Compilers'), 'Compilers (78%) MUST NOT be in weakTopics');
  console.log('  ✅ TEST 6 PASSED: Performance improvement successfully transitioned topic from Weak ONLY to Strong ONLY.');

  console.log('\n--- TEST 7: Case-Insensitive and Whitespace Normalization ---');
  const resultsCase7 = [
    {
      userAnswers: [
        { topic: 'Deep Learning', isCorrect: true },
        { topic: '  deep learning  ', isCorrect: true },
        { topic: 'DEEP LEARNING', isCorrect: true },
        { topic: 'deep  learning', isCorrect: true },
      ],
    },
  ];
  const agg7 = aggregateTopicPerformance(resultsCase7);
  assert(agg7.topics.length === 1, `Expected 1 normalized topic, found ${agg7.topics.length}`);
  assert(agg7.strongTopics.length === 1, 'Expected exactly 1 strong topic entry');
  assert(agg7.weakTopics.length === 0, 'Expected 0 weak topics');
  console.log('  ✅ TEST 7 PASSED: Variations of "Deep Learning" merged into single topic without duplicates.');

  console.log('\n--- TEST 8: Strict Mutual Exclusivity Invariant Check ---');
  // Multi-topic mixed attempt
  const multiTopicResults = [
    {
      userAnswers: [
        { topic: 'Topic A', isCorrect: true },
        { topic: 'Topic A', isCorrect: true },
        { topic: 'Topic A', isCorrect: true },
        { topic: 'Topic A', isCorrect: true },
        { topic: 'Topic B', isCorrect: false },
        { topic: 'Topic B', isCorrect: false },
        { topic: 'Topic C', isCorrect: true },
        { topic: 'Topic C', isCorrect: true },
        { topic: 'Topic C', isCorrect: true },
        { topic: 'Topic C', isCorrect: false },
      ],
    },
  ];
  const agg8 = aggregateTopicPerformance(multiTopicResults);
  const strongSet = new Set(agg8.strongTopics.map(t => t.toLowerCase()));
  const weakSet = new Set(agg8.weakTopics.map(t => t.toLowerCase()));
  const intersection = [...strongSet].filter(x => weakSet.has(x));

  assert(intersection.length === 0, `Mutual Exclusivity Violation: ${intersection.join(', ')} found in both!`);
  console.log('  ✅ TEST 8 PASSED: strongTopics ∩ weakTopics is strictly empty set.');

  console.log('\n🎉 ALL 8 STRONG & WEAK TOPICS MUTUAL EXCLUSIVITY TESTS PASSED PERFECTLY!\n');
}

runMutualExclusivityTests().catch(err => {
  console.error(err);
  process.exit(1);
});
