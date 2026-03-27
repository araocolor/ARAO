import { auth, currentUser } from "@clerk/nextjs/server";
import { syncProfile } from "@/lib/profiles";
import { getOrdersByUser } from "@/lib/orders";
import Link from "next/link";
import type { Order } from "@/lib/orders";

export default async function AccountOrdersPage() {
  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="admin-panel-card stack account-section-card">
        <h2>주문내역</h2>
        <p style={{ margin: 0, color: "#ef4444" }}>로그인이 필요합니다.</p>
      </div>
    );
  }

  const user = await currentUser();
  if (!user?.emailAddresses?.[0]) {
    return (
      <div className="admin-panel-card stack account-section-card">
        <h2>주문내역</h2>
        <p style={{ margin: 0, color: "#ef4444" }}>사용자 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const profile = await syncProfile({
    email: user.emailAddresses[0].emailAddress,
    fullName: user.fullName || undefined,
  });

  if (!profile) {
    return (
      <div className="admin-panel-card stack account-section-card">
        <h2>주문내역</h2>
        <p style={{ margin: 0, color: "#ef4444" }}>프로필을 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 서버에서 주문 데이터 직접 조회
  let orders: Order[] = [];
  try {
    orders = await getOrdersByUser(profile.id, 1, 20);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
  }

  return (
    <OrdersContent orders={orders} />
  );
}

// 클라이언트 컴포넌트: 정적 UI 렌더링만 담당
function OrdersContent({ orders }: { orders: Order[] }) {
  return (
    <div className="admin-panel-card stack account-section-card" data-testid="account-orders-v2">
      <h2>주문내역</h2>

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
              prefetch={true}
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
    </div>
  );
}
