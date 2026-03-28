"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type NotificationItem } from "@/lib/notifications";

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

// 알림 타입별 라벨 매핑
const TYPE_LABEL: Record<string, string> = {
  settings: "계정 설정",
  order_shipped: "주문 발송",
  order_cancelled: "결제 취소",
  consulting: "1:1 상담",
  review_reply: "사용자 후기",
  gallery_like: "갤러리",
};

// 알림 타입별 아이콘 이모지
const TYPE_ICON: Record<string, string> = {
  settings: "⚙️",
  order_shipped: "📦",
  order_cancelled: "⚠️",
  consulting: "💬",
  review_reply: "📝",
  gallery_like: "❤️",
};

export function NotificationDrawer({
  isOpen,
  isMounted,
  items,
  onClose,
}: NotificationDrawerProps) {
  if (!isMounted) return null;

  const handleItemClick = async (item: NotificationItem) => {
    // settings/consulting 제외, 나머지는 읽음 처리
    if (item.type !== "settings" && item.type !== "consulting" && !item.is_read) {
      try {
        await fetch(`/api/account/notifications/${item.id}`, {
          method: "PATCH",
        });
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }
    onClose();
  };

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

        {/* 사용자페이지 링크 */}
        <div className="notif-profile-link">
          <Link href="/account/general" onClick={onClose}>
            사용자페이지 &gt;
          </Link>
        </div>

        {/* 알림 목록 */}
        {items.length === 0 ? (
          <div className="notif-empty">알림이 없습니다.</div>
        ) : (
          <div className="notif-list">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.link}
                className={`notif-item ${
                  !item.is_read ? "is-unread" : ""
                }`}
                onClick={() => handleItemClick(item)}
              >
                <div className={`notif-item-icon notif-icon-${item.type}`}>
                  {TYPE_ICON[item.type] || "🔔"}
                </div>
                <div className="notif-item-body">
                  <p className="notif-item-title">{item.title}</p>
                  <p className="notif-item-category">{TYPE_LABEL[item.type] || item.type}</p>
                  <p className="notif-item-time">
                    {formatRelativeTime(item.created_at)}
                  </p>
                </div>
              </Link>
            ))}
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
