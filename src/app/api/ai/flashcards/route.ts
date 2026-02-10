import { NextRequest, NextResponse } from "next/server";
import { groqCompletion } from "@/lib/groq";
import { getAuthUser } from "@/lib/supabase/server-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { resolveContent } from "@/lib/pdf/resolveContent";

export const runtime = "nodejs";

/** POST /api/ai/flashcards — Generate flashcards from study material */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content: rawContent, fileUrl, count = 10 } = body as {
      content?: string;
      fileUrl?: string;
      count?: number;
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
          content: `You are an expert flashcard creator. Generate ${count} flashcards from the given study material. Each flashcard should have a clear question on the front and a concise answer on the back.

Format your response as valid JSON (no markdown fences):
{
  "flashcards": [
    { "question": "...", "answer": "..." }
  ]
}`,
        },
        { role: "user", content: `Create flashcards from:\n\n${content}` },
      ],
      temperature: 0.5,
      max_tokens: 4096,
    });

    let parsed: { flashcards: Array<{ question: string; answer: string }> };
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = { flashcards: [] };
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
        content_type: "flashcards",
        result_data: resultData,
      })
      .select("id")
      .single();

    return NextResponse.json({ ...parsed, session_id: session?.id });
  } catch (err: unknown) {
    console.error("[api/ai/flashcards]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
