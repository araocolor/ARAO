"use client";

import { useEffect, useRef, useState } from "react";
import { CompanyFooter } from "@/components/company-footer";
import type { LandingContent } from "@/lib/landing-content";

const QNA_CACHE_KEY = "user-review-list-cache-qna";
const CACHE_TTL = 5 * 60 * 1000;

function isQnaCacheFresh() {
  try {
    const raw = sessionStorage.getItem(QNA_CACHE_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw) as { ts: number };
    return Date.now() - ts < CACHE_TTL;
  } catch {
    return false;
  }
}

type LandingPageFooterProps = {
  content: LandingContent["footer"];
};

export function LandingPageFooter({ content }: LandingPageFooterProps) {
  const footerRef = useRef<HTMLElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [legalSheet, setLegalSheet] = useState<null | "terms" | "privacy">(null);
  const [legalSheetVisible, setLegalSheetVisible] = useState(false);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (isQnaCacheFresh()) return;
        fetch("/api/main/user-review?page=1&limit=20&sort=latest&board=qna")
          .then((r) => (r.ok ? r.json() : null))
          .then((data: { items?: unknown[]; [key: string]: unknown } | null) => {
            if (!data || !Array.isArray(data.items)) return;
            sessionStorage.setItem(QNA_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
          })
          .catch(() => {});
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!legalSheet) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const rafId = window.requestAnimationFrame(() => setLegalSheetVisible(true));

    return () => {
      window.cancelAnimationFrame(rafId);
      document.body.style.overflow = prevOverflow;
    };
  }, [legalSheet]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  function openLegalSheet(type: "terms" | "privacy") {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setLegalSheet(type);
  }

  function closeLegalSheet() {
    setLegalSheetVisible(false);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setLegalSheet(null);
      closeTimerRef.current = null;
    }, 220);
  }

  return (
    <footer className="landing-footer" id="help" ref={footerRef}>
      <CompanyFooter address={content.address} links={content.links} onOpenLegalSheet={openLegalSheet} />
      {legalSheet && (
        <>
          <div
            className={`landing-legal-sheet-backdrop${legalSheetVisible ? " is-open" : ""}`}
            onClick={closeLegalSheet}
            aria-hidden="true"
          />
          <section
            className={`landing-legal-sheet${legalSheetVisible ? " is-open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={legalSheet === "terms" ? "이용약관" : "개인정보처리방침"}
          >
            <button
              type="button"
              className="landing-legal-sheet-handle"
              onClick={closeLegalSheet}
              aria-label="슬라이드 닫기"
            >
              <span />
            </button>
            <iframe
              src={legalSheet === "terms" ? "/terms.html" : "/privacy.html"}
              className="landing-legal-sheet-iframe"
              title={legalSheet === "terms" ? "이용약관" : "개인정보처리방침"}
            />
            <div className="landing-legal-sheet-actions">
              <button type="button" className="landing-legal-sheet-close-btn" onClick={closeLegalSheet}>
                닫기
              </button>
            </div>
          </section>
        </>
      )}
    </footer>
  );
}
