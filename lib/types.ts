export interface Option {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface Question {
  id: string;
  submodule: string;
  question_type: string;
  difficulty: number;
  stem: string;
  options: Option[];
  explanation: string;
  clinical_pearl: string;
  references: string[];
  tags: string[];
}

export interface Module {
  module: string;
  display_name: string;
  description: string;
  questions: Question[];
}

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  icon: string;
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  submitted: Record<string, boolean>;
  score: number;
  startTime: number;
  moduleId: string | null;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timeSpent: number;
  moduleId: string | null;
  questionResults: QuestionResult[];
}

export interface QuestionResult {
  question: Question;
  selectedAnswer: string;
  isCorrect: boolean;
}
