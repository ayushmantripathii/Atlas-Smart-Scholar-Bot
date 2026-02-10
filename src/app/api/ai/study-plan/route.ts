import { NextRequest, NextResponse } from "next/server";
import { groqCompletion } from "@/lib/groq";
import { getAuthUser } from "@/lib/supabase/server-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { resolveContent } from "@/lib/pdf/resolveContent";

export const runtime = "nodejs";

/** POST /api/ai/study-plan — Generate a study plan from material */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content: rawContent, fileUrl } = body as {
      content?: string;
      fileUrl?: string;
    };

    let resolved;
    try {
      resolved = await resolveContent({ content: rawContent, fileUrl });
    } catch (resolveErr: unknown) {
      return NextResponse.json(
        { error: resolveErr instanceof Error ? resolveErr.message : "Invalid input." },
        { status: 400 }
      );
    }

    const content = resolved.text;

    const result = await groqCompletion({
      messages: [
        {
          role: "system",
          content: `You are an expert study planner. Create a structured study plan based on the given material. Consider topic difficulty and importance.

Format your response as valid JSON (no markdown fences):
{
  "title": "Study Plan for [Subject]",
  "topics": [
    {
      "topic": "...",
      "priority": "high|medium|low",
      "estimated_minutes": 30,
      "resources": ["..."]
    }
  ],
  "estimated_hours": 10
}`,
        },
        { role: "user", content: `Create a study plan for:\n\n${content}` },
      ],
      temperature: 0.5,
      max_tokens: 4096,
    });

    let parsed: { title: string; topics: Array<{ topic: string; priority: string; estimated_minutes: number; resources: string[] }>; estimated_hours: number };
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = { title: "Study Plan", topics: [], estimated_hours: 0 };
    }

    const admin = createSupabaseAdmin();
    await admin.from("users").upsert({ id: user.id, email: user.email ?? "" }, { onConflict: "id" });

    const resultData = {
      ...parsed,
      ...(resolved.source === "file" && resolved.fileUrl
        ? { file_url: resolved.fileUrl }
        : { original_content: content.trim().slice(0, 10_000) }),
    };

    const { data: session } = await admin
      .from("study_sessions")
      .insert({
        user_id: user.id,
        title: parsed.title || content.trim().slice(0, 80),
        content_type: "study_plan",
        result_data: resultData,
      })
      .select("id")
      .single();

    return NextResponse.json({ ...parsed, session_id: session?.id });
  } catch (err: unknown) {
    console.error("[api/ai/study-plan]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
