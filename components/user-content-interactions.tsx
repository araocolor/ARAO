"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { TierBadge } from "@/components/tier-badge";
import { UserProfileModal, type UserProfileModalTarget } from "@/components/user-profile-modal";

type Comment = {
  id: string;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  parentId: string | null;
  authorId: string;
  authorEmail?: string | null;
  authorTier?: string | null;
  iconImage: string | null;
  isMine?: boolean;
  likeCount: number;
  liked: boolean;
};

type ReplyContext = {
  target: Comment;
  parentId: string;
};

type SubmitButtonState = "idle" | "pending" | "error";

type ReviewCountPatch = {
  likeCount?: number;
  commentCount?: number;
};

type CommentCreatedEventDetail = {
  reviewId: string;
  comment: Comment;
};

const SOFT_DELETED_PARENT_TEXT = "댓글이 삭제되었습니다.";

function dispatchNotificationRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("notification-refresh"));
}

function sanitizeCount(value: number | undefined): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return Math.max(Math.trunc(value), 0);
}

function patchReviewCountCaches(reviewId: string, patch: ReviewCountPatch) {
  const nextLikeCount = sanitizeCount(patch.likeCount);
  const nextCommentCount = sanitizeCount(patch.commentCount);
  if (nextLikeCount === undefined && nextCommentCount === undefined) return;

  try {
    const PAGE_CACHE_PREFIX = "user-review-page-cache-v1:";
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      if (!key.startsWith("user-review-list-cache") && !key.startsWith(PAGE_CACHE_PREFIX)) continue;

      const raw = sessionStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw) as {
        data?: {
          items?: Array<{ id: string; likeCount?: number; commentCount?: number; [key: string]: unknown }>;
          [key: string]: unknown;
        };
        ts?: number;
      };

      if (!parsed.data || !Array.isArray(parsed.data.items)) continue;

      let changed = false;
      parsed.data.items = parsed.data.items.map((item) => {
        if (item.id !== reviewId) return item;
        const nextItem = { ...item };
        if (nextLikeCount !== undefined) nextItem.likeCount = nextLikeCount;
        if (nextCommentCount !== undefined) nextItem.commentCount = nextCommentCount;
        changed = true;
        return nextItem;
      });

      if (!changed) continue;
      parsed.ts = Date.now();
      sessionStorage.setItem(key, JSON.stringify(parsed));
    }
  } catch {}
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${m}.${day} ${h}:${min}`;
}

function getLikesCache(reviewId: string): { liked: boolean; likeCount: number } | null {
  try {
    const cached = sessionStorage.getItem(`user-review-likes-${reviewId}`);
    if (!cached) return null;
    const { data, ts } = JSON.parse(cached) as { data: { liked: boolean; likeCount: number }; ts: number };
    if (Date.now() - ts < 300000) return data;
  } catch {}
  return null;
}

function setLikesCache(reviewId: string, next: { liked: boolean; likeCount: number }) {
  try {
    sessionStorage.setItem(`user-review-likes-${reviewId}`, JSON.stringify({ data: next, ts: Date.now() }));
  } catch {}
  patchReviewCountCaches(reviewId, { likeCount: next.likeCount });
}

function setCommentCountCache(reviewId: string, nextCommentCount: number) {
  patchReviewCountCaches(reviewId, { commentCount: nextCommentCount });
}

function getCommentsCache(reviewId: string): Comment[] | null {
  try {
    const cached = sessionStorage.getItem(`user-review-comments-${reviewId}`);
    if (!cached) return null;
    const { data, ts } = JSON.parse(cached) as { data: { comments: Comment[] }; ts: number };
    if (Date.now() - ts < 300000) {
      return (data.comments ?? []).map((comment) => ({
        ...comment,
        parentId: comment.parentId ?? null,
        authorEmail: comment.authorEmail ?? null,
        likeCount: comment.likeCount ?? 0,
        liked: comment.liked ?? false,
      }));
    }
  } catch {}
  return null;
}

function getVisibleCommentCount(comments: Comment[]): number {
  return comments.reduce((count, comment) => count + (comment.isDeleted ? 0 : 1), 0);
}

export function UserContentLikeSection({
  reviewId,
  footer,
  onLikeCountChange,
}: {
  reviewId: string;
  footer?: boolean;
  onLikeCountChange?: (nextLikeCount: number) => void;
}) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const cachedLikes = getLikesCache(reviewId);
  const [liked, setLiked] = useState(cachedLikes?.liked ?? false);
  const [likeCount, setLikeCount] = useState(cachedLikes?.likeCount ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const interactedRef = useRef(false);

  useEffect(() => {
    fetch(`/api/main/user-review/${reviewId}/likes`)
      .then((r) => r.json())
      .then((d) => {
        if (interactedRef.current) return;
        const nextLiked = d.liked ?? false;
        const nextLikeCount = sanitizeCount(d.likeCount) ?? 0;
        setLiked(nextLiked);
        setLikeCount(nextLikeCount);
        onLikeCountChange?.(nextLikeCount);
        setLikesCache(reviewId, { liked: nextLiked, likeCount: nextLikeCount });
      })
      .catch(() => {});
  }, [reviewId, onLikeCountChange]);

  async function handleLike() {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    if (likeLoading) return;
    const prevLiked = liked;
    const prevLikeCount = likeCount;
    interactedRef.current = true;
    setLikeLoading(true);
    const nextLiked = !prevLiked;
    const optimisticLikeCount = Math.max(prevLikeCount + (nextLiked ? 1 : -1), 0);
    setLiked(nextLiked);
    setLikeCount(optimisticLikeCount);
    onLikeCountChange?.(optimisticLikeCount);
    try {
      const res = await fetch(`/api/main/user-review/${reviewId}/likes`, { method: "POST" });
      const d = await res.json();
      const nextLikeCount = sanitizeCount(d.likeCount) ?? 0;
      setLiked(d.liked);
      setLikeCount(nextLikeCount);
      setLikesCache(reviewId, { liked: d.liked, likeCount: nextLikeCount });
      onLikeCountChange?.(nextLikeCount);
      if (d.liked) dispatchNotificationRefresh();
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevLikeCount);
      onLikeCountChange?.(prevLikeCount);
    } finally {
      setLikeLoading(false);
      interactedRef.current = false;
    }
  }

  if (footer) {
    return (
      <button
        type="button"
        className={`user-content-bottom-like-btn${liked ? " liked" : ""}`}
        onClick={handleLike}
        disabled={likeLoading}
        aria-label="좋아요"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? "#FF2D2D" : "none"} stroke={liked ? "#FF2D2D" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>
    );
  }

  return (
    <section className="user-content-like-inline">
      <button
        type="button"
        className={`user-content-like-btn${liked ? " liked" : ""}`}
        onClick={handleLike}
        disabled={likeLoading}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? "#FF2D2D" : "none"} stroke={liked ? "#FF2D2D" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {likeCount > 0 && <span className="user-content-like-count">{likeCount}</span>}
      </button>
    </section>
  );
}

export function UserContentInteractions({
  reviewId,
  reviewAuthorId,
  targetCommentId,
  onCommentCountChange,
  onRequestOpenSheet,
  onRequestEditComment,
  autoFocusComment,
  onCommentSubmitted,
  initialReplyTarget,
}: {
  reviewId: string;
  reviewAuthorId?: string | null;
  targetCommentId?: string | null;
  onCommentCountChange?: (nextCommentCount: number) => void;
  onRequestOpenSheet?: (replyTarget?: { authorId: string; commentId: string; parentId: string; content: string; iconImage: string | null }) => void;
  onRequestEditComment?: (comment: { id: string; content: string; parentId: string | null; authorId: string; iconImage: string | null; parentAuthorId?: string | null; parentContent?: string | null; parentIconImage?: string | null }) => void;
  autoFocusComment?: boolean;
  onCommentSubmitted?: (commentId: string) => void;
  initialReplyTarget?: { authorId: string; commentId: string; parentId: string } | null;
}) {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const cachedComments = getCommentsCache(reviewId);
  const [comments, setComments] = useState<Comment[]>(cachedComments ?? []);
  const commentsRef = useRef<Comment[]>(cachedComments ?? []);
  const [commentInput, setCommentInput] = useState("");
  const [replyThreadInput, setReplyThreadInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyThreadSubmitting, setReplyThreadSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyContext | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const commentTextareaElRef = useRef<HTMLTextAreaElement>(null);
  const replyThreadTextareaElRef = useRef<HTMLTextAreaElement>(null);
  const [menuComment, setMenuComment] = useState<Comment | null>(null);
  const [pendingLikeCommentIds, setPendingLikeCommentIds] = useState<Set<string>>(new Set());
  const [submitButtonState, setSubmitButtonState] = useState<SubmitButtonState>("idle");
  const submitButtonStateTimerRef = useRef<number | null>(null);
  const lastCommentCountRef = useRef<number | null>(null);
  const highlightedCommentDoneRef = useRef<string | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const missingTargetNoticeTimerRef = useRef<number | null>(null);
  const commentSectionRef = useRef<HTMLElement | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [missingTargetNotice, setMissingTargetNotice] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(cachedComments !== null);
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [profileModalTarget, setProfileModalTarget] = useState<UserProfileModalTarget | null>(null);
  const [activeReplyThreadParentId, setActiveReplyThreadParentId] = useState<string | null>(null);
  const COMMENT_HIGHLIGHT_DURATION_MS = 2000;
  const signedInEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  const openReplyThread = useCallback((parentId: string) => {
    setActiveReplyThreadParentId(parentId);
  }, []);

  const closeReplyThread = useCallback(() => {
    setActiveReplyThreadParentId(null);
  }, []);

  function setCommentsCache(nextComments: Comment[]) {
    try {
      sessionStorage.setItem(
        `user-review-comments-${reviewId}`,
        JSON.stringify({ data: { comments: nextComments }, ts: Date.now() })
      );
    } catch {}
  }

  const syncCommentCount = useCallback((nextComments: Comment[]) => {
    const nextCommentCount = getVisibleCommentCount(nextComments);
    if (lastCommentCountRef.current === nextCommentCount) return;
    lastCommentCountRef.current = nextCommentCount;
    setCommentCountCache(reviewId, nextCommentCount);
    onCommentCountChange?.(nextCommentCount);
  }, [reviewId, onCommentCountChange]);

  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  useEffect(() => {
    if (!activeReplyThreadParentId) return;
    const parentExists = comments.some((comment) => comment.id === activeReplyThreadParentId && !comment.parentId);
    if (!parentExists) {
      setActiveReplyThreadParentId(null);
    }
  }, [comments, activeReplyThreadParentId]);

  useEffect(() => {
    setReplyThreadInput("");
    setReplyThreadSubmitting(false);
    const textarea = replyThreadTextareaElRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
  }, [activeReplyThreadParentId]);

  useEffect(() => {
    if (!autoFocusComment) return;
    const timer = window.setTimeout(() => {
      const textarea = commentTextareaElRef.current;
      if (!textarea) return;
      textarea.focus();
      const cursor = textarea.value.length;
      try { textarea.setSelectionRange(cursor, cursor); } catch {}
    }, 50);
    return () => window.clearTimeout(timer);
  }, [autoFocusComment]);

  useEffect(() => {
    function handleCreated(event: Event) {
      const custom = event as CustomEvent<CommentCreatedEventDetail>;
      const detail = custom.detail;
      if (!detail || detail.reviewId !== reviewId || !detail.comment) return;

      setComments((prev) => {
        if (prev.some((comment) => comment.id === detail.comment.id)) return prev;
        const next = [...prev, detail.comment];
        setCommentsCache(next);
        return next;
      });
    }

    window.addEventListener("user-review-comment-created", handleCreated as EventListener);
    return () => {
      window.removeEventListener("user-review-comment-created", handleCreated as EventListener);
    };
  }, [reviewId]);

  useEffect(() => {
    function handleEdited(event: Event) {
      const custom = event as CustomEvent<{ reviewId: string; commentId: string; content: string }>;
      const detail = custom.detail;
      if (!detail || detail.reviewId !== reviewId) return;
      setComments((prev) => {
        const next = prev.map((c) => c.id === detail.commentId ? { ...c, content: detail.content } : c);
        setCommentsCache(next);
        return next;
      });
    }

    window.addEventListener("user-review-comment-edited", handleEdited as EventListener);
    return () => {
      window.removeEventListener("user-review-comment-edited", handleEdited as EventListener);
    };
  }, [reviewId]);

  useEffect(() => {
    if (!initialReplyTarget) return;
    const mention = `@${initialReplyTarget.authorId} `;
    const pseudoTarget = {
      id: initialReplyTarget.commentId,
      authorId: initialReplyTarget.authorId,
    } as Comment;
    setReplyTo({ target: pseudoTarget, parentId: initialReplyTarget.parentId });
    setCommentInput(mention);
    setSubmitButtonState("idle");
    const timer = window.setTimeout(() => {
      const textarea = commentTextareaElRef.current;
      if (!textarea) return;
      textarea.focus();
      const cursor = textarea.value.length;
      try { textarea.setSelectionRange(cursor, cursor); } catch {}
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }, 50);
    return () => window.clearTimeout(timer);
  }, [initialReplyTarget]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
      if (submitButtonStateTimerRef.current !== null) {
        window.clearTimeout(submitButtonStateTimerRef.current);
      }
      if (missingTargetNoticeTimerRef.current !== null) {
        window.clearTimeout(missingTargetNoticeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!isSignedIn) {
      setViewerRole(null);
      return () => {
        cancelled = true;
      };
    }

    try {
      if (signedInEmail) {
        const cacheKey = `general_${signedInEmail.toLowerCase()}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as { data?: { role?: string } };
          const cachedRole = parsed?.data?.role;
          if (typeof cachedRole === "string" && cachedRole.trim().length > 0) {
            setViewerRole(cachedRole);
          }
        }
      }
    } catch {}

    fetch("/api/account/general")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { role?: string } | null) => {
        if (cancelled) return;
        setViewerRole(data?.role ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setViewerRole(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, signedInEmail]);

  useEffect(() => {
    syncCommentCount(comments);
  }, [comments, syncCommentCount]);

  useEffect(() => {
    lastCommentCountRef.current = null;
    syncCommentCount(commentsRef.current);
  }, [reviewId, syncCommentCount]);

  useEffect(() => {
    const normalizedTargetId =
      typeof targetCommentId === "string" && targetCommentId.trim().length > 0
        ? targetCommentId.trim()
        : null;
    if (!normalizedTargetId) return;
    if (highlightedCommentDoneRef.current === normalizedTargetId) return;

    const targetComment = comments.find((comment) => comment.id === normalizedTargetId) ?? null;
    if (targetComment?.parentId && activeReplyThreadParentId !== targetComment.parentId) {
      openReplyThread(targetComment.parentId);
      return;
    }

    const targetEl = document.getElementById(`user-review-comment-${normalizedTargetId}`);
    if (!targetEl) {
      if (!commentsLoaded) return;
      highlightedCommentDoneRef.current = normalizedTargetId;
      window.requestAnimationFrame(() => {
        commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      setMissingTargetNotice(true);
      if (missingTargetNoticeTimerRef.current !== null) {
        window.clearTimeout(missingTargetNoticeTimerRef.current);
      }
      missingTargetNoticeTimerRef.current = window.setTimeout(() => {
        setMissingTargetNotice(false);
        missingTargetNoticeTimerRef.current = null;
      }, 2400);
      return;
    }

    highlightedCommentDoneRef.current = normalizedTargetId;
    window.requestAnimationFrame(() => {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    setHighlightedCommentId(normalizedTargetId);
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedCommentId((prev) => (prev === normalizedTargetId ? null : prev));
    }, COMMENT_HIGHLIGHT_DURATION_MS);
  }, [targetCommentId, comments, commentsLoaded, COMMENT_HIGHLIGHT_DURATION_MS, activeReplyThreadParentId, openReplyThread]);

  function setCommentLikePending(commentId: string, pending: boolean) {
    setPendingLikeCommentIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(commentId);
      else next.delete(commentId);
      return next;
    });
  }

  const likeCommentMutation = useMutation<
    { liked: boolean; likeCount: number },
    Error,
    string,
    { previousComments: Comment[]; commentId: string }
  >({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/main/user-review/${reviewId}/comments/${commentId}/likes`, { method: "POST" });
      if (!res.ok) throw new Error("댓글 좋아요 반영 실패");
      return (await res.json()) as { liked: boolean; likeCount: number };
    },
    onMutate: async (commentId: string) => {
      const previousComments = commentsRef.current;
      setCommentLikePending(commentId, true);
      setComments((prev) => {
        const next = prev.map((comment) => {
          if (comment.id !== commentId) return comment;
          const nextLiked = !comment.liked;
          return {
            ...comment,
            liked: nextLiked,
            likeCount: Math.max(comment.likeCount + (nextLiked ? 1 : -1), 0),
          };
        });
        setCommentsCache(next);
        return next;
      });
      return { previousComments, commentId };
    },
    onSuccess: (data, commentId) => {
      setComments((prev) => {
        const next = prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, liked: data.liked, likeCount: data.likeCount }
            : comment
        );
        setCommentsCache(next);
        return next;
      });
      if (data.liked) dispatchNotificationRefresh();
    },
    onError: (_error, _commentId, context) => {
      if (!context) return;
      setComments(context.previousComments);
      setCommentsCache(context.previousComments);
    },
    onSettled: (_data, _error, commentId, context) => {
      setCommentLikePending(context?.commentId ?? commentId, false);
    },
  });

  useEffect(() => {
    highlightedCommentDoneRef.current = null;
    setMissingTargetNotice(false);

    // 캐시가 있으면 즉시 표시. 단, 이메일 필드가 비어 있으면 백그라운드 갱신
    const cached = getCommentsCache(reviewId);
    if (cached !== null) {
      setComments(cached);
      setCommentsLoaded(true);
      const needEmailBackfill = cached.some((comment) => !(comment.authorEmail ?? "").trim());
      if (needEmailBackfill) {
        fetch(`/api/main/user-review/${reviewId}/comments`)
          .then((r) => r.json())
          .then((d) => {
            const nextComments: Comment[] = Array.isArray(d.comments)
              ? d.comments.map((comment: Comment) => ({
                ...comment,
                parentId: comment.parentId ?? null,
                authorEmail: comment.authorEmail ?? null,
                likeCount: comment.likeCount ?? 0,
                liked: comment.liked ?? false,
              }))
              : [];
            setComments(nextComments);
            try {
              sessionStorage.setItem(
                `user-review-comments-${reviewId}`,
                JSON.stringify({ data: { comments: nextComments }, ts: Date.now() })
              );
            } catch {}
          })
          .catch(() => {});
      }
      return;
    }

    setCommentsLoaded(false);
    fetch(`/api/main/user-review/${reviewId}/comments`)
      .then((r) => r.json())
      .then((d) => {
        const nextComments: Comment[] = Array.isArray(d.comments)
          ? d.comments.map((comment: Comment) => ({
            ...comment,
            parentId: comment.parentId ?? null,
            authorEmail: comment.authorEmail ?? null,
            likeCount: comment.likeCount ?? 0,
            liked: comment.liked ?? false,
          }))
          : [];
        setComments(nextComments);
        try {
          sessionStorage.setItem(
            `user-review-comments-${reviewId}`,
            JSON.stringify({ data: { comments: nextComments }, ts: Date.now() })
          );
        } catch {}
      })
      .catch(() => {})
      .finally(() => {
        setCommentsLoaded(true);
      });
  }, [reviewId, syncCommentCount]);

  // Supabase Realtime: 다른 사용자의 댓글 실시간 반영
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`review-comments-${reviewId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_review_comments",
          filter: `review_id=eq.${reviewId}`,
        },
        () => {
          fetch(`/api/main/user-review/${reviewId}/comments`)
            .then((r) => r.json())
            .then((d) => {
              const nextComments: Comment[] = Array.isArray(d.comments)
                ? d.comments.map((comment: Comment) => ({
                  ...comment,
                  parentId: comment.parentId ?? null,
                  authorEmail: comment.authorEmail ?? null,
                  likeCount: comment.likeCount ?? 0,
                  liked: comment.liked ?? false,
                }))
                : [];
              setComments(nextComments);
              setCommentsCache(nextComments);
            })
            .catch(() => {});
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [reviewId]);

  // visibilitychange: 앱 복귀 시 백그라운드로 캐시 갱신
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      fetch(`/api/main/user-review/${reviewId}/comments`)
        .then((r) => r.json())
        .then((d) => {
          const nextComments: Comment[] = Array.isArray(d.comments)
            ? d.comments.map((comment: Comment) => ({
              ...comment,
              parentId: comment.parentId ?? null,
              authorEmail: comment.authorEmail ?? null,
              likeCount: comment.likeCount ?? 0,
              liked: comment.liked ?? false,
            }))
            : [];
          setComments(nextComments);
          setCommentsCache(nextComments);
        })
        .catch(() => {});
      fetch(`/api/main/user-review/${reviewId}/likes`)
        .then((r) => r.json())
        .then((d) => {
          const nextLiked = d.liked ?? false;
          const nextLikeCount = sanitizeCount(d.likeCount) ?? 0;
          setLikesCache(reviewId, { liked: nextLiked, likeCount: nextLikeCount });
        })
        .catch(() => {});
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => { document.removeEventListener("visibilitychange", handleVisibilityChange); };
  }, [reviewId]);

  function editRows(text: string) {
    return Math.min(Math.max(text.split("\n").length, 1), 3);
  }

  function startReply(target: Comment, parentId: string) {
    if (onRequestOpenSheet) {
      requestOpenSheet({
        authorId: target.authorId,
        commentId: target.id,
        parentId,
        content: target.content,
        iconImage: target.iconImage ?? null,
      });
      return;
    }
    setReplyTo({ target, parentId });
    setSubmitButtonState("idle");
    const mention = `@${target.authorId} `;
    setCommentInput(mention);
    window.setTimeout(() => {
      const textarea = commentTextareaElRef.current;
      if (!textarea) return;
      textarea.focus();
      const cursor = textarea.value.length;
      try { textarea.setSelectionRange(cursor, cursor); } catch {}
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }, 0);
  }

  function requestOpenSheet(replyTarget?: { authorId: string; commentId: string; parentId: string; content: string; iconImage: string | null }) {
    if (!onRequestOpenSheet) return;
    onRequestOpenSheet(replyTarget);
  }

  function openCommentSheetForReplyThread() {
    if (!activeReplyThreadParentComment) return;
    requestOpenSheet({
      authorId: activeReplyThreadParentComment.authorId,
      commentId: activeReplyThreadParentComment.id,
      parentId: activeReplyThreadParentComment.id,
      content: activeReplyThreadParentComment.content,
      iconImage: activeReplyThreadParentComment.iconImage ?? null,
    });
  }

  function updateSubmitButtonState(next: SubmitButtonState, autoResetMs?: number) {
    if (submitButtonStateTimerRef.current !== null) {
      window.clearTimeout(submitButtonStateTimerRef.current);
      submitButtonStateTimerRef.current = null;
    }

    setSubmitButtonState(next);
    if (!autoResetMs) return;

    submitButtonStateTimerRef.current = window.setTimeout(() => {
      setSubmitButtonState("idle");
      submitButtonStateTimerRef.current = null;
    }, autoResetMs);
  }

  async function handleSubmitComment() {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    if (!commentInput.trim() || submitting) return;
    const submittingReply = replyTo !== null;
    if (submittingReply) {
      updateSubmitButtonState("pending");
    } else {
      updateSubmitButtonState("idle");
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/main/user-review/${reviewId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentInput.trim(), parentId: replyTo?.parentId ?? null }),
      });
      if (res.ok) {
        const rawComment = (await res.json()) as Partial<Comment>;
        const newComment: Comment = {
          id: rawComment.id ?? crypto.randomUUID(),
          content: rawComment.content ?? "",
          isDeleted: rawComment.isDeleted ?? false,
          createdAt: rawComment.createdAt ?? new Date().toISOString(),
          parentId: rawComment.parentId ?? null,
          authorId: rawComment.authorId ?? "익명",
          authorEmail: rawComment.authorEmail ?? null,
          authorTier: rawComment.authorTier ?? null,
          iconImage: rawComment.iconImage ?? null,
          isMine: rawComment.isMine ?? true,
          likeCount: sanitizeCount(rawComment.likeCount) ?? 0,
          liked: rawComment.liked ?? false,
        };
        setComments((prev) => {
          const next = [...prev, newComment];
          setCommentsCache(next);
          return next;
        });
        setCommentInput("");
        setReplyTo(null);
        if (submittingReply) {
          updateSubmitButtonState("idle");
        }
        dispatchNotificationRefresh();
        onCommentSubmitted?.(newComment.id);
      } else if (submittingReply) {
        updateSubmitButtonState("error", 2200);
      }
    } catch {
      if (submittingReply) {
        updateSubmitButtonState("error", 2200);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitReplyThreadComment() {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    if (!activeReplyThreadParentComment) return;
    if (!replyThreadInput.trim() || replyThreadSubmitting) return;

    setReplyThreadSubmitting(true);
    try {
      const res = await fetch(`/api/main/user-review/${reviewId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyThreadInput.trim(), parentId: activeReplyThreadParentComment.id }),
      });

      if (!res.ok) return;

      const rawComment = (await res.json()) as Partial<Comment>;
      const newComment: Comment = {
        id: rawComment.id ?? crypto.randomUUID(),
        content: rawComment.content ?? replyThreadInput.trim(),
        isDeleted: rawComment.isDeleted ?? false,
        createdAt: rawComment.createdAt ?? new Date().toISOString(),
        parentId: rawComment.parentId ?? activeReplyThreadParentComment.id,
        authorId: rawComment.authorId ?? "익명",
        authorEmail: rawComment.authorEmail ?? null,
        authorTier: rawComment.authorTier ?? null,
        iconImage: rawComment.iconImage ?? null,
        isMine: rawComment.isMine ?? true,
        likeCount: sanitizeCount(rawComment.likeCount) ?? 0,
        liked: rawComment.liked ?? false,
      };

      setComments((prev) => {
        const next = [...prev, newComment];
        setCommentsCache(next);
        return next;
      });
      setReplyThreadInput("");
      const textarea = replyThreadTextareaElRef.current;
      if (textarea) textarea.style.height = "auto";
      dispatchNotificationRefresh();
      onCommentSubmitted?.(newComment.id);
    } finally {
      setReplyThreadSubmitting(false);
    }
  }

  async function handleEditComment(commentId: string) {
    if (!editInput.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/main/user-review/${reviewId}/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, content: editInput.trim() }),
      });
      if (res.ok) {
        setComments((prev) => {
          const next = prev.map((c) => c.id === commentId ? { ...c, content: editInput.trim() } : c);
          setCommentsCache(next);
          return next;
        });
        setEditingId(null);
        setEditInput("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLikeComment(commentId: string) {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    if (pendingLikeCommentIds.has(commentId)) return;
    likeCommentMutation.mutate(commentId);
  }

  async function handleDeleteComment(commentId: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/main/user-review/${reviewId}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        const payload = (await res.json()) as {
          ok?: boolean;
          mode?: "hard" | "soft";
          commentId?: string;
          content?: string;
        };
        const deletedCommentId = payload.commentId ?? commentId;
        const hasChildReplies = commentsRef.current.some((c) => c.parentId === deletedCommentId);
        const fallbackMode: "hard" | "soft" = hasChildReplies ? "soft" : "hard";
        const deleteMode = payload.mode ?? fallbackMode;

        setComments((prev) => {
          const next = deleteMode === "hard"
            ? prev.filter((c) => c.id !== deletedCommentId)
            : prev.map((c) =>
              c.id === deletedCommentId
                ? { ...c, isDeleted: true, content: payload.content ?? SOFT_DELETED_PARENT_TEXT }
                : c
            );
          setCommentsCache(next);
          return next;
        });
        setReplyTo((prev) => (prev?.target.id === deletedCommentId ? null : prev));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleAvatarClick(target: Comment) {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    setProfileModalTarget({
      authorId: target.authorId,
      authorEmail: target.authorEmail ?? null,
      authorTier: target.authorTier ?? null,
      iconImage: target.iconImage ?? null,
    });
  }

  const rootComments = comments.filter((comment) => !comment.parentId);
  const commentById = useMemo(() => {
    const map = new Map<string, Comment>();
    comments.forEach((comment) => {
      map.set(comment.id, comment);
    });
    return map;
  }, [comments]);
  const replyChildrenMap = useMemo(() => {
    const map = new Map<string, Comment[]>();
    comments.forEach((comment) => {
      if (!comment.parentId) return;
      const bucket = map.get(comment.parentId) ?? [];
      bucket.push(comment);
      map.set(comment.parentId, bucket);
    });
    return map;
  }, [comments]);
  const getReplies = useCallback((parentId: string) => replyChildrenMap.get(parentId) ?? [], [replyChildrenMap]);
  const getReplyDescendantCount = useCallback((parentId: string) => {
    let count = 0;
    const stack = [parentId];
    while (stack.length > 0) {
      const currentParentId = stack.pop() as string;
      const children = replyChildrenMap.get(currentParentId) ?? [];
      count += children.length;
      children.forEach((child) => stack.push(child.id));
    }
    return count;
  }, [replyChildrenMap]);
  const activeReplyThreadParentComment = activeReplyThreadParentId
    ? comments.find((comment) => comment.id === activeReplyThreadParentId && !comment.parentId) ?? null
    : null;
  const activeReplyThreadReplies = activeReplyThreadParentId ? getReplies(activeReplyThreadParentId) : [];
  const isReviewAuthor = (authorId: string) => !!reviewAuthorId && authorId === reviewAuthorId;

  function renderReplyThreadComment(reply: Comment, depth = 0) {
    const childReplies = getReplies(reply.id);
    const indentStyle = depth > 0 ? { marginLeft: "22px" } : undefined;
    const isThirdLevel = depth === 1;
    const parentAuthorId = isThirdLevel && reply.parentId ? commentById.get(reply.parentId)?.authorId ?? null : null;

    return (
      <div key={reply.id} className="user-content-reply-thread-node">
        <div
          id={`user-review-comment-${reply.id}`}
          className={`user-content-comment-item is-reply${depth > 0 ? " is-reply-nested" : ""}${reply.isMine ? " is-mine" : ""}${highlightedCommentId === reply.id ? " is-highlighted" : ""}`}
          style={indentStyle}
        >
          <button
            type="button"
            className="user-content-comment-avatar-btn"
            onClick={() => handleAvatarClick(reply)}
            aria-label={`${reply.authorId} 회원 정보 보기`}
          >
            <span className="user-content-comment-avatar">
              {reply.iconImage
                ? <img src={reply.iconImage} alt="" className="user-content-comment-avatar-img" />
                : <span className="user-content-comment-avatar-default">{reply.authorId.slice(0, 1).toUpperCase()}</span>
              }
            </span>
          </button>
          <div className="user-content-comment-body">
            <div className="user-content-comment-author-row">
              <span className="user-content-comment-author">
                {reply.authorId}
                {parentAuthorId && (
                  <span className="user-content-comment-author-parent-ref">{` > @${parentAuthorId}`}</span>
                )}
                <TierBadge tier={reply.authorTier} />
                {isReviewAuthor(reply.authorId) && (
                  <span className="user-content-comment-author-badge" aria-label="작성자">작성자</span>
                )}
              </span>
              <span className="user-content-comment-date">{formatDate(reply.createdAt)}</span>
              <div className="user-content-comment-right">
                {reply.isMine && !reply.isDeleted && (
                  <button
                    type="button"
                    className="user-content-comment-more-btn"
                    onClick={() => { setMenuComment(reply); }}
                  >
                    ...
                  </button>
                )}
              </div>
            </div>
            {editingId === reply.id ? (
              <div className="user-content-comment-edit-form">
                <textarea
                  className="user-content-comment-input"
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  rows={editRows(editInput)}
                  maxLength={300}
                  ref={(el) => { if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }}
                />
                <div className="user-content-comment-edit-actions">
                  <button type="button" className="user-content-comment-action-btn" onClick={() => { setEditingId(null); setEditInput(""); }}>취소</button>
                  <button type="button" className="user-content-comment-action-btn" onClick={() => handleEditComment(reply.id)} disabled={!editInput.trim() || submitting}>저장</button>
                </div>
              </div>
            ) : (
              <p className={`user-content-comment-text${reply.isDeleted ? " deleted" : ""}`}>{reply.content}</p>
            )}
            <div className="user-content-comment-actions">
              {!reply.isDeleted && (
                <button
                  type="button"
                  className="user-content-comment-action-btn"
                  onClick={() => startReply(reply, reply.id)}
                  aria-label={`${reply.authorId}님에게 답글쓰기`}
                >
                  댓글쓰기
                </button>
              )}
              <button
                type="button"
                className="user-content-comment-like-btn"
                onClick={() => handleLikeComment(reply.id)}
                aria-label="좋아요"
                disabled={pendingLikeCommentIds.has(reply.id)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={reply.liked ? "#E02424" : "none"} stroke={reply.liked ? "#E02424" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                {reply.likeCount > 0 && <span>{reply.likeCount}</span>}
              </button>
            </div>
          </div>
        </div>
        {childReplies.length > 0 && (
          <div className="user-content-reply-thread-children">
            {childReplies.map((childReply) => renderReplyThreadComment(childReply, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <section ref={commentSectionRef} className="user-content-comment-section">
      {missingTargetNotice && (
        <p className="user-content-comment-missing-notice" role="status" aria-live="polite">
          삭제되었거나 찾을 수 없는 댓글임
        </p>
      )}

      {/* 댓글 목록 */}
      {comments.length > 0 && (
        <div className="user-content-comment-thread-list">
          {rootComments.map((comment) => {
            const replyCount = getReplyDescendantCount(comment.id);

            return (
              <div key={comment.id} className="user-content-comment-thread">
                <div
                  id={`user-review-comment-${comment.id}`}
                  className={`user-content-comment-item${comment.isMine ? " is-mine" : ""}${highlightedCommentId === comment.id ? " is-highlighted" : ""}`}
                >
                  <button
                    type="button"
                    className="user-content-comment-avatar-btn"
                    onClick={() => handleAvatarClick(comment)}
                    aria-label={`${comment.authorId} 회원 정보 보기`}
                  >
                    <span className="user-content-comment-avatar">
                      {comment.iconImage
                        ? <img src={comment.iconImage} alt="" className="user-content-comment-avatar-img" />
                        : <span className="user-content-comment-avatar-default">{comment.authorId.slice(0, 1).toUpperCase()}</span>
                      }
                    </span>
                  </button>
                  <div className="user-content-comment-body">
                    <div className="user-content-comment-author-row">
                      <span className="user-content-comment-author">
                        {comment.authorId}
                        <TierBadge tier={comment.authorTier} />
                        {isReviewAuthor(comment.authorId) && (
                          <span className="user-content-comment-author-badge" aria-label="작성자">작성자</span>
                        )}
                      </span>
                      <span className="user-content-comment-date">{formatDate(comment.createdAt)}</span>
                      <div className="user-content-comment-right">
                        {comment.isMine && !comment.isDeleted && (
                          <button
                            type="button"
                            className="user-content-comment-more-btn"
                            onClick={() => { setMenuComment(comment); }}
                          >
                            ...
                          </button>
                        )}
                      </div>
                    </div>
                    {editingId === comment.id ? (
                      <div className="user-content-comment-edit-form">
                        <textarea
                          className="user-content-comment-input"
                          value={editInput}
                          onChange={(e) => setEditInput(e.target.value)}
                          rows={editRows(editInput)}
                          maxLength={300}
                          ref={(el) => { if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }}
                        />
                        <div className="user-content-comment-edit-actions">
                          <button type="button" className="user-content-comment-action-btn" onClick={() => { setEditingId(null); setEditInput(""); }}>취소</button>
                          <button type="button" className="user-content-comment-action-btn" onClick={() => handleEditComment(comment.id)} disabled={!editInput.trim() || submitting}>저장</button>
                        </div>
                      </div>
                    ) : (
                      <p className={`user-content-comment-text${comment.isDeleted ? " deleted" : ""}`}>{comment.content}</p>
                    )}
                    <div className="user-content-comment-actions">
                      {!comment.isDeleted && (
                        <button
                          type="button"
                          className="user-content-comment-action-btn"
                          onClick={() => startReply(comment, comment.id)}
                        >
                          댓글쓰기
                        </button>
                      )}
                      <button
                        type="button"
                        className="user-content-comment-like-btn"
                        onClick={() => handleLikeComment(comment.id)}
                        aria-label="좋아요"
                        disabled={pendingLikeCommentIds.has(comment.id)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill={comment.liked ? "#E02424" : "none"} stroke={comment.liked ? "#E02424" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                      </button>
                    </div>
                  </div>
                </div>

                {replyCount > 0 && (
                  <button
                    type="button"
                    className="user-content-comment-reply-open-btn"
                    onClick={() => openReplyThread(comment.id)}
                    aria-label={`댓글 ${replyCount}개 보기`}
                  >
                    <span className="user-content-comment-reply-open-line" aria-hidden="true" />
                    <span className="user-content-comment-reply-open-label">{`댓글 ${replyCount}개 보기`}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeReplyThreadParentComment && (
        <>
          <div className="user-content-reply-thread-backdrop" onClick={closeReplyThread} />
          <section className="user-content-reply-thread-sheet" role="dialog" aria-modal="true" aria-label="대댓글 목록">
            <header className="user-content-reply-thread-head">
              <span className="user-content-reply-thread-head-spacer" aria-hidden="true" />
              <p className="user-content-reply-thread-head-title">답글</p>
              <button type="button" className="user-content-reply-thread-head-btn" onClick={closeReplyThread} aria-label="닫기">
                x
              </button>
            </header>
            <div className="user-content-reply-thread-body">
              <div className="user-content-reply-thread-parent-wrap">
                <div className="user-content-comment-item is-parent-preview">
                  <button
                    type="button"
                    className="user-content-comment-avatar-btn"
                    onClick={() => handleAvatarClick(activeReplyThreadParentComment)}
                    aria-label={`${activeReplyThreadParentComment.authorId} 회원 정보 보기`}
                  >
                    <span className="user-content-comment-avatar">
                      {activeReplyThreadParentComment.iconImage
                        ? <img src={activeReplyThreadParentComment.iconImage} alt="" className="user-content-comment-avatar-img" />
                        : <span className="user-content-comment-avatar-default">{activeReplyThreadParentComment.authorId.slice(0, 1).toUpperCase()}</span>
                      }
                    </span>
                  </button>
                  <div className="user-content-comment-body">
                    <div className="user-content-comment-author-row">
                      <span className="user-content-comment-author">
                        {activeReplyThreadParentComment.authorId}
                        <TierBadge tier={activeReplyThreadParentComment.authorTier} />
                        {isReviewAuthor(activeReplyThreadParentComment.authorId) && (
                          <span className="user-content-comment-author-badge" aria-label="작성자">작성자</span>
                        )}
                      </span>
                      <span className="user-content-comment-date">{formatDate(activeReplyThreadParentComment.createdAt)}</span>
                    </div>
                    <p className={`user-content-comment-text${activeReplyThreadParentComment.isDeleted ? " deleted" : ""}`}>
                      {activeReplyThreadParentComment.content}
                    </p>
                  </div>
                </div>
              </div>

              <div className="user-content-reply-thread-list">
                {activeReplyThreadReplies.length === 0 && (
                  <p className="user-content-reply-thread-empty">아직 답글이 없습니다.</p>
                )}
                {activeReplyThreadReplies.map((reply) => renderReplyThreadComment(reply))}
              </div>
            </div>
            <div className="user-content-reply-thread-dock">
              <div className="user-content-comment-form">
                <textarea
                  ref={replyThreadTextareaElRef}
                  className="user-content-comment-input"
                  placeholder="답글을 남겨보세요"
                  value={replyThreadInput}
                  readOnly={!!onRequestOpenSheet}
                  onClick={(e) => {
                    if (!isSignedIn) { router.push("/sign-in"); return; }
                    if (onRequestOpenSheet) {
                      e.currentTarget.blur();
                      openCommentSheetForReplyThread();
                    }
                  }}
                  onFocus={(e) => {
                    if (!isSignedIn) { router.push("/sign-in"); return; }
                    if (onRequestOpenSheet) {
                      e.currentTarget.blur();
                      openCommentSheetForReplyThread();
                    }
                  }}
                  onChange={(e) => {
                    const next = e.target.value;
                    setReplyThreadInput(next);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  maxLength={300}
                  rows={1}
                />
                <button
                  type="button"
                  className={`user-content-comment-submit${replyThreadInput.trim() ? " active" : ""}`}
                  onClick={handleSubmitReplyThreadComment}
                  disabled={!replyThreadInput.trim() || replyThreadSubmitting}
                >
                  {replyThreadSubmitting ? "등록 중..." : "등록"}
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="user-content-comment-dock">
      {/* 댓글 입력폼 */}
      <div className="user-content-comment-form">
        <textarea
          ref={commentTextareaElRef}
          className="user-content-comment-input"
          placeholder={replyTo ? "답글을 남겨보세요" : "댓글을 남겨보세요"}
          value={commentInput}
          readOnly={!!onRequestOpenSheet}
          onClick={(e) => {
            if (!isSignedIn) { router.push("/sign-in"); return; }
            if (onRequestOpenSheet) {
              e.currentTarget.blur();
              onRequestOpenSheet();
            }
          }}
          onFocus={(e) => {
            if (!isSignedIn) { router.push("/sign-in"); return; }
            if (onRequestOpenSheet) {
              e.currentTarget.blur();
              onRequestOpenSheet();
            }
          }}
          onChange={(e) => {
            const next = e.target.value;
            setCommentInput(next);
            if (replyTo && next.trim().length === 0) {
              setReplyTo(null);
              updateSubmitButtonState("idle");
            }
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          maxLength={300}
          rows={1}
        />
        <button
          type="button"
          className={`user-content-comment-submit${commentInput.trim() ? " active" : ""}`}
          onClick={handleSubmitComment}
          disabled={!commentInput.trim() || submitting}
        >
          {submitButtonState === "pending"
            ? "등록 중..."
            : submitButtonState === "error"
                ? "다시 시도"
                : "등록"}
        </button>
      </div>
      </div>

      <UserProfileModal
        target={profileModalTarget}
        isSignedIn={!!isSignedIn}
        viewerRole={viewerRole}
        onRequestSignIn={() => router.push("/sign-in")}
        onClose={() => setProfileModalTarget(null)}
      />

      {/* 댓글 메뉴 바텀시트 */}
      {menuComment && (
        <>
          <div className="user-content-comment-sheet-backdrop" onClick={() => setMenuComment(null)} />
          <div className="user-content-comment-sheet">
            <button
              type="button"
              className="user-content-comment-sheet-item"
              onClick={() => {
                if (onRequestEditComment) {
                  const parentComment = menuComment.parentId
                    ? comments.find((c) => c.id === menuComment.parentId) ?? null
                    : null;
                  onRequestEditComment({
                    id: menuComment.id,
                    content: menuComment.content,
                    parentId: menuComment.parentId,
                    authorId: menuComment.authorId,
                    iconImage: menuComment.iconImage,
                    parentAuthorId: parentComment?.authorId ?? null,
                    parentContent: parentComment?.content ?? null,
                    parentIconImage: parentComment?.iconImage ?? null,
                  });
                } else {
                  setEditingId(menuComment.id);
                  setEditInput(menuComment.content);
                }
                setMenuComment(null);
              }}
            >
              수정하기
            </button>
            <button
              type="button"
              className="user-content-comment-sheet-item danger"
              onClick={() => {
                handleDeleteComment(menuComment.id);
                setMenuComment(null);
              }}
            >
              삭제하기
            </button>
            <button
              type="button"
              className="user-content-comment-sheet-item cancel"
              onClick={() => setMenuComment(null)}
            >
              창닫기
            </button>
          </div>
        </>
      )}
    </section>
  );
}
