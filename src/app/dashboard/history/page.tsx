"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  History,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Inbox,
  Sparkles,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { StudySessionRow, SummaryResultData } from "@/types/study";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<StudySessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const supabase = createSupabaseBrowserClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in to view history.");
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("study_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) {
          console.error("[history]", fetchError);
          setError("Failed to load history.");
          return;
        }

        setSessions((data as StudySessionRow[]) ?? []);
      } catch {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neon-cyan" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold">History</h2>
          <p className="text-muted-foreground mt-1">
            View your past AI-generated summaries.
          </p>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">History</h2>
        <p className="text-muted-foreground mt-1">
          View your past AI-generated summaries and study sessions.
        </p>
      </div>

      {/* Empty state */}
      {sessions.length === 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Inbox className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No sessions yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Head over to the Summarizer tool and generate your first summary.
              It will appear here automatically.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Session list */}
      <div className="space-y-3">
        {sessions.map((session) => {
          const isExpanded = expandedId === session.id;
          const resultData = session.result_data as SummaryResultData | null;

          return (
            <Card
              key={session.id}
              className="border-border/50 bg-card/50 transition-colors hover:border-neon-cyan/20"
            >
              <CardHeader className="pb-3">
                <button
                  onClick={() => toggleExpand(session.id)}
                  className="flex items-start justify-between w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium leading-snug line-clamp-2">
                        {session.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(session.created_at)}
                        <span className="mx-1 text-border">•</span>
                        <span className="capitalize">{session.content_type}</span>
                      </CardDescription>
                    </div>
                  </div>

                  <div className="shrink-0 mt-1">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              </CardHeader>

              {/* Expanded detail */}
              {isExpanded && resultData && (
                <CardContent className="pt-0 space-y-5 border-t border-border/30 mt-1 pt-4">
                  {/* Summary */}
                  {resultData.summary && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-neon-cyan">
                        Overview
                      </h4>
                      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        {resultData.summary}
                      </p>
                    </div>
                  )}

                  {/* Key Points */}
                  {resultData.key_points?.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-neon-purple">
                        Key Points
                      </h4>
                      <ul className="space-y-1.5">
                        {resultData.key_points.map((point, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon-purple" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Topics */}
                  {resultData.topics?.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-neon-pink">
                        Topics
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {resultData.topics.map((topic, i) => (
                          <span
                            key={i}
                            className="rounded-full border border-neon-pink/30 bg-neon-pink/10 px-3 py-1 text-xs font-medium text-neon-pink"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}

              {/* Expanded but no result data */}
              {isExpanded && !resultData && (
                <CardContent className="pt-0 border-t border-border/30 mt-1 pt-4">
                  <p className="text-sm text-muted-foreground italic">
                    No summary data stored for this session.
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
