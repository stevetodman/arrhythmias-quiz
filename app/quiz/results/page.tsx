"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuizResult } from "@/lib/types";
import { getModuleById } from "@/lib/questions";

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<QuizResult | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem("quizResults");
    if (stored) {
      setResults(JSON.parse(stored));
    }
  }, []);

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">No results found</div>
          <button
            onClick={() => router.push("/")}
            className="text-blue-400 hover:text-blue-300"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const module = results.moduleId ? getModuleById(results.moduleId) : null;
  const passed = results.percentage >= 70;
  const incorrectQuestions = results.questionResults.filter((r) => !r.isCorrect);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h1>
          {module && (
            <p className="text-slate-400">{module.name}</p>
          )}
        </div>

        {/* Score Card */}
        <div className={`rounded-2xl p-8 mb-8 ${
          passed
            ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30"
            : "bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30"
        }`}>
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${
              passed ? "text-green-400" : "text-red-400"
            }`}>
              {results.percentage}%
            </div>
            <div className="text-xl text-white mb-4">
              {results.correctAnswers} / {results.totalQuestions} correct
            </div>
            <div className={`inline-block px-4 py-2 rounded-full font-bold ${
              passed
                ? "bg-green-500/30 text-green-300"
                : "bg-red-500/30 text-red-300"
            }`}>
              {passed ? "🎉 Passed!" : "Keep practicing!"}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {results.correctAnswers}
            </div>
            <div className="text-sm text-slate-400">Correct</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">
              {results.totalQuestions - results.correctAnswers}
            </div>
            <div className="text-sm text-slate-400">Incorrect</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {formatTime(results.timeSpent)}
            </div>
            <div className="text-sm text-slate-400">Time</div>
          </div>
        </div>

        {/* Review Incorrect Questions */}
        {incorrectQuestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              Review Incorrect Answers ({incorrectQuestions.length})
            </h2>
            <div className="space-y-3">
              {incorrectQuestions.map((result, index) => {
                const isExpanded = expandedQuestions.has(index);
                const correctOption = result.question.options.find((o) => o.is_correct);

                return (
                  <div
                    key={index}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleQuestion(index)}
                      className="w-full p-4 text-left flex items-start gap-3"
                    >
                      <span className="text-red-400 mt-1">✗</span>
                      <div className="flex-1">
                        <p className="text-white line-clamp-2">
                          {result.question.stem}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          Your answer: {result.selectedAnswer.toUpperCase()} |
                          Correct: {correctOption?.id.toUpperCase()}
                        </p>
                      </div>
                      <span className={`text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-700">
                        <div className="pt-4 space-y-3">
                          {/* Options */}
                          <div className="space-y-2">
                            {result.question.options.map((opt) => (
                              <div
                                key={opt.id}
                                className={`p-3 rounded-lg text-sm ${
                                  opt.is_correct
                                    ? "bg-green-500/20 border border-green-500/50 text-green-100"
                                    : opt.id === result.selectedAnswer
                                    ? "bg-red-500/20 border border-red-500/50 text-red-100"
                                    : "bg-slate-700/50 text-slate-400"
                                }`}
                              >
                                <span className="font-bold">{opt.id.toUpperCase()})</span> {opt.text}
                              </div>
                            ))}
                          </div>

                          {/* Explanation */}
                          <div className="bg-slate-700/50 rounded-lg p-4">
                            <h4 className="font-bold text-white text-sm mb-2">Explanation</h4>
                            <p className="text-slate-300 text-sm">
                              {result.question.explanation}
                            </p>
                          </div>

                          {/* Clinical Pearl */}
                          <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg p-4">
                            <h4 className="font-bold text-amber-400 text-sm mb-1">💡 Clinical Pearl</h4>
                            <p className="text-slate-300 text-sm">
                              {result.question.clinical_pearl}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Performance Tips */}
        {!passed && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-blue-400 mb-3">💪 Tips for Improvement</h3>
            <ul className="text-slate-300 space-y-2 text-sm">
              <li>• Review the clinical pearls for each missed question</li>
              <li>• Focus on understanding the mechanisms, not just memorizing</li>
              <li>• Practice recognizing ECG patterns for different arrhythmias</li>
              <li>• Consider retaking this module before moving to the next</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl font-bold bg-slate-700 hover:bg-slate-600 text-white transition-all"
          >
            ← Back to Modules
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("quizResults");
              const params = new URLSearchParams();
              if (results.moduleId) params.set("module", results.moduleId);
              params.set("count", results.totalQuestions.toString());
              router.push(`/quiz?${params.toString()}`);
            }}
            className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white transition-all"
          >
            Try Again 🔄
          </button>
        </div>
      </div>
    </main>
  );
}
