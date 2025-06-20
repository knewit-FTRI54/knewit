import express, { ErrorRequestHandler } from 'express';
import { ServerError } from './types/types';
import cors from 'cors';
import apiRouter from './querying/openai.service';
import authRouter from './routes/auth.routes';
import dotenv from 'dotenv';
import connectDB from './src/config/db';

dotenv.config();
connectDB();

const app = express(); // ✅ move this to the top

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRouter); // ✅ now safe to use
app.use('/api/quiz', apiRouter);

app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

// Global error handler
const errorHandler: ErrorRequestHandler = (
  err: ServerError,
  _req,
  res,
  _next
) => {
  const defaultError: ServerError = {
    log: 'Express error handler caught unknown middleware error',
    status: 500,
    message: { err: 'An error occurred' },
  };
  const errorObj: ServerError = { ...defaultError, ...err };
  console.log(errorObj.log);
  res.status(errorObj.status).json(errorObj.message);
};

app.use(errorHandler);

export default app;
