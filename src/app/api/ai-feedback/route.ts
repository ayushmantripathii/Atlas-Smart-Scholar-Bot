import { NextRequest, NextResponse } from "next/server";
import { groqCompletion } from "@/lib/groq";
import { createSupabaseServerClient, getAuthUser } from "@/lib/supabase/server-client";

export const runtime = "nodejs";

interface AiFeedbackBody {
  quizScore?: number;
  wpm?: number;
  accuracy?: number;
  recentActivity?: number;
}

type TrendDirection = "improving" | "declining" | "stable" | "insufficient_data";

function toValidNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

async function fetchAverageQuizScore(userId: string): Promise<number | null> {
  const supabase = createSupabaseServerClient();
  const tableCandidates = ["quiz_attempts", "quiz_history"] as const;

  for (const table of tableCandidates) {
    const { data, error } = await supabase
      .from(table)
      .select("score")
      .eq("user_id", userId)
      .limit(100);

    if (!error && data && data.length > 0) {
      const average = data.reduce((sum, row) => sum + (row.score ?? 0), 0) / data.length;
      return Number(average.toFixed(2));
    }
  }

  return null;
}

async function fetchRecentQuizScores(userId: string): Promise<number[]> {
  const supabase = createSupabaseServerClient();
  const tableCandidates = ["quiz_attempts", "quiz_history"] as const;

  for (const table of tableCandidates) {
    const { data, error } = await supabase
      .from(table)
      .select("score, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data && data.length > 0) {
      return data
        .slice()
        .reverse()
        .map((item) => Number((item.score ?? 0).toFixed(2)));
    }
  }

  return [];
}

async function fetchLatestTypingMetrics(userId: string): Promise<{ wpm: number; accuracy: number } | null> {
  const supabase = createSupabaseServerClient();
  const tableCandidates = ["typing_tests", "typing_test_results"] as const;

  for (const table of tableCandidates) {
    const { data, error } = await supabase
      .from(table)
      .select("wpm, accuracy")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        wpm: Number((data.wpm ?? 0).toFixed(2)),
        accuracy: Number((data.accuracy ?? 0).toFixed(2)),
      };
    }
  }

  return null;
}

async function fetchTypingTrendSeries(userId: string): Promise<{ wpmSeries: number[]; accuracySeries: number[] }> {
  const supabase = createSupabaseServerClient();
  const tableCandidates = ["typing_tests", "typing_test_results"] as const;

  for (const table of tableCandidates) {
    const { data, error } = await supabase
      .from(table)
      .select("wpm, accuracy, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data && data.length > 0) {
      const normalized = data.slice().reverse();
      return {
        wpmSeries: normalized.map((row) => Number((row.wpm ?? 0).toFixed(2))),
        accuracySeries: normalized.map((row) => Number((row.accuracy ?? 0).toFixed(2))),
      };
    }
  }

  return { wpmSeries: [], accuracySeries: [] };
}

async function fetchRecentActivity(userId: string): Promise<number | null> {
  const supabase = createSupabaseServerClient();
  const weekAgoIso = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const { count, error } = await supabase
    .from("study_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", weekAgoIso);

  if (error) return null;
  return count ?? 0;
}

function computeTrend(series: number[], threshold: number): TrendDirection {
  if (series.length < 3) return "insufficient_data";

  const half = Math.floor(series.length / 2);
  const firstWindow = series.slice(0, half);
  const secondWindow = series.slice(half);

  if (firstWindow.length === 0 || secondWindow.length === 0) {
    return "insufficient_data";
  }

  const firstAvg = firstWindow.reduce((sum, value) => sum + value, 0) / firstWindow.length;
  const secondAvg = secondWindow.reduce((sum, value) => sum + value, 0) / secondWindow.length;
  const delta = secondAvg - firstAvg;

  if (delta >= threshold) return "improving";
  if (delta <= -threshold) return "declining";
  return "stable";
}

function formatTrendLabel(trend: TrendDirection): string {
  if (trend === "insufficient_data") return "insufficient data";
  return trend;
}

