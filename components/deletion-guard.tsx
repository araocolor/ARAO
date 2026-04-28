"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { AccountDeletedView } from "@/components/account-deleted-view";

type DeletionStatus = {
  pending: boolean;
  deletedAt?: string | null;
  deleteScheduledAt?: string | null;
  email?: string;
};

export function DeletionGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [status, setStatus] = useState<DeletionStatus | null>(null);
  const [suppressed, setSuppressed] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setStatus(null);
      return;
    }

    fetch("/api/account/delete/status")
      .then((r) => r.json())
      .then((data: DeletionStatus) => setStatus(data))
      .catch(() => setStatus({ pending: false }));
  }, [isSignedIn, isLoaded]);

  useEffect(() => {
    function check() {
      setSuppressed(Boolean(document.querySelector(".account-delete-modal-backdrop")));
    }
    check();
    const t = window.setInterval(check, 200);
    return () => window.clearInterval(t);
  }, []);

  if (isLoaded && isSignedIn && status?.pending && !suppressed) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AccountDeletedView
          deletedAt={status.deletedAt ?? null}
          deleteScheduledAt={status.deleteScheduledAt ?? null}
          email={status.email ?? ""}
          onRestored={() => setStatus({ pending: false })}
        />
      </div>
    );
  }

  return <>{children}</>;
}
