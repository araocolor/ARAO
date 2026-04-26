import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncProfile } from "@/lib/profiles";

const AVATAR_BUCKET = process.env.SUPABASE_AVATAR_BUCKET || "board_image";
const AVATAR_CACHE_CONTROL = "31536000";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function normalizeIconImage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase().startsWith("data:")) return null;
  return trimmed;
}

function getAvatarExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    case "image/jpeg":
    default:
      return "jpg";
  }
}

function parseAvatarDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return null;
  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_AVATAR_MIME_TYPES.has(mimeType)) return null;
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > MAX_AVATAR_BYTES) return null;
  return { mimeType, buffer };
}

function getStoragePathFromPublicUrl(iconImage: string | null | undefined): string | null {
  if (!iconImage) return null;

  try {
    const url = new URL(iconImage);
    const publicPrefix = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
    const index = url.pathname.indexOf(publicPrefix);
    if (index < 0) return null;
    const encodedPath = url.pathname.slice(index + publicPrefix.length);
    if (!encodedPath) return null;
    return decodeURIComponent(encodedPath);
  } catch {
    return null;
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ iconImage: null }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;
  const profile = await syncProfile({ email, fullName });

  return NextResponse.json(
    {
      iconImage: normalizeIconImage(profile?.icon_image),
      username: profile?.username ?? null,
      tier: profile?.tier ?? "general",
      role: profile?.role ?? "member",
    },
    { headers: { "Cache-Control": "private, max-age=60" } }
  );
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;
  const profile = await syncProfile({ email, fullName });

  if (!profile) {
    return NextResponse.json({ message: "회원 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as { dataUrl?: string };

    if (!body.dataUrl || !body.dataUrl.startsWith("data:image/")) {
      return NextResponse.json({ message: "유효한 이미지 데이터가 없습니다." }, { status: 400 });
    }
    const parsed = parseAvatarDataUrl(body.dataUrl);
    if (!parsed) {
      return NextResponse.json({ message: "이미지 형식이 올바르지 않습니다." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const ext = getAvatarExtension(parsed.mimeType);
    const avatarPath = `avatars/${profile.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(avatarPath, parsed.buffer, {
        contentType: parsed.mimeType,
        cacheControl: AVATAR_CACHE_CONTROL,
        upsert: false,
      });

    if (uploadError) {
      console.error("Avatar storage upload error:", uploadError);
      return NextResponse.json({ message: "아이콘 업로드 중 오류가 발생했습니다." }, { status: 400 });
    }

    const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(avatarPath);
    const iconImage = publicUrlData?.publicUrl ?? null;
    if (!iconImage) {
      return NextResponse.json({ message: "아이콘 URL 생성에 실패했습니다." }, { status: 500 });
    }

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ icon_image: iconImage })
      .eq("id", profile.id);

    if (profileUpdateError) {
      console.error("Avatar save error:", profileUpdateError);
      try {
        await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath]);
      } catch {}
      return NextResponse.json({ message: "아이콘 저장 중 오류가 발생했습니다." }, { status: 400 });
    }

    return NextResponse.json({ message: "아이콘이 저장되었습니다.", iconImage });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ message: "파일 업로드 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;
  const profile = await syncProfile({ email, fullName });

  if (!profile) {
    return NextResponse.json({ message: "회원 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const avatarPath = getStoragePathFromPublicUrl(profile.icon_image);

    if (avatarPath) {
      const { error: storageDeleteError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .remove([avatarPath]);

      if (storageDeleteError) {
        console.error("Avatar storage delete error:", storageDeleteError);
        return NextResponse.json({ message: "스토리지 이미지 삭제 중 오류가 발생했습니다." }, { status: 400 });
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ icon_image: null })
      .eq("id", profile.id);

    if (error) {
      console.error("Avatar delete error:", error);
      return NextResponse.json({ message: "아이콘 삭제 중 오류가 발생했습니다." }, { status: 400 });
    }

    return NextResponse.json({ message: "아이콘이 삭제되었습니다.", iconImage: null });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json({ message: "아이콘 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
