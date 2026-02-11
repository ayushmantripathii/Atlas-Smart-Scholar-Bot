import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

/** POST /api/quiz-history — Record a completed quiz attempt */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { session_id, score, total_questions } = body as {
      session_id?: string;
      score: number;
      total_questions: number;
    };

    if (typeof score !== "number" || typeof total_questions !== "number") {
      return NextResponse.json(
        { error: "score and total_questions are required numbers." },
        { status: 400 }
      );
    }

    if (score < 0 || total_questions <= 0 || score > total_questions) {
      return NextResponse.json(
        { error: "Invalid score or total_questions values." },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdmin();

    // Ensure user row exists
    await admin
      .from("users")
      .upsert({ id: user.id, email: user.email ?? "" }, { onConflict: "id" });

    const { data, error } = await admin
      .from("quiz_history")
      .insert({
        user_id: user.id,
        session_id: session_id ?? null,
        score,
        total_questions,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[api/quiz-history] insert error:", error);
      return NextResponse.json(
        { error: "Failed to save quiz result." },
        { status: 500 }
      );
    }

    // Revalidate the dashboard so server-rendered stats refresh
    revalidatePath("/dashboard");

    return NextResponse.json({ success: true, id: data.id });
  } catch (err: unknown) {
    console.error("[api/quiz-history]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
