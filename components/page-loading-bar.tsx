"use client";

import { useEffect, useState } from "react";

export function PageLoadingBar() {
  const [state, setState] = useState<"loading" | "complete" | "hidden">("loading");

  useEffect(() => {
    if (document.readyState === "complete") {
      setState("complete");
      const timer = setTimeout(() => setState("hidden"), 400);
      return () => clearTimeout(timer);
    }

    function handleLoad() {
      setState("complete");
      const timer = setTimeout(() => setState("hidden"), 400);
      return () => clearTimeout(timer);
    }

    window.addEventListener("load", handleLoad);
    return () => window.removeEventListener("load", handleLoad);
  }, []);

  if (state === "hidden") return null;

  return <div className={`page-loading-bar ${state}`} />;
}
