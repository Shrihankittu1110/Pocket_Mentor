import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini if API key is provided
let genAI = null;
const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.warn('Could not initialize GoogleGenerativeAI:', err.message);
  }
}

/**
 * Intelligent NLP Helper to extract sentences and keywords for fallback mode
 */
function cleanText(text) {
  return text.replace(/\r\n/g, '\n').replace(/\n+/g, ' ').trim();
}

function extractSentences(text) {
  return text
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 25 && s.length < 250);
}

function extractKeywords(text) {
  const words = text
    .replace(/[^\w\s]/gi, '')
    .split(/\s+/)
    .filter(w => w.length > 4)
    .map(w => w.toLowerCase());
  
  const counts = {};
  const stopwords = new Set([
    'which', 'there', 'their', 'about', 'would', 'these', 'other', 'could', 'after', 'first',
    'because', 'should', 'between', 'through', 'before', 'where', 'being', 'those', 'under',
    'system', 'software', 'learning', 'student', 'pocket', 'mentor'
  ]);

  for (const w of words) {
    if (!stopwords.has(w)) {
      counts[w] = (counts[w] || 0) + 1;
    }
  }

  return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 15);
}

/**
 * 1. AI Summary Generation
 */
export const generateSummary = async (content, topic = 'General') => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are Pocket Mentor, an expert AI tutor. Generate a comprehensive yet clear and engaging study summary for college students based on the following notes.
Topic: ${topic}
Notes:
"""
${content.slice(0, 12000)}
"""

Please provide a well-structured Markdown summary with:
- 📌 Overview & Core Concepts
- 🔑 Key Definitions & Takeaways
- 💡 Real-World Examples or Use Cases
- ⚠️ Common Pitfalls or Exam Tips`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.warn('Gemini API call failed, falling back to smart NLP engine:', error.message);
    }
  }

  // Smart Fallback Generation
  const sentences = extractSentences(content);
  const keywords = extractKeywords(content);
  const topSentences = sentences.slice(0, 6).join(' ');

  return `### 📌 Overview: ${topic}
${topSentences || content.slice(0, 400)}

### 🔑 Key Takeaways & Core Concepts
${keywords.slice(0, 5).map(kw => `- **${kw.charAt(0).toUpperCase() + kw.slice(1)}**: Crucial concept identified in the source notes.`).join('\n')}

### 💡 Highlights & Definitions
${sentences.slice(2, 6).map(s => `- ${s}`).join('\n') || '- Pay special attention to core architectural principles and practical implementation steps.'}

### ⚠️ Exam & Revision Tip
Review these foundational items before practicing the interactive flashcards and taking the quiz!`;
};

/**
 * 2. 60-Second Quick Revision Generator
 */
export const generateQuickRevision = async (content, topic = 'General') => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });
      const prompt = `You are Pocket Mentor. Generate a punchy, high-impact 60-Second Quick Revision guide for the topic "${topic}" based on these notes:
"""
${content.slice(0, 10000)}
"""

Respond in valid JSON matching this schema:
{
  "topic": "${topic}",
  "overview": "A 2-sentence crisp summary of the topic",
  "keyPoints": ["Bullet point 1", "Bullet point 2", "Bullet point 3", "Bullet point 4"],
  "examples": ["Example 1", "Example 2", "Example 3"],
  "durationSeconds": 60
}`;

      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (error) {
      console.warn('Gemini Quick Revision failed, using NLP fallback:', error.message);
    }
  }

  // Fallback 60s revision
  const sentences = extractSentences(content);
  const keywords = extractKeywords(content);

  return {
    topic: topic || 'Quick Revision',
    overview: sentences[0] || `${topic} is a key computing concept that coordinates underlying structures and resources efficiently.`,
    keyPoints: sentences.slice(1, 5).length >= 2 
      ? sentences.slice(1, 5) 
      : [
          `Key concept revolves around ${keywords[0] || 'efficiency'} and structured workflows.`,
          `Essential functions focus on resource coordination and error management.`,
          `Supports scalability, modularity, and high-performance throughput.`,
          `Fundamental for technical interviews and practical real-world design.`
        ],
    examples: keywords.slice(0, 3).map(k => `${k.charAt(0).toUpperCase() + k.slice(1)} implementation standard`),
    durationSeconds: 60,
  };
};

/**
 * 3. Flashcards Generator
 */
export const generateFlashcards = async (content, topic = 'General', count = 6) => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });
      const prompt = `You are Pocket Mentor. Create ${count} interactive flashcards from the notes below for topic "${topic}".
Format as a JSON array of objects with "question", "answer", "topic", and "difficulty" ("easy", "medium", or "hard").
Front (question) should be a concise question or concept inquiry.
Back (answer) should be a clear, informative answer suitable for quick recall.

Notes:
"""
${content.slice(0, 10000)}
"""

