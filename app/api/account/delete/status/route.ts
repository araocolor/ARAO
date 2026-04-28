import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { syncProfile } from "@/lib/profiles";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ pending: false });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  if (!email) {
    return NextResponse.json({ pending: false });
  }

  const profile = await syncProfile({ email });
  if (!profile || !profile.deleted_at) {
    return NextResponse.json({ pending: false });
  }

  return NextResponse.json({
    pending: true,
    deletedAt: profile.deleted_at,
    deleteScheduledAt: profile.delete_scheduled_at,
    email: profile.email,
  });
}
