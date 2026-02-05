"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getRandomQuestions,
  getQuestionsByModule,
  shuffleArray,
  getModuleById,
} from "@/lib/questions";
import { Question, QuestionResult } from "@/lib/types";

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const moduleId = searchParams.get("module");
  const count = parseInt(searchParams.get("count") || "10");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    let qs: Question[];
    if (moduleId) {
      qs = shuffleArray(getQuestionsByModule(moduleId)).slice(0, count);
    } else {
      qs = getRandomQuestions(count);
    }
    setQuestions(qs);
  }, [moduleId, count]);

  const currentQuestion = questions[currentIndex];
  const module = moduleId ? getModuleById(moduleId) : null;

  const handleSubmit = useCallback(() => {
    if (!selectedAnswer || !currentQuestion) return;

    const isCorrect = currentQuestion.options.find(
      (o) => o.id === selectedAnswer
    )?.is_correct;

    setResults((prev) => [
      ...prev,
      {
        question: currentQuestion,
        selectedAnswer,
        isCorrect: isCorrect || false,
      },
    ]);
    setIsSubmitted(true);
  }, [selectedAnswer, currentQuestion]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      // Quiz complete - save results and navigate
      const correctCount = results.filter((r) => r.isCorrect).length +
        (currentQuestion?.options.find((o) => o.id === selectedAnswer)?.is_correct ? 1 : 0);

      const quizResults = {
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        percentage: Math.round((correctCount / questions.length) * 100),
        timeSpent: Math.round((Date.now() - startTime) / 1000),
        moduleId,
        questionResults: [
          ...results,
          {
            question: currentQuestion!,
            selectedAnswer: selectedAnswer!,
            isCorrect: currentQuestion?.options.find((o) => o.id === selectedAnswer)?.is_correct || false,
          },
        ],
      };

      localStorage.setItem("quizResults", JSON.stringify(quizResults));
      router.push("/quiz/results");
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsSubmitted(false);
    }
  }, [currentIndex, questions.length, results, currentQuestion, selectedAnswer, startTime, moduleId, router]);

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading questions...</div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const correctOption = currentQuestion.options.find((o) => o.is_correct);
  const correctCount = results.filter((r) => r.isCorrect).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Exit Quiz
          </button>
          <div className="text-slate-400">
            {module ? module.name : "Mixed Quiz"}
          </div>
          <div className="text-slate-400">
            Score: {correctCount}/{results.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 sm:p-8 mb-6">
          {/* Question Type & Difficulty */}
          <div className="flex gap-2 mb-4">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
              {currentQuestion.question_type.replace("_", " ")}
            </span>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
              {"★".repeat(currentQuestion.difficulty)}{"☆".repeat(3 - currentQuestion.difficulty)}
            </span>
          </div>

          {/* Question Stem */}
          <h2 className="text-xl text-white font-medium mb-6 leading-relaxed">
            {currentQuestion.stem}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              let optionStyle = "bg-slate-700/50 border-slate-600 hover:border-slate-500";

              if (isSubmitted) {
                if (option.is_correct) {
                  optionStyle = "bg-green-500/20 border-green-500 text-green-100";
                } else if (option.id === selectedAnswer && !option.is_correct) {
                  optionStyle = "bg-red-500/20 border-red-500 text-red-100";
                } else {
                  optionStyle = "bg-slate-700/30 border-slate-700 text-slate-500";
                }
              } else if (option.id === selectedAnswer) {
                optionStyle = "bg-blue-500/20 border-blue-500";
              }

              return (
                <button
                  key={option.id}
                  onClick={() => !isSubmitted && setSelectedAnswer(option.id)}
                  disabled={isSubmitted}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${optionStyle}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isSubmitted && option.is_correct
                        ? "bg-green-500 text-white"
                        : isSubmitted && option.id === selectedAnswer
                        ? "bg-red-500 text-white"
                        : option.id === selectedAnswer
                        ? "bg-blue-500 text-white"
                        : "bg-slate-600 text-slate-300"
                    }`}>
                      {option.id.toUpperCase()}
                    </span>
                    <span className="text-slate-200 pt-1">{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation (shown after submit) */}
        {isSubmitted && (
          <div className="space-y-4 mb-6 animate-fadeIn">
            {/* Result Banner */}
            <div className={`p-4 rounded-xl ${
              correctOption?.id === selectedAnswer
                ? "bg-green-500/20 border border-green-500/50"
                : "bg-red-500/20 border border-red-500/50"
            }`}>
              <div className="font-bold text-lg mb-1">
                {correctOption?.id === selectedAnswer ? (
                  <span className="text-green-400">✓ Correct!</span>
                ) : (
                  <span className="text-red-400">✗ Incorrect</span>
                )}
              </div>
              {correctOption?.id !== selectedAnswer && (
                <div className="text-slate-300">
                  Correct answer: <span className="font-medium">{correctOption?.id.toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Explanation */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <h3 className="font-bold text-white mb-2">Explanation</h3>
              <p className="text-slate-300 leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>

            {/* Clinical Pearl */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-l-4 border-amber-500 rounded-r-xl p-5">
              <h3 className="font-bold text-amber-400 mb-2">💡 Clinical Pearl</h3>
              <p className="text-slate-300 leading-relaxed">
                {currentQuestion.clinical_pearl}
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${
                selectedAnswer
                  ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed"
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white transition-all"
            >
              {currentIndex + 1 >= questions.length ? "See Results" : "Next Question →"}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
