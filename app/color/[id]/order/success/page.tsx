"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LandingPageHeader } from "@/components/landing-page-header";

export default function ColorOrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pgToken = searchParams.get("pg_token");
  const orderId = searchParams.get("orderId");
  const requestedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requestedRef.current || !pgToken || !orderId) {
      return;
    }

    requestedRef.current = true;

    void (async () => {
      try {
        const response = await fetch(`/api/color/${id}/order/approve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId, pgToken }),
        });
        const data = (await response.json()) as { ok?: boolean; message?: string };

        if (!response.ok || !data.ok) {
          throw new Error(data.message ?? "결제 승인에 실패했습니다.");
        }

        router.replace(`/account/orders/${orderId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "결제 승인에 실패했습니다.");
      }
    })();
  }, [id, orderId, pgToken, router]);

  return (
    <main className="color-detail-shell">
      <LandingPageHeader />
      <div className="color-order-state">
        {!error ? (
          <>
            <h1 className="color-detail-title">결제를 확인하고 있습니다</h1>
            <p className="color-order-copy">잠시만 기다려 주세요. 승인 완료 후 주문 상세로 이동합니다.</p>
          </>
        ) : (
          <>
            <h1 className="color-detail-title">결제 확인에 실패했습니다</h1>
            <p className="color-order-error">{error}</p>
            <div className="color-order-actions">
              <button
                type="button"
                className="color-order-secondary-btn"
                onClick={() => router.push(`/color/${id}/order`)}
              >
                다시 시도
              </button>
              {orderId && (
                <button
                  type="button"
                  className="landing-button landing-button-primary color-order-pay-btn"
                  onClick={() => router.push(`/account/orders/${orderId}`)}
                >
                  주문 확인
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
