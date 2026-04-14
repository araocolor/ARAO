import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncProfile } from "@/lib/profiles";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await request.json()) as {
      orderId?: string;
      reason?: string;
    };

    const orderId = body.orderId?.trim();
    if (!orderId) {
      return NextResponse.json({ message: "주문 번호가 없습니다." }, { status: 400 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;
    const profile = await syncProfile({ email, fullName });

    if (!profile) {
      return NextResponse.json({ message: "프로필을 찾을 수 없습니다." }, { status: 404 });
    }

    const { id } = await params;
    void id;

    const admin = createSupabaseAdminClient();
    const { data: order, error } = await admin
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .eq("user_id", profile.id)
      .single<{ id: string; status: string }>();

    if (error || !order) {
      return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
    }

    if (order.status !== "결제완료") {
      await admin.from("orders").update({ status: "결제오류" }).eq("id", orderId);
      await admin
        .from("payments")
        .update({ status: body.reason?.trim() || "aborted" })
        .eq("order_id", orderId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/color/[id]/order/abort error:", error);
    return NextResponse.json({ message: "주문 상태 정리에 실패했습니다." }, { status: 500 });
  }
}
