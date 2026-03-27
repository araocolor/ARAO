"use client";

import { ReactNode } from "react";
import { useAccountPrefetch } from "@/hooks/use-account-prefetch";

export function AccountPrefetchWrapper({ children }: { children: ReactNode }) {
  useAccountPrefetch();

  return <>{children}</>;
}
