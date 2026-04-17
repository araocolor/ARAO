import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ColorItem } from "@/lib/color-types";

const COLOR_SELECT_CANDIDATES: string[] = [
  "id, product_code, creator, creator_icon, title, content, price, file_link, img_standard_full, img_standard_mid, img_standard_thumb, img_portrait_full, img_portrait_mid, img_portrait_thumb, img_arao_full, img_arao_mid, img_arao_thumb, like_count, created_at, is_admin",
  "id, product_code, creator, title, content, price, file_link, img_standard_full, img_standard_mid, img_standard_thumb, img_portrait_full, img_portrait_mid, img_portrait_thumb, img_arao_full, img_arao_mid, img_arao_thumb, like_count, created_at, is_admin",
  "id, product_code, creator_icon, title, content, price, file_link, img_standard_full, img_standard_mid, img_standard_thumb, img_portrait_full, img_portrait_mid, img_portrait_thumb, img_arao_full, img_arao_mid, img_arao_thumb, like_count, created_at, is_admin",
  "id, creator, creator_icon, title, content, price, file_link, img_standard_full, img_standard_mid, img_standard_thumb, img_portrait_full, img_portrait_mid, img_portrait_thumb, img_arao_full, img_arao_mid, img_arao_thumb, like_count, created_at, is_admin",
  "id, product_code, title, content, price, file_link, img_standard_full, img_standard_mid, img_standard_thumb, img_portrait_full, img_portrait_mid, img_portrait_thumb, img_arao_full, img_arao_mid, img_arao_thumb, like_count, created_at, is_admin",
  "id, creator, title, content, price, file_link, img_standard_full, img_standard_mid, img_standard_thumb, img_portrait_full, img_portrait_mid, img_portrait_thumb, img_arao_full, img_arao_mid, img_arao_thumb, like_count, created_at, is_admin",
  "id, creator_icon, title, content, price, file_link, img_standard_full, img_standard_mid, img_standard_thumb, img_portrait_full, img_portrait_mid, img_portrait_thumb, img_arao_full, img_arao_mid, img_arao_thumb, like_count, created_at, is_admin",
  "id, title, content, price, file_link, img_standard_full, img_standard_mid, img_standard_thumb, img_portrait_full, img_portrait_mid, img_portrait_thumb, img_arao_full, img_arao_mid, img_arao_thumb, like_count, created_at, is_admin",
];

type SelectError = { code?: string; message?: string } | null;

function isMissingOptionalColorColumn(error: SelectError): boolean {
  if (error?.code !== "42703") return false;
  const message = error.message ?? "";
  return message.includes("product_code") || message.includes("creator") || message.includes("creator_icon");
}

async function selectWithFallback<T>(
  runner: (columns: string) => Promise<{ data: T; error: SelectError }>
): Promise<T> {
  let lastMissingError: SelectError = null;

  for (const columns of COLOR_SELECT_CANDIDATES) {
    const { data, error } = await runner(columns);
    if (!error) return data;
    if (isMissingOptionalColorColumn(error)) {
      lastMissingError = error;
      continue;
    }
    throw error;
  }

  throw lastMissingError ?? new Error("colors 조회에 실패했습니다.");
}

export async function getColorIdByProductCode(productCode: string): Promise<string | null> {
  const code = productCode.trim().toLowerCase();
  if (!code) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("colors")
    .select("id")
    .eq("product_code", code)
    .maybeSingle<{ id: string }>();

  if (error) {
    if (isMissingOptionalColorColumn(error)) {
      return null;
    }
    throw error;
  }

  return data?.id ?? null;
}

export async function getColorList(limit = 30): Promise<ColorItem[]> {
  const supabase = createSupabaseAdminClient();
  const data = await selectWithFallback<ColorItem[] | null>(async (columns) =>
    (await supabase
      .from("colors")
      .select(columns)
      .order("created_at", { ascending: false })
      .limit(limit)) as unknown as { data: ColorItem[] | null; error: SelectError }
  );

  return data ?? [];
}

export async function getColorById(id: string): Promise<ColorItem | null> {
  const supabase = createSupabaseAdminClient();
  const data = await selectWithFallback<ColorItem | null>(async (columns) =>
    (await supabase
      .from("colors")
      .select(columns)
      .eq("id", id)
      .maybeSingle<ColorItem>()) as unknown as { data: ColorItem | null; error: SelectError }
  );

  return data ?? null;
}
