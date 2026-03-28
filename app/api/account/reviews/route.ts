import { auth, currentUser } from "@clerk/nextjs/server";
import { getReviews, createReview } from "@/lib/reviews";
import { syncProfile } from "@/lib/profiles";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const { reviews, total } = await getReviews(page, limit);

    return NextResponse.json({ reviews, total, page, limit });
  } catch (error) {
    console.error("GET /api/account/reviews error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { category, title, content } = body;

    if (!category || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const review = await createReview(profile.id, category, title, content);

    if (!review) {
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("POST /api/account/reviews error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
