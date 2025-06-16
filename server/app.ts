import express, { ErrorRequestHandler } from 'express';
import { ServerError } from './types/types.js';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors());

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
