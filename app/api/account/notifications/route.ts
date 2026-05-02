import { auth, currentUser } from "@clerk/nextjs/server";
import { getNotificationsForProfile } from "@/lib/notifications";
import { syncProfile } from "@/lib/profiles";
import { NextResponse } from "next/server";
import type { NotificationItem } from "@/lib/notifications";

function getImportantPriority(item: NotificationItem): number {
  if (item.type === "consulting") return 0;
  if (item.type === "review_comment") return 1;
  if (item.type === "gallery_reply") return 1;
  if (item.type === "review_reply") return 2;
  if (item.type === "gallery_comment_deleted") return 2;
  return 99;
}

function selectInitialNotificationItems(items: NotificationItem[]): NotificationItem[] {
  const sortedItems = [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const importantItems = sortedItems
    .filter((item) => item.type !== "settings")
    .sort((a, b) => {
      const pa = getImportantPriority(a);
      const pb = getImportantPriority(b);
      if (pa !== pb) return pa - pb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 3);

  const importantIds = new Set(importantItems.map((item) => item.id));
  const remainingItems = sortedItems.filter((item) => !importantIds.has(item.id));

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const recentSevenDays = remainingItems
    .filter((item) => new Date(item.created_at).getTime() >= sevenDaysAgo)
    .slice(0, 5);

  const recentSevenIds = new Set(recentSevenDays.map((item) => item.id));
  const recentThirtyDays = remainingItems
    .filter((item) => {
      if (recentSevenIds.has(item.id)) return false;
      const createdAt = new Date(item.created_at).getTime();
      return createdAt < sevenDaysAgo && createdAt >= thirtyDaysAgo;
    })
    .slice(0, 5);

  return [...importantItems, ...recentSevenDays, ...recentThirtyDays];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
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

    // 모든 알림 소스 집계 (settings, consulting, notifications 테이블)
    const { items, unreadCount } = await getNotificationsForProfile(profile.id, {
      username: profile.username,
      password_hash: profile.password_hash,
      phone: profile.phone,
      notification_enabled: profile.notification_enabled,
    });

    const responseItems = mode === "initial13" ? selectInitialNotificationItems(items) : items;

    return NextResponse.json({
      unreadCount,
      items: responseItems,
      iconImage: profile.icon_image ?? null,
      username: profile.username ?? null,
      email: profile.email ?? null,
      notificationEnabled: profile.notification_enabled ?? true,
      notificationCommentEnabled: profile.notif_comment_enabled ?? true,
      notificationLikeEnabled: profile.notif_like_enabled ?? true,
      role: profile.role ?? null,
    });
  } catch (error) {
    console.error("GET /api/account/notifications error:", error);
    return NextResponse.json({ unreadCount: 0, items: [] });
  }
}
