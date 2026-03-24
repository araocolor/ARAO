"use client";

import { useState } from "react";
import type { LandingContent } from "@/lib/landing-content";

type AdminPricingManagerProps = {
  initialContent: LandingContent;
};

export function AdminPricingManager({ initialContent }: AdminPricingManagerProps) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const updatePlan = (
    index: number,
    key: "name" | "price" | "unit" | "description",
    value: string,
  ) => {
    setContent((current) => ({
      ...current,
      pricing: {
        ...current.pricing,
        plans: current.pricing.plans.map((plan, planIndex) =>
          planIndex === index ? { ...plan, [key]: value } : plan,
        ),
      },
    }));
  };

  const updatePlanFeatures = (index: number, value: string) => {
    setContent((current) => ({
      ...current,
      pricing: {
        ...current.pricing,
        plans: current.pricing.plans.map((plan, planIndex) =>
          planIndex === index
            ? {
                ...plan,
                features: value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean),
              }
            : plan,
        ),
      },
    }));
  };

  const save = async () => {
    setSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/admin/landing-content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(content),
      });

      const data = (await response.json()) as LandingContent | { message?: string };

      if (!response.ok) {
        const message = "message" in data ? data.message : undefined;
        setStatus(message ?? "저장에 실패했습니다.");
        return;
      }

      setContent(data as LandingContent);
      setStatus("상품가격 페이지 내용이 저장되었습니다.");
    } catch {
      setStatus("저장 요청 중 문제가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="landing-manage stack">
      <div className="admin-toolbar">
        <button className="sign-out-button" type="button" onClick={save} disabled={saving}>
          {saving ? "저장 중..." : "전체 저장"}
        </button>
        {status ? <p className="muted">{status}</p> : null}
      </div>

      <section className="admin-form-card stack">
        <div className="admin-section-heading">
          <span className="muted">Pricing Hero</span>
          <button className="admin-save-button" type="button" onClick={save} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
        <input
          className="admin-input"
          value={content.pricing.sectionTitle}
          onChange={(event) =>
            setContent((current) => ({
              ...current,
              pricing: { ...current.pricing, sectionTitle: event.target.value },
            }))
          }
          placeholder="섹션 라벨"
        />
        <input
          className="admin-input"
          value={content.pricing.title}
          onChange={(event) =>
            setContent((current) => ({
              ...current,
              pricing: { ...current.pricing, title: event.target.value },
            }))
          }
          placeholder="제목"
        />
        <textarea
          className="admin-textarea"
          rows={4}
          value={content.pricing.body}
          onChange={(event) =>
            setContent((current) => ({
              ...current,
              pricing: { ...current.pricing, body: event.target.value },
            }))
          }
          placeholder="설명"
        />
      </section>

      {content.pricing.plans.map((plan, index) => (
        <section key={`${plan.name}-${index}`} className="admin-form-card stack">
          <div className="admin-section-heading">
            <span className="muted">Plan {index + 1}</span>
            <button className="admin-save-button" type="button" onClick={save} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
          <div className="admin-form-grid">
            <input
              className="admin-input"
              value={plan.name}
              onChange={(event) => updatePlan(index, "name", event.target.value)}
              placeholder="상품명"
            />
            <input
              className="admin-input"
              value={plan.price}
              onChange={(event) => updatePlan(index, "price", event.target.value)}
              placeholder="가격"
            />
          </div>
          <div className="admin-form-grid">
            <input
              className="admin-input"
              value={plan.unit}
              onChange={(event) => updatePlan(index, "unit", event.target.value)}
              placeholder="단위"
            />
            <input className="admin-input" value={plan.accent} readOnly />
          </div>
          <textarea
            className="admin-textarea"
            rows={3}
            value={plan.description}
            onChange={(event) => updatePlan(index, "description", event.target.value)}
            placeholder="설명"
          />
          <textarea
            className="admin-textarea"
            rows={4}
            value={plan.features.join("\n")}
            onChange={(event) => updatePlanFeatures(index, event.target.value)}
            placeholder="기능 목록을 줄바꿈으로 입력"
          />
        </section>
      ))}
    </div>
  );
}
