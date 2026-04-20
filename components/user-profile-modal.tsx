"use client";

import { useEffect, useState } from "react";
import { TierBadge } from "@/components/tier-badge";

export type UserProfileModalTarget = {
  authorId: string;
  authorEmail?: string | null;
  authorTier?: string | null;
  iconImage?: string | null;
};

type UserProfileModalProps = {
  target: UserProfileModalTarget | null;
  isSignedIn: boolean;
  viewerRole: string | null | undefined;
  onRequestSignIn: () => void;
  onClose: () => void;
};

const TEMP_PROFILE_BIO_LINE_1 = "안녕하세요 사진을 사랑하는 사람입니다.";
const TEMP_PROFILE_BIO_LINE_2 = "만나서 반습니다. 좋은 곳을 알게 되서 기뻐요";
const TEMP_PROFILE_CONTACT = "insta@safdsfdsd.com";

function getRoleLevel(role: string | null | undefined): number {
  const normalized = (role ?? "").trim().toLowerCase();
  if (normalized === "admin") return 3;
  if (normalized === "pro" || normalized === "creator" || normalized === "premium") return 2;
  if (normalized === "member" || normalized === "user" || normalized === "customer" || normalized === "general") return 1;
  return 0;
}

function normalizeTier(tier: string | null | undefined): "member" | "pro" | "premium" {
  const normalized = (tier ?? "").trim().toLowerCase();
  if (normalized === "premium") return "premium";
  if (normalized === "pro") return "pro";
  return "member";
}

function getTierBadgeValue(tier: string | null | undefined): "pro" | "premium" | null {
  const normalized = (tier ?? "").trim().toLowerCase();
  if (normalized === "premium") return "premium";
  if (normalized === "pro") return "pro";
  return null;
}

function getDisplayEmail(target: UserProfileModalTarget): string {
  const fromTarget = (target.authorEmail ?? "").trim();
  if (fromTarget) return fromTarget;
  const author = (target.authorId ?? "").trim();
  return author.includes("@") ? author : "이메일주소";
}

function renderProfileModalContent(target: UserProfileModalTarget) {
  const tierLabel = normalizeTier(target.authorTier);
  const tierForBadge = getTierBadgeValue(target.authorTier);
  return (
    <div className="user-content-profile-content">
      <div className="user-content-profile-avatar" data-tier={tierLabel}>
        {target.iconImage ? (
          <img src={target.iconImage} alt="" className="user-content-profile-avatar-img" />
        ) : (
          <span className="user-content-profile-avatar-default">
            {target.authorId.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <div className="user-content-profile-id-row">
        <strong className="user-content-profile-id">{target.authorId}</strong>
        <TierBadge tier={tierForBadge} size={18} marginLeft={0} />
      </div>
      <p className="user-content-profile-email">{getDisplayEmail(target)}</p>
      <p className="user-content-profile-bio-title">{tierLabel}</p>
      <div className="user-content-profile-divider" />
      <p className="user-content-profile-bio-line">{TEMP_PROFILE_BIO_LINE_1}</p>
      <p className="user-content-profile-bio-line">{TEMP_PROFILE_BIO_LINE_2}</p>
      <p className="user-content-profile-contact">{TEMP_PROFILE_CONTACT}</p>
    </div>
  );
}

export function UserProfileModal({
  target,
  isSignedIn,
  viewerRole,
  onRequestSignIn,
  onClose,
}: UserProfileModalProps) {
  const [fullOpen, setFullOpen] = useState(false);

  useEffect(() => {
    setFullOpen(false);
  }, [target]);

  if (!target) return null;

  function handleOpenFull() {
    if (!isSignedIn) {
      onRequestSignIn();
      return;
    }

    if (getRoleLevel(viewerRole) < 2) {
      window.alert("상세보기는 pro 등급 이상만 볼 수 있어요.");
      return;
    }

    setFullOpen(true);
  }

  if (fullOpen) {
    return (
      <>
        <div className="user-content-profile-full-backdrop" onClick={onClose} />
        <div className="user-content-profile-full-modal" role="dialog" aria-modal="true" aria-label="회원 상세 정보">
          <div className="user-content-profile-full-head">
            <button type="button" className="user-content-profile-full-close" onClick={onClose} aria-label="닫기">
              ×
            </button>
          </div>
          <div className="user-content-profile-full-body">{renderProfileModalContent(target)}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="user-content-profile-modal-backdrop" onClick={onClose} />
      <div className="user-content-profile-modal" role="dialog" aria-modal="true" aria-label="회원 정보 미리보기">
        <div className="user-content-profile-modal-body">{renderProfileModalContent(target)}</div>
        <div className="user-content-profile-modal-actions">
          <button
            type="button"
            className="user-content-profile-modal-btn is-muted"
            disabled
            aria-disabled="true"
          >
            상세보기
          </button>
          <button
            type="button"
            className="user-content-profile-modal-btn"
            onClick={onClose}
            autoFocus
          >
            닫기
          </button>
        </div>
      </div>
    </>
  );
}
