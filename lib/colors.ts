import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ColorItem } from "@/lib/color-types";

const COLOR_SELECT =
  "id, title, content, price, file_link, img_arao_full, img_arao_mid, img_arao_thumb, like_count, created_at, is_admin";

export async function getColorById(id: string): Promise<ColorItem | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("colors")
    .select(COLOR_SELECT)
    .eq("id", id)
    .maybeSingle<ColorItem>();

  if (error) {
    throw error;
  }

  return data ?? null;
}
