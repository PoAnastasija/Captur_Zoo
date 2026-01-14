import { useCallback, useState } from 'react';
import { Quiz } from '@/app/types/zoo';

const QUIZ_COMPLETION_STORAGE_KEY = 'captur_zoo_quiz_completion';
const QUIZ_SCORES_STORAGE_KEY = 'captur_zoo_quiz_scores';

interface QuizCompletion {
  [animalId: string]: boolean;
}

interface QuizScore {
  animalId: string;
  quizId: string;
  score: number;
  maxScore: number;
  xpEarned: number;
  perfectScore: boolean;
  timestamp: string;
}

export interface UseQuizOptions {
  quiz?: Quiz;
}

export const useQuiz = ({ quiz }: UseQuizOptions = {}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [scores, setScores] = useState<QuizScore[]>([]);

  // Load quiz completion state from localStorage
  const loadQuizCompletion = useCallback((animalId: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = window.localStorage.getItem(QUIZ_COMPLETION_STORAGE_KEY);
      if (stored) {
        const completion = JSON.parse(stored) as QuizCompletion;
        return completion[animalId] || false;
      }
    } catch (error) {
      console.warn('Failed to load quiz completion state', error);
    }
    return false;
  }, []);

  // Load quiz scores from localStorage
  const loadScores = useCallback((): QuizScore[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem(QUIZ_SCORES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as QuizScore[];
      }
    } catch (error) {
      console.warn('Failed to load quiz scores', error);
    }
    return [];
  }, []);

  // Check if quiz has been completed
  const isQuizCompleted = useCallback((animalId: string): boolean => {
    return loadQuizCompletion(animalId);
  }, [loadQuizCompletion]);

  // Mark quiz as completed and save score
  const completeQuiz = useCallback(
    (animalId: string, score: number, maxScore: number) => {
      if (typeof window === 'undefined') return;

      const xpReward = quiz?.xpReward || 50;
      const perfectScore = score === maxScore;

      try {
        // Mark as completed
        const completion = JSON.parse(window.localStorage.getItem(QUIZ_COMPLETION_STORAGE_KEY) || '{}') as QuizCompletion;
        completion[animalId] = true;
        window.localStorage.setItem(QUIZ_COMPLETION_STORAGE_KEY, JSON.stringify(completion));

        // Save score
        const allScores = loadScores();
        const newScore: QuizScore = {
          animalId,
          quizId: quiz?.id || animalId,
          score,
          maxScore,
          xpEarned: xpReward,
          perfectScore,
          timestamp: new Date().toISOString(),
        };
        allScores.push(newScore);
        window.localStorage.setItem(QUIZ_SCORES_STORAGE_KEY, JSON.stringify(allScores));
        setScores(allScores);
      } catch (error) {
        console.warn('Failed to save quiz completion', error);
      }
    },
    [quiz, loadScores]
  );

  // Get score for a specific animal
  const getQuizScore = useCallback(
    (animalId: string): QuizScore | undefined => {
      const allScores = loadScores();
      return allScores.find((s) => s.animalId === animalId);
    },
    [loadScores]
  );

  // Get total XP earned
  const getTotalXP = useCallback((): number => {
    const allScores = loadScores();
    return allScores.reduce((sum, score) => sum + score.xpEarned, 0);
  }, [loadScores]);

  // Select an answer for current question
  const selectAnswer = useCallback((questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
    setShowFeedback(true);
  }, []);

  // Move to next question
  const nextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => prev + 1);
    setShowFeedback(false);
  }, []);

  // Reset quiz
  const resetQuiz = useCallback(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowFeedback(false);
    setQuizCompleted(false);
  }, []);

  // Calculate final score
  const calculateScore = useCallback((): { score: number; maxScore: number } => {
    if (!quiz) return { score: 0, maxScore: 0 };

    let correctCount = 0;
    quiz.questions.forEach((question) => {
      const selectedAnswerId = selectedAnswers[question.id];
      if (!selectedAnswerId) return;

      const selectedAnswer = question.answers.find((a) => a.id === selectedAnswerId);
      if (selectedAnswer?.isCorrect) {
        correctCount++;
      }
    });

    return {
      score: correctCount,
      maxScore: quiz.questions.length,
    };
  }, [quiz, selectedAnswers]);

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const isLastQuestion = quiz && currentQuestionIndex === quiz.questions.length - 1;

  return {
    // State
    currentQuestionIndex,
    currentQuestion,
    selectedAnswers,
    showFeedback,
    quizCompleted,
    isLastQuestion,
    scores,

    // Methods
    selectAnswer,
    nextQuestion,
    resetQuiz,
    completeQuiz,
    isQuizCompleted,
    getQuizScore,
    getTotalXP,
    calculateScore,
    loadScores,

    // Loaders
    loadQuizCompletion,
  };
};
