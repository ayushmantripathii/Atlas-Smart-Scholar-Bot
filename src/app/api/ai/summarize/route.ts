import { NextRequest, NextResponse } from "next/server";
import { groqCompletion } from "@/lib/groq";
import { getAuthUser } from "@/lib/supabase/server-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { resolveContent } from "@/lib/pdf/resolveContent";
import type { SummarizeResponse, SummaryResultData } from "@/types/study";

export const runtime = "nodejs";

/** POST /api/ai/summarize — Generate an AI summary and persist to Supabase */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Authenticate ──────────────────────────────────
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to use the summarizer." },
        { status: 401 }
      );
    }

    // ── 2. Validate input ────────────────────────────────
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

    // ── 3. Call Groq AI ──────────────────────────────────
    const systemPrompt =
      "You are an expert academic assistant. Summarize study material clearly, structured with headings and bullet points. " +
      "Return your answer as valid JSON with this exact shape:\n" +
      '{ "summary": "<overview paragraph>", "key_points": ["point 1", "point 2", ...], "topics": ["topic 1", "topic 2", ...] }\n' +
      "Do NOT wrap the JSON in markdown code fences. Return raw JSON only.";

    const result = await groqCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Summarize the following study material:\n\n${content}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 4096,
    });

    // Parse the AI response
    let parsed: { summary: string; key_points: string[]; topics: string[] };
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = { summary: result, key_points: [], topics: [] };
    }

    // ── 4. Persist to Supabase (admin client bypasses RLS) ──
    const admin = createSupabaseAdmin();

    // Ensure the user exists in public.users (in case the trigger hasn't run)
    await admin
      .from("users")
      .upsert(
        { id: user.id, email: user.email ?? "" },
        { onConflict: "id" }
      );

    const title = content.trim().slice(0, 80);

    const resultData: SummaryResultData = {
      summary: parsed.summary,
      key_points: parsed.key_points,
      topics: parsed.topics,
      original_content: content.trim().slice(0, 10_000),
      ...(resolved.source === "file" && resolved.fileUrl
        ? { file_url: resolved.fileUrl }
        : {}),
    };

    const { data: session, error: insertError } = await admin
      .from("study_sessions")
      .insert({
        user_id: user.id,
        title,
        content_type: "summary",
        result_data: resultData,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[api/ai/summarize] DB insert error:", insertError);
    }

    const response: SummarizeResponse = {
      ...parsed,
      session_id: session?.id ?? undefined,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("[api/ai/summarize]", err);

    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
