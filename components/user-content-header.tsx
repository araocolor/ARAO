"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BoardHeader } from "@/components/board-header";

type Props = {
  reviewId: string;
  isAuthor: boolean;
  board?: string;
  onBack?: () => void;
};

const BOARD_VALUES = new Set(["notice", "review", "qna", "arao"]);
const PAGE_CACHE_PREFIX = "user-review-page-cache-v1:";

function getNormalizedBoard(board?: string | null): string {
  if (!board) return "review";
  return BOARD_VALUES.has(board) ? board : "review";
}

function getBoardListCacheKey(board: string): string {
  return board === "review" ? "user-review-list-cache" : `user-review-list-cache-${board}`;
}

function getBoardListPath(board: string): string {
  return board === "review" ? "/user_review" : `/user_review?board=${board}`;
}

export function UserContentHeader({ reviewId, isAuthor, board, onBack }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeBoard = searchParams.get("board");
  const normalizedBoard = getNormalizedBoard(routeBoard ?? board);
  const boardListPath = getBoardListPath(normalizedBoard);

  useEffect(() => {
    router.prefetch(boardListPath);
  }, [router, boardListPath]);

  async function handleDelete() {
    if (!confirm("게시글을 삭제할까요?")) return;
    try {
      const response = await fetch(`/api/main/user-review/${reviewId}`, { method: "DELETE" });
      if (!response.ok) {
        const message = (await response.json().catch(() => null)) as { message?: string } | null;
        alert(message?.message ?? "삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      try {
        const cacheKeys = [getBoardListCacheKey(normalizedBoard)];
        if (normalizedBoard !== "review") cacheKeys.push("user-review-list-cache");
        cacheKeys.forEach((cacheKey) => {
          const listRaw = sessionStorage.getItem(cacheKey);
          if (!listRaw) return;
          const parsed = JSON.parse(listRaw) as { data: { items: Array<{ id: string }>; total: number }; ts: number };
          parsed.data.items = parsed.data.items.filter((item) => item.id !== reviewId);
          parsed.data.total = Math.max(parsed.data.total - 1, 0);
          sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
        });
        sessionStorage.removeItem(`user-review-content-${reviewId}`);
        sessionStorage.removeItem(`user-review-likes-${reviewId}`);
        sessionStorage.removeItem(`user-review-comments-${reviewId}`);
        for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
          const key = sessionStorage.key(i);
          if (!key || !key.startsWith(PAGE_CACHE_PREFIX)) continue;
          sessionStorage.removeItem(key);
        }
      } catch {}

      router.push(boardListPath, { scroll: false });
    } catch {
      alert("삭제 중 네트워크 오류가 발생했습니다.");
    }
  }

  const menuItems = isAuthor
    ? [
        { label: "수정하기", onClick: () => router.push(`/write_review?id=${reviewId}&board=${normalizedBoard}`) },
        { label: "삭제하기", onClick: handleDelete },
      ]
    : [];

  return <BoardHeader menuItems={menuItems} onBack={onBack ?? (() => router.push(boardListPath, { scroll: false }))} />;
}
