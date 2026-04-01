"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

type Category = "일반" | "공지";

export default function WriteReviewPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [category, setCategory] = useState<Category>("일반");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleCancel() {
    router.back();
  }

  async function handleSave() {
    if (!title.trim() || saving) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/main/user-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title: title.trim(), content: content.trim() }),
      });
      if (res.ok) {
        router.push("/user_review");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="write-review-shell">
      {/* 상단 헤더 */}
      <header className="write-review-header">
        <span className="write-review-header-title">후기 작성</span>
        <button
          type="button"
          className="write-review-cancel-btn"
          onClick={handleCancel}
        >
          취소
        </button>
      </header>

      {/* 본문 */}
      <div className="write-review-body">
        {/* 카테고리 드롭다운 */}
        <div className="write-review-dropdown-wrap">
          <button
            type="button"
            className="user-review-dropdown-trigger"
            onClick={() => setDropdownOpen((v) => !v)}
          >
            {category}
            <svg
              className={`user-review-dropdown-arrow${dropdownOpen ? " open" : ""}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="user-review-dropdown-menu">
              {(["일반", "공지"] as Category[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`user-review-dropdown-option${category === opt ? " active" : ""}`}
                  onClick={() => { setCategory(opt); setDropdownOpen(false); }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="write-review-divider" />

        {/* 제목 */}
        <input
          type="text"
          className="write-review-title-input"
          placeholder="제목을 입력해주세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
        />

        {/* 구분선 */}
        <div className="write-review-divider" />

        {/* 내용 */}
        <textarea
          className="write-review-content-input"
          placeholder="내용을 입력해주세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {/* 하단 툴바 */}
      <footer className="write-review-toolbar">
        {/* 이미지 */}
        <button
          type="button"
          className="write-review-tool-btn"
          aria-label="이미지 첨부"
          onClick={() => imageInputRef.current?.click()}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
        {/* 파일 */}
        <button
          type="button"
          className="write-review-tool-btn"
          aria-label="파일 첨부"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </button>
        {/* 저장 */}
        <button
          type="button"
          className={`write-review-save-btn${title.trim() && !saving ? " active" : ""}`}
          onClick={handleSave}
          disabled={!title.trim() || saving}
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>

        <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} />
        <input ref={fileInputRef} type="file" style={{ display: "none" }} />
      </footer>
    </main>
  );
}
