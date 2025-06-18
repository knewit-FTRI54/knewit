import { useState } from 'react';

interface Question {
  question: string;
  options: string[];
  correct_index: number;
  difficulty: string;
  explanation?: string;
}

function App() {
  const [sessionId, setSessionId] = useState<string>('');
  const [theme, setTheme] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');

  /** 1. Start the quiz -> call /api/quiz/session -> generate 5 questions */
  const startQuiz = async () => {
    if (!theme) return;
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/quiz/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });

      /**
       *    Data contains:
       *    - sessionId
       *    - question
       */

      const data = await response.json();

      setSessionId(data.sessionId);
      setCurrentQuestion(data.question);
      setFeedback('');
    } catch (error) {
      setFeedback('Error starting quiz');
    }
    setLoading(false);
  };

  /** 2. Everytime we submit an answer, call backend to update the difficulty based on whether the user's answer was correct or not. **/
  const submitAnswer = async (answerIndex: number) => {
    setLoading(true);

    /** 1. we get the right answer and update difficulty */
    try {
      const response = await fetch('http://localhost:4000/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answerIndex }),
      });
      const data = await response.json();
      setFeedback(
        `${data.correct ? 'Correct!' : 'Wrong!'} ${
          data.explanation
        } (Difficulty: ${data.newDifficulty})`
      );

      /** 2.  */
      setTimeout(async () => {
        const nextResponse = await fetch(
          `http://localhost:4000/api/quiz/question?sessionId=${sessionId}`
        );
        const nextData = await nextResponse.json();
        setCurrentQuestion(nextData.question);
        setFeedback('');
      }, 1000);
    } catch (error) {
      setFeedback('Error submitting answer');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Quiz Game</h1>

      {/* First question doesn't have a sessionId and thus no theme. 
          Hence prompt the user to give us their desired theme */}
      {!sessionId ? (
        <div>
          <input
            type='text'
            placeholder='Enter theme (e.g., food, history, science)'
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{ width: '300px', padding: '10px', marginRight: '10px' }}
          />

          {/* This is a simple signal to show user 
              we're generating the answer (in the backend) */}
          <button onClick={startQuiz} disabled={!theme || loading}>
            {loading ? 'Starting...' : 'Start Quiz'}
          </button>
        </div>
      ) : (
        <div>
          <p>
            <strong>Session ID:</strong> {sessionId}
          </p>

          {currentQuestion && (
            <div>
              <h3>{currentQuestion.question}</h3>
              <p>
                <em>Difficulty: {currentQuestion.difficulty}</em>
              </p>

              {/* 1/ Map over the current question, 
                  2/ Render each option 
                  3/ onClick pass index into the submit function handler */}
              {currentQuestion.options.map((option, index) => (
                <div key={index} style={{ margin: '10px 0' }}>
                  <button
                    onClick={() => submitAnswer(index)}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      textAlign: 'left',
                      backgroundColor: '#f0f0f0',
                      border: '1px solid #ccc',
                      cursor: 'pointer',
                      color: 'black',
                    }}
                  >
                    {index + 1}. {option}
                  </button>
                </div>
              ))}
            </div>
          )}

          {feedback && (
            <div
              style={{
                marginTop: '20px',
                padding: '15px',

                // If is correct -> green; if wrong -> red
                backgroundColor: feedback.includes('Correct')
                  ? '#d4edda'
                  : '#f8d7da',
                border:
                  '1px solid ' +
                  (feedback.includes('Correct') ? '#c3e6cb' : '#f5c6cb'),
                borderRadius: '5px',
                color: 'black',
              }}
            >
              {feedback}
            </div>
          )}

          {loading && <p>Loading...</p>}

          {/* Start from the beginning */}
          <button
            onClick={() => {
              setSessionId('');
              setCurrentQuestion(null);
              setTheme('');
              setFeedback('');
            }}
            style={{ marginTop: '20px' }}
          >
            Reset Quiz
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

/**
 * rawArgs example output:
 *
 * {
      "questions": [
        {
          "question": "What is the chemical symbol for water?",
          "options": ["H2O", "O2H", "H2O2", "HO"],
          "correct_index": 0,
          "difficulty": "medium",
          "explanation": "The chemical symbol for water is H2O, indicating it consists of two hydrogen atoms and one oxygen atom."
        },
        {
          "question": "What planet is known as the Red Planet?",
          "options": ["Earth", "Venus", "Mars", "Jupiter"],
          "correct_index": 2,
          "difficulty": "easy",
          "explanation": "Mars is often referred to as the Red Planet due to its reddish appearance, which is caused by iron oxide (rust) on its surface."
        },
        {
          "question": "What gas do plants absorb from the atmosphere?",
          "options": ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
          "correct_index": 2,
          "difficulty": "easy",
          "explanation": "Plants absorb carbon dioxide from the atmosphere during photosynthesis, using it to produce oxygen and glucose."
        },
        {
          "question": "What is the powerhouse of the cell?",
          "options": ["Nucleus", "Ribosome", "Mitochondria", "Chloroplast"],
          "correct_index": 2,
          "difficulty": "medium",
          "explanation": "The mitochondria are known as the powerhouse of the cell because they produce ATP, the energy currency of the cell."
        },
        {
          "question": "What is the boiling point of water at sea level in degrees Celsius?",
          "options": ["90°C", "100°C", "85°C", "120°C"],
          "correct_index": 1,
          "difficulty": "easy",
          "explanation": "The boiling point of water at sea level is 100°C. This is a fundamental concept in thermodynamics."
        }
      ]
    }
 *
 */
