import { auth, currentUser } from "@clerk/nextjs/server";
import { getGalleryItemLikeStatus, toggleGalleryItemLike } from "@/lib/gallery-interactions";
import { syncProfile } from "@/lib/profiles";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string; index: string }> }
) {
  try {
    const { category, index } = await params;
    const { searchParams } = new URL(request.url);

    let profileId: string | undefined;

    // 로그인한 경우 프로필 ID 조회
    const { userId } = await auth();
    if (userId) {
      const user = await currentUser();
      if (user?.emailAddresses?.[0]?.emailAddress) {
        const profile = await syncProfile({
          email: user.emailAddresses[0].emailAddress,
          fullName: user.fullName,
        });
        profileId = profile?.id;
      }
    }

    const status = await getGalleryItemLikeStatus(category, parseInt(index), profileId);

    return NextResponse.json(status);
  } catch (error) {
    console.error("GET /api/gallery/[category]/[index]/likes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ category: string; index: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json({ error: "User info not found" }, { status: 400 });
    }

    const profile = await syncProfile({
      email: user.emailAddresses[0].emailAddress,
      fullName: user.fullName,
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const { category, index } = await params;

    const result = await toggleGalleryItemLike(category, parseInt(index), profile.id);

    if (!result) {
      return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/gallery/[category]/[index]/likes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
