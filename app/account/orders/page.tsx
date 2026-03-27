"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order } from "@/lib/orders";

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/account/orders");
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="admin-panel-card stack account-section-card" data-testid="account-orders-v2">
      <h2>주문내역</h2>

      {loading && <p style={{ margin: 0 }}>로딩 중...</p>}

      {error && <p style={{ margin: 0, color: "#ef4444" }}>오류: {error}</p>}

      {!loading && !error && (
        <>
          <p style={{ margin: 0, fontWeight: 700 }}>
            {orders.length > 0 ? `주문 ${orders.length}건` : "주문 내역이 없습니다"}
          </p>

          {orders.length > 0 && (
            <div style={{ display: "grid", gap: 10 }}>
              {orders.map((order, index) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <article
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: 12,
                      padding: 12,
                      background: "#fff",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "#f9f9f9";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "#fff";
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
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
