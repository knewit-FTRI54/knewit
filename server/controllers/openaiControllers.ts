import { RequestHandler } from 'express';

export const queryOpenAI: RequestHandler = (req, res, next) => {
  console.log('from openAI controllers', req.body);
  next();
};
