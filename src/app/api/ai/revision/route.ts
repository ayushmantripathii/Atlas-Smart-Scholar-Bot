import { NextRequest, NextResponse } from "next/server";
import { groqCompletion } from "@/lib/groq";
import { getAuthUser } from "@/lib/supabase/server-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";

/** POST /api/ai/revision — Generate a condensed revision guide */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const content: string | undefined = body?.content;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required." },
        { status: 400 }
      );
    }

    const result = await groqCompletion({
      messages: [
        {
          role: "system",
          content: `You are an expert revision assistant. Create a condensed revision guide from the given study material. Focus on the most important concepts, formulas, and key facts that are essential for exam preparation.

Format your response as valid JSON (no markdown fences):
{
  "revision_title": "Quick Revision: [Subject]",
  "sections": [
    {
      "heading": "...",
      "key_facts": ["...", "..."],
      "tips": "..."
    }
  ]
}`,
        },
        { role: "user", content: `Create a revision guide from:\n\n${content}` },
      ],
      temperature: 0.4,
      max_tokens: 4096,
    });

    let parsed: { revision_title: string; sections: Array<{ heading: string; key_facts: string[]; tips: string }> };
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = { revision_title: "Revision Guide", sections: [] };
    }

    const admin = createSupabaseAdmin();
    await admin.from("users").upsert({ id: user.id, email: user.email ?? "" }, { onConflict: "id" });

    const { data: session } = await admin
      .from("study_sessions")
      .insert({
        user_id: user.id,
        title: parsed.revision_title || content.trim().slice(0, 80),
        content_type: "revision",
        result_data: parsed,
      })
      .select("id")
      .single();

    return NextResponse.json({ ...parsed, session_id: session?.id });
  } catch (err: unknown) {
    console.error("[api/ai/revision]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
