"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bookmark } from "lucide-react";
import type { ColorItem } from "@/lib/color-types";

type ColorSortMode = "bookmark" | "download" | "purchase";
type ColorViewMode = "col3" | "feed";
const COLOR_VIEW_MODE_STORAGE_KEY = "color-view-mode";

const VIEW_OPTIONS: Array<{ value: ColorViewMode; label: string }> = [
  { value: "col3", label: "앨범형" },
  { value: "feed", label: "목록형" },
];

function toTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareByRecent(a: ColorItem, b: ColorItem): number {
  return toTimestamp(b.created_at) - toTimestamp(a.created_at);
}

function ColorCard({ item, onClick, viewMode }: { item: ColorItem; onClick: () => void; viewMode: ColorViewMode }) {
  const mid = item.img_arao_mid ?? item.img_arao_thumb ?? null;
  const full = item.img_arao_full ?? null;
  const [src, setSrc] = useState(mid ?? full);
  const upgradedRef = useRef(false);

  useEffect(() => {
    if (upgradedRef.current || !full || full === mid) return;
    upgradedRef.current = true;
    const img = new window.Image();
    img.onload = () => setSrc(full);
    img.src = full;
  }, [full, mid]);

  if (viewMode === "feed") {
    return (
      <article className="color-feed-card" onClick={onClick} style={{ cursor: "pointer" }}>
        <div className="color-feed-card-image-wrap">
          {src ? (
            <Image
              src={src}
              alt={item.title}
              fill
              className="color-card-image"
              sizes="100vw"
            />
          ) : (
            <div className="color-card-image-placeholder">이미지 없음</div>
          )}
        </div>
        <div className="color-feed-card-info">
          <p className="color-feed-card-title">{item.title}</p>
          <span className="color-feed-card-heart">
            <Bookmark size={13} strokeWidth={2} fill="currentColor" />
            {item.like_count}
          </span>
        </div>
      </article>
    );
  }

  return (
    <article className="color-card" onClick={onClick} style={{ cursor: "pointer" }}>
      <div className="color-card-image-wrap">
        {src ? (
          <Image
            src={src}
            alt={item.title}
            fill
            className="color-card-image"
            sizes="(max-width: 820px) 33vw, 274px"
          />
        ) : (
          <div className="color-card-image-placeholder">이미지 없음</div>
        )}
        <div className="color-card-title-badge">
          <span className="color-card-title-badge-text">{item.title}</span>
        </div>
        <div className="color-card-heart">
          <Bookmark size={16} strokeWidth={2} fill="currentColor" />
          <span>{item.like_count}</span>
        </div>
      </div>
    </article>
  );
}

function preloadImages(urls: (string | null | undefined)[]): Promise<void> {
  return Promise.all(
    urls.filter(Boolean).map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src!;
        })
    )
  ).then(() => undefined);
}

