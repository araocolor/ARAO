"use client";

import { ReactNode } from "react";
import { useAccountPrefetch } from "@/hooks/use-account-prefetch";
import { useInactivityLogout } from "@/hooks/use-inactivity-logout";

export function AccountPrefetchWrapper({ children }: { children: ReactNode }) {
  useAccountPrefetch();
  useInactivityLogout();

  return <>{children}</>;
}
