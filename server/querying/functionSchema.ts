// Define the response schema once
export const generateQuizQuestionsFn = {
  name: 'generate_quiz_questions',
  description: 'Return 5-6 themed multiple-choice questions',
  parameters: {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        minItems: 5,
        maxItems: 6,
        items: {
          type: 'object',
          required: ['question', 'options', 'correct_index', 'difficulty'],
          properties: {
            question: { type: 'string' },
            options: {
              type: 'array',
              minItems: 4,
              maxItems: 4,
              items: { type: 'string' },
            },
            correct_index: { type: 'integer', minimum: 0, maximum: 3 },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          },
        },
      },
    },
  },
} as const;
