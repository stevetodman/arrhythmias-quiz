"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getModules, getTotalQuestionCount } from "@/lib/questions";

const moduleEmojis: Record<string, string> = {
  sinus: "💓",
  atrial: "💗",
  junctional: "💜",
  ventricular: "❤️",
  channelopathies: "🧬",
};

const moduleColors: Record<string, string> = {
  sinus: "from-red-500/20 to-red-600/20 border-red-500/50 hover:border-red-400",
  atrial: "from-purple-500/20 to-purple-600/20 border-purple-500/50 hover:border-purple-400",
  junctional: "from-blue-500/20 to-blue-600/20 border-blue-500/50 hover:border-blue-400",
  ventricular: "from-orange-500/20 to-orange-600/20 border-orange-500/50 hover:border-orange-400",
  channelopathies: "from-teal-500/20 to-teal-600/20 border-teal-500/50 hover:border-teal-400",
};

export default function Home() {
  const router = useRouter();
  const modules = getModules();
  const totalQuestions = getTotalQuestionCount();
  const [questionCount, setQuestionCount] = useState(10);

  const startQuiz = (moduleId?: string) => {
    const params = new URLSearchParams();
    if (moduleId) params.set("module", moduleId);
    params.set("count", questionCount.toString());
    router.push(`/quiz?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Arrhythmia Quiz
              </span>
            </h1>
            <p className="text-xl text-slate-400 mb-2">
              Based on Park&apos;s Pediatric Cardiology, Chapter 24
            </p>
            <p className="text-slate-500 mb-8">
              Master cardiac arrhythmias with {totalQuestions} board-style questions
            </p>

            {/* Quick Stats */}
            <div className="flex justify-center gap-6 mb-12">
              <div className="bg-slate-800/50 rounded-xl px-6 py-4 border border-slate-700">
                <div className="text-3xl font-bold text-white">{totalQuestions}</div>
                <div className="text-sm text-slate-400">Questions</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl px-6 py-4 border border-slate-700">
                <div className="text-3xl font-bold text-white">5</div>
                <div className="text-sm text-slate-400">Modules</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl px-6 py-4 border border-slate-700">
                <div className="text-3xl font-bold text-white">3</div>
                <div className="text-sm text-slate-400">Difficulty Levels</div>
              </div>
            </div>

            {/* Question Count Selector */}
            <div className="inline-flex items-center gap-4 bg-slate-800/50 rounded-xl px-6 py-3 border border-slate-700 mb-8">
              <span className="text-slate-400">Questions per quiz:</span>
              <div className="flex gap-2">
                {[10, 20, 30, 64].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      questionCount === count
                        ? "bg-red-500 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {count === 64 ? "All" : count}
                  </button>
                ))}
              </div>
            </div>

            {/* Random Quiz Button */}
            <div className="mb-12">
              <button
                onClick={() => startQuiz()}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-red-500/25 transition-all hover:scale-105"
              >
                🎲 Start Random Quiz
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Or choose a module:
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => startQuiz(module.id)}
              className={`group relative bg-gradient-to-br ${moduleColors[module.id]} border rounded-xl p-6 text-left transition-all hover:scale-[1.02] hover:shadow-xl`}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{moduleEmojis[module.id]}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {module.name}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                    {module.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      {module.questionCount} questions
                    </span>
                    <span className="text-red-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Start →
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>Based on Park&apos;s Pediatric Cardiology, 7th Edition</p>
          <p className="mt-1">For educational purposes only</p>
        </div>
      </footer>
    </main>
  );
}
