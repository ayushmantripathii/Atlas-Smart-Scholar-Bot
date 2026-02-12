import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** PATCH /api/session-duration — Update a study session's duration_minutes */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { session_id, duration_minutes } = body as {
      session_id: string;
      duration_minutes: number;
    };

    if (!session_id || typeof duration_minutes !== "number") {
      return NextResponse.json(
        { error: "session_id and duration_minutes are required." },
        { status: 400 }
      );
    }

    if (duration_minutes < 0 || duration_minutes > 1440) {
      return NextResponse.json(
        { error: "duration_minutes must be between 0 and 1440." },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdmin();

    const { error } = await admin
      .from("study_sessions")
      .update({ duration_minutes: Math.round(duration_minutes) })
      .eq("id", session_id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[api/session-duration] update error:", error);
      return NextResponse.json(
        { error: "Failed to update session duration." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[api/session-duration]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