Return strictly a JSON array of objects:
[
  { "question": "...", "answer": "...", "topic": "${topic}", "difficulty": "medium" }
]`;

      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (error) {
      console.warn('Gemini Flashcard generation failed, using NLP fallback:', error.message);
    }
  }

  // NLP Fallback Flashcards
  const sentences = extractSentences(content);
  const keywords = extractKeywords(content);
  const cards = [];

  // Generate cards from sentences and keywords
  if (sentences.length > 0) {
    cards.push({
      question: `What is the primary role of ${topic}?`,
      answer: sentences[0] || `${topic} is essential for structuring operations and achieving reliable results.`,
      topic: topic,
      difficulty: 'easy',
    });
  }

  keywords.slice(0, count - 1).forEach((kw, idx) => {
    const matchingSentence = sentences.find(s => s.toLowerCase().includes(kw));
    cards.push({
      question: `How does "${kw}" relate to ${topic}?`,
      answer: matchingSentence || `In ${topic}, ${kw} plays a key role in ensuring accurate execution and system balance.`,
      topic: topic,
      difficulty: idx % 2 === 0 ? 'medium' : 'hard',
    });
  });

  while (cards.length < Math.min(count, 4)) {
    cards.push({
      question: `What is a critical takeaway when working with ${topic}?`,
      answer: `Ensuring proper resource allocation, handling boundary edge cases, and continuous testing.`,
      topic: topic,
      difficulty: 'easy',
    });
  }

  return cards.slice(0, count);
};

/**
 * 4. Quiz Generator
 */
export const generateQuiz = async (content, topic = 'General', count = 5) => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });
      const prompt = `You are Pocket Mentor. Generate an interactive quiz with ${count} questions based on these notes for topic "${topic}".
Include a mix of:
- Multiple Choice Questions (mcq) with 4 options
- True/False questions (true_false) with ["True", "False"] options
- Fill in the blank (fill_blank) with 4 options where 1 is correct

Schema:
{
  "title": "${topic} Mastery Quiz",
  "topic": "${topic}",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "Brief explanation of why this answer is correct",
      "questionType": "mcq",
      "topic": "${topic}"
    }
  ]
}

Notes:
"""
${content.slice(0, 10000)}
"""`;

      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());
      if (parsed && parsed.questions && parsed.questions.length > 0) {
        return parsed;
      }
    } catch (error) {
      console.warn('Gemini Quiz generation failed, using NLP fallback:', error.message);
    }
  }

  // Smart Fallback Quiz Generation
  const sentences = extractSentences(content);
  const keywords = extractKeywords(content);
  const title = `${topic} Mastery Quiz`;

  const questions = [
    {
      question: `What is the fundamental purpose of ${topic}?`,
      options: [
        sentences[0]?.slice(0, 90) || `To coordinate resources and streamline operations`,
        `To replace physical hardware with unmanaged threads`,
        `To prevent all network traffic from reaching the client`,
        `To act exclusively as a CSS styling framework`
      ],
      correctAnswer: sentences[0]?.slice(0, 90) || `To coordinate resources and streamline operations`,
      explanation: `According to the study material, ${topic} focuses on organizing fundamental processes and resources.`,
      questionType: 'mcq',
      topic: topic,
    },
    {
      question: `True or False: ${keywords[0] || topic} is considered a primary component in modern development and architecture.`,
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: `True. The provided notes emphasize that ${keywords[0] || topic} is integral to proper functioning.`,
      questionType: 'true_false',
      topic: topic,
    },
    {
      question: `Complete the statement: In ${topic}, ______ is essential for maintaining optimal performance and clarity.`,
      options: [
        keywords[1] ? keywords[1].charAt(0).toUpperCase() + keywords[1].slice(1) : 'Modularity',
        'Unsynchronized memory leaks',
        'Infinite blocking loops',
        'Deprecated protocols'
      ],
      correctAnswer: keywords[1] ? keywords[1].charAt(0).toUpperCase() + keywords[1].slice(1) : 'Modularity',
      explanation: `Proper design requires key concepts like ${keywords[1] || 'Modularity'} to ensure system reliability.`,
      questionType: 'fill_blank',
      topic: topic,
    },
    {
      question: `Which of the following is most strongly associated with ${topic}?`,
      options: [
        keywords[2] ? keywords[2].charAt(0).toUpperCase() + keywords[2].slice(2) : 'Resource Allocation',
        'Ignoring runtime exceptions',
        'Hardcoding credentials into source code',
        'Disabling caching and indices'
      ],
      correctAnswer: keywords[2] ? keywords[2].charAt(0).toUpperCase() + keywords[2].slice(2) : 'Resource Allocation',
      explanation: `${keywords[2] || 'Resource Allocation'} is a core mechanism discussed in the topic notes.`,
      questionType: 'mcq',
      topic: topic,
    },
    {
      question: `True or False: ${topic} workflows function best without error checking or validation.`,
      options: ['True', 'False'],
      correctAnswer: 'False',
      explanation: `False. Robust architecture requires thorough validation and error handling at every layer.`,
      questionType: 'true_false',
      topic: topic,
    }
  ];

  return {
    title,
    topic,
    questions: questions.slice(0, count),
  };
};

/**
 * 5. Analyze Weak Topics from Quiz Results
 */
export const analyzeWeakTopics = (userAnswers = []) => {
  const incorrectAnswers = userAnswers.filter(a => !a.isCorrect);
  const topicCounts = {};

  incorrectAnswers.forEach(a => {
    const t = a.topic || 'General';
    topicCounts[t] = (topicCounts[t] || 0) + 1;
  });

  return Object.keys(topicCounts).sort((a, b) => topicCounts[b] - topicCounts[a]);
};

/**
 * 6. Study Recommendations based on Weak Topics
 */
export const generateStudyRecommendations = (weakTopics = []) => {
  if (weakTopics.length === 0) {
    return [
      "Outstanding performance! You have mastered all topics covered in this quiz.",
      "Consider teaching peers in the Study Groups to solidify your knowledge and earn mentor points!"
    ];
  }

  return weakTopics.map(topic => 
    `Focus on reviewing "${topic}". Try generating a 60-second quick revision and interactive flashcard deck for this specific topic.`
  );
};
