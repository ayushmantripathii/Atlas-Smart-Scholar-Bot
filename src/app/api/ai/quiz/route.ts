import { NextRequest, NextResponse } from "next/server";
import { groqCompletion } from "@/lib/groq";
import { getAuthUser } from "@/lib/supabase/server-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { resolveContent } from "@/lib/pdf/resolveContent";

export const runtime = "nodejs";

/** POST /api/ai/quiz — Generate quiz questions from study material */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content: rawContent, fileUrl, count = 5 } = body as {
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
          content: `You are an expert quiz generator. Generate ${count} multiple choice questions from the given study material. Each question should have 4 options with one correct answer and a brief explanation.

Format your response as valid JSON (no markdown fences):
{
  "questions": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "A) ...",
      "explanation": "..."
    }
  ]
}`,
        },
        { role: "user", content: `Generate quiz questions from:\n\n${content}` },
      ],
      temperature: 0.5,
      max_tokens: 4096,
    });

    let parsed: { questions: Array<{ question: string; options: string[]; correct_answer: string; explanation?: string }> };
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = { questions: [] };
    }

    // Persist session
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
        content_type: "quiz",
        result_data: resultData,
      })
      .select("id")
      .single();

    return NextResponse.json({ ...parsed, session_id: session?.id });
  } catch (err: unknown) {
    console.error("[api/ai/quiz]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
