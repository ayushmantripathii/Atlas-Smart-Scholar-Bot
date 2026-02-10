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
} from "lucide-react";

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

export default function DashboardPage() {
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

      {/* Quick Stats Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-5 rounded-xl border border-border/50 bg-card/50">
          <p className="text-sm text-muted-foreground">Study Sessions</p>
          <p className="text-2xl font-bold mt-1">0</p>
        </div>
        <div className="p-5 rounded-xl border border-border/50 bg-card/50">
          <p className="text-sm text-muted-foreground">Quizzes Taken</p>
          <p className="text-2xl font-bold mt-1">0</p>
        </div>
        <div className="p-5 rounded-xl border border-border/50 bg-card/50">
          <p className="text-sm text-muted-foreground">Flashcards Created</p>
          <p className="text-2xl font-bold mt-1">0</p>
        </div>
      </div>
    </div>
  );
}
