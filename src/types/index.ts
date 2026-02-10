// ---- User ----
export interface User {
  id: string;
  email: string;
  created_at: string;
}

// ---- Study Sessions ----
export interface StudySession {
  id: string;
  user_id: string;
  title: string;
  content_type: "pdf" | "notes" | "past_paper";
  created_at: string;
}

// ---- Uploads ----
export interface Upload {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  created_at: string;
}

// ---- Quiz ----
export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

export interface QuizHistory {
  id: string;
  user_id: string;
  session_id: string;
  score: number;
  created_at: string;
}

// ---- Exam Analysis ----
export interface ExamAnalysis {
  id: string;
  user_id: string;
  detected_topics: DetectedTopic[];
  frequency_map: Record<string, number>;
  created_at: string;
}

export interface DetectedTopic {
  topic: string;
  frequency: number;
  importance: "high" | "medium" | "low";
}

// ---- Flashcards ----
export interface Flashcard {
  id: string;
  user_id: string;
  session_id: string;
  question: string;
  answer: string;
  created_at: string;
}

// ---- Study Plan ----
export interface StudyPlan {
  title: string;
  topics: StudyPlanTopic[];
  estimated_hours: number;
}

export interface StudyPlanTopic {
  topic: string;
  priority: "high" | "medium" | "low";
  estimated_minutes: number;
  resources: string[];
}

// ---- AI Responses ----
export interface SummaryResponse {
  summary: string;
  key_points: string[];
  topics: string[];
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

export interface FlashcardResponse {
  flashcards: { question: string; answer: string }[];
}

// ---- Navigation ----
export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

// ---- Tool Card ----
export interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  gradient: string;
  glowColor: string;
}
