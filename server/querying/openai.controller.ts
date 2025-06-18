import { RequestHandler, Request, Response } from 'express';
import OpenAI from 'openai';
import { QuizQuestion, Difficulty } from '../types/types';
import { SYSTEM_PROMPT } from './quizMasterPrompt';
import { generateQuizQuestionsFn } from './functionSchema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** ROUGH RESPONSE SCHEMA:
 * {
    "questions": [
      {
        "question": "When did humans transition from hunter-gatherer to agriculture?",
        "difficulty": "medium",
        "correct_answer": "Around 10,000 years ago",
        "options": [
          "Around 10,000 years ago",
          "500 years ago",
          "2 million years ago",
          "During the Industrial Revolution"
        ]
      },
      {
        "question": ...,
        ...
      }
      ...
    ]
  }
 */

interface GenArgs {
  theme?: string; // absent means 'top-up' means batchSize = 6
  batchSize: number; // 5 or 6
  difficulty: Difficulty;
}

export async function generateQuestions(
  args: GenArgs
): Promise<QuizQuestion[]> {
  const firstCall = args.theme!;

  const userContent =
    (firstCall ? `Theme: ${args.theme}\n` : `Use the stored theme.\n`) +
    `Player difficulty: ${args.difficulty}\n` +
    `Generate ${args.batchSize} questions.`;

  console.log('⏳ Generating questions:', {
    firstCall,
    batchSize: args.batchSize,
    difficulty: args.difficulty,
  });

  /** ─────────────────────────────────────────────────────────────────────────────────────────────────────── *
   *    Query OpenAI                                                                                          *
   *    - Deifne a tools that we're going to be using (type: 'function')                                      *
   *    - https://platform.openai.com/docs/guides/function-calling?api-mode=responses                         *
   *    - https://medium.com/@alexanderekb/openai-api-responses-in-json-format-quickstart-guide-75342e50cbd6  *
   * ──────────────────────────────────────────────────────────────────────────────────────────────────────── */
  let resp;
  try {
    resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      tools: [
        {
          type: 'function',
          function: generateQuizQuestionsFn,
        },
      ],
      tool_choice: {
        type: 'function',
        function: { name: 'generate_quiz_questions' },
      },
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });
  } catch (err) {
    console.error('❌ OpenAI API error:', err);
    return [];
  }

  // Safely parse tool_call response; arguments is a JSON schema
  const rawArgs =
    resp.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;

  // console.log(rawArgs);
  let result: { questions?: QuizQuestion[] } = {};

  try {
    result = rawArgs ? JSON.parse(rawArgs) : {};
  } catch (parseErr) {
    console.error('❌ Failed to parse OpenAI arguments:', parseErr);
  }

  console.log('✅ OpenAI returned:', {
    questionCount: result.questions?.length,
  });

  return result.questions || [];
}

/**
 * rawArgs example output:
 *
 * {
      "questions": [
        {
          "question": "What is the chemical symbol for water?",
          "options": ["H2O", "O2H", "H2O2", "HO"],
          "correct_index": 0,
          "difficulty": "medium",
          "explanation": "The chemical symbol for water is H2O, indicating it consists of two hydrogen atoms and one oxygen atom."
        },
        {
          "question": "What planet is known as the Red Planet?",
          "options": ["Earth", "Venus", "Mars", "Jupiter"],
          "correct_index": 2,
          "difficulty": "easy",
          "explanation": "Mars is often referred to as the Red Planet due to its reddish appearance, which is caused by iron oxide (rust) on its surface."
        },
        {
          "question": "What gas do plants absorb from the atmosphere?",
          "options": ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
          "correct_index": 2,
          "difficulty": "easy",
          "explanation": "Plants absorb carbon dioxide from the atmosphere during photosynthesis, using it to produce oxygen and glucose."
        },
        {
          "question": "What is the powerhouse of the cell?",
          "options": ["Nucleus", "Ribosome", "Mitochondria", "Chloroplast"],
          "correct_index": 2,
          "difficulty": "medium",
          "explanation": "The mitochondria are known as the powerhouse of the cell because they produce ATP, the energy currency of the cell."
        },
        {
          "question": "What is the boiling point of water at sea level in degrees Celsius?",
          "options": ["90°C", "100°C", "85°C", "120°C"],
          "correct_index": 1,
          "difficulty": "easy",
          "explanation": "The boiling point of water at sea level is 100°C. This is a fundamental concept in thermodynamics."
        }
      ]
    }
 *
 */
