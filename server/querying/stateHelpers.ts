import { SessionState, Difficulty, QuizQuestion } from '../types/types.js';
import { generateQuestions } from './openai.controller.js';

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
  if (state.queue.length <= 2) {
    await topUp(state);
  }
  const question = state.queue.shift();
  if (question) {
    state.history.push(question);
  }
  return question;
}

/** Internal helper - never pass theme if it’s already on state */
async function topUp(state: SessionState) {
  const batchSize = 6; // always 6 on refill
  const fresh = await generateQuestions({
    // theme not passed -> generateQuestions knows this is a top-up
    batchSize,
    difficulty: state.difficulty,
  });
  state.queue.push(...fresh);
}
