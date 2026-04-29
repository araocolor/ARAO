"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useHeaderSessionStore } from "@/stores/header-session-store";

type HomeEntryLoaderProps = {
  children: ReactNode;
};
const ENTRY_LOADER_MS = 1000;
const NOTIFICATION_CACHE_PREFIX = "header-notifications-cache-v1";

type NotificationCachePayload = {
  unreadCount: number;
  items: unknown[];
  iconImage?: string | null;
  username?: string | null;
  email?: string | null;
  notificationEnabled: boolean;
  role?: string | null;
};

type NotificationCacheSnapshot = {
  data: NotificationCachePayload;
  ts: number;
};

type GeneralProfileResponse = {
  iconImage?: string | null;
  email?: string | null;
  role?: string | null;
  tier?: string | null;
  username?: string | null;
  notificationEnabled?: boolean;
  unreadCount?: number;
};

function hasLandingCache(): boolean {
  try {
    return !!(
      sessionStorage.getItem("color-items") ||
      sessionStorage.getItem("color-list-cache") ||
      sessionStorage.getItem("user-review-list-cache-arao")
    );
  } catch {
    return false;
  }
}

function hasValueInLocalStorage(key: string): boolean {
  try {
    const raw = localStorage.getItem(key);
    return typeof raw === "string" && raw.trim().length > 0;
  } catch {
    return false;
  }
}

function hasMemberCache(userId: string): boolean {
  return (
    hasValueInLocalStorage(`header-avatar:${userId}`) &&
    hasValueInLocalStorage(`header-email:${userId}`) &&
    hasValueInLocalStorage(`header-role:${userId}`) &&
    hasValueInLocalStorage(`header-tier:${userId}`) &&
    hasValueInLocalStorage(`header-username:${userId}`)
  );
}

function getNotificationCacheKey(userId: string): string {
  return `${NOTIFICATION_CACHE_PREFIX}:${userId}`;
}

function hasNotificationEnabledCache(userId: string): boolean {
  try {
    const raw = sessionStorage.getItem(getNotificationCacheKey(userId));
    if (!raw) return false;
    const parsed = JSON.parse(raw) as NotificationCacheSnapshot;
    return (
      typeof parsed?.data?.notificationEnabled === "boolean" &&
      Number.isFinite(parsed?.data?.unreadCount)
    );
  } catch {
    return false;
  }
}

function getCachedUnreadCount(userId: string): number | null {
  try {
    const raw = sessionStorage.getItem(getNotificationCacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NotificationCacheSnapshot;
    if (!Number.isFinite(parsed?.data?.unreadCount)) return null;
    return Math.max(0, Math.trunc(Number(parsed.data.unreadCount)));
  } catch {
    return null;
  }
}

export function HomeEntryLoader({ children }: HomeEntryLoaderProps) {
  const [ready, setReady] = useState(false);
  const { isSignedIn, user } = useUser();
  const hydrateHeaderSession = useHeaderSessionStore((state) => state.hydrateForUser);
  const setHeaderAvatar = useHeaderSessionStore((state) => state.setAvatar);
  const setHeaderUsername = useHeaderSessionStore((state) => state.setUsername);
  const setHeaderEmail = useHeaderSessionStore((state) => state.setEmail);
  const setHeaderRole = useHeaderSessionStore((state) => state.setRole);
  const setHeaderTier = useHeaderSessionStore((state) => state.setTier);
  const setHeaderBadgeCount = useHeaderSessionStore((state) => state.setBadgeCount);

  useEffect(() => {
    const cached = hasLandingCache();
    const delay = cached ? ENTRY_LOADER_MS : ENTRY_LOADER_MS;
    const timer = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isSignedIn || !user?.id) return;

    let cancelled = false;
    const userId = user.id;
    hydrateHeaderSession(userId);

    async function warmupMemberCache() {
      const memberCached = hasMemberCache(userId);
      const notificationCached = hasNotificationEnabledCache(userId);
      if (notificationCached) {
        const cachedUnreadCount = getCachedUnreadCount(userId);
        if (cachedUnreadCount !== null) setHeaderBadgeCount(cachedUnreadCount);
      }
      if (memberCached && notificationCached) return;

      try {
        const response = await fetch("/api/account/general", { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as GeneralProfileResponse;

        if (data.iconImage !== undefined) setHeaderAvatar(data.iconImage ?? null);
        if (data.username !== undefined) setHeaderUsername(data.username ?? null);
        if (data.email !== undefined) setHeaderEmail(data.email ?? null);
        if (data.role !== undefined) setHeaderRole(data.role ?? null);
        if (data.tier !== undefined) setHeaderTier(data.tier ?? null);
        const unreadCount = Number.isFinite(data.unreadCount) ? Math.max(0, Math.trunc(Number(data.unreadCount))) : 0;
        setHeaderBadgeCount(unreadCount);

        if (typeof data.notificationEnabled === "boolean") {
          try {
            const snapshot: NotificationCacheSnapshot = {
              data: {
                unreadCount,
                items: [],
                iconImage: data.iconImage ?? null,
                username: data.username ?? null,
                email: data.email ?? null,
                notificationEnabled: data.notificationEnabled,
                role: data.role ?? null,
              },
              ts: Date.now(),
            };
            sessionStorage.setItem(getNotificationCacheKey(userId), JSON.stringify(snapshot));
          } catch {}
        }
      } catch {}
    }

    void warmupMemberCache();
    return () => {
      cancelled = true;
    };
  }, [
    isSignedIn,
    user?.id,
    hydrateHeaderSession,
    setHeaderAvatar,
    setHeaderUsername,
    setHeaderEmail,
    setHeaderRole,
    setHeaderTier,
    setHeaderBadgeCount,
  ]);

  if (!ready) {
    return (
      <main className="landing-entry-loader" aria-label="로딩">
        <div className="landing-entry-loader-bar-track" aria-hidden="true">
          <span className="landing-entry-loader-bar-fill" />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