function generateRuleBasedFeedback(metrics: {
  quizScore: number;
  wpm: number;
  accuracy: number;
  recentActivity: number;
  quizTrend: TrendDirection;
  wpmTrend: TrendDirection;
  accuracyTrend: TrendDirection;
}): string {
  const lines: string[] = [];

  if (metrics.quizScore < 50) {
    lines.push("Focus more on understanding core concepts before attempting harder questions.");
  } else if (metrics.quizScore < 75) {
    lines.push("You are progressing well on quizzes. Aim for stronger consistency on medium-to-hard questions.");
  } else {
    lines.push("Great job on quizzes. Your current understanding is strong.");
  }

  if (metrics.wpm < 30 && metrics.accuracy < 80) {
    lines.push("Practice typing daily for 10-15 minutes and prioritize clean, accurate keystrokes first.");
  } else if (metrics.wpm < 30) {
    lines.push("Typing accuracy is improving. Add short daily drills to boost your speed.");
  } else if (metrics.accuracy < 80) {
    lines.push("Your speed is good. Improve accuracy by slowing down slightly and focusing on precision.");
  } else {
    lines.push("Your typing metrics are balanced. Keep this rhythm with regular practice.");
  }

  if (metrics.recentActivity < 3) {
    lines.push("Try completing at least one focused study session each day to build momentum.");
  } else {
    lines.push("Your recent activity is consistent. Keep the streak alive and challenge yourself gradually.");
  }

  if (metrics.quizTrend === "improving") {
    lines.push("Your recent quiz trend is improving. Keep your revision rhythm steady.");
  } else if (metrics.quizTrend === "declining") {
    lines.push("Your recent quiz trend dipped slightly. Revisit weak topics and attempt a short recap quiz.");
  }

  if (metrics.wpmTrend === "improving" || metrics.accuracyTrend === "improving") {
    lines.push("Typing trend is moving upward. Maintain short, consistent practice sessions.");
  } else if (metrics.wpmTrend === "declining" || metrics.accuracyTrend === "declining") {
    lines.push("Typing trend has slowed. Focus on controlled drills to recover speed and precision.");
  }

  lines.push("You are improving steadily. Keep going, and your results will compound week by week.");

  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: AiFeedbackBody = {};
    try {
      body = (await request.json()) as AiFeedbackBody;
    } catch {
      body = {};
    }

    const [quizScoreFromDb, typingFromDb, recentActivityFromDb, recentQuizScores, typingTrendSeries] = await Promise.all([
      fetchAverageQuizScore(user.id),
      fetchLatestTypingMetrics(user.id),
      fetchRecentActivity(user.id),
      fetchRecentQuizScores(user.id),
      fetchTypingTrendSeries(user.id),
    ]);

    const quizScore =
      quizScoreFromDb ??
      toValidNumber(body.quizScore) ??
      0;
    const wpm =
      typingFromDb?.wpm ??
      toValidNumber(body.wpm) ??
      0;
    const accuracy =
      typingFromDb?.accuracy ??
      toValidNumber(body.accuracy) ??
      0;
    const recentActivity =
      recentActivityFromDb ??
      toValidNumber(body.recentActivity) ??
      0;

    const quizTrend = computeTrend(recentQuizScores, 3);
    const wpmTrend = computeTrend(typingTrendSeries.wpmSeries, 2);
    const accuracyTrend = computeTrend(typingTrendSeries.accuracySeries, 1.5);

    const fallbackFeedback = generateRuleBasedFeedback({
      quizScore,
      wpm,
      accuracy,
      recentActivity,
      quizTrend,
      wpmTrend,
      accuracyTrend,
    });

    try {
      const aiFeedback = await groqCompletion({
        messages: [
          {
            role: "system",
            content:
              "You are Atlas AI Coach. Write concise, motivational, personalized feedback for a student using performance metrics. Return plain text with 3-4 short lines and practical next steps.",
          },
          {
            role: "user",
            content: `Student performance data:\n- Average quiz score: ${quizScore}\n- Typing WPM: ${wpm}\n- Typing accuracy: ${accuracy}%\n- Recent activity (last 7 days): ${recentActivity} sessions\n- Quiz trend (last 5 attempts): ${formatTrendLabel(quizTrend)}\n- Typing speed trend (last 5 attempts): ${formatTrendLabel(wpmTrend)}\n- Typing accuracy trend (last 5 attempts): ${formatTrendLabel(accuracyTrend)}\n\nGenerate smart feedback that combines current metrics with trend direction and motivates improvement with practical next steps.`,
          },
        ],
        temperature: 0.6,
        max_tokens: 220,
      });

      const feedback = aiFeedback.trim() || fallbackFeedback;
      return NextResponse.json({ feedback }, { status: 200 });
    } catch {
      return NextResponse.json({ feedback: fallbackFeedback }, { status: 200 });
    }
  } catch (error) {
    console.error("[api/ai-feedback]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}