"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LandingPageHeader } from "@/components/landing-page-header";
import { clearPendingColorOrder } from "@/lib/color-order-session";

export default function ColorOrderFailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const reportedRef = useRef(false);

  useEffect(() => {
    clearPendingColorOrder(id);

    if (reportedRef.current || !orderId) {
      return;
    }

    reportedRef.current = true;
    void fetch(`/api/color/${id}/order/abort`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId, reason: "failed" }),
    });
  }, [id, orderId]);

  return (
    <main className="color-detail-shell">
      <LandingPageHeader />
      <div className="color-order-state">
        <h1 className="color-detail-title">결제를 완료하지 못했습니다</h1>
        <p className="color-order-copy">네트워크나 인증 문제로 중단되었을 수 있습니다. 다시 주문 화면에서 재시도해 주세요.</p>
        <div className="color-order-actions">
          <button type="button" className="color-order-secondary-btn" onClick={() => router.push(`/color/${id}`)}>
            상품으로
          </button>
          <button
            type="button"
            className="landing-button landing-button-primary color-order-pay-btn"
            onClick={() => router.push(`/color/${id}/order`)}
          >
            다시 결제
          </button>
        </div>
      </div>
    </main>
  );
}
