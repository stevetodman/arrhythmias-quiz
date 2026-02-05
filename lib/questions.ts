import { Module, Question, ModuleInfo } from "./types";

import sinusData from "@/data/module-1-sinus.json";
import atrialData from "@/data/module-2-atrial.json";
import junctionalData from "@/data/module-3-junctional.json";
import ventricularData from "@/data/module-4-ventricular.json";
import channelopathiesData from "@/data/module-5-channelopathies.json";

const modules: Module[] = [
  sinusData as Module,
  atrialData as Module,
  junctionalData as Module,
  ventricularData as Module,
  channelopathiesData as Module,
];

const moduleIcons: Record<string, string> = {
  sinus: "heartbeat",
  atrial: "pulse",
  junctional: "nodal",
  ventricular: "lightning",
  channelopathies: "channel",
};

export function getModules(): ModuleInfo[] {
  return modules.map((m) => ({
    id: m.module,
    name: m.display_name,
    description: m.description,
    questionCount: m.questions.length,
    icon: moduleIcons[m.module] || "default",
  }));
}

export function getAllQuestions(): Question[] {
  return modules.flatMap((m) => m.questions);
}

export function getQuestionsByModule(moduleId: string): Question[] {
  const module = modules.find((m) => m.module === moduleId);
  return module ? module.questions : [];
}

export function getRandomQuestions(count: number = 20): Question[] {
  const allQuestions = getAllQuestions();
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getTotalQuestionCount(): number {
  return getAllQuestions().length;
}

export function getModuleById(moduleId: string): ModuleInfo | undefined {
  const moduleInfos = getModules();
  return moduleInfos.find((m) => m.id === moduleId);
}
