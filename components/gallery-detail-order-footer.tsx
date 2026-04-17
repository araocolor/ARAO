"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderFooter } from "@/components/order-footer";

type GalleryDetailOrderFooterProps = {
  orderHref: string | null;
};

export function GalleryDetailOrderFooter({ orderHref }: GalleryDetailOrderFooterProps) {
  const router = useRouter();
  const [isWished, setIsWished] = useState(false);

  return (
    <OrderFooter
      onWish={() => setIsWished((prev) => !prev)}
      isWished={isWished}
      onBuy={() => {
        if (!orderHref) return;
        router.push(orderHref);
      }}
      buyDisabled={!orderHref}
      buyLabel={orderHref ? "구매하기" : "상품 준비중"}
    />
  );
}
