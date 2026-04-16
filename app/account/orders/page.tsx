import { auth, currentUser } from "@clerk/nextjs/server";
import { syncProfile } from "@/lib/profiles";
import { getOrdersByUser } from "@/lib/orders";
import { OrdersContent } from "@/components/orders-content";
import { isDesignMode, mockOrders } from "@/lib/design-mock";
import type { Order } from "@/lib/orders";

type SearchParams =
  | Promise<{ open?: string | string[] }>
  | undefined;

function resolveOpenOrderId(raw: string | string[] | undefined): string | undefined {
  if (typeof raw === "string") return raw.trim() || undefined;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0].trim() || undefined;
  return undefined;
}

export default async function AccountOrdersPage({ searchParams }: { searchParams?: SearchParams }) {
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const openOrderId = resolveOpenOrderId(resolvedSearch?.open);

  // 디자인 모드: Clerk 로그인 없이 더미 데이터 표시
  if (isDesignMode) {
    return <OrdersContent orders={mockOrders} openOrderId={openOrderId} />;
  }

  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="account-panel-card stack account-section-card">
        <h2>주문내역</h2>
        <p style={{ margin: 0, color: "#ef4444" }}>로그인이 필요합니다.</p>
      </div>
    );
  }

  const user = await currentUser();
  if (!user?.emailAddresses?.[0]) {
    return (
      <div className="account-panel-card stack account-section-card">
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
      <div className="account-panel-card stack account-section-card">
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
    <OrdersContent orders={orders} openOrderId={openOrderId} />
  );
}
