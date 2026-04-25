"use client";

import { useSearchParams } from "next/navigation";
import { OrdersContent } from "@/components/orders-content";
import { isDesignMode, mockOrders } from "@/lib/design-mock";

function resolveOpenOrderId(raw: string | null): string | undefined {
  return raw?.trim() || undefined;
}

export default function AccountOrdersPage() {
  const searchParams = useSearchParams();
  const openOrderId = resolveOpenOrderId(searchParams.get("open"));

  if (isDesignMode) {
    return <OrdersContent orders={mockOrders} openOrderId={openOrderId} />;
  }

  return <OrdersContent openOrderId={openOrderId} />;
}
