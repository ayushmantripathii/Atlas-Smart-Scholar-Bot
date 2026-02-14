import Link from "next/link";
import {
  FileText,
  Brain,
  Lightbulb,
  Sparkles,
  BarChart3,
  BookOpen,
  MessageSquare,
  Upload,
  ArrowRight,
  Flame,
  Trophy,
  CalendarDays,
  Bot,
} from "lucide-react";
import { createSupabaseServerClient, getAuthUser } from "@/lib/supabase/server-client";
import type { DashboardStats, WeeklyChartPoint } from "@/types/study";
import { calculateStreak } from "@/lib/streak";
import { generateStudyInsight } from "@/lib/insights";
import { WeeklySessionsChart } from "@/components/dashboard/WeeklySessionsChart";

/** Force fresh data on every request — prevents Next.js from caching stale stats */
export const dynamic = "force-dynamic";

const tools = [
  {
    title: "Upload Material",
    description: "Upload PDFs, notes, or past papers for AI analysis.",
    icon: Upload,
    href: "/dashboard/upload",
    gradient: "from-blue-500 to-cyan-500",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]",
  },
  {
    title: "Summarizer",
    description: "Get concise summaries and key points from your content.",
    icon: FileText,
    href: "/dashboard/summarizer",
    gradient: "from-cyan-500 to-teal-500",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]",
  },
  {
    title: "Quiz Generator",
    description: "Auto-generate MCQs and practice tests from your material.",
    icon: Brain,
    href: "/dashboard/quiz",
    gradient: "from-purple-500 to-pink-500",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]",
  },
  {
    title: "Flashcards",
    description: "Create smart flashcards for quick memorization sessions.",
    icon: Lightbulb,
    href: "/dashboard/flashcards",
    gradient: "from-amber-500 to-orange-500",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
  },
  {
    title: "Study Plans",
    description: "Get AI-powered personalized study schedules.",
    icon: Sparkles,
    href: "/dashboard/study-plans",
    gradient: "from-pink-500 to-rose-500",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]",
  },
  {
    title: "Exam Analysis",
    description: "Detect repeated topics and patterns from past papers.",
    icon: BarChart3,
    href: "/dashboard/exam-analysis",
    gradient: "from-emerald-500 to-green-500",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]",
  },
  {
    title: "Revision Mode",
    description: "Condensed recap to solidify your understanding.",
    icon: BookOpen,
    href: "/dashboard/revision",
    gradient: "from-indigo-500 to-blue-500",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]",
  },
  {
    title: "Chat Mode",
    description: "Have an AI-powered Q&A session over your study material.",
    icon: MessageSquare,
    href: "/dashboard/chat",
    gradient: "from-violet-500 to-purple-500",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]",
  },
];

interface DashboardData {
  stats: DashboardStats;
  weeklyChart: WeeklyChartPoint[];
  insight: string;
}

/** Fetch all dashboard analytics for the authenticated user */
async function getDashboardData(): Promise<DashboardData> {
  const defaults: DashboardData = {
    stats: {
      studySessions: 0,
      weeklyStudySessions: 0,
      currentStreak: 0,
      longestStreak: 0,
    },
    weeklyChart: [],
    insight: generateStudyInsight({
      thisWeekSessions: 0,
      lastWeekSessions: 0,
      currentStreak: 0,
      totalSessions: 0,
    }),
  };

  const user = await getAuthUser();
  if (!user) return defaults;

  const supabase = createSupabaseServerClient();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000).toISOString();

  const [totalRes, weeklyRes, prevWeekRes, allSessionsRes] = await Promise.all([
    // Total study sessions
    supabase
      .from("study_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    // This week's sessions (with created_at for chart grouping)
    supabase
      .from("study_sessions")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", weekAgo),
    // Previous week's sessions count (for insight comparison)
    supabase
      .from("study_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", twoWeeksAgo)
      .lt("created_at", weekAgo),
    // All sessions (for streak calculation)
    supabase
      .from("study_sessions")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  const allSessions = allSessionsRes.data ?? [];
  const weeklySessions = weeklyRes.data ?? [];

  // --- Streak ---
  const { currentStreak, longestStreak } = calculateStreak(allSessions);

  // --- Weekly chart: group last 7 days ---
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyChart: WeeklyChartPoint[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    const dateStr = d.toISOString().slice(0, 10);
    const count = weeklySessions.filter(
      (s) => new Date(s.created_at).toISOString().slice(0, 10) === dateStr
    ).length;
    weeklyChart.push({
      day: dayLabels[d.getUTCDay()],
      sessions: count,
    });
  }

  // --- Insight ---
  const thisWeekCount = weeklySessions.length;
  const lastWeekCount = prevWeekRes.count ?? 0;
  const insight = generateStudyInsight({
    thisWeekSessions: thisWeekCount,
    lastWeekSessions: lastWeekCount,
    currentStreak,
    totalSessions: totalRes.count ?? 0,
  });

  return {
    stats: {
      studySessions: totalRes.count ?? 0,
      weeklyStudySessions: thisWeekCount,
      currentStreak,
      longestStreak,
    },
    weeklyChart,
    insight,
  };
}

export default async function DashboardPage() {
  const { stats, weeklyChart, insight } = await getDashboardData();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome to <span className="gradient-text">Atlas</span>
        </h2>
        <p className="text-muted-foreground mt-2">
          Select a tool below to get started with your study session.
        </p>
      </div>

      {/* Tool Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <div
              className={`group relative p-5 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-border transition-all duration-300 cursor-pointer h-full ${tool.glowColor}`}
            >
              {/* Icon */}
              <div
                className={`h-11 w-11 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}
              >
                <tool.icon className="h-5 w-5 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-base font-semibold mb-1 group-hover:text-foreground transition-colors">
                {tool.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tool.description}
              </p>

              {/* Arrow */}
              <div className="mt-4 flex items-center text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                <span>Open</span>
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Streak + Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-5 rounded-xl border border-border/50 bg-card/50">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <p className="text-sm">Study Sessions</p>
          </div>
          <p className="text-2xl font-bold mt-1">{stats.studySessions}</p>
        </div>
        <div className="p-5 rounded-xl border border-orange-500/20 bg-orange-500/5">
          <div className="flex items-center gap-2 text-orange-400">
            <Flame className="h-4 w-4" />
            <p className="text-sm">Current Streak</p>
          </div>
          <p className="text-2xl font-bold mt-1 text-orange-400">
            {stats.currentStreak} {stats.currentStreak === 1 ? "Day" : "Days"}
          </p>
        </div>
        <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 text-amber-400">
            <Trophy className="h-4 w-4" />
            <p className="text-sm">Longest Streak</p>
          </div>
          <p className="text-2xl font-bold mt-1 text-amber-400">
            {stats.longestStreak} {stats.longestStreak === 1 ? "Day" : "Days"}
          </p>
        </div>
      </div>

      {/* Weekly Activity Overview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            This Week
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5">
            <p className="text-xs text-muted-foreground">Sessions This Week</p>
            <p className="text-xl font-bold mt-1 text-neon-cyan">{stats.weeklyStudySessions}</p>
          </div>
        </div>
      </div>

      {/* Weekly Sessions Chart */}
      <WeeklySessionsChart data={weeklyChart} />

      {/* AI Study Insight */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-5 w-5 text-neon-cyan" />
          <h3 className="text-sm font-semibold">AI Study Insight</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
      </div>
    </div>
  );
}
