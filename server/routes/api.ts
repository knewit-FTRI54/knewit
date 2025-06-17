import express from 'express';
import { queryOpenAI } from './../controllers/openaiControllers';

const router = express.Router();

router.post('/', queryOpenAI, (req, res) => {
  const userInput = req.body;
  res.send(userInput);
});

export default router;
