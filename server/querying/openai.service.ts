import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { v4 as uuid } from 'uuid'; // to generate random numbers
import { initSession, nextQuestion, updateDifficulty } from './stateHelpers';
import { loadSession, saveSession } from './sessionStore';
import { QuizQuestion } from '../types/types';

const router = Router();

/* ──────────────────────────────────────────────────────────────── *
 *  POST /api/quiz/session                                          *
 *  body: { theme: "food" }                                         *
 * ──────────────────────────────────────────────────────────────── */
router.post(
  '/session',
  asyncHandler(async (req, res, next) => {
    const { theme } = req.body as { theme?: string };
    if (!theme) {
      res.status(400).json({ error: 'theme is required' });
      return;
    }

    const state = await initSession(theme);
    const sessionId = uuid();

    // Get first question and track it
    const firstQuestion = state.queue.shift() as QuizQuestion;
    state.history.push(firstQuestion);

    await saveSession(sessionId, state);

    res.json({
      sessionId,
      question: firstQuestion,
    });
  })
);

/* ──────────────────────────────────────────────────────────────── *
 *  GET /api/quiz/question?sessionId=...                            *
 * ──────────────────────────────────────────────────────────────── */
router.get(
  '/question',
  asyncHandler(async (req, res, next) => {
    const sessionId = req.query.sessionId as string;
    const state = await ensureSession(sessionId, res);

    const question = await nextQuestion(state);
    if (!question) {
      res.status(410).json({ error: 'session finished' });
      return;
    }

    await saveSession(sessionId, state);
    res.json({ question });
  })
);

/* ──────────────────────────────────────────────────────────────── *
 *  POST /api/quiz/answer                                           *
 *  body: { sessionId, answerIndex }                                *
 * ──────────────────────────────────────────────────────────────── */
router.post(
  '/answer',
  asyncHandler(async (req, res, next) => {
    const { sessionId, answerIndex } = req.body as {
      sessionId?: string;
      answerIndex?: number;
    };
    const state = await ensureSession(sessionId, res);
    if (typeof answerIndex !== 'number') {
      res.status(400).json({ error: 'answerIndex is required' });
      return;
    }

    // Last question asked is the one we just graded:
    const lastQ = state.history[state.history.length - 1] as QuizQuestion;
    if (!lastQ) {
      res.status(409).json({ error: 'no question to grade' });
      return;
    }

    const correct = answerIndex === lastQ.correct_index;
    updateDifficulty(state, correct);

    await saveSession(sessionId!, state);

    res.json({
      correct,
      explanation: lastQ.explanation,
      newDifficulty: state.difficulty,
    });
  })
);

/* ──────────────────────────────────────────────────────────────── *
 *  Helper – guard & load session                                   *
 * ──────────────────────────────────────────────────────────────── */
async function ensureSession(sessionId: string | undefined, res: any) {
  if (!sessionId) {
    res.status(400).json({ error: 'sessionId missing' });
    throw new Error();
  }
  const state = await loadSession(sessionId);
  if (!state) {
    res.status(404).json({ error: 'session not found' });
    throw new Error();
  }
  return state;
}

export default router;
