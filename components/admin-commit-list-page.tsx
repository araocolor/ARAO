"use client";

import { useEffect, useMemo, useState } from "react";

type CommitReportSection = {
  title: string;
  bullets: string[];
};

type CommitReportItem = {
  id: string;
  menu: string;
  heading: string;
  displayDateTime: string;
  aiAgent: string;
  originalReview: string;
  meta?: string;
  keywords: string[];
  sections: CommitReportSection[];
};

type WorkLogApiRow = {
  id: string;
  commit_hash: string;
  title: string;
  summary: string;
  details: string | null;
  original_review: string | null;
  status: "draft" | "done" | "rollback";
  report_url: string | null;
  deployed_at: string | null;
  author_name_snapshot: string;
  created_at: string;
  updated_at: string;
};

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function splitCommitLabel(menu: string): { commit: string | null; title: string } {
  const marker = " - ";
  const idx = menu.indexOf(marker);
  if (idx <= 0) return { commit: null, title: menu };
  const commit = menu.slice(0, idx).trim();
  const title = menu.slice(idx + marker.length).trim();
  if (!/^[a-z0-9]+$/i.test(commit) || commit.length > 16 || !title) {
    return { commit: null, title: menu };
  }
  return { commit, title };
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour24 = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const period = hour24 < 12 ? "am" : "pm";
  const hour12 = hour24 % 12 || 12;
  return `${year}/${month}/${day} ${hour12}:${minute}${period}`;
}

