"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { GalleryComment } from "@/lib/gallery-interactions";
import { getCached, setCached } from "@/hooks/use-prefetch-cache";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex < 0) return email;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  return local.slice(0, 2) + "***" + domain;
}

type Props = {
  category: string;
  index: number;
  onClose: () => void;
  onCommentAdded: () => void;
  highlightCommentId?: string;
};

export function GalleryCommentSheet({ category, index, onClose, onCommentAdded, highlightCommentId }: Props) {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [comments, setComments] = useState<GalleryComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentLikes, setCommentLikes] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [closing, setClosing] = useState(false);
  const [sheetMode, setSheetMode] = useState<"half" | "full">("half");
  const [dragY, setDragY] = useState(0);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragLastY = useRef(0);
  const dragLastTs = useRef(0);
  const dragVelocityY = useRef(0);
  const gestureDecided = useRef(false);
  const gestureControlsSheet = useRef(false);
  const startedInComments = useRef(false);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<GalleryComment[]>([]);

  // commentsRef를 항상 최신 상태로 유지 (Realtime 핸들러에서 사용)
  useEffect(() => { commentsRef.current = comments; }, [comments]);

  useEffect(() => {
    const commentKey = `gallery_comments_${category}_${index}`;

    function applyComments(data: { comments?: (GalleryComment & { user_liked?: boolean })[] }) {
      const list = data.comments ?? [];
      setComments(list);
      const likes: Record<string, { liked: boolean; count: number }> = {};
      list.forEach((c) => { likes[c.id] = { liked: c.user_liked ?? false, count: c.like_count }; });
      setCommentLikes(likes);
      setLoading(false);
    }

    // 캐시 히트 시 즉시 댓글 표시
    const cached = getCached<{ comments: (GalleryComment & { user_liked?: boolean })[] }>(commentKey);
    if (cached) {
      applyComments(cached);
    }

    // 항상 서버에서 최신 user_liked 상태 백그라운드 갱신
    fetch(`/api/gallery/${category}/${index}/comments`)
      .then((r) => r.json())
      .then((data) => {
        setCached(commentKey, data);
        if (!cached) {
          // 캐시 없었으면 전체 반영
          applyComments(data);
        } else {
          // 캐시 있었으면 liked 상태만 조용히 업데이트
          const likes: Record<string, { liked: boolean; count: number }> = {};
          (data.comments ?? []).forEach((c: GalleryComment & { user_liked?: boolean }) => {
            likes[c.id] = { liked: c.user_liked ?? false, count: c.like_count };
          });
          setCommentLikes(likes);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cached) setLoading(false); });
  }, [category, index]);

  // 하이라이트 댓글로 스크롤 + flash (시트 슬라이드 + 데이터 로드 완료 후)
  useEffect(() => {
    if (!highlightCommentId || loading) return;
    const scrollTimer = setTimeout(() => {
      const el = highlightRef.current;
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        el.classList.remove("flash-highlight");
        void el.offsetWidth;
        el.classList.add("flash-highlight");
      }, 400);
    }, 100);
    return () => clearTimeout(scrollTimer);
  }, [highlightCommentId, loading]);

  // Supabase Realtime: 다른 사용자의 댓글 실시간 반영
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`gallery-comments-${category}-${index}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "gallery_comments",
          filter: `item_category=eq.${category}&item_index=eq.${index}`,
        },
        (payload) => {
          const newId = payload.new.id as string;
          // 내가 방금 추가한 댓글이면 무시 (이미 옵티미스틱 UI로 반영됨)
          if (commentsRef.current.some((c) => c.id === newId)) return;
          // 다른 사람 댓글 → API 재조회로 author 정보 포함해서 추가
          fetch(`/api/gallery/${category}/${index}/comments`)
            .then((r) => r.json())
            .then((data) => {
              const list: (GalleryComment & { user_liked?: boolean })[] = data.comments ?? [];
              setComments(list);
              const likes: Record<string, { liked: boolean; count: number }> = {};
              list.forEach((c) => { likes[c.id] = { liked: c.user_liked ?? false, count: c.like_count }; });
              setCommentLikes(likes);
              setCached(`gallery_comments_${category}_${index}`, data);
            })
            .catch(() => {});
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [category, index]);

  function dismiss() {
    if (closing) return;
    setDragY(0);
    setClosing(true);
    setTimeout(() => onClose(), 300);
  }

  const handleCommentLike = async (commentId: string) => {
    setAnimatingIds((s) => new Set(s).add(commentId));
    setTimeout(() => setAnimatingIds((s) => { const n = new Set(s); n.delete(commentId); return n; }), 450);
    const prev = commentLikes[commentId] ?? { liked: false, count: 0 };
    const nextLiked = !prev.liked;
    const nextCount = nextLiked ? prev.count + 1 : Math.max(prev.count - 1, 0);

    // 즉시 UI 반영
    setCommentLikes((s) => ({ ...s, [commentId]: { liked: nextLiked, count: nextCount } }));

    try {
      const res = await fetch(`/api/gallery/comments/${commentId}/likes`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCommentLikes((s) => ({ ...s, [commentId]: { liked: data.liked, count: data.count } }));
        // 캐시에도 반영 → 댓글창 재오픈 시 정확한 liked 상태 유지
        const commentKey = `gallery_comments_${category}_${index}`;
        const cached = getCached<{ comments: (GalleryComment & { user_liked?: boolean })[] }>(commentKey);
        if (cached?.comments) {
          const updatedComments = cached.comments.map((c) =>
            c.id === commentId ? { ...c, user_liked: data.liked, like_count: data.count } : c
          );
          setCached(commentKey, { ...cached, comments: updatedComments });
        }
      } else {
        // 실패 시 롤백
        setCommentLikes((s) => ({ ...s, [commentId]: prev }));
      }
    } catch {
      setCommentLikes((s) => ({ ...s, [commentId]: prev }));
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || submitting) return;
    setSubmitting(true);

    const tempId = "temp-" + Date.now();
    const tempComment: GalleryComment = {
      id: tempId,
      profile_id: "",
      item_category: category,
      item_index: index,
      content: input.trim(),
      like_count: 0,
      created_at: new Date().toISOString(),
      author_username: (user?.username ?? null),
      author_fullname: (user?.fullName ?? null),
      author_icon_image: null,
      author_email: (user?.primaryEmailAddress?.emailAddress ?? null),
    };

    // 즉시 UI 반영
    setComments((prev) => [...prev, tempComment]);
    setCommentLikes((prev) => ({ ...prev, [tempId]: { liked: false, count: 0 } }));
    setInput("");
    onCommentAdded();

    try {
      const res = await fetch(`/api/gallery/${category}/${index}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: tempComment.content }),
      });
      if (res.ok) {
        const comment: GalleryComment = await res.json();
        setComments((prev) => prev.map((c) => (c.id === tempId ? comment : c)));
        setCommentLikes((prev) => {
          const next = { ...prev };
          delete next[tempId];
          next[comment.id] = { liked: false, count: 0 };
          return next;
        });
        // 캐시 업데이트 → 댓글창 재오픈 시 새 댓글 유지
        const commentKey = `gallery_comments_${category}_${index}`;
        const cached = getCached<{ comments: GalleryComment[] }>(commentKey);
        if (cached?.comments) {
          const withoutTemp = cached.comments.filter((c) => c.id !== tempId);
          setCached(commentKey, { ...cached, comments: [...withoutTemp, comment] });
        }
      } else {
        // 실패 시 롤백
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        setCommentLikes((prev) => { const next = { ...prev }; delete next[tempId]; return next; });
      }
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setCommentLikes((prev) => { const next = { ...prev }; delete next[tempId]; return next; });
    } finally {
      setSubmitting(false);
    }
  };

  // 드래그 핸들러
  function onDragStart(e: React.TouchEvent) {
    isDragging.current = true;
    const y = e.touches[0].clientY;
    dragStartY.current = y;
    dragLastY.current = y;
    dragLastTs.current = Date.now();
    dragVelocityY.current = 0;
    gestureDecided.current = false;
    gestureControlsSheet.current = false;
    startedInComments.current = commentsContainerRef.current?.contains(e.target as Node) ?? false;
  }

  function onDragMove(e: React.TouchEvent) {
    if (!isDragging.current) return;
    const y = e.touches[0].clientY;
    const now = Date.now();
    const diff = y - dragStartY.current;
    const stepDt = Math.max(now - dragLastTs.current, 1);
    dragVelocityY.current = (y - dragLastY.current) / stepDt; // px/ms
    dragLastY.current = y;
    dragLastTs.current = now;

    if (!gestureDecided.current && Math.abs(diff) > 6) {
      if (!startedInComments.current) {
        gestureControlsSheet.current = true;
      } else {
        const scrollTop = commentsContainerRef.current?.scrollTop ?? 0;
        if (diff > 0) {
          gestureControlsSheet.current = scrollTop <= 0;
        } else {
          gestureControlsSheet.current = sheetMode === "half" && scrollTop <= 0;
        }
      }
      gestureDecided.current = true;
    }

    if (!gestureControlsSheet.current) return;
    e.preventDefault();

    let next = diff;
    if (sheetMode === "full" && next < 0) {
      // full 상태에서 위로 더 끌 때는 저항만 주고 사실상 고정
      next = next * 0.2;
    }
    setDragY(next);
  }

  function onDragEnd() {
    isDragging.current = false;
    if (!gestureControlsSheet.current) return;

    const fastDown = dragVelocityY.current > 0.6;
    const fastUp = dragVelocityY.current < -0.6;

    if (sheetMode === "half") {
      if (dragY < -70 || fastUp) {
        setSheetMode("full"); // 전체화면 확장
      } else if (dragY > 130 || fastDown) {
        dismiss(); // 닫기
      }
      setDragY(0);
    } else {
      if (dragY > 280 || (dragY > 180 && fastDown)) {
        dismiss(); // 크게 내리면 닫기
      } else if (dragY > 100 || fastDown) {
        setSheetMode("half"); // 중간 높이로 복귀
      }
      setDragY(0);
    }
  }

  const panelStyle: React.CSSProperties = {
    height: sheetMode === "full" ? "100dvh" : "56vh",
    borderRadius: sheetMode === "full" ? "0" : "20px 20px 0 0",
    transform: closing
      ? "translateY(100%)"
      : dragY !== 0
        ? `translateY(${dragY}px)`
        : undefined,
    transition: isDragging.current
      ? "none"
      : closing
        ? "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)"
        : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), height 0.3s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.3s",
  };

  return (
    <div
      className={`gallery-sheet-overlay${closing ? " is-closing" : ""}`}
      onClick={dismiss}
    >
      <div
        className="gallery-sheet-panel"
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
      >
        {/* 드래그 핸들 + 타이틀 — 드래그 영역 */}
        <div className="gallery-sheet-drag-area">
          <div className="gallery-sheet-handle" />
          <p className="gallery-sheet-title">댓글</p>
        </div>

        <div
          ref={commentsContainerRef}
          className="gallery-sheet-comments"
          style={{ overscrollBehavior: "contain" }}
        >
          {loading && <p className="gallery-sheet-empty">불러오는 중...</p>}
          {!loading && comments.length === 0 && (
            <p className="gallery-sheet-empty">첫 번째 댓글을 남겨보세요</p>
          )}
          {comments.map((c) => {
            const likeState = commentLikes[c.id] ?? { liked: false, count: c.like_count };
            const isHighlight = c.id === highlightCommentId;
            return (
              <div
                key={c.id}
                ref={isHighlight ? highlightRef : undefined}
                className="gallery-comment-item"
              >
                {c.author_icon_image ? (
                  <img src={c.author_icon_image} className="gallery-comment-avatar gallery-comment-avatar-img" alt="" />
                ) : (
                  <div className="gallery-comment-avatar gallery-comment-avatar-default">
                    <span className="gallery-comment-avatar-head" />
                    <span className="gallery-comment-avatar-body" />
                  </div>
                )}
                <div className="gallery-comment-body">
                  <span className="gallery-comment-author">
                    {c.author_username
                      ? c.author_username
                      : c.author_email
                        ? maskEmail(c.author_email)
                        : "익명"}
                  </span>
                  <span className="gallery-comment-content">{c.content}</span>
                </div>
                <button
                  className={`gallery-comment-like-btn${likeState.liked ? " liked" : ""}${animatingIds.has(c.id) ? " heart-animate" : ""}`}
                  onClick={() => handleCommentLike(c.id)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={likeState.liked ? "#ef4444" : "none"}
                    stroke={likeState.liked ? "#ef4444" : "currentColor"}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {likeState.count > 0 && <span>{likeState.count}</span>}
                </button>
              </div>
            );
          })}
        </div>

        <div className="gallery-sheet-emoji-row">
          {["❤️","😍","🥰","😊","😂","🔥","✨","👍","🎉","💯","🙏","😭","💕","😎","🤩","👏","💪","🌟","😆","🥹","💖","😘","🫶","🤍","😁","🫠","😅","🤗","😇","🥲","😴","🤭","😋","🤔","😬","🥳","😤","😢","🤯","🫡"].map((emoji) => (
            <button
              key={emoji}
              className="gallery-sheet-emoji-btn"
              onClick={() => setInput((prev) => prev + emoji)}
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="gallery-sheet-input-row">
          <div className="gallery-comment-avatar gallery-comment-avatar-sm" />
          <input
            className="gallery-sheet-input"
            placeholder="회원님에 댓글을 남겨보세요."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            onFocus={(e) => {
              if (!isSignedIn) {
                e.target.blur();
                router.push("/sign-in");
              }
            }}
          />
          <button
            className="gallery-sheet-submit"
            onClick={handleSubmit}
            disabled={!input.trim() || submitting}
          >
            게시
          </button>
        </div>
      </div>
    </div>
  );
}
