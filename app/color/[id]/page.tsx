"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LandingPageHeader } from "@/components/landing-page-header";
import Image from "next/image";
import type { ColorItem } from "@/lib/color-types";

const COLOR_CACHE_KEY = "color-items";

function getFromCache(id: string): ColorItem | null {
  try {
    const raw = sessionStorage.getItem(COLOR_CACHE_KEY);
    if (!raw) return null;
    const items = JSON.parse(raw) as ColorItem[];
    return items.find((i) => i.id === id) ?? null;
  } catch {
    return null;
  }
}

export default function ColorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<ColorItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getFromCache(id);
    if (cached) {
      setItem(cached);
    }

    void (async () => {
      try {
        const res = await fetch(`/api/color/${id}`);
        if (!res.ok) return;
        const data = (await res.json()) as ColorItem;
        setItem(data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [id]);

  const imgSrc = item?.img_arao_full ?? item?.img_arao_mid ?? item?.img_arao_thumb;

  return (
    <main className="color-detail-shell">
      <LandingPageHeader />

      {loading && (
        <div className="color-empty">불러오는 중...</div>
      )}

      {!loading && !item && (
        <div className="color-empty">
          <p>아이템을 찾을 수 없습니다.</p>
          <button className="color-detail-back-btn" onClick={() => router.back()}>
            돌아가기
          </button>
        </div>
      )}

      {!loading && item && (
        <div className="color-detail-grid">
          {/* 왼쪽: 정보 */}
          <div className="color-detail-info landing-stack-sm">
            <span className="landing-section-label">COLOR</span>
            <h1 className="color-detail-title">{item.title}</h1>
            {item.content && (
              <p className="color-detail-body">{item.content}</p>
            )}
            {item.price != null && (
              <p className="color-detail-price">
                {item.price.toLocaleString()}원
              </p>
            )}
            <button
              type="button"
              className="landing-button landing-button-primary color-detail-buy-btn"
              disabled={item.price == null || item.price <= 0}
              onClick={() => router.push(`/color/${item.id}/order`)}
            >
              {item.price != null && item.price > 0 ? "구매하기" : "가격 준비중"}
            </button>
          </div>

          {/* 오른쪽: 이미지 */}
          <div className="color-detail-image-wrap">
            {imgSrc ? (
              <Image
                src={imgSrc}
                alt={item.title}
                fill
                className="color-detail-image"
                sizes="(max-width: 820px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="color-card-image-placeholder">이미지 없음</div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
