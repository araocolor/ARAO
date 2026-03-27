import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { syncProfile } from "@/lib/profiles";
import { getOrderById } from "@/lib/orders";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  try {
    const order = await getOrderById(id, profile.id);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ message: "Failed to fetch order" }, { status: 500 });
  }
}
