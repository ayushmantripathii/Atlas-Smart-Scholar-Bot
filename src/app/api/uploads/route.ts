import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/uploads — Upload a file to Supabase Storage + record in uploads table.
 * Accepts multipart/form-data with a "file" field.
 *
 * GET /api/uploads — List the authenticated user's uploads.
 *
 * DELETE /api/uploads?id=<uuid> — Delete a specific upload.
 */

const BUCKET = "study-materials";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// ── POST ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    // Determine content type — allow common study formats
    const mime = file.type || "application/octet-stream";
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isAllowed =
      ALLOWED_TYPES.includes(mime) ||
      ["pdf", "txt", "md", "docx"].includes(ext);

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, TXT, MD, or DOCX." },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdmin();

    // Ensure user row exists
    await admin
      .from("users")
      .upsert({ id: user.id, email: user.email ?? "" }, { onConflict: "id" });

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${timestamp}_${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: storageError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: mime,
        upsert: false,
      });

    if (storageError) {
      console.error("[api/uploads] Storage error:", storageError);
      return NextResponse.json(
        { error: `Storage error: ${storageError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = admin.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const fileUrl = urlData?.publicUrl ?? storagePath;

    // Insert record into uploads table
    const { data: upload, error: dbError } = await admin
      .from("uploads")
      .insert({
        user_id: user.id,
        file_url: fileUrl,
        file_name: file.name,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[api/uploads] DB error:", dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(upload, { status: 201 });
  } catch (err: unknown) {
    console.error("[api/uploads] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ── GET ───────────────────────────────────────────────
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createSupabaseAdmin();

    const { data, error } = await admin
      .from("uploads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/uploads] GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err: unknown) {
    console.error("[api/uploads] GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ── DELETE ────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Upload ID is required." }, { status: 400 });
    }

    const admin = createSupabaseAdmin();

    // Fetch the upload to get the storage path
    const { data: upload, error: fetchError } = await admin
      .from("uploads")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !upload) {
      return NextResponse.json({ error: "Upload not found." }, { status: 404 });
    }

    // Extract storage path from the URL
    const url = upload.file_url as string;
    const bucketPrefix = `/storage/v1/object/public/${BUCKET}/`;
    const pathIndex = url.indexOf(bucketPrefix);
    if (pathIndex !== -1) {
      const storagePath = url.substring(pathIndex + bucketPrefix.length);
      await admin.storage.from(BUCKET).remove([storagePath]);
    }

    // Delete DB record
    const { error: deleteError } = await admin
      .from("uploads")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("[api/uploads] DELETE error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[api/uploads] DELETE error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
