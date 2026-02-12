import { NextRequest, NextResponse } from "next/server";
import { groqCompletion } from "@/lib/groq";
import { getAuthUser } from "@/lib/supabase/server-client";
import { resolveContent } from "@/lib/pdf/resolveContent";

/** POST /api/ai/chat — Conversational AI study assistant */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { context, fileUrl, question, history = [] } = body as {
      context?: string;
      fileUrl?: string;
      question?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "Question is required." },
        { status: 400 }
      );
    }

    // Build the study context from fileUrl and/or pasted text
    let studyContext = "";

    if (fileUrl) {
      try {
        const resolved = await resolveContent({ fileUrl });
        studyContext = resolved.text;
      } catch (err) {
        console.error("[api/ai/chat] Failed to resolve file:", err);
        return NextResponse.json(
          { error: "Failed to read the uploaded file. Please try again." },
          { status: 400 }
        );
      }
    }

    // Append any pasted text context (user may provide both)
    if (context && context.trim()) {
      studyContext = studyContext
        ? `${studyContext}\n\n--- Additional Context ---\n${context.trim()}`
        : context.trim();
    }

    const systemContent = studyContext
      ? `You are an intelligent AI study assistant called Atlas. You help students understand study material by answering their questions clearly and thoroughly. Base your answers on the provided study material. If the question is outside the scope of the material, say so politely.\n\nStudy Material Context:\n${studyContext}`
      : `You are an intelligent AI study assistant called Atlas. You help students with their studies by answering questions clearly and thoroughly. Provide accurate, well-structured answers.`;

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemContent },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: question },
    ];

    const result = await groqCompletion({
      messages,
      temperature: 0.6,
      max_tokens: 4096,
    });

    return NextResponse.json({ answer: result });
  } catch (err: unknown) {
    console.error("[api/ai/chat]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
