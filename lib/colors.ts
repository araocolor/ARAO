import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ColorItem } from "@/lib/color-types";

const COLOR_SELECT =
  "id, product_code, title, content, price, file_link, img_standard_full, img_standard_mid, img_standard_thumb, img_portrait_full, img_portrait_mid, img_portrait_thumb, img_arao_full, img_arao_mid, img_arao_thumb, like_count, created_at, is_admin";
const COLOR_SELECT_LEGACY =
  "id, title, content, price, file_link, img_standard_full, img_standard_mid, img_standard_thumb, img_portrait_full, img_portrait_mid, img_portrait_thumb, img_arao_full, img_arao_mid, img_arao_thumb, like_count, created_at, is_admin";

function isMissingProductCodeColumn(error: { code?: string; message?: string } | null): boolean {
  return error?.code === "42703" && (error.message ?? "").includes("product_code");
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
    if (isMissingProductCodeColumn(error)) {
      return null;
    }
    throw error;
  }

  return data?.id ?? null;
}

export async function getColorList(limit = 30): Promise<ColorItem[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("colors")
    .select(COLOR_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingProductCodeColumn(error)) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("colors")
        .select(COLOR_SELECT_LEGACY)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (legacyError) throw legacyError;
      return legacyData ?? [];
    }
    throw error;
  }
  return data ?? [];
}

export async function getColorById(id: string): Promise<ColorItem | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("colors")
    .select(COLOR_SELECT)
    .eq("id", id)
    .maybeSingle<ColorItem>();

  if (error) {
    if (isMissingProductCodeColumn(error)) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("colors")
        .select(COLOR_SELECT_LEGACY)
        .eq("id", id)
        .maybeSingle<ColorItem>();

      if (legacyError) throw legacyError;
      return legacyData ?? null;
    }
    throw error;
  }

  return data ?? null;
}