export function ColorGrid({ items }: { items: ColorItem[] }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortMode, setSortMode] = useState<ColorSortMode>("bookmark");
  const [viewMode, setViewMode] = useState<ColorViewMode>("col3");
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [viewDropdownPos, setViewDropdownPos] = useState({ top: 0, right: 0 });
  const viewDropdownRef = useRef<HTMLDivElement>(null);
  const viewDropdownBtnRef = useRef<HTMLButtonElement>(null);

  const setViewModeWithSave = (mode: ColorViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(COLOR_VIEW_MODE_STORAGE_KEY, mode);
    } catch {}
  };

  useEffect(() => {
    const role = sessionStorage.getItem("user-role");
    setIsAdmin(role === "admin");
  }, []);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(COLOR_VIEW_MODE_STORAGE_KEY);
      if (savedMode === "col3" || savedMode === "feed") {
        setViewMode(savedMode);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!viewDropdownOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(e.target as Node)) {
        setViewDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [viewDropdownOpen]);

  useEffect(() => {
    void (async () => {
      await preloadImages(items.map((i) => i.img_arao_full));
      await preloadImages(items.map((i) => i.img_portrait_full));
      await preloadImages(items.map((i) => i.img_standard_full));
    })();
  }, [items]);


  const handleClick = (item: ColorItem) => {
    try {
      const thumb = item.img_arao_thumb ?? item.img_arao_mid ?? null;
      sessionStorage.setItem(
        `color-detail-instant-${item.id}`,
        JSON.stringify({ id: item.id, title: item.title, thumb })
      );
      sessionStorage.setItem("color-items", JSON.stringify(items));
    } catch {}
    router.push(`/color/${item.id}`);
  };

  const visibleItems = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();
    const filtered = normalizedKeyword
      ? items.filter((item) => {
          const title = item.title.toLowerCase();
          const content = (item.content ?? "").toLowerCase();
          const productCode = (item.product_code ?? "").toLowerCase();
          return (
            title.includes(normalizedKeyword) ||
            content.includes(normalizedKeyword) ||
            productCode.includes(normalizedKeyword)
          );
        })
      : items;

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortMode === "bookmark") {
        if (b.like_count !== a.like_count) return b.like_count - a.like_count;
        return compareByRecent(a, b);
      }
      if (sortMode === "download") {
        const downloadA = a.file_link ? 1 : 0;
        const downloadB = b.file_link ? 1 : 0;
        if (downloadB !== downloadA) return downloadB - downloadA;
        if (b.like_count !== a.like_count) return b.like_count - a.like_count;
        return compareByRecent(a, b);
      }
      const purchasableA = (a.price ?? 0) > 0 ? 1 : 0;
      const purchasableB = (b.price ?? 0) > 0 ? 1 : 0;
      if (purchasableB !== purchasableA) return purchasableB - purchasableA;
      if ((b.price ?? 0) !== (a.price ?? 0)) return (b.price ?? 0) - (a.price ?? 0);
      return compareByRecent(a, b);
    });

    return sorted;
  }, [items, searchKeyword, sortMode]);

  const gridClassName = viewMode === "col3" ? "color-grid color-grid-col3" : "color-grid color-grid-feed";

  return (
    <>
      <section className="color-filter-toolbar" aria-label="정렬 및 보기 방식">
        <button
          type="button"
          className={`color-filter-chip${sortMode === "bookmark" ? " is-active" : ""}`}
          onClick={() => setSortMode("bookmark")}
        >
          북마크순
        </button>
        <button
          type="button"
          className={`color-filter-chip${sortMode === "download" ? " is-active" : ""}`}
          onClick={() => setSortMode("download")}
        >
          다운로드순
        </button>
        <button
          type="button"
          className={`color-filter-chip${sortMode === "purchase" ? " is-active" : ""}`}
          onClick={() => setSortMode("purchase")}
        >
          구매순
        </button>
        <div className="color-view-dropdown" ref={viewDropdownRef}>
          <button
            ref={viewDropdownBtnRef}
            type="button"
            className="color-filter-chip"
            onClick={() => {
              if (viewDropdownBtnRef.current) {
                const rect = viewDropdownBtnRef.current.getBoundingClientRect();
                setViewDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
              }
              setViewDropdownOpen((v) => !v);
            }}
          >
            {VIEW_OPTIONS.find((o) => o.value === viewMode)?.label ?? "보기"}
            <span className={`color-view-dropdown-arrow${viewDropdownOpen ? " open" : ""}`}>▾</span>
          </button>
          {viewDropdownOpen && (
            <div
              className="color-view-dropdown-menu"
              style={{ top: viewDropdownPos.top, right: viewDropdownPos.right }}
            >
              {VIEW_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`color-view-dropdown-option${viewMode === opt.value ? " active" : ""}`}
                  onClick={() => {
                    setViewModeWithSave(opt.value);
                    setViewDropdownOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div>
        {visibleItems.length === 0 ? (
          <div className="color-empty">검색 결과가 없습니다.</div>
        ) : (
          <div className={gridClassName}>
            {visibleItems.map((item) => (
              <ColorCard key={item.id} item={item} onClick={() => handleClick(item)} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>

      <footer className="color-filter-footer" aria-label="컬러 검색">
        <div className="color-filter-footer-inner">
          <form
            className="color-filter-search-row"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="search"
              className="color-filter-search-input"
              placeholder="제목, 내용, 상품코드 검색"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              aria-label="컬러 검색"
            />
            <button type="submit" className="color-filter-search-btn">
              찾아보기
            </button>
          </form>
        </div>
      </footer>

      <button
        type="button"
        className="color-fab"
        aria-label="글쓰기"
        disabled={!isAdmin}
        onClick={() => router.push("/color/write")}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </>
  );
}
