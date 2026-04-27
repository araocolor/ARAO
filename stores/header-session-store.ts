"use client";

import { create } from "zustand";

type HeaderSessionStore = {
  activeUserId: string | null;
  badgeCount: number;
  avatar: string | null;
  username: string | null;
  usernameReady: boolean;
  email: string | null;
  role: string | null;
  tier: string | null;
  hydrateForUser: (userId: string | null | undefined) => void;
  setBadgeCount: (count: number) => void;
  setAvatar: (avatar: string | null) => void;
  setUsername: (username: string | null) => void;
  setUsernameReady: (ready: boolean) => void;
  setEmail: (email: string | null) => void;
  setRole: (role: string | null) => void;
  setTier: (tier: string | null) => void;
  clearActiveUserCache: () => void;
};

function normalizeUserId(userId: string | null | undefined): string | null {
  if (typeof userId !== "string") return null;
  const trimmed = userId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getBadgeKey(userId: string): string {
  return `header-badge-count:${userId}`;
}

function getAvatarKey(userId: string): string {
  return `header-avatar:${userId}`;
}

function getUsernameKey(userId: string): string {
  return `header-username:${userId}`;
}

function getEmailKey(userId: string): string {
  return `header-email:${userId}`;
}

function getRoleKey(userId: string): string {
  return `header-role:${userId}`;
}

function getTierKey(userId: string): string {
  return `header-tier:${userId}`;
}

function readStringFromStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw && raw.trim().length > 0 ? raw : null;
  } catch {
    return null;
  }
}

function readBadgeFromStorage(userId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(getBadgeKey(userId));
    const parsed = Number(raw ?? 0);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(Math.trunc(parsed), 0);
  } catch {
    return 0;
  }
}

export const useHeaderSessionStore = create<HeaderSessionStore>((set, get) => ({
  activeUserId: null,
  badgeCount: 0,
  avatar: null,
  username: null,
  usernameReady: false,
  email: null,
  role: null,
  tier: null,

  hydrateForUser: (userId) => {
    const normalized = normalizeUserId(userId);
    if (!normalized) {
      set({ activeUserId: null, badgeCount: 0, avatar: null, username: null, usernameReady: false, email: null, role: null, tier: null });
      return;
    }
    const badgeCount = readBadgeFromStorage(normalized);
    const avatar = readStringFromStorage(getAvatarKey(normalized));
    const username = readStringFromStorage(getUsernameKey(normalized));
    const email = readStringFromStorage(getEmailKey(normalized));
    const role = readStringFromStorage(getRoleKey(normalized));
    const tier = readStringFromStorage(getTierKey(normalized));
    set({ activeUserId: normalized, badgeCount, avatar, username, usernameReady: username !== null, email, role, tier });
  },

  setBadgeCount: (count) => {
    const normalizedCount = Math.max(Math.trunc(Number(count) || 0), 0);
    const activeUserId = get().activeUserId;
    set({ badgeCount: normalizedCount });
    if (!activeUserId || typeof window === "undefined") return;
    try {
      localStorage.setItem(getBadgeKey(activeUserId), String(normalizedCount));
    } catch {}
  },

  setAvatar: (avatar) => {
    const activeUserId = get().activeUserId;
    const normalizedAvatar = avatar && avatar.trim().length > 0 ? avatar : null;
    set({ avatar: normalizedAvatar });
    if (!activeUserId || typeof window === "undefined") return;
    try {
      if (normalizedAvatar) localStorage.setItem(getAvatarKey(activeUserId), normalizedAvatar);
      else localStorage.removeItem(getAvatarKey(activeUserId));
    } catch {}
  },

  setUsername: (username) => {
    const activeUserId = get().activeUserId;
    const normalizedUsername = username && username.trim().length > 0 ? username : null;
    set({ username: normalizedUsername, usernameReady: true });
    if (!activeUserId || typeof window === "undefined") return;
    try {
      if (normalizedUsername) localStorage.setItem(getUsernameKey(activeUserId), normalizedUsername);
      else localStorage.removeItem(getUsernameKey(activeUserId));
    } catch {}
  },

  setUsernameReady: (ready) => {
    set({ usernameReady: ready });
  },

  setEmail: (email) => {
    const activeUserId = get().activeUserId;
    const normalizedEmail = email && email.trim().length > 0 ? email : null;
    set({ email: normalizedEmail });
    if (!activeUserId || typeof window === "undefined") return;
    try {
      if (normalizedEmail) localStorage.setItem(getEmailKey(activeUserId), normalizedEmail);
      else localStorage.removeItem(getEmailKey(activeUserId));
    } catch {}
  },

  setRole: (role) => {
    const activeUserId = get().activeUserId;
    const normalizedRole = role && role.trim().length > 0 ? role : null;
    set({ role: normalizedRole });
    if (!activeUserId || typeof window === "undefined") return;
    try {
      if (normalizedRole) localStorage.setItem(getRoleKey(activeUserId), normalizedRole);
      else localStorage.removeItem(getRoleKey(activeUserId));
    } catch {}
  },

  setTier: (tier) => {
    const activeUserId = get().activeUserId;
    const normalizedTier = tier && tier.trim().length > 0 ? tier : null;
    set({ tier: normalizedTier });
    if (!activeUserId || typeof window === "undefined") return;
    try {
      if (normalizedTier) localStorage.setItem(getTierKey(activeUserId), normalizedTier);
      else localStorage.removeItem(getTierKey(activeUserId));
    } catch {}
  },

  clearActiveUserCache: () => {
    const activeUserId = get().activeUserId;
    if (activeUserId && typeof window !== "undefined") {
      try {
        localStorage.removeItem(getBadgeKey(activeUserId));
        localStorage.removeItem(getAvatarKey(activeUserId));
        localStorage.removeItem(getUsernameKey(activeUserId));
        localStorage.removeItem(getEmailKey(activeUserId));
        localStorage.removeItem(getRoleKey(activeUserId));
        localStorage.removeItem(getTierKey(activeUserId));
      } catch {}
    }
    set({ activeUserId: null, badgeCount: 0, avatar: null, username: null, usernameReady: false, email: null, role: null, tier: null });
  },
}));
