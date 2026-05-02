"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Bell, Heart, MessageCircle, ShoppingBag } from "lucide-react";
import { type NotificationItem } from "@/lib/notifications";

type NotificationDrawerProps = {
  isOpen: boolean;
  isMounted: boolean;
  items: NotificationItem[];
  isLoading?: boolean;
  username: string | null;
  email: string | null;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onRollbackRead: (id: string) => void;
  onRequestFullLoad?: () => Promise<void>;
  notificationSettings: NotificationSettings;
  onNotificationSettingsChange: (next: NotificationSettings) => void;
};

type NotificationFilter = "all" | "comment" | "like" | "other";
export type NotificationSettings = {
  allEnabled: boolean;
  commentEnabled: boolean;
  likeEnabled: boolean;
  orderConsultingEnabled: true;
};

const COMMENT_TYPES = new Set(["review_comment", "review_reply", "gallery_reply"]);
const LIKE_TYPES = new Set(["gallery_like", "review_like", "review_comment_like"]);

function appendQueryParam(link: string, key: string, value: string): string {
  const [beforeHash, hash = ""] = link.split("#", 2);
  const separator = beforeHash.includes("?") ? "&" : "?";
  const next = `${beforeHash}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  return hash ? `${next}#${hash}` : next;
}

function hasQueryParam(link: string, key: string): boolean {
  try {
    const url = new URL(link, "https://arao.local");
    return url.searchParams.has(key);
  } catch {
    return link.includes(`${key}=`);
  }
}

function getCommentIdFromSourceId(item: NotificationItem): string | null {
  if (item.type !== "review_comment" && item.type !== "review_comment_like") return null;
  const sourceId = typeof item.source_id === "string" ? item.source_id.trim() : "";
  if (!sourceId) return null;
  const parts = sourceId.split(":");
  if (parts.length < 2) return null;
  const candidate = parts[1]?.trim();
  return candidate && candidate.length > 0 ? candidate : null;
}

function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex < 0) return email;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  return `${local.slice(0, 2)}***${domain}`;
}

// 알림 제목에서 "{이름}님이" 앞부분을 bold 처리
function formatTitle(title: string): React.ReactNode {
  const t = title.endsWith(".") ? title : title + ".";
  const idx = t.indexOf("님이");
  if (idx <= 0) return t;
  const name = t.slice(0, idx);
  const maskedName = name.includes("@") ? maskEmail(name) : name;
  const rest = t.slice(idx);
  return <><strong>{maskedName}</strong>{rest}</>;
}

function getSenderName(title: string): string | null {
  const idx = title.indexOf("님이");
  if (idx <= 0) return null;
  const name = title.slice(0, idx).trim();
  return name || null;
}

