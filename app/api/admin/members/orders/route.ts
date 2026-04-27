import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("clerk_id", userId)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 403 });
  }

  const url = new URL(request.url);
  const memberId = url.searchParams.get("userId");
  if (!memberId) return NextResponse.json({ message: "userId가 필요합니다." }, { status: 400 });

  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", memberId)
    .eq("status", "결제완료");

  if (!orders || orders.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const orderIds = orders.map((o) => o.id);

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id")
    .in("order_id", orderIds);

  if (!items || items.length === 0) {
    const { data: payments } = await supabase
      .from("payments")
      .select("product_name")
      .in("order_id", orderIds);

    const names = [...new Set((payments ?? []).map((p) => p.product_name).filter(Boolean))];
    return NextResponse.json({ products: names });
  }

  const productIds = [...new Set(items.map((i) => i.product_id))];
  const { data: products } = await supabase
    .from("products")
    .select("name")
    .in("id", productIds);

  const names = (products ?? []).map((p) => p.name);
  return NextResponse.json({ products: names });
}
