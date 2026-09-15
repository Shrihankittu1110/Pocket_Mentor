import { 
  parseDocumentStructure, 
  classifyTopicType, 
  generateSummary, 
  generateGroundedFallbackSummary,
  validateAndGroundTopicExplanation 
} from './services/aiService.js';

async function runGroundingTests() {
  console.log('🧪 Starting Deep Mastery Study Guide Source-Grounding & Dynamic Template Tests...\n');

  // Multi-domain document containing Database concepts and Machine Learning concepts
  const mixedDocument = `
# Chapter 1: Relational Database Normalization

## Insertion Anomaly
An insertion anomaly occurs when certain facts cannot be recorded at all without the addition of other unrelated facts.
In an unnormalized university database table containing Student and Department attributes, we cannot insert a new department 'MECH' with HOD 'Dr. Kumar' unless at least one student is currently enrolled in that department.
This occurs because the primary key of the unnormalized relation requires a valid student registration number.
To resolve insertion anomalies, relations must be decomposed into third normal form (3NF) or Boyce-Codd normal form (BCNF).

## Deletion Anomaly
A deletion anomaly is the unintended loss of data when deleting other data.
If the only student enrolled in the 'CIVIL' department withdraws and their record is deleted, all information regarding the existence of the CIVIL department and its head of department is permanently lost.

# Chapter 2: Deep Learning & Neural Networks

## Activation Functions
Activation functions determine whether a neuron should be activated or not by calculating the weighted sum of inputs and adding bias.
The purpose of the activation function is to introduce non-linearity into the output of a neuron, enabling neural networks to learn complex data representations.

## Rectified Linear Unit (ReLU)
ReLU is defined mathematically by the function:
f(x) = max(0, x)
where x is the input to the neuron, and f(x) outputs x if x is positive and 0 otherwise.
ReLU helps prevent the vanishing gradient problem during backpropagation and enables faster convergence.
`;

  // 1. Test Document Structure Parsing
  console.log('--- TEST 1: Document Structure & Topic Isolation ---');
  const structured = parseDocumentStructure(mixedDocument, 'Computer Science');
  console.log(`  -> Identified ${structured.topics.length} isolated topics.`);
  
  if (structured.topics.length < 4) {
    throw new Error(`❌ TEST 1 FAILED: Expected at least 4 topics, got ${structured.topics.length}`);
  }

  const topicNames = structured.topics.map(t => t.topic);
  console.log('  -> Topics found:', topicNames.join(', '));

  // Verify Insertion Anomaly topic contains Department example
  const insertionTopic = structured.topics.find(t => t.topic.includes('Insertion Anomaly'));
  if (!insertionTopic || !insertionTopic.rawText.includes('Dr. Kumar') || !insertionTopic.rawText.includes('MECH')) {
    throw new Error(`❌ TEST 1 FAILED: Insertion Anomaly topic missing its specific department example!`);
  }

  // Verify Activation Functions topic DOES NOT contain Department example
  const actTopic = structured.topics.find(t => t.topic.includes('Activation Functions'));
  if (!actTopic || actTopic.rawText.includes('Dr. Kumar') || actTopic.rawText.includes('MECH')) {
    throw new Error(`❌ TEST 1 FAILED: Topic contamination! Activation Functions contains Database Department example!`);
  }
  console.log('  ✅ TEST 1 PASSED: Strict topic boundaries and passages isolated correctly.');

  // 2. Test Topic Type Classification
  console.log('\n--- TEST 2: Topic Archetype Classification ---');
  const insertionType = classifyTopicType(insertionTopic.topic, insertionTopic.rawText);
  const reluTopic = structured.topics.find(t => t.topic.includes('ReLU'));
  const reluType = classifyTopicType(reluTopic.topic, reluTopic.rawText);
  const actType = classifyTopicType(actTopic.topic, actTopic.rawText);

  console.log(`  -> Insertion Anomaly classified as: ${insertionType}`);
  console.log(`  -> ReLU classified as: ${reluType}`);
  console.log(`  -> Activation Functions classified as: ${actType}`);

  if (insertionType !== 'Problem/Anomaly') {
    throw new Error(`❌ TEST 2 FAILED: Expected 'Problem/Anomaly' for Insertion Anomaly, got ${insertionType}`);
  }
  if (reluType !== 'Formula/Numerical') {
    throw new Error(`❌ TEST 2 FAILED: Expected 'Formula/Numerical' for ReLU, got ${reluType}`);
  }
  console.log('  ✅ TEST 2 PASSED: Topics classified accurately into distinct archetypes.');

  // 3. Test Grounded Fallback Generator
  console.log('\n--- TEST 3: Grounded NLP Generator Dynamic Output ---');
  const fallbackOutput = generateGroundedFallbackSummary(structured, 'Database & ML Systems');

  // Verify NO banned placeholder phrases
  const bannedList = [
    'Crucial concept identified in the source notes',
    'Conceptual mechanism documented in the notes',
    'Implementation standard',
    'Important concept from source',
  ];
  for (const banned of bannedList) {
    if (fallbackOutput.includes(banned)) {
      throw new Error(`❌ TEST 3 FAILED: Output contains banned placeholder: "${banned}"`);
    }
  }

  // Verify Insertion Anomaly has dynamic section structure (Why does it occur, Source Example)
  if (!fallbackOutput.includes('Why does it occur?') || !fallbackOutput.includes('Dr. Kumar')) {
    throw new Error(`❌ TEST 3 FAILED: Insertion Anomaly missing dynamic 'Why does it occur?' or source example in output!`);
  }

  // Verify Department example is NOT under Activation Functions
  const actSectionMatch = fallbackOutput.match(/## \d+\. Topic \d+: Activation Functions[\s\S]*?(?=\n---\n##|\s*$)/);
  if (actSectionMatch && (actSectionMatch[0].includes('Dr. Kumar') || actSectionMatch[0].includes('MECH'))) {
    throw new Error(`❌ TEST 3 FAILED: Cross-topic contamination! Database example leaked into Activation Functions section!`);
  }

  // Verify ReLU has Formula section
  const reluSectionMatch = fallbackOutput.match(/## \d+\. Topic \d+: Rectified Linear Unit[\s\S]*?(?=\n---\n##|\s*$)/);
  if (!reluSectionMatch || !reluSectionMatch[0].includes('Formula & Equation') || !reluSectionMatch[0].includes('max(0, x)')) {
    throw new Error(`❌ TEST 3 FAILED: ReLU section missing formula 'max(0, x)'!`);
  }

  console.log('  ✅ TEST 3 PASSED: NLP fallback generator generates dynamic, source-grounded sections with 0 cross-topic contamination and 0 placeholders.');

  // 4. Test generateSummary end-to-end
  console.log('\n--- TEST 4: Full generateSummary Pipeline Verification ---');
  const fullSummary = await generateSummary(mixedDocument, 'Computer Science Foundations');

  if (!fullSummary.includes('Chapter / Unit Overview') || !fullSummary.includes('Insertion Anomaly') || !fullSummary.includes('Activation Functions')) {
    throw new Error(`❌ TEST 4 FAILED: Full summary missing core chapters or topics!`);
  }

  console.log('  ✅ TEST 4 PASSED: generateSummary generated complete, structured study guide covering all topics.');

  console.log('\n🎉 ALL GROUNDING AND DYNAMIC TEMPLATE TESTS PASSED PERFECTLY!\n');
}

runGroundingTests().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
