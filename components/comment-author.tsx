"use client";

import { useState } from "react";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { TierBadge } from "@/components/tier-badge";
import { DeletedUserNoticeModal } from "@/components/deleted-user-notice-modal";

type CommentAuthorProps = {
  username: string | null;
  iconImage: string | null;
  tier: string | null;
  isDeleted: boolean;
  onClickProfile?: () => void;
  avatarSize?: number;
  className?: string;
};

export function CommentAuthor({
  username,
  iconImage,
  tier,
  isDeleted,
  onClickProfile,
  avatarSize = 28,
  className,
}: CommentAuthorProps) {
  const [noticeOpen, setNoticeOpen] = useState(false);

  const displayName = username || "익명";

  const handleClick = () => {
    if (isDeleted) {
      setNoticeOpen(true);
      return;
    }
    onClickProfile?.();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            background: isDeleted ? "#e5e7eb" : "#f3f4f6",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {isDeleted || !iconImage ? (
            <UserRound width={avatarSize * 0.6} height={avatarSize * 0.6} color="#9ca3af" strokeWidth={2} />
          ) : (
            <Image
              src={iconImage}
              alt=""
              width={avatarSize}
              height={avatarSize}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              unoptimized
            />
          )}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: isDeleted ? "#9ca3af" : "inherit",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {displayName}
          {!isDeleted && <TierBadge tier={tier} />}
        </span>
      </button>
      <DeletedUserNoticeModal open={noticeOpen} onClose={() => setNoticeOpen(false)} />
    </>
  );
}
