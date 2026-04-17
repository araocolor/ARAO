import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncProfile } from "@/lib/profiles";

const COLOR_LIST_SELECT_CANDIDATES: string[] = [
  "id, product_code, creator, creator_icon, title, content, price, file_link, img_arao_full, img_arao_mid, img_arao_thumb, img_standard_full, img_portrait_full, like_count, created_at, profile_id, is_admin",
  "id, product_code, creator, title, content, price, file_link, img_arao_full, img_arao_mid, img_arao_thumb, img_standard_full, img_portrait_full, like_count, created_at, profile_id, is_admin",
  "id, product_code, creator_icon, title, content, price, file_link, img_arao_full, img_arao_mid, img_arao_thumb, img_standard_full, img_portrait_full, like_count, created_at, profile_id, is_admin",
  "id, creator, creator_icon, title, content, price, file_link, img_arao_full, img_arao_mid, img_arao_thumb, img_standard_full, img_portrait_full, like_count, created_at, profile_id, is_admin",
  "id, product_code, title, content, price, file_link, img_arao_full, img_arao_mid, img_arao_thumb, img_standard_full, img_portrait_full, like_count, created_at, profile_id, is_admin",
  "id, creator, title, content, price, file_link, img_arao_full, img_arao_mid, img_arao_thumb, img_standard_full, img_portrait_full, like_count, created_at, profile_id, is_admin",
  "id, creator_icon, title, content, price, file_link, img_arao_full, img_arao_mid, img_arao_thumb, img_standard_full, img_portrait_full, like_count, created_at, profile_id, is_admin",
  "id, title, content, price, file_link, img_arao_full, img_arao_mid, img_arao_thumb, img_standard_full, img_portrait_full, like_count, created_at, profile_id, is_admin",
];

type MissingOptionalColumn = "product_code" | "creator" | "creator_icon";
type SelectError = { code?: string; message?: string } | null;

function normalizeProductCode(input?: string | null): string | null {
  const raw = (input ?? "").trim().toLowerCase();
  if (!raw) return null;

  const normalized = raw.replace(/\s+/g, "-");
  if (!/^[a-z0-9][a-z0-9_-]{1,48}[a-z0-9]$/.test(normalized)) {
    throw new Error("상품코드는 영문 소문자, 숫자, -, _ 만 사용할 수 있습니다. (3~50자)");
  }
  return normalized;
}

function getMissingOptionalColorColumn(error: SelectError): MissingOptionalColumn | null {
  if (error?.code !== "42703") return null;
  const message = error.message ?? "";
  if (message.includes("creator_icon")) return "creator_icon";
  if (message.includes("creator")) return "creator";
  if (message.includes("product_code")) return "product_code";
  return null;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));
    const offset = (page - 1) * limit;

    const supabase = createSupabaseAdminClient();
    let lastMissingError: SelectError = null;

    for (const columns of COLOR_LIST_SELECT_CANDIDATES) {
      const { data, count, error } = await supabase
        .from("colors")
        .select(columns, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (!error) {
        return NextResponse.json({ items: data ?? [], total: count ?? 0, page, limit });
      }

      if (getMissingOptionalColorColumn(error)) {
        lastMissingError = error;
        continue;
      }

      throw error;
    }

    throw lastMissingError ?? new Error("colors 조회에 실패했습니다.");
  } catch (error) {
    console.error("GET /api/color error:", error);
    return NextResponse.json({ items: [], total: 0, page: 1, limit: 20 }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;
  const profile = await syncProfile({ email, fullName });
  if (!profile) return NextResponse.json({ message: "프로필을 찾을 수 없습니다." }, { status: 404 });

  try {
    const body = (await request.json()) as {
      title?: string;
      product_code?: string | null;
      creator?: string | null;
      creator_icon?: string | null;
      content?: string;
      price?: number | null;
      file_link?: string | null;
      img_standard_full?: string | null;
      img_standard_mid?: string | null;
      img_standard_thumb?: string | null;
      img_portrait_full?: string | null;
      img_portrait_mid?: string | null;
      img_portrait_thumb?: string | null;
      img_arao_full?: string | null;
      img_arao_mid?: string | null;
      img_arao_thumb?: string | null;
    };

    const title = (body.title ?? "").trim();
    if (!title) return NextResponse.json({ message: "제목을 입력해주세요." }, { status: 400 });

    const creator = (body.creator ?? "").trim() || null;
    const creatorIcon = body.creator_icon?.trim() || null;

    let productCode: string | null = null;
    try {
      productCode = normalizeProductCode(body.product_code);
    } catch (error) {
      const message = error instanceof Error ? error.message : "상품코드 형식이 올바르지 않습니다.";
      return NextResponse.json({ message }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("colors")
      .insert({
        profile_id: profile.id,
        is_admin: profile.role === "admin",
        title,
        ...(productCode !== null ? { product_code: productCode } : {}),
        creator,
        creator_icon: creatorIcon,
        content: (body.content ?? "").trim() || null,
        price: body.price ?? null,
        file_link: body.file_link?.trim() || null,
        img_standard_full: body.img_standard_full ?? null,
        img_standard_mid: body.img_standard_mid ?? null,
        img_standard_thumb: body.img_standard_thumb ?? null,
        img_portrait_full: body.img_portrait_full ?? null,
        img_portrait_mid: body.img_portrait_mid ?? null,
        img_portrait_thumb: body.img_portrait_thumb ?? null,
        img_arao_full: body.img_arao_full ?? null,
        img_arao_mid: body.img_arao_mid ?? null,
        img_arao_thumb: body.img_arao_thumb ?? null,
        like_count: 0,
      })
      .select("id")
      .single();

    if (error) {
      const missingColumn = getMissingOptionalColorColumn(error);
      if (missingColumn === "creator_icon") {
        return NextResponse.json(
          { message: "DB에 creator_icon 컬럼이 아직 없습니다. SQL 반영 후 다시 저장해주세요." },
          { status: 400 }
        );
      }
      if (missingColumn === "creator") {
        return NextResponse.json(
          { message: "DB에 creator 컬럼이 아직 없습니다. SQL 반영 후 다시 저장해주세요." },
          { status: 400 }
        );
      }
      if (missingColumn === "product_code") {
        return NextResponse.json(
          { message: "DB에 product_code 컬럼이 아직 없습니다. SQL 반영 후 다시 저장해주세요." },
          { status: 400 }
        );
      }
      const duplicateKeyText = `${error.message} ${error.details ?? ""} ${error.hint ?? ""}`;
      if (error.code === "23505" && duplicateKeyText.includes("colors_product_code_key")) {
        return NextResponse.json({ message: "이미 사용 중인 상품코드입니다." }, { status: 409 });
      }
      throw error;
    }
    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("POST /api/color error:", error);
    return NextResponse.json({ message: "저장에 실패했습니다." }, { status: 500 });
  }
}
