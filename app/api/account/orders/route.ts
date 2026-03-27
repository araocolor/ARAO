import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { syncProfile } from "@/lib/profiles";
import { getOrdersByUser } from "@/lib/orders";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  if (!user?.emailAddresses?.[0]) {
    return NextResponse.json({ message: "User email not found" }, { status: 400 });
  }

  const profile = await syncProfile({
    email: user.emailAddresses[0].emailAddress,
    fullName: user.fullName || undefined,
  });
  if (!profile) {
    return NextResponse.json({ message: "Profile not found" }, { status: 404 });
  }

  // Get query params
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");

  try {
    const orders = await getOrdersByUser(profile.id, page, limit);
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ message: "Failed to fetch orders" }, { status: 500 });
  }
}
