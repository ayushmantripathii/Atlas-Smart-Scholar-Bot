import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { createSupabaseServerClient, getAuthUser } from "@/lib/supabase/server-client";

export const dynamic = "force-dynamic";

type QuizAttemptRow = {
  score: number | null;
  total_questions?: number | null;
  topic?: string | null;
  created_at: string;
};

type TypingRow = {
  wpm: number;
  accuracy: number;
  created_at: string;
};

type ResumeRow = {
  score: number | null;
  created_at: string;
};

type AdminFeedbackRow = {
  id: string;
  message: string;
  created_at: string;
};

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeQuizScore(rawScore: number, totalQuestions?: number | null): number {
  if (typeof totalQuestions === "number" && totalQuestions > 0 && rawScore <= totalQuestions) {
    return Number(((rawScore / totalQuestions) * 100).toFixed(2));
  }
  if (rawScore <= 1) {
    return Number((rawScore * 100).toFixed(2));
  }
  return Number(rawScore.toFixed(2));
}

function formatPointLabel(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(new Date(isoDate));
}

function formatPointLabelWithTime(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(isoDate));
}

function formatWeekLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

async function fetchQuizAttempts(userId: string): Promise<QuizAttemptRow[]> {
  const supabase = createSupabaseServerClient();

  const { data: attempts, error: attemptsError } = await supabase
    .from("quiz_attempts")
    .select("score, total_questions, topic, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (!attemptsError) {
    return (attempts ?? []) as QuizAttemptRow[];
  }

  const { data: history, error: historyError } = await supabase
    .from("quiz_history")
    .select("score, total_questions, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (!historyError) {
    return (history ?? []) as QuizAttemptRow[];
  }

  return [];
}

