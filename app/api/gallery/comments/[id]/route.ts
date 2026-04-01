import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { syncProfile } from "@/lib/profiles";
import { deleteGalleryComment } from "@/lib/gallery-interactions";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? user?.primaryEmailAddress?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "User info not found" }, { status: 400 });
    }

    const profile = await syncProfile({ email, fullName: user?.fullName ?? null });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const { id } = await params;
    const result = await deleteGalleryComment(id, profile.id);

    if (!result) {
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE /api/gallery/comments/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
