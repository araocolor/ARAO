import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function normalizeProductCode(input?: string | null): string | null {
  const raw = (input ?? "").trim().toLowerCase();
  if (!raw) return null;

  const normalized = raw.replace(/\s+/g, "-");
  if (!/^[a-z0-9][a-z0-9_-]{1,48}[a-z0-9]$/.test(normalized)) {
    throw new Error("상품코드는 영문 소문자, 숫자, -, _ 만 사용할 수 있습니다. (3~50자)");
  }
  return normalized;
}

function isMissingProductCodeColumn(error: { code?: string; message?: string } | null): boolean {
  return error?.code === "42703" && (error.message ?? "").includes("product_code");
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ available: false, message: "Unauthorized" }, { status: 401 });

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
    if (!email) return NextResponse.json({ available: false, message: "이메일 정보가 없습니다." }, { status: 401 });

    const supabaseAuth = createSupabaseAdminClient();
    const { data: profile } = await supabaseAuth.from("profiles").select("role").eq("email", email.toLowerCase()).maybeSingle();
    if (profile?.role !== "admin") return NextResponse.json({ available: false, message: "권한이 없습니다." }, { status: 403 });

    const url = new URL(request.url);
    const rawCode = url.searchParams.get("code");
    const excludeId = (url.searchParams.get("excludeId") ?? "").trim();

    let code: string | null = null;
    try {
      code = normalizeProductCode(rawCode);
    } catch (error) {
      const message = error instanceof Error ? error.message : "상품코드 형식이 올바르지 않습니다.";
      return NextResponse.json({ available: false, message }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ available: false, message: "상품코드를 입력해주세요." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("colors")
      .select("id")
      .eq("product_code", code)
      .maybeSingle<{ id: string }>();

    if (error) {
      if (isMissingProductCodeColumn(error)) {
        return NextResponse.json(
          { available: false, message: "DB에 product_code 컬럼이 아직 없습니다. SQL 반영이 필요합니다." },
          { status: 400 }
        );
      }
      throw error;
    }

    if (!data) {
      return NextResponse.json({ available: true, normalizedCode: code, message: "사용 가능한 상품코드입니다." });
    }

    if (excludeId && data.id === excludeId) {
      return NextResponse.json({
        available: true,
        normalizedCode: code,
        message: "현재 상품에서 사용 중인 코드입니다.",
      });
    }

    return NextResponse.json({ available: false, normalizedCode: code, message: "이미 사용 중인 상품코드입니다." });
  } catch (error) {
    console.error("GET /api/color/product-code-check error:", error);
    return NextResponse.json({ available: false, message: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
