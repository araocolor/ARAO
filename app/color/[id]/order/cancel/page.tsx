"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LandingPageHeader } from "@/components/landing-page-header";

export default function ColorOrderCancelPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const reportedRef = useRef(false);

  useEffect(() => {
    if (reportedRef.current || !orderId) {
      return;
    }

    reportedRef.current = true;
    void fetch(`/api/color/${id}/order/abort`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId, reason: "cancelled" }),
    });
  }, [id, orderId]);

  return (
    <main className="color-detail-shell">
      <LandingPageHeader />
      <div className="color-order-state">
        <h1 className="color-detail-title">결제가 취소되었습니다</h1>
        <p className="color-order-copy">원하시면 다시 주문 확인 화면에서 카카오페이 테스트 결제를 진행할 수 있습니다.</p>
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
