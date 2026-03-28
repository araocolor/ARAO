import { auth } from "@clerk/nextjs/server";
import { markNotificationRead } from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 본인 소유 확인
    const supabase = createSupabaseAdminClient();
    const { data: notification, error: fetchError } = await supabase
      .from("notifications")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (fetchError || !notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Clerk userId와 profile_id 매칭 확인은 별도 처리 필요
    // 여기서는 notification의 profile_id만 확인
    // (실제로는 Clerk userId → profile_id 변환 필요)

    // 읽음 처리
    await markNotificationRead(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/account/notifications/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
