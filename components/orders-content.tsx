"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order, OrderDetail } from "@/lib/orders";
import { getCached, setCached } from "@/hooks/use-prefetch-cache";

type OrdersContentProps = {
  orders: Order[];
  openOrderId?: string;
};

function getOrderStatusStyle(status: string) {
  if (status === "결제완료") return { background: "#dbeafe", color: "#0369a1" };
  if (status === "발송완료") return { background: "#dcfce7", color: "#15803d" };
  if (status === "환불진행중") return { background: "#fef08a", color: "#854d0e" };
  if (status === "환불완료") return { background: "#f3e8ff", color: "#6b21a8" };
  return { background: "#fee2e2", color: "#991b1b" };
}

function getPaymentStatusStyle(status: string) {
  if (status === "completed") return { background: "#dbeafe", color: "#0369a1" };
  return { background: "#fee2e2", color: "#991b1b" };
}

export function OrdersContent({ orders, openOrderId }: OrdersContentProps) {
  const [popupOrder, setPopupOrder] = useState<OrderDetail | null>(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupError, setPopupError] = useState<string | null>(null);
  const [handledOpenId, setHandledOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (orders.length === 0) return;

    void Promise.allSettled(
      orders.map(async (order) => {
        const key = `order_${order.id}`;
        if (getCached(key)) return;

        const res = await fetch(`/api/account/orders/${order.id}`);
        if (!res.ok) return;

        const data = await res.json();
        setCached(key, data);
      })
    );
  }, [orders]);

  useEffect(() => {
    if (!openOrderId || handledOpenId === openOrderId) return;

    let active = true;
    setPopupLoading(true);
    setPopupError(null);
    setHandledOpenId(openOrderId);

    void (async () => {
      try {
        const cacheKey = `order_${openOrderId}`;
        const cached = getCached<OrderDetail>(cacheKey);
        if (cached) {
          if (active) setPopupOrder(cached);
          return;
        }

        const res = await fetch(`/api/account/orders/${openOrderId}`);
        if (!res.ok) throw new Error("주문 정보를 불러오지 못했습니다.");
        const data = (await res.json()) as OrderDetail;
        setCached(cacheKey, data);
        if (active) setPopupOrder(data);
      } catch (err) {
        if (active) {
          setPopupOrder(null);
          setPopupError(err instanceof Error ? err.message : "주문 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (active) setPopupLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [handledOpenId, openOrderId]);

  function closePopup() {
    setPopupOrder(null);
    setPopupError(null);
  }

  return (
    <>
      <div className="account-panel-card stack account-section-card" data-testid="account-orders-v2">
        <h2>주문내역</h2>

        <p style={{ margin: 0, fontWeight: 700 }}>
          {orders.length > 0 ? `주문 ${orders.length}건` : "주문 내역이 없습니다"}
        </p>

        {orders.length > 0 && (
          <div style={{ display: "grid", gap: 10 }}>
            {orders.map((order, index) => {
              const isFocused = openOrderId === order.id;
              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                  prefetch={true}
                >
                  <article
                    style={{
                      border: isFocused ? "1.5px solid #111111" : "1px solid #ddd",
                      borderRadius: 12,
                      padding: 12,
                      background: isFocused ? "#f4f4f5" : "#fff",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "#f9f9f9";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = isFocused ? "#f4f4f5" : "#fff";
                    }}
                  >
                    <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>
                      주문 {index + 1}
                    </h3>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, lineHeight: 1.6 }}>
                      <span>{order.total_amount.toLocaleString("ko-KR")} {order.currency}</span>
                      <br />
                      <span>{new Date(order.created_at).toLocaleDateString("ko-KR")}</span>
                      <span> | </span>
                      <span style={{ fontWeight: 700 }}>{order.status}</span>
                    </p>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {(popupLoading || popupError || popupOrder) && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1200,
          }}
          onClick={closePopup}
        >
          <section
            style={{
              width: "100%",
              maxWidth: 520,
              maxHeight: "84dvh",
              overflowY: "auto",
              borderRadius: 14,
              background: "#fff",
              padding: 18,
              boxShadow: "0 12px 34px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {popupLoading && <p style={{ margin: 0, fontSize: 14 }}>주문 정보를 불러오는 중...</p>}

            {popupError && (
              <>
                <p style={{ margin: 0, color: "#991b1b", fontSize: 14 }}>{popupError}</p>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={closePopup}
                    style={{
                      border: "1px solid #d1d5db",
                      background: "#fff",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    닫기
                  </button>
                </div>
              </>
            )}

            {popupOrder && (
              <>
                <h3 style={{ margin: 0, fontSize: 18 }}>주문 상세</h3>
                <div style={{ marginTop: 14, display: "grid", gap: 10, fontSize: 14 }}>
                  <p style={{ margin: 0 }}>
                    주문번호 <strong style={{ fontFamily: "monospace" }}>{popupOrder.id}</strong>
                  </p>
                  <p style={{ margin: 0 }}>
                    주문일 {new Date(popupOrder.created_at).toLocaleString("ko-KR")}
                  </p>
                  <p style={{ margin: 0 }}>
                    금액 <strong>{popupOrder.total_amount.toLocaleString("ko-KR")} {popupOrder.currency}</strong>
                  </p>
                  <p style={{ margin: 0 }}>
                    상태{" "}
                    <span
                      style={{
                        ...getOrderStatusStyle(popupOrder.status),
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {popupOrder.status}
                    </span>
                  </p>
                  <p style={{ margin: 0 }}>
                    결제상태{" "}
                    <span
                      style={{
                        ...getPaymentStatusStyle(popupOrder.payment.status),
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {popupOrder.payment.status}
                    </span>
                  </p>
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link
                    href={`/account/orders/${popupOrder.id}`}
                    prefetch={true}
                    style={{
                      textDecoration: "none",
                      background: "#111111",
                      color: "#fff",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    상세 화면으로
                  </Link>
                  <button
                    type="button"
                    onClick={closePopup}
                    style={{
                      border: "1px solid #d1d5db",
                      background: "#fff",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    닫기
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
