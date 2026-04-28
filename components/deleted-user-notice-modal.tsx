"use client";

import { useEffect } from "react";

type DeletedUserNoticeModalProps = {
  open: boolean;
  onClose: () => void;
};

export function DeletedUserNoticeModal({ open, onClose }: DeletedUserNoticeModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "20px 24px",
          minWidth: 260,
          maxWidth: "90vw",
          textAlign: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}
      >
        <p style={{ margin: 0, fontSize: 15, color: "#111" }}>탈퇴회원입니다.</p>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 16,
            padding: "8px 20px",
            border: "none",
            borderRadius: 8,
            background: "#111",
            color: "#fff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
}
