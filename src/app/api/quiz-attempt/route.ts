import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getAuthUser } from "@/lib/supabase/server-client";

export const runtime = "nodejs";

interface QuizAttemptBody {
  score?: number;
  total_questions?: number;
  topic?: string;
}

/** POST /api/quiz-attempt - Save one completed quiz attempt for the current user */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as QuizAttemptBody;
    const { score, total_questions, topic } = body;

    if (
      typeof score !== "number" ||
      !Number.isFinite(score) ||
      typeof total_questions !== "number" ||
      !Number.isFinite(total_questions) ||
      typeof topic !== "string"
    ) {
      return NextResponse.json(
        { error: "score, total_questions, and topic are required." },
        { status: 400 }
      );
    }

    const normalizedTopic = topic.trim();
    if (!normalizedTopic) {
      return NextResponse.json({ error: "topic is required." }, { status: 400 });
    }

    if (score < 0 || total_questions <= 0 || score > total_questions) {
      return NextResponse.json(
        { error: "Invalid score or total_questions values." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: user.id,
        score,
        total_questions,
        topic: normalizedTopic,
      })
      .select("id, score, total_questions, topic, created_at")
      .single();

    if (error) {
      console.error("[api/quiz-attempt] insert error:", error);
      return NextResponse.json(
        { error: "Failed to save quiz attempt." },
        { status: 500 }
      );
    }

    revalidatePath("/dashboard");

    return NextResponse.json({ success: true, attempt: data }, { status: 201 });
  } catch (error) {
    console.error("[api/quiz-attempt]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