async function fetchTypingHistory(userId: string): Promise<TypingRow[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("typing_tests")
    .select("wpm, accuracy, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []) as TypingRow[];
}

async function fetchStudySessions(userId: string): Promise<Array<{ created_at: string }>> {
  const supabase = createSupabaseServerClient();
  const sinceIso = new Date(Date.now() - 56 * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("study_sessions")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

async function fetchResumeScores(userId: string): Promise<ResumeRow[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("resume_analysis")
    .select("score, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return [];
  return (data ?? []) as ResumeRow[];
}

async function fetchAdminFeedback(userId: string): Promise<AdminFeedbackRow[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("admin_feedback")
    .select("id, message, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as AdminFeedbackRow[];
}

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export default async function AnalyticsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard/analytics");
  }

  const [quizRows, typingRows, studySessions, resumeScores, adminFeedback] = await Promise.all([
    fetchQuizAttempts(user.id),
    fetchTypingHistory(user.id),
    fetchStudySessions(user.id),
    fetchResumeScores(user.id),
    fetchAdminFeedback(user.id),
  ]);

  const normalizedQuiz = quizRows
    .map((row) => ({
      score: normalizeQuizScore(row.score ?? 0, row.total_questions),
      topic: row.topic?.trim() || null,
      created_at: row.created_at,
    }))
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

  const typingTrend = typingRows.map((row) => ({
    date: new Date(row.created_at).toLocaleDateString("en-GB"),
    wpm: Number(row.wpm.toFixed(2)),
    accuracy: Number(row.accuracy.toFixed(2)),
    createdAt: row.created_at,
  }));

  const quizAttemptsForTopic = normalizedQuiz.map((row) => ({
    topic: row.topic?.trim() || "General",
    createdAt: row.created_at,
  }));

  const sameDayAttemptsCount = normalizedQuiz.reduce<Record<string, number>>((acc, row) => {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const quizTrend = normalizedQuiz.map((row) => {
    const dayKey = new Date(row.created_at).toISOString().slice(0, 10);
    const hasMultipleOnSameDay = (sameDayAttemptsCount[dayKey] ?? 0) > 1;

    return {
      date: hasMultipleOnSameDay
        ? formatPointLabelWithTime(row.created_at)
        : formatPointLabel(row.created_at),
      score: row.score,
      createdAt: row.created_at,
    };
  });

  const now = new Date();
  const weeklyActivity = Array.from({ length: 8 }, (_, index) => {
    const end = new Date(now.getTime() - (7 - index) * 7 * 86_400_000);
    const start = new Date(end.getTime() - 7 * 86_400_000);

    const sessionsInWeek = studySessions.filter((session) => {
      const createdAt = +new Date(session.created_at);
      return createdAt >= +start && createdAt < +end;
    }).length;

    return {
      week: formatWeekLabel(end),
      sessions: sessionsInWeek,
      weekEndAt: end.toISOString(),
    };
  });

  const quizScores = normalizedQuiz.map((item) => item.score);
  const wpmValues = typingRows.map((item) => item.wpm);
  const accuracyValues = typingRows.map((item) => item.accuracy);

  const overview = {
    avgQuizScore: Number(avg(quizScores).toFixed(2)),
    avgWpm: Number(avg(wpmValues).toFixed(2)),
    avgAccuracy: Number(avg(accuracyValues).toFixed(2)),
    latestAtsScore: resumeScores[0]?.score ?? null,
  };

  const latestQuizWindow = quizScores.slice(-5);
  const previousQuizWindow = quizScores.slice(-10, -5);
  const latestWpmWindow = wpmValues.slice(0, 5);
  const previousWpmWindow = wpmValues.slice(5, 10);

  const quizChange = percentChange(avg(latestQuizWindow), avg(previousQuizWindow));
  const wpmChange = percentChange(avg(latestWpmWindow), avg(previousWpmWindow));

  const bestQuiz = quizScores.length > 0 ? Math.max(...quizScores) : null;
  const bestWpm = wpmValues.length > 0 ? Math.max(...wpmValues) : null;

  const weakestArea = (() => {
    const candidates = [
      { area: "quiz performance", score: overview.avgQuizScore },
      { area: "typing speed", score: Math.min(100, overview.avgWpm) },
      { area: "typing accuracy", score: overview.avgAccuracy },
      { area: "resume ATS score", score: overview.latestAtsScore ?? 100 },
    ];

    return candidates.sort((a, b) => a.score - b.score)[0]?.area ?? "overall consistency";
  })();

  const quizRange =
    quizScores.length > 0
      ? Math.max(...quizScores) - Math.min(...quizScores)
      : 0;

  const insights: string[] = [];

  if (typeof wpmChange === "number") {
    insights.push(
      wpmChange >= 0
        ? `Your typing speed improved by ${wpmChange}% compared to the previous window.`
        : `Your typing speed dropped by ${Math.abs(wpmChange)}% recently. Short daily drills can recover momentum.`
    );
  }

  if (typeof quizChange === "number") {
    insights.push(
      quizChange >= 0
        ? `Quiz performance improved by ${quizChange}% in recent attempts.`
        : `Quiz performance is down by ${Math.abs(quizChange)}%. Revisit weak topics before the next attempt.`
    );
  }

  if (quizRange >= 25) {
    insights.push("Quiz performance is fluctuating. Create targeted revision blocks for topics with lower scores.");
  }

  if (bestQuiz !== null || bestWpm !== null) {
    insights.push(
      `Best performance so far: ${bestQuiz !== null ? `quiz score ${bestQuiz.toFixed(1)}%` : "no quiz data"}${
        bestWpm !== null ? ` and typing speed ${bestWpm.toFixed(1)} WPM` : ""
      }.`
    );
  }

  insights.push(`Weakest area currently: ${weakestArea}. Focus here first for the fastest improvement.`);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="mt-2 text-muted-foreground">
          Deep performance insights across quizzes, typing, study activity, and resume analysis.
        </p>
      </div>

      <AnalyticsDashboard
        overview={overview}
        quizTrend={quizTrend}
        quizAttemptsForTopic={quizAttemptsForTopic}
        typingTrend={typingTrend}
        weeklyActivity={weeklyActivity}
        insights={insights}
        adminFeedback={adminFeedback}
        aiFeedbackInput={{
          quizScore: overview.avgQuizScore,
          wpm: overview.avgWpm,
          accuracy: overview.avgAccuracy,
          recentActivity: weeklyActivity[weeklyActivity.length - 1]?.sessions ?? 0,
        }}
      />
    </div>
  );
}
