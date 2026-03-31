import { NextResponse } from "next/server";
import { getGalleryItemLikers } from "@/lib/gallery-interactions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ category: string; index: string }> }
) {
  try {
    const { category, index } = await params;
    const parsedIndex = parseInt(index, 10);

    if (Number.isNaN(parsedIndex)) {
      return NextResponse.json({ error: "Invalid index" }, { status: 400 });
    }

    const users = await getGalleryItemLikers(category, parsedIndex);
    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/gallery/[category]/[index]/likes/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
