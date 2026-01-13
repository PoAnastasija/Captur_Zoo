'use client';

import React, { useEffect, useState } from 'react';
import { Quiz, QuizQuestion } from '@/app/types/zoo';
import { useQuiz } from '@/lib/useQuiz';
import { Check, X, ChevronRight, RotateCcw } from 'lucide-react';

interface QuizPanelProps {
  quiz: Quiz;
  animalName: string;
  isOpen: boolean;
  onClose: () => void;
  onQuizComplete?: (score: number, maxScore: number, xpEarned: number) => void;
}

export const QuizPanel: React.FC<QuizPanelProps> = ({
  quiz,
  animalName,
  isOpen,
  onClose,
  onQuizComplete,
}) => {
  const {
    currentQuestionIndex,
    currentQuestion,
    selectedAnswers,
    showFeedback,
    quizCompleted,
    isLastQuestion,
    selectAnswer,
    nextQuestion,
    resetQuiz,
    completeQuiz,
    calculateScore,
  } = useQuiz({ quiz });

  const [finalScore, setFinalScore] = useState<{ score: number; maxScore: number } | null>(null);

  if (!isOpen) return null;

  const handleSelectAnswer = (answerId: string) => {
    if (showFeedback) return; // Prevent changing answer after selection
    selectAnswer(currentQuestion!.id, answerId);
  };

  const handleContinue = () => {
    if (isLastQuestion) {
      // Quiz completed
      const score = calculateScore();
      setFinalScore(score);
      completeQuiz(quiz.animalId || '', score.score, score.maxScore);
      if (onQuizComplete) {
        onQuizComplete(score.score, score.maxScore, quiz.xpReward);
      }
    } else {
      nextQuestion();
    }
  };

  const handleReset = () => {
    resetQuiz();
    setFinalScore(null);
  };

  const selectedAnswerId = currentQuestion ? selectedAnswers[currentQuestion.id] : null;
  const selectedAnswer = currentQuestion?.answers.find((a) => a.id === selectedAnswerId);
  const isAnswerCorrect = selectedAnswer?.isCorrect || false;

  if (finalScore) {
    // Final score screen
    const isPerfect = finalScore.score === finalScore.maxScore;
    const percentage = Math.round((finalScore.score / finalScore.maxScore) * 100);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in">
          <div className="text-center">
            {/* Score Circle */}
            <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
              <div className="text-4xl font-bold text-white">{percentage}%</div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Terminé !</h2>
            <p className="text-gray-600 mb-6">
              Score : {finalScore.score} sur {finalScore.maxScore}
            </p>

            {/* XP Reward */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Récompense XP</p>
              <p className="text-2xl font-bold text-amber-600">+{quiz.xpReward} XP</p>
            </div>

            {/* Feedback */}
            {isPerfect && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                <p className="text-green-700 font-semibold">🎉 Excellent Score !</p>
                <p className="text-sm text-green-600">Vous avez débloqué un badge spécial !</p>
              </div>
            )}

            {!isPerfect && percentage >= 75 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-blue-700 font-semibold">Très Bien !</p>
                <p className="text-sm text-blue-600">Vous maîtrisez bien ce sujet</p>
              </div>
            )}

            {percentage < 75 && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-amber-700 font-semibold">À Retenter</p>
                <p className="text-sm text-amber-600">Réessayez dans 24h pour améliorer votre score</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Recommencer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <p className="text-gray-600">Chargement du quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Quiz : {animalName}</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-sm font-semibold">
              {currentQuestionIndex + 1}/{quiz.questions.length}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Difficulty Badge */}
          <div className="mb-4">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                currentQuestion.difficulty === 'easy'
                  ? 'bg-green-100 text-green-700'
                  : currentQuestion.difficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {currentQuestion.difficulty === 'easy'
                ? '🟢 Facile'
                : currentQuestion.difficulty === 'medium'
                  ? '🟡 Moyen'
                  : '🔴 Difficile'}
            </span>
          </div>

          {/* Question */}
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{currentQuestion.question}</h3>

          {/* Answers */}
          <div className="space-y-3 mb-6">
            {currentQuestion.answers.map((answer) => {
              const isSelected = selectedAnswerId === answer.id;
              const isCorrect = answer.isCorrect;

              let bgClass = 'bg-white hover:bg-gray-50 border-2 border-gray-200';
              let textClass = 'text-gray-900';

              if (showFeedback && isSelected) {
                if (isCorrect) {
                  bgClass = 'bg-green-50 border-2 border-green-500';
                  textClass = 'text-gray-900';
                } else {
                  bgClass = 'bg-red-50 border-2 border-red-500';
                  textClass = 'text-gray-900';
                }
              } else if (showFeedback && isCorrect) {
                bgClass = 'bg-green-50 border-2 border-green-500';
              } else if (showFeedback) {
                bgClass = 'bg-white border-2 border-gray-200 opacity-60';
              }

              return (
                <button
                  key={answer.id}
                  onClick={() => handleSelectAnswer(answer.id)}
                  disabled={showFeedback}
                  className={`w-full p-4 rounded-lg text-left font-medium transition-all ${bgClass} ${textClass} ${
                    !showFeedback && 'cursor-pointer'
                  } ${showFeedback && 'cursor-default'}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        showFeedback && isSelected
                          ? isCorrect
                            ? 'bg-green-500 border-green-500'
                            : 'bg-red-500 border-red-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {showFeedback && isSelected && (
                        <span className="text-white text-sm">
                          {isCorrect ? <Check size={16} /> : <X size={16} />}
                        </span>
                      )}
                    </div>
                    <span>{answer.text}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback/Explanation */}
          {showFeedback && (
            <div
              className={`p-4 rounded-lg mb-6 border-2 ${
                isAnswerCorrect
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <p className={`font-semibold mb-2 ${isAnswerCorrect ? 'text-green-900' : 'text-red-900'}`}>
                {isAnswerCorrect ? '✓ Correct !' : '✗ Incorrect'}
              </p>
              <p className={`text-sm ${isAnswerCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Continue Button */}
          {showFeedback && (
            <button
              onClick={handleContinue}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isLastQuestion ? 'Voir Résultats' : 'Suivant'}
              {!isLastQuestion && <ChevronRight size={20} />}
            </button>
          )}

          {!showFeedback && (
            <button
              disabled
              className="w-full px-6 py-3 bg-gray-300 text-gray-600 rounded-lg font-semibold cursor-not-allowed"
            >
              Sélectionnez une réponse
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPanel;
