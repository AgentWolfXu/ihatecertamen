// Admin API endpoint for importing certamen questions
// Supports JSON upload with validation and category checking

import { Router } from 'express';
import { getDb } from '../../../database/databases.js';
import { CATEGORIES, SUBCATEGORIES } from '../../../quizbowl/categories.js';

const router = Router();

// Validate certamen question structure
function validateCertamenQuestion(question, index) {
  const errors = [];
  
  // Required fields
  if (!question.question || typeof question.question !== 'string') {
    errors.push(`Question ${index}: Missing or invalid question text`);
  }
  
  if (!question.answer || typeof question.answer !== 'string') {
    errors.push(`Question ${index}: Missing or invalid answer`);
  }
  
  if (!question.category || typeof question.category !== 'string') {
    errors.push(`Question ${index}: Missing or invalid category`);
  } else if (!CATEGORIES.includes(question.category)) {
    errors.push(`Question ${index}: Invalid category "${question.category}". Must be one of: ${CATEGORIES.join(', ')}`);
  }
  
  if (!question.subcategory || typeof question.subcategory !== 'string') {
    errors.push(`Question ${index}: Missing or invalid subcategory`);
  } else if (!SUBCATEGORIES.includes(question.subcategory)) {
    errors.push(`Question ${index}: Invalid subcategory "${question.subcategory}". Must be one of: ${SUBCATEGORIES.join(', ')}`);
  }
  
  // Optional fields with validation
  if (question.difficulty !== undefined) {
    if (!Number.isInteger(question.difficulty) || question.difficulty < 1 || question.difficulty > 10) {
      errors.push(`Question ${index}: Difficulty must be an integer between 1 and 10`);
    }
  }
  
  if (question.metadata && typeof question.metadata !== 'object') {
    errors.push(`Question ${index}: Metadata must be an object`);
  }
  
  return errors;
}

// Check for duplicate questions
async function checkDuplicates(questions, db) {
  const duplicates = [];
  const tossups = db.collection('tossups');
  const bonuses = db.collection('bonuses');
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    
    // Check for exact question text matches
    const existingTossup = await tossups.findOne({ 
      question: question.question,
      category: question.category 
    });
    
    if (existingTossup) {
      duplicates.push({
        index: i,
        type: 'tossup',
        reason: 'Exact question text match',
        existingId: existingTossup._id
      });
    }
    
    // Check for similar answers (fuzzy matching could be added here)
    const existingAnswer = await tossups.findOne({ 
      answer: question.answer,
      category: question.category 
    });
    
    if (existingAnswer && existingAnswer._id.toString() !== (existingTossup?._id?.toString() || '')) {
      duplicates.push({
        index: i,
        type: 'tossup',
        reason: 'Similar answer in same category',
        existingId: existingAnswer._id
      });
    }
  }
  
  return duplicates;
}

// Import questions into database
async function importQuestions(questions, db) {
  const tossups = db.collection('tossups');
  const results = {
    imported: 0,
    failed: 0,
    errors: []
  };
  
  for (let i = 0; i < questions.length; i++) {
    try {
      const question = questions[i];
      
      // Create tossup document
      const tossupDoc = {
        _id: new Date().getTime().toString() + '_' + i, // Simple ID generation
        question: question.question,
        answer: question.answer,
        answer_sanitized: question.answer.replace(/<[^>]*>/g, ''), // Remove HTML tags
        category: question.category,
        subcategory: question.subcategory,
        difficulty: question.difficulty || 5,
        type: 'tossup',
        packet: question.packet || 'imported',
        set: question.set || 'imported',
        setName: question.setName || 'Imported Questions',
        packetNumber: question.packetNumber || 1,
        questionNumber: i + 1,
        updatedAt: new Date().toISOString(),
        setYear: question.setYear || new Date().getFullYear(),
        metadata: question.metadata || {}
      };
      
      await tossups.insertOne(tossupDoc);
      results.imported++;
      
    } catch (error) {
      results.failed++;
      results.errors.push(`Question ${i}: ${error.message}`);
    }
  }
  
  return results;
}

// POST /api/admin/import-questions
router.post('/', async (req, res) => {
  try {
    const { questions, options = {} } = req.body;
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        error: 'Invalid request: questions must be a non-empty array'
      });
    }
    
    const db = getDb();
    
    // Step 1: Validate all questions
    const validationErrors = [];
    questions.forEach((question, index) => {
      const errors = validateCertamenQuestion(question, index);
      validationErrors.push(...errors);
    });
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    // Step 2: Check for duplicates (if not skipping)
    if (!options.skipDuplicateCheck) {
      const duplicates = await checkDuplicates(questions, db);
      
      if (duplicates.length > 0 && !options.allowDuplicates) {
        return res.status(400).json({
          error: 'Duplicate questions found',
          duplicates: duplicates,
          message: 'Set allowDuplicates: true to proceed with duplicates'
        });
      }
    }
    
    // Step 3: Import questions
    const importResults = await importQuestions(questions, db);
    
    res.json({
      success: true,
      message: `Successfully imported ${importResults.imported} questions`,
      results: importResults,
      summary: {
        total: questions.length,
        imported: importResults.imported,
        failed: importResults.failed
      }
    });
    
  } catch (error) {
    console.error('Error importing questions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /api/admin/import-questions/schema
router.get('/schema', (req, res) => {
  res.json({
    schema: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['question', 'answer', 'category', 'subcategory'],
          properties: {
            question: {
              type: 'string',
              description: 'The question text'
            },
            answer: {
              type: 'string',
              description: 'The answer (HTML formatting allowed)'
            },
            category: {
              type: 'string',
              enum: CATEGORIES,
              description: 'The main category'
            },
            subcategory: {
              type: 'string',
              enum: SUBCATEGORIES,
              description: 'The subcategory'
            },
            difficulty: {
              type: 'integer',
              minimum: 1,
              maximum: 10,
              description: 'Question difficulty (1-10)'
            },
            packet: {
              type: 'string',
              description: 'Packet identifier'
            },
            set: {
              type: 'string',
              description: 'Set identifier'
            },
            setName: {
              type: 'string',
              description: 'Human-readable set name'
            },
            packetNumber: {
              type: 'integer',
              minimum: 1,
              description: 'Packet number within set'
            },
            setYear: {
              type: 'integer',
              description: 'Year the set was created'
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata'
            }
          }
        }
      },
      options: {
        type: 'object',
        properties: {
          skipDuplicateCheck: {
            type: 'boolean',
            description: 'Skip duplicate checking'
          },
          allowDuplicates: {
            type: 'boolean',
            description: 'Allow duplicate questions'
          }
        }
      }
    },
    categories: CATEGORIES,
    subcategories: SUBCATEGORIES,
    example: {
      questions: [
        {
          question: "This Roman emperor built the famous wall in Britain that bears his name.",
          answer: "Hadrian",
          category: "History",
          subcategory: "Roman History",
          difficulty: 7,
          packet: "sample_packet_1",
          set: "sample_set_1",
          setName: "Sample Certamen Questions",
          packetNumber: 1,
          setYear: 2024
        }
      ],
      options: {
        skipDuplicateCheck: false,
        allowDuplicates: false
      }
    }
  });
});

export default router;