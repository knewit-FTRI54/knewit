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
  const firstCall = !!args.theme;

  const userContent =
    (firstCall ? `Theme: ${args.theme}\n` : `Use the stored theme.\n`) +
    `Player difficulty: ${args.difficulty}\n` +
    `Generate ${args.batchSize} questions.`;

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    functions: [generateQuizQuestionsFn],
    function_call: { name: 'generate_quiz_questions' },
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return JSON.parse(resp.choices[0].message.function_call!.arguments).questions;
}

// const topUpQuestions = async (
//   theme?: string,
//   cursor: 'easy' | 'medium' | 'hard'
// ): Promise<QuizResponse> => {
//   let prompt: string = '';

//   if (theme) {
//     prompt = `Generate a quiz about "${theme}" with exactly 5 questions:
//       - 1 introductory question about ${theme} at medium difficulty.
//       - 2 easy questions
//       - 2 hard questions

//       Return ONLY valid JSON in this exact format:
//       {
//         "questions": [
//           {
//             "id": "q1",
//             "question": "Question text here?",
//             "options": ["Option A", "Option B", "Option C", "Option D"],
//             "correctAnswer": "Option A",
//             "difficulty": "easy",
//             "explanation": "Brief explanation why this is correct"
//           }
//         ],
//         "theme": "${theme}",
//         "totalQuestions": 5
//       }

//       Make sure one of the 4 options is always the correct answer. Focus on interesting, engaging questions about ${theme}.`;
//   } else {
//     prompt = `Generate a quiz about "${theme}" with exactly 6 questions:
//       - 2 easy questions
//       - 2 medium questions
//       - 2 hard questions

//       Return ONLY valid JSON in this exact format:
//       {
//         "questions": [
//           {
//             "id": "q1",
//             "question": "Question text here?",
//             "options": ["Option A", "Option B", "Option C", "Option D"],
//             "correctAnswer": "Option A",
//             "difficulty": "easy",
//             "explanation": "Brief explanation why this is correct"
//           }
//         ],
//         "theme": "${theme}",
//         "totalQuestions": 6
//       }

//       Make sure one of the 4 options is always the correct answer. Focus on interesting, engaging questions about ${theme}.`;
//   }

//   const messages = [
//     {
//       role: 'system',
//       content: SYSTEM_PROMPT,
//     },
//     {
//       role: 'user',
//       content:
//         `Theme: ${theme}\n` +
//         `Player difficulty: ${cursor}\n` +
//         `Generate ${theme ? '5' : '6'} questions.`,
//     },
//   ];

//   const completion = await openai.chat.completions.create({
//     model: 'gpt-4o-mini',
//     messages,
//     functions: [generateQuizQuestionsFn],
//     function_call: { name: 'generate_quiz_questions' },
//     response_format: { type: 'json_object' },
//     temperature: 0.7,
//   });

//   const payload = JSON.parse(
//     completion.choices[0].message.function_call!.arguments
//   ) as { questions: QuizQuestion[] };

//   return payload.questions;

//   return quizData;
// };

// export const generateInitialQuiz: RequestHandler = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     res.setHeader('Content-Type', 'text/event-stream');
//     res.setHeader('Cache-Control', 'no-cache');
//     res.setHeader('Connection', 'keep-alive');
//     res.setHeader('Access-Control-Allow-Origin', '*');

//     const { prompt: theme } = req.body;

//     // Need the user question as well as the previous answers
//     const response = await topUpQuestions(theme);

//     const quizData = '';
//     res.locals.quizData = quizData;

//     // 1. Start generating
//     res.write(
//       `data: ${JSON.stringify({
//         type: 'status',
//         message: 'Generating question...',
//       })}\n\n`
//     );

//     // 2. Generate the quiz questions (+ answers)
//     res.write(
//       `data: ${JSON.stringify({
//         type: 'initialQuiz',
//         data: quizData,
//         question: quizData.question,
//       })}\n\n`
//     );

//     // 3. Streaming completed
//     res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);

//     res.end();
//   } catch (err: any) {
//     console.log('--- Error inside askController ------------');
//     console.error(err);

//     res.write(
//       `data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`
//     );
//     res.end();
//   }
// };

// export const queryOpenAI: RequestHandler = (req, res, next) => {
//   const userQuestion = req.body;
//   const USER_PROMPT = ``;

//   console.log('from openAI controllers', req.body);

//   next();
// };
