import { NextRequest, NextResponse } from "next/server";
import { groqCompletion } from "@/lib/groq";
import { getAuthUser } from "@/lib/supabase/server-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { resolveContent } from "@/lib/pdf/resolveContent";

export const runtime = "nodejs";

/** POST /api/ai/exam-analysis — Extract topics and patterns from exam papers */
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
          content: `You are an expert academic analyst. Extract and rank the main topics from the given study material or past exam papers. Identify frequently tested topics and their importance.

Format your response as valid JSON (no markdown fences):
{
  "detected_topics": [
    { "topic": "...", "frequency": 5, "importance": "high|medium|low" }
  ],
  "frequency_map": { "topic_name": 5 }
}`,
        },
        { role: "user", content: `Extract and rank topics from:\n\n${content}` },
      ],
      temperature: 0.4,
      max_tokens: 4096,
    });

    let parsed: { detected_topics: Array<{ topic: string; frequency: number; importance: string }>; frequency_map: Record<string, number> };
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = { detected_topics: [], frequency_map: {} };
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
        title: content.trim().slice(0, 80),
        content_type: "exam_analysis",
        result_data: resultData,
      })
      .select("id")
      .single();

    return NextResponse.json({ ...parsed, session_id: session?.id });
  } catch (err: unknown) {
    console.error("[api/ai/exam-analysis]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
