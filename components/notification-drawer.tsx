"use client";

import Link from "next/link";
import { type NotificationItem } from "@/lib/consulting";

type NotificationDrawerProps = {
  isOpen: boolean;
  isMounted: boolean;
  items: NotificationItem[];
  onClose: () => void;
};

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

// 카테고리 라벨 매핑
const CATEGORY_LABEL: Record<string, string> = {
  consulting: "1:1 상담",
  general: "일반 문의",
};

// 카테고리 아이콘 이모지
const CATEGORY_ICON: Record<string, string> = {
  consulting: "💬",
  general: "📋",
};

export function NotificationDrawer({
  isOpen,
  isMounted,
  items,
  onClose,
}: NotificationDrawerProps) {
  if (!isMounted) return null;

  // 카테고리별로 알림을 그룹화
  const groupedItems = items.reduce(
    (acc, item) => {
      const category = item.type as "consulting" | "general";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, NotificationItem[]>
  );

  return (
    <>
      {/* 백드롭 */}
      <div
        className={`notif-backdrop ${isOpen ? "is-open" : "is-closing"}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 드로어 */}
      <div
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
            홈으로
          </button>
        </div>

        {/* 알림 목록 */}
        {items.length === 0 ? (
          <div className="notif-empty">알림이 없습니다.</div>
        ) : (
          <div className="notif-list">
            {(["consulting", "general"] as const).map((type) => {
              const categoryItems = groupedItems[type];
              if (!categoryItems || categoryItems.length === 0) return null;

              return (
                <div key={type}>
                  <span className="notif-category-label">
                    {CATEGORY_LABEL[type]}
                  </span>
                  {categoryItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/account/consulting`}
                      className={`notif-item ${
                        item.has_unread_reply ? "is-unread" : ""
                      }`}
                      onClick={onClose}
                    >
                      <div
                        className={`notif-item-icon notif-icon-${item.type}`}
                      >
                        {CATEGORY_ICON[item.type]}
                      </div>
                      <div className="notif-item-body">
                        <p className="notif-item-title">{item.title}</p>
                        <p className="notif-item-time">
                          {formatRelativeTime(item.updated_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* 푸터 */}
        <div className="notif-footer">
          <span className="notif-report-link">
            &lt; 이용관련 불편신고 &gt;
          </span>
        </div>
      </div>
    </>
  );
}
