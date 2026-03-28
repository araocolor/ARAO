import { auth, currentUser } from "@clerk/nextjs/server";
import { getUnreadInquiryCount, getNotificationItems } from "@/lib/consulting";
import { syncProfile } from "@/lib/profiles";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ unreadCount: 0, items: [] });
    }

    const user = await currentUser();
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json({ unreadCount: 0, items: [] });
    }

    const profile = await syncProfile({
      email: user.emailAddresses[0].emailAddress,
      fullName: user.fullName,
    });

    if (!profile) {
      return NextResponse.json({ unreadCount: 0, items: [] });
    }

    // 병렬로 카운트와 목록 조회
    const [unreadCount, items] = await Promise.all([
      getUnreadInquiryCount(profile.id),
      getNotificationItems(profile.id, 20),
    ]);

    return NextResponse.json({ unreadCount, items });
  } catch (error) {
    console.error("GET /api/account/notifications error:", error);
    return NextResponse.json({ unreadCount: 0, items: [] });
  }
}
