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
   *  Query OpenAI                                                                                            *
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