function linesToBullets(input: string): string[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toReportItem(row: WorkLogApiRow): CommitReportItem {
  const summary = row.summary?.trim() ?? "";
  const details = row.details?.trim() ?? "";
  const originalReview = row.original_review?.trim() || details || summary || "원본 리뷰가 아직 없습니다.";
  const menu = `${row.commit_hash} - ${row.title}`;

  const sections: CommitReportSection[] = [];
  if (summary) {
    sections.push({
      title: "간략 리뷰",
      bullets: [summary],
    });
  }
  if (details) {
    sections.push({
      title: "상세 리뷰",
      bullets: linesToBullets(details),
    });
  }
  if (sections.length === 0) {
    sections.push({
      title: "내용",
      bullets: ["등록된 요약/상세 내용이 없습니다."],
    });
  }

  const metaParts: string[] = [
    `커밋: ${row.commit_hash}`,
    `상태: ${row.status}`,
  ];
  if (row.report_url) {
    metaParts.push(`링크: ${row.report_url}`);
  }

  return {
    id: row.id,
    menu,
    heading: row.title,
    displayDateTime: formatDateTime(row.deployed_at ?? row.updated_at ?? row.created_at),
    aiAgent: row.author_name_snapshot?.trim() || "Unknown",
    originalReview,
    meta: metaParts.join(" / "),
    keywords: [
      row.commit_hash,
      row.title,
      summary,
      details,
      originalReview,
      row.author_name_snapshot,
      row.status,
    ].filter(Boolean),
    sections,
  };
}

export function AdminCommitListPage() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [items, setItems] = useState<CommitReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadItems() {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/admin/work-logs?limit=200");
      const data = (await response.json()) as { items?: WorkLogApiRow[]; message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "작업 이력을 불러오지 못했습니다.");
      }
      const rows = Array.isArray(data.items) ? data.items : [];
      setItems(rows.map(toReportItem));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "작업 이력 조회 중 오류가 발생했습니다.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("work_list_theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    if (!theme) return;
    try {
      window.localStorage.setItem("work_list_theme", theme);
    } catch {
      // no-op
    }
  }, [theme]);

  const filteredItems = useMemo(() => {
    const normalized = normalizeQuery(query);
    if (!normalized) return items;
    return items.filter((item) => {
      const text = `${item.menu} ${item.heading} ${item.meta ?? ""} ${item.keywords.join(" ")}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [items, query]);

  useEffect(() => {
    if (!openId) return;
    if (filteredItems.some((item) => item.id === openId)) return;
    setOpenId(null);
  }, [openId, filteredItems]);

  useEffect(() => {
    if (!detailItemId) return;
    if (items.some((item) => item.id === detailItemId)) return;
    setDetailItemId(null);
  }, [detailItemId, items]);

  const detailItem = detailItemId ? items.find((item) => item.id === detailItemId) ?? null : null;

  return (
    <div className="admin-commit-report" data-theme={theme ?? undefined}>
      <div className={`admin-commit-report-stage${detailItem ? " is-detail-open" : ""}`}>
        <div className="admin-commit-report-screen admin-commit-report-screen-main">
          <div className="admin-commit-report-top">
            <input
              className="admin-commit-report-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="검색어: 커밋명, 제목, 리뷰"
            />
            <button
              type="button"
              className="admin-commit-report-theme-btn"
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            >
              테마
            </button>
          </div>

          <div className="admin-commit-report-list-head">
            <h1>작업 목록</h1>
            <span>{loading ? "로딩..." : `${filteredItems.length}건`}</span>
          </div>

          {loadError ? <p className="admin-commit-report-empty">{loadError}</p> : null}

          {!loadError && filteredItems.length === 0 ? (
            <p className="admin-commit-report-empty">
              {loading ? "작업 이력을 불러오는 중입니다." : "등록된 작업 이력이 없습니다."}
            </p>
          ) : (
            <ul className="admin-commit-report-rows">
              {filteredItems.map((item) => {
                const expanded = item.id === openId;
                const label = splitCommitLabel(item.menu);
                return (
                  <li key={item.id} className="admin-commit-report-row">
                    <button
                      type="button"
                      className={`admin-commit-report-row-trigger${expanded ? " active" : ""}`}
                      onClick={() => setOpenId((prev) => (prev === item.id ? null : item.id))}
                      aria-expanded={expanded}
                      aria-controls={`report-panel-${item.id}`}
                    >
                      <span className="admin-commit-report-row-main">
                        {label.commit ? (
                          <span className="admin-commit-report-row-commit">{label.commit}</span>
                        ) : null}
                        <span className="admin-commit-report-row-title">{label.title}</span>
                        <span className="admin-commit-report-row-divider">/</span>
                        <span className="admin-commit-report-row-model">{item.aiAgent}</span>
                      </span>
                      <span className="admin-commit-report-row-icon" aria-hidden="true">
                        {expanded ? "−" : "+"}
                      </span>
                    </button>

                    {expanded ? (
                      <div id={`report-panel-${item.id}`} className="admin-commit-report-row-body">
                        <div className="admin-commit-report-title-row">
                          <h2>{item.heading}</h2>
                          <div className="admin-commit-report-title-actions">
                            <span className="admin-commit-report-datetime">{item.displayDateTime}</span>
                            <button
                              type="button"
                              className="admin-commit-report-detail-btn"
                              onClick={() => setDetailItemId(item.id)}
                            >
                              상세보기
                            </button>
                          </div>
                        </div>
                        {item.meta ? <p className="admin-commit-report-meta">{item.meta}</p> : null}
                        {item.sections.map((section) => (
                          <div key={`${item.id}-${section.title}`}>
                            <p className="admin-commit-report-section-title">{section.title}</p>
                            <ul>
                              {section.bullets.map((bullet) => (
                                <li key={bullet}>{bullet}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="admin-commit-report-screen admin-commit-report-screen-detail">
          {detailItem ? (
            <section className="admin-commit-report-detail-view">
              <button
                type="button"
                className="admin-commit-report-back-btn"
                onClick={() => setDetailItemId(null)}
                aria-label="작업 리스트로 돌아가기"
              >
                ← 돌아가기
              </button>

              <div className="admin-commit-report-detail-content">
                <h2>{detailItem.heading}</h2>
                <p className="admin-commit-report-meta">{detailItem.displayDateTime}</p>
                <p className="admin-commit-report-section-title">원본 리뷰</p>
                <pre className="admin-commit-report-original-text">{detailItem.originalReview}</pre>
              </div>
            </section>
          ) : (
            <div className="admin-commit-report-detail-placeholder" />
          )}
        </div>
      </div>
    </div>
  );
}
