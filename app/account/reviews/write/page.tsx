"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "general", label: "일반" },
  { value: "product", label: "상품" },
  { value: "service", label: "서비스" },
  { value: "etc", label: "기타" },
];

export default function ReviewWritePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    category: "general",
    title: "",
    content: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 입력 검증
    if (formData.title.length < 2 || formData.title.length > 100) {
      setError("제목은 2자 이상 100자 이하여야 합니다.");
      setLoading(false);
      return;
    }

    if (formData.content.length < 10 || formData.content.length > 2000) {
      setError("본문은 10자 이상 2000자 이하여야 합니다.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/account/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "글쓰기 실패");
      }

      const review = await response.json();
      router.push(`/account/reviews/${review.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel-card stack">
      <p className="muted">Reviews</p>
      <h2>후기 작성</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="review-write-form">
        <div className="form-group">
          <label htmlFor="category">카테고리</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="title">제목</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="제목을 입력하세요 (2-100자)"
            maxLength={100}
          />
          <span className="form-hint">{formData.title.length}/100</span>
        </div>

        <div className="form-group">
          <label htmlFor="content">본문</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="본문을 입력하세요 (10-2000자)"
            maxLength={2000}
            rows={10}
          />
          <span className="form-hint">{formData.content.length}/2000</span>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "작성 중..." : "작성"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
