"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useNotificationCount } from "@/hooks/use-notification-count";
import { useAdminPendingCount } from "@/hooks/use-admin-pending-count";
import { NotificationDrawer } from "@/components/notification-drawer";
import type { NotificationItem } from "@/lib/notifications";

export function HeaderProfileLink() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const unreadCount = useNotificationCount(isSignedIn ?? false);
  const pendingCount = useAdminPendingCount(isSignedIn ?? false);

  // 드로어 상태
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 배지 카운트: items 중 is_read = false인 개수
  const badgeCount = items.filter((item) => !item.is_read).length;

  // 알림 목록 조회
  async function fetchNotificationItems() {
    try {
      setIsLoadingNotifications(true);
      const response = await fetch("/api/account/notifications");
      if (response.ok) {
        const data = (await response.json()) as {
          unreadCount: number;
          items: NotificationItem[];
        };
        setItems(data.items);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }

  // 드로어 오픈
  function openDrawer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setDrawerMounted(true);
    setDrawerOpen(true);
    fetchNotificationItems();
  }

  // 드로어 닫기
  function closeDrawer() {
    setDrawerOpen(false);
    closeTimerRef.current = setTimeout(() => {
      setDrawerMounted(false);
    }, 180); // CSS transition duration과 동일
  }

  // 정리
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // 클릭 핸들러
  function handleClick() {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    openDrawer();
  }

  return (
    <>
      <button
        className={`header-profile-link ${isSignedIn ? "signed-in" : ""}`}
        onClick={handleClick}
        aria-label="알림"
        type="button"
      >
        <span className="header-profile-icon" aria-hidden="true">
          <span className="header-profile-head" />
          <span className="header-profile-body" />
        </span>
        {isSignedIn && badgeCount > 0 && (
          <span className="header-profile-badge">{badgeCount}</span>
        )}
      </button>

      {/* 알림 드로어 */}
      {drawerMounted && (
        <NotificationDrawer
          isOpen={drawerOpen}
          isMounted={drawerMounted}
          items={items}
          onClose={closeDrawer}
        />
      )}
    </>
  );
}
