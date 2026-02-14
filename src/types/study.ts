// ---- Study Session (persisted to Supabase) ----

export type StudyContentType =
  | "pdf"
  | "notes"
  | "past_paper"
  | "summary"
  | "quiz"
  | "flashcards"
  | "study_plan"
  | "exam_analysis"
  | "revision";

export interface StudySessionRow {
  id: string;
  user_id: string;
  title: string;
  content_type: StudyContentType;
  result_data: Record<string, unknown> | null;
  duration_minutes: number;
  created_at: string;
}

/** Dashboard analytics shape returned by the server component */
export interface DashboardStats {
  studySessions: number;
  weeklyStudySessions: number;
  currentStreak: number;
  longestStreak: number;
}

/** Single data point for the weekly sessions chart */
export interface WeeklyChartPoint {
  day: string;
  sessions: number;
}

/** The JSON blob stored in the `result_data` column for summaries */
export interface SummaryResultData {
  summary: string;
  key_points: string[];
  topics: string[];
  original_content?: string;
}

// ---- Quiz ----
export interface QuizQuestionData {
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

export interface QuizResultData {
  questions: QuizQuestionData[];
}

// ---- Flashcards ----
export interface FlashcardData {
  question: string;
  answer: string;
}

export interface FlashcardsResultData {
  flashcards: FlashcardData[];
}

// ---- Study Plan ----
export interface StudyPlanTopicData {
  topic: string;
  priority: string;
  estimated_minutes: number;
  resources: string[];
}

export interface StudyPlanResultData {
  title: string;
  topics: StudyPlanTopicData[];
  estimated_hours: number;
}

// ---- Exam Analysis ----
export interface DetectedTopicData {
  topic: string;
  frequency: number;
  importance: string;
}

export interface ExamAnalysisResultData {
  detected_topics: DetectedTopicData[];
  frequency_map: Record<string, number>;
}

// ---- Revision ----
export interface RevisionSectionData {
  heading: string;
  key_facts: string[];
  tips: string;
}

export interface RevisionResultData {
  revision_title: string;
  sections: RevisionSectionData[];
}

// ---- Chat ----
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ---- API request / response shapes ----

export interface SummarizeRequest {
  content: string;
}

export interface SummarizeResponse {
  summary: string;
  key_points: string[];
  topics: string[];
  session_id?: string;
}

export interface ApiError {
  error: string;
}
