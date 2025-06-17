import { SessionState, Difficulty, QuizQuestion } from '../types/types';
import { generateQuestions } from './openai.controller';

/** Step 1: we call once, right after user chooses a theme */
export async function initSession(theme: string): Promise<SessionState> {
  const queue = await generateQuestions({
    theme,
    batchSize: 5,
    difficulty: 'easy',
  });
  return { theme, queue, history: [], difficulty: 'easy', consecutiveWrong: 0 };
}

/** Step 2: we call after every answer */
export function updateDifficulty(
  state: SessionState,
  answeredCorrectly: boolean
) {
  if (answeredCorrectly) {
    state.consecutiveWrong = 0;
    if (state.difficulty === 'easy') state.difficulty = 'medium';
    else if (state.difficulty === 'medium') state.difficulty = 'hard';
  } else {
    state.consecutiveWrong += 1;
    // tilt-prevention: three misses drop one level
    if (state.consecutiveWrong >= 3) {
      if (state.difficulty === 'hard') state.difficulty = 'medium';
      else if (state.difficulty === 'medium') state.difficulty = 'easy';
      state.consecutiveWrong = 0;
    }
  }
}

/** Step 3: we pull the next question, top-up transparently if needed */
export async function nextQuestion(
  state: SessionState
): Promise<QuizQuestion | undefined> {
  // Find a question of the current difficulty level
  let questionIndex = state.queue.findIndex(
    (q) => q.difficulty === state.difficulty
  );

  // If no question of current difficulty, try one level easier
  if (questionIndex === -1 && state.difficulty === 'hard') {
    questionIndex = state.queue.findIndex((q) => q.difficulty === 'medium');
  }
  if (
    questionIndex === -1 &&
    (state.difficulty === 'hard' || state.difficulty === 'medium')
  ) {
    questionIndex = state.queue.findIndex((q) => q.difficulty === 'easy');
  }

  // If still no question found, or running low on questions, top up
  if (questionIndex === -1 || state.queue.length <= 3) {
    await topUp(state);
    // Try again after top-up
    questionIndex = state.queue.findIndex(
      (q) => q.difficulty === state.difficulty
    );
    if (questionIndex === -1) {
      questionIndex = 0; // fallback to first available question
    }
  }

  if (questionIndex >= 0) {
    const question = state.queue.splice(questionIndex, 1)[0];
    state.history.push(question);
    return question;
  }

  return undefined;
}

/** Internal helper - never pass theme if it's already on state */
async function topUp(state: SessionState) {
  const batchSize = 6; // always 6 on refill

  // Generate questions adapted to current difficulty level
  // More questions around user's current level
  const fresh = await generateQuestions({
    // theme not passed -> generateQuestions knows this is a top-up
    batchSize,
    difficulty: state.difficulty,
  });
  state.queue.push(...fresh);
}
