import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncProfile } from "@/lib/profiles";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;
  const profile = await syncProfile({ email, fullName });

  if (!profile) return NextResponse.json({ message: "회원 정보를 찾을 수 없습니다." }, { status: 404 });

  const body = (await request.json()) as { url?: string };
  if (!body.url || typeof body.url !== "string") {
    return NextResponse.json({ message: "유효한 이미지 URL이 없습니다." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // random_avatars 테이블에 해당 URL이 존재하는지 검증
  const { data: avatar } = await supabase
    .from("random_avatars")
    .select("url")
    .eq("url", body.url)
    .maybeSingle();

  if (!avatar) return NextResponse.json({ message: "유효하지 않은 랜덤 아바타입니다." }, { status: 400 });

  const { error } = await supabase
    .from("profiles")
    .update({ icon_image: body.url })
    .eq("id", profile.id);

  if (error) return NextResponse.json({ message: "저장 중 오류가 발생했습니다." }, { status: 500 });

  return NextResponse.json({ message: "저장되었습니다.", iconImage: body.url });
}
