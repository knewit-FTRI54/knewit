import { useState, useEffect } from 'react';
import './App.css';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';

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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('token'));
  const [showLogin, setShowLogin] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    document.body.className = isDarkMode ? '' : 'light';
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setSessionId('');
    setTheme('');
    setCurrentQuestion(null);
    setFeedback('');
  };

  const startQuiz = async () => {
    if (!theme) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/quiz/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ theme }),
      });
      const data = await response.json();
      setSessionId(data.sessionId);
      setCurrentQuestion(data.question);
      setFeedback('');
    } catch (error) {
      setFeedback('Error starting quiz');
    }
    setLoading(false);
  };

  const submitAnswer = async (answerIndex: number) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/quiz/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId, answerIndex }),
      });
      const data = await response.json();
      setFeedback(`${data.correct ? 'Correct!' : 'Wrong!'} ${data.explanation} (Difficulty: ${data.newDifficulty})`);
      setTimeout(async () => {
        const nextResponse = await fetch(`http://localhost:4000/api/quiz/question?sessionId=${sessionId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const nextData = await nextResponse.json();
        setCurrentQuestion(nextData.question);
        setFeedback('');
      }, 1000);
    } catch {
      setFeedback('Error submitting answer');
    }
    setLoading(false);
  };

  return (
    <div className={`quiz-container ${isDarkMode ? '' : 'light'}`}>
      {/* Top right logout */}
      {isAuthenticated && (
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <button className="logout-button" onClick={handleLogout}>Log out</button>
        </div>
      )}

      <button
        className={`theme-toggle ${isDarkMode ? '' : 'light'}`}
        onClick={toggleTheme}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      <h1 className='quiz-title'>Quiz Game</h1>

      {!isAuthenticated ? (
        <div className="auth-container">
          {showLogin ? (
            <LoginForm onLoginSuccess={() => setIsAuthenticated(true)} />
          ) : (
            <RegisterForm onRegisterSuccess={() => setIsAuthenticated(true)} />
          )}
          <p>
            {showLogin ? (
              <>Don't have an account? <button onClick={() => setShowLogin(false)}>Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => setShowLogin(true)}>Log in</button></>
            )}
          </p>
        </div>
      ) : (
        <>
          {!sessionId ? (
            <div className='theme-input-container'>
              <input
                className='theme-input'
                type='text'
                placeholder='Enter theme (e.g., food, history, science)'
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              />
              <button
                className='primary-button'
                onClick={startQuiz}
                disabled={!theme || loading}
              >
                {loading ? 'Starting...' : 'Start Quiz'}
              </button>
            </div>
          ) : (
            <div>
              <div className='session-info'><strong>Session ID:</strong> {sessionId}</div>
              {currentQuestion && (
                <div className='question-container'>
                  <h3 className='question-text'>{currentQuestion.question}</h3>
                  <span className={`difficulty-badge difficulty-${currentQuestion.difficulty}`}>
                    {currentQuestion.difficulty}
                  </span>
                  <div className='options-container'>
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        className='option-button'
                        onClick={() => submitAnswer(index)}
                        disabled={loading}
                      >
                        <span className='option-number'>{index + 1}</span>
                        <span>{option}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {feedback && (
                <div className={`feedback-container ${feedback.includes('Correct') ? 'feedback-correct' : 'feedback-incorrect'}`}>{feedback}</div>
              )}
              {loading && <p className='loading-text'>Loading...</p>}
              <button className='reset-button' onClick={() => {
                setSessionId('');
                setCurrentQuestion(null);
                setTheme('');
                setFeedback('');
              }}>Reset Quiz</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
