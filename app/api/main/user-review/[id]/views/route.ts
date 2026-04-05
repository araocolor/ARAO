import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { incrementUserReviewViewCount } from "@/lib/user-reviews";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  await incrementUserReviewViewCount(id);
  return NextResponse.json({ ok: true });
}
