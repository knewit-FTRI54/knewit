export type ServerError = {
  log: string;
  status: number;
  message: { err: string };
};

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SessionState {
  theme: string;
  queue: QuizQuestion[];
  history: QuizQuestion[];
  difficulty: Difficulty;
  consecutiveWrong: number;
}

export interface QuizResponse {
  questions: QuizQuestion[];
  theme: string;
  totalQuestions: number;
}