// 상대 시간 포맷 함수
function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}초전`;
  if (minutes < 60) return `${minutes}분전`;
  if (hours < 24) return `${hours}시간전`;

  const remainingHours = hours % 24;
  if (days < 30) {
    return remainingHours > 0
      ? `${days}일 ${remainingHours}시간전`
      : `${days}일전`;
  }

  // 30일 이상은 날짜로 표시
  return new Date(isoString).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

function getPeriodLabel(isoString: string): string {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘";
  if (diffDays <= 7) return "이번 주";
  if (now.getMonth() === then.getMonth() && now.getFullYear() === then.getFullYear()) return "이번 달";
  return "이전";
}

const PERIOD_ORDER = ["오늘", "이번 주", "이번 달", "이전"];

// 알림 타입별 라벨 매핑
const TYPE_LABEL: Record<string, string> = {
  settings: "계정 설정",
  order_shipped: "주문 발송",
  order_cancelled: "결제 취소",
  consulting: "1:1 상담",
  review_reply: "사용자 후기",
  review_like: "사용자 후기",
  review_comment: "사용자 후기",
  review_comment_like: "사용자 후기",
  gallery_like: "갤러리",
  gallery_reply: "갤러리",
  gallery_comment_deleted: "갤러리",
};

// 알림 타입별 아이콘 이모지
const TYPE_ICON: Record<string, string> = {
  settings: "⚙️",
  order_shipped: "📦",
  order_cancelled: "⚠️",
  consulting: "💬",
  review_reply: "📝",
  review_like: "❤️",
  review_comment: "💬",
  review_comment_like: "❤️",
  gallery_like: "❤️",
  gallery_reply: "💬",
  gallery_comment_deleted: "🗑️",
};

export function NotificationDrawer({
  isOpen,
  isMounted,
  items,
  isLoading = false,
  username,
  email,
  onClose,
  onMarkRead,
  onRollbackRead,
  onRequestFullLoad,
  notificationSettings,
  onNotificationSettingsChange,
}: NotificationDrawerProps) {
  const [optimisticReadIds, setOptimisticReadIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [showAllRecentSevenDays, setShowAllRecentSevenDays] = useState(false);
  const [recentThirtyLoadSteps, setRecentThirtyLoadSteps] = useState(0);
  const [filterLoadSteps, setFilterLoadSteps] = useState<Record<Exclude<NotificationFilter, "all">, number>>({
    comment: 0,
    like: 0,
    other: 0,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
    return () => setPortalTarget(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setActiveFilter("all");
      setShowAllRecentSevenDays(false);
      setRecentThirtyLoadSteps(0);
      setFilterLoadSteps({ comment: 0, like: 0, other: 0 });
      setSettingsOpen(false);
      return;
    }
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(e: MouseEvent | TouchEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isMounted || !portalTarget) return null;
  const headerDisplayName = username || (email ? maskEmail(email) : "");
  const sortedItems = [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleItemClick = (item: NotificationItem) => {
    onClose();
  };

  // 중요알림 우선순위
  const getImportantPriority = (item: NotificationItem): number => {
    if (item.type === "consulting") return 0;
    if (item.type === "review_comment") return 1;
    if (item.type === "gallery_reply") return 1;
    if (item.type === "review_reply") return 2;
    if (item.type === "gallery_comment_deleted") return 2;
    return 99;
  };

  const importantItems = sortedItems
    .filter((item) => item.type !== "settings")
    .sort((a, b) => {
      const pa = getImportantPriority(a);
      const pb = getImportantPriority(b);
      if (pa !== pb) return pa - pb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 3);

  // 중요알림 이후 항목 (최근7일)
  const importantIds = new Set(importantItems.map((i) => i.id));
  const remainingItems = sortedItems.filter((i) => !importantIds.has(i.id));

  // 7일 / 30일 필터링
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const allRecentSevenDays = remainingItems.filter(
    (i) => new Date(i.created_at).getTime() >= sevenDaysAgo
  );
  const allRecentThirtyDays = remainingItems.filter(
    (i) =>
      new Date(i.created_at).getTime() < sevenDaysAgo &&
      new Date(i.created_at).getTime() >= thirtyDaysAgo
  );

  // 최근7일 섹션: 기본 5개, 더보기 클릭 시 7일 전체
  const recentSevenVisibleItems = showAllRecentSevenDays
    ? allRecentSevenDays
    : allRecentSevenDays.slice(0, 5);

  // 최근30일(8일~30일): 기본 5개, 더보기 클릭 시 30개씩 추가
  const recentThirtyVisibleCount = 5 + recentThirtyLoadSteps * 30;
  const recentThirtyVisibleItems = allRecentThirtyDays.slice(0, recentThirtyVisibleCount);

  function isCommentItem(item: NotificationItem): boolean {
    return COMMENT_TYPES.has(item.type);
  }

  function isLikeItem(item: NotificationItem): boolean {
    return LIKE_TYPES.has(item.type);
  }

  function isOtherItem(item: NotificationItem): boolean {
    return !isCommentItem(item) && !isLikeItem(item);
  }

  const filteredItemsByTab = {
    comment: sortedItems.filter((item) => notificationSettings.commentEnabled && isCommentItem(item)),
    like: sortedItems.filter((item) => notificationSettings.likeEnabled && isLikeItem(item)),
    other: sortedItems.filter((item) => {
      if (!isOtherItem(item)) return false;
      if (item.type === "consulting") return true;
      if (item.type.startsWith("order_")) return true;
      return notificationSettings.allEnabled;
    }),
  };

  const currentFilteredItems =
    activeFilter === "all" ? [] : filteredItemsByTab[activeFilter];
  const currentLoadSteps =
    activeFilter === "all" ? 0 : filterLoadSteps[activeFilter];
  const currentVisibleCount =
    activeFilter === "all" ? 0 : 10 + currentLoadSteps * 30;
  const currentVisibleItems =
    activeFilter === "all" ? [] : currentFilteredItems.slice(0, currentVisibleCount);

  const visibleImportantItems = importantItems.filter((item) => {
    if (isCommentItem(item)) return notificationSettings.commentEnabled;
    if (isLikeItem(item)) return notificationSettings.likeEnabled;
    if (item.type === "consulting" || item.type.startsWith("order_")) return true;
    return notificationSettings.allEnabled;
  });
  const visibleRecentSevenItems = recentSevenVisibleItems.filter((item) => {
    if (isCommentItem(item)) return notificationSettings.commentEnabled;
    if (isLikeItem(item)) return notificationSettings.likeEnabled;
    if (item.type === "consulting" || item.type.startsWith("order_")) return true;
    return notificationSettings.allEnabled;
  });
  const visibleRecentThirtyItems = recentThirtyVisibleItems.filter((item) => {
    if (isCommentItem(item)) return notificationSettings.commentEnabled;
    if (isLikeItem(item)) return notificationSettings.likeEnabled;
    if (item.type === "consulting" || item.type.startsWith("order_")) return true;
    return notificationSettings.allEnabled;
  });

  function handleToggleAllEnabled(nextEnabled: boolean) {
    if (!nextEnabled) {
      onNotificationSettingsChange({
        allEnabled: false,
        commentEnabled: false,
        likeEnabled: false,
        orderConsultingEnabled: true,
      });
      return;
    }
    onNotificationSettingsChange({
      allEnabled: true,
      commentEnabled: true,
      likeEnabled: true,
      orderConsultingEnabled: true,
    });
  }

  function handleToggleCommentEnabled(nextEnabled: boolean) {
    onNotificationSettingsChange({
      ...notificationSettings,
      commentEnabled: nextEnabled,
    });
  }

  function handleToggleLikeEnabled(nextEnabled: boolean) {
    onNotificationSettingsChange({
      ...notificationSettings,
      likeEnabled: nextEnabled,
    });
  }

  async function handleExpandRecentSevenDays() {
    if (isLoading) return;
    if (onRequestFullLoad) {
      await onRequestFullLoad();
    }
    setShowAllRecentSevenDays(true);
  }

  async function handleExpandRecentThirtyDays() {
    if (isLoading) return;
    if (onRequestFullLoad) {
      await onRequestFullLoad();
    }
    setRecentThirtyLoadSteps((prev) => prev + 1);
  }

  async function handleFilterSelect(filter: NotificationFilter) {
    setActiveFilter(filter);
    if (filter !== "all" && onRequestFullLoad) {
      void onRequestFullLoad();
    }
  }

  async function handleExpandFilteredList() {
    if (activeFilter === "all" || isLoading) return;
    if (onRequestFullLoad) {
      await onRequestFullLoad();
    }
    setFilterLoadSteps((prev) => ({
      ...prev,
      [activeFilter]: prev[activeFilter] + 1,
    }));
  }

  return createPortal((
    <>
      {/* 백드롭 */}
      <div
        className={`notif-backdrop ${isOpen ? "is-open" : "is-closing"}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 드로어 */}
      <div
        ref={drawerRef}
        className={`notif-drawer ${isOpen ? "is-open" : "is-closing"}`}
        role="dialog"
        aria-modal="true"
        aria-label="알림"
      >
        {/* 헤더 */}
        <div className="notif-header">
          <button
            className="notif-back-btn"
            onClick={onClose}
            aria-label="닫기"
            type="button"
          >
            {/* 뒤로가기 화살표 */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="notif-header-username">{headerDisplayName}</span>
          <Link
            href="/account/general"
            className="notif-settings-btn"
            onClick={onClose}
            aria-label="설정"
          >
            {/* 설정 아이콘 */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </div>

        <div className="notif-filter-row" role="tablist" aria-label="알림 필터">
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === "all"}
            className={`notif-filter-btn${activeFilter === "all" ? " is-active" : ""}`}
            onClick={() => { void handleFilterSelect("all"); }}
          >
            전체
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === "comment"}
            className={`notif-filter-btn${activeFilter === "comment" ? " is-active" : ""}`}
            onClick={() => { void handleFilterSelect("comment"); }}
          >
            댓글
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === "like"}
            className={`notif-filter-btn${activeFilter === "like" ? " is-active" : ""}`}
            onClick={() => { void handleFilterSelect("like"); }}
          >
            좋아요
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === "other"}
            className={`notif-filter-btn${activeFilter === "other" ? " is-active" : ""}`}
            onClick={() => { void handleFilterSelect("other"); }}
          >
            중요
          </button>
        </div>

        {/* 알림 목록 */}
        {isLoading && items.length === 0 ? (
          <div className="notif-empty">불러오는 중...</div>
        ) : activeFilter === "all" && visibleImportantItems.length === 0 && visibleRecentSevenItems.length === 0 && visibleRecentThirtyItems.length === 0 ? (
          <div className="notif-empty">알림이 없습니다.</div>
        ) : activeFilter !== "all" && currentFilteredItems.length === 0 ? (
          <div className="notif-empty">선택한 알림이 없습니다.</div>
        ) : (
          <div className="notif-list">
            {(() => {
              const renderItem = (item: NotificationItem, highlight = false) => {
                const senderName = getSenderName(item.title);
                const senderInitial = senderName ? senderName.slice(0, 1).toUpperCase() : "?";
                const shouldAppendTimestamp =
                  item.link.includes("commentId") &&
                  (item.type === "gallery_like" ||
                    item.type === "gallery_reply" ||
                    item.type === "gallery_comment_deleted");
                let href = item.link;
                if (href.startsWith("/user_content/")) {
                  if (!hasQueryParam(href, "commentId")) {
                    const commentId = getCommentIdFromSourceId(item);
                    if (commentId) href = appendQueryParam(href, "commentId", commentId);
                  }
                  href = appendQueryParam(href, "from", "notification");
                }
                if (shouldAppendTimestamp) {
                  href = appendQueryParam(href, "t", String(Date.now()));
                }
                return (
                  <Link
                    key={item.id}
                    href={href}
                    className={`notif-item${highlight ? " is-unread" : ""}`}
                    onClick={() => handleItemClick(item)}
                  >
                    {item.type === "consulting" ? (
                      <img src="/apple-touch-icon.png" className="notif-sender-avatar" alt="" />
                    ) : item.sender_icon ? (
                      <img src={item.sender_icon} className="notif-sender-avatar" alt="" />
                    ) : (
                      <span className="notif-sender-avatar notif-sender-avatar-default">
                        <span className="notif-sender-initial">{senderInitial}</span>
                      </span>
                    )}
                    <div className="notif-item-body">
                      <p className="notif-item-title">
                        {item.type === "consulting" ? (() => {
                          const [titlePart, rest] = item.title.split("||");
                          return <>상담글 <strong>{titlePart}</strong> {rest}</>;
                        })() : item.type === "settings" ? item.title : formatTitle(item.title)}
                      </p>
                      {item.type !== "settings" && (
                        <p className="notif-item-time">
                          {formatRelativeTime(item.created_at)}
                          {item.is_read && <span className="notif-read-check">✓</span>}
                          {!item.is_read && <span className="notif-unread-dot" />}
                        </p>
                      )}
                    </div>
                    {item.type === "consulting" ? (
                      <span className="notif-related-thumb notif-related-thumb-empty" aria-hidden="true">
                        <MessageCircle size={20} strokeWidth={1.8} />
                      </span>
                    ) : item.related_image ? (
                      <img src={item.related_image} className="notif-related-thumb" alt="" loading="lazy" />
                    ) : (
                      <span
                        className={`notif-related-thumb notif-related-thumb-empty${
                          item.type === "settings" ? " is-settings" : ""
                        }`}
                        aria-hidden="true"
                      >
                        {item.type === "settings" ? "A" : (TYPE_ICON[item.type] || "🔔")}
                      </span>
                    )}
                  </Link>
                );
              };

              if (activeFilter !== "all") {
                return (
                  <div className="notif-section">
                    {currentVisibleItems.map((item) => renderItem(item, !item.is_read))}
                    {currentFilteredItems.length > currentVisibleItems.length && (
                      <button
                        className="notif-more-btn"
                        onClick={() => { void handleExpandFilteredList(); }}
                        type="button"
                      >
                        더 많은 알람 ({currentFilteredItems.length - currentVisibleItems.length}개)
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <>
                  {/* 중요알림 섹션 (3개 고정) */}
                  {visibleImportantItems.length > 0 && (
                    <div className="notif-section">
                      <span className="notif-section-title">중요알림</span>
                      {visibleImportantItems.map((item) => renderItem(item, !item.is_read))}
                    </div>
                  )}

                  {/* 최근7일 섹션 (5개 고정) */}
                  {visibleRecentSevenItems.length > 0 && (
                    <div className="notif-section">
                      <span className="notif-section-title">최근 7일</span>
                      {visibleRecentSevenItems.map((item) => renderItem(item))}
                      {!showAllRecentSevenDays && allRecentSevenDays.length > recentSevenVisibleItems.length && (
                        <button
                          className="notif-more-btn"
                          onClick={() => { void handleExpandRecentSevenDays(); }}
                          type="button"
                        >
                          더 많은 알람 ({allRecentSevenDays.length - recentSevenVisibleItems.length}개)
                        </button>
                      )}
                    </div>
                  )}

                  {/* 최근 30일 섹션 */}
                  {visibleRecentThirtyItems.length > 0 && (
                    <div className="notif-section">
                      <span className="notif-section-title">최근 30일</span>
                      {visibleRecentThirtyItems.map((item) => renderItem(item))}
                      {allRecentThirtyDays.length > recentThirtyVisibleItems.length && (
                        <button
                          className="notif-more-btn"
                          onClick={() => { void handleExpandRecentThirtyDays(); }}
                          type="button"
                        >
                          더 많은 알람 ({allRecentThirtyDays.length - recentThirtyVisibleItems.length}개)
                        </button>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* 푸터 */}
        <div className="notif-footer">
          <button
            type="button"
            className="notif-settings-panel-btn"
            onClick={() => setSettingsOpen(true)}
          >
            Settting
          </button>
        </div>

        {settingsOpen && (
          <>
            <button
              type="button"
              className="notif-settings-panel-backdrop"
              onClick={() => setSettingsOpen(false)}
              aria-label="알림 설정 닫기"
            />
            <div className="notif-settings-panel" role="dialog" aria-label="알림 설정">
              <div className="notif-settings-panel-header">
                <strong>Notification</strong>
                <button type="button" className="notif-settings-close-btn" onClick={() => setSettingsOpen(false)}>
                  x
                </button>
              </div>
              <div className="notif-settings-list">
                <button type="button" className="notif-settings-item" onClick={() => handleToggleAllEnabled(!notificationSettings.allEnabled)}>
                  <span className="notif-settings-item-label"><Bell size={16} />전체알림</span>
                  <span className={`notif-ios-switch${notificationSettings.allEnabled ? " is-on" : ""}`}>
                    <span className="notif-ios-switch-thumb" />
                  </span>
                </button>
                <button
                  type="button"
                  className="notif-settings-item"
                  onClick={() => handleToggleCommentEnabled(!notificationSettings.commentEnabled)}
                  disabled={!notificationSettings.allEnabled}
                >
                  <span className="notif-settings-item-label"><MessageCircle size={16} />댓글</span>
                  <span className={`notif-ios-switch${notificationSettings.commentEnabled ? " is-on" : ""}`}>
                    <span className="notif-ios-switch-thumb" />
                  </span>
                </button>
                <button
                  type="button"
                  className="notif-settings-item"
                  onClick={() => handleToggleLikeEnabled(!notificationSettings.likeEnabled)}
                  disabled={!notificationSettings.allEnabled}
                >
                  <span className="notif-settings-item-label"><Heart size={16} />좋아요</span>
                  <span className={`notif-ios-switch${notificationSettings.likeEnabled ? " is-on" : ""}`}>
                    <span className="notif-ios-switch-thumb" />
                  </span>
                </button>
                <button type="button" className="notif-settings-item" disabled>
                  <span className="notif-settings-item-label"><ShoppingBag size={16} />주문/상담</span>
                  <span className="notif-ios-switch is-on is-locked">
                    <span className="notif-ios-switch-thumb" />
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  ), portalTarget);
}
