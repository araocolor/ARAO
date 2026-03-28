import { auth, currentUser } from "@clerk/nextjs/server";
import { toggleReviewLike } from "@/lib/reviews";
import { syncProfile } from "@/lib/profiles";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    const result = await toggleReviewLike(id, profile.id);

    if (!result) {
      return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/account/reviews/[id]/likes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
