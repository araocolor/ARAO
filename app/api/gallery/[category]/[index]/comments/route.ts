import { auth, currentUser } from "@clerk/nextjs/server";
import { getGalleryComments, createGalleryComment } from "@/lib/gallery-interactions";
import { syncProfile } from "@/lib/profiles";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string; index: string }> }
) {
  try {
    const { category, index } = await params;

    const comments = await getGalleryComments(category, parseInt(index));

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("GET /api/gallery/[category]/[index]/comments error:", error);
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
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const comment = await createGalleryComment(category, parseInt(index), profile.id, content);

    if (!comment) {
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/gallery/[category]/[index]/comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
