import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncProfile } from "@/lib/profiles";

const SOFT_DELETED_PARENT_TEXT = "댓글이 삭제되었습니다.";

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 0) return email;
  return `${email.slice(0, 2)}***${email.slice(at)}`;
}

/**
 * POST /api/main/user-review/batch-interactions
 * body: { ids: string[] }
 * 여러 게시글의 좋아요/댓글을 한 번에 반환
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { ids?: unknown };
    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ results: {} });
    }

    const ids = body.ids
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .slice(0, 20); // 최대 20개

    if (ids.length === 0) return NextResponse.json({ results: {} });

    const { userId } = await auth();
    let viewerProfileId: string | null = null;
    if (userId) {
      const user = await currentUser();
      const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
      const profile = await syncProfile({ email });
      viewerProfileId = profile?.id ?? null;
    }

    const supabase = createSupabaseAdminClient();

    // 좋아요 수 한 번에 조회
    const { data: likeRows } = await supabase
      .from("user_review_likes")
      .select("review_id")
      .in("review_id", ids);

    // 이 사용자가 좋아요한 글 목록
    let myLikedSet = new Set<string>();
    if (viewerProfileId) {
      const { data: myLikes } = await supabase
        .from("user_review_likes")
        .select("review_id")
        .in("review_id", ids)
        .eq("profile_id", viewerProfileId);
      myLikedSet = new Set((myLikes ?? []).map((r) => r.review_id));
    }

    // 좋아요 수 집계
    const likeCountMap = new Map<string, number>();
    (likeRows ?? []).forEach((r) => {
      likeCountMap.set(r.review_id, (likeCountMap.get(r.review_id) ?? 0) + 1);
    });

    // 댓글 한 번에 조회
    const { data: commentRows } = await supabase
      .from("user_review_comments")
      .select("id, review_id, content, created_at, is_deleted, parent_id, profile_id, like_count, profile:profile_id(username, email, icon_image, deleted_at)")
      .in("review_id", ids)
      .order("created_at", { ascending: true });

    // 댓글 좋아요 한 번에 조회
    const commentIds = (commentRows ?? []).map((r: any) => r.id);
    let commentLikedSet = new Set<string>();
    if (viewerProfileId && commentIds.length > 0) {
      const { data: commentLikes } = await supabase
        .from("user_review_comment_likes")
        .select("comment_id")
        .eq("profile_id", viewerProfileId)
        .in("comment_id", commentIds);
      commentLikedSet = new Set((commentLikes ?? []).map((r: any) => r.comment_id));
    }

    // 게시글별 댓글 그룹핑
    const commentsByReviewId = new Map<string, any[]>();
    (commentRows ?? []).forEach((row: any) => {
      const arr = commentsByReviewId.get(row.review_id) ?? [];
      arr.push(row);
      commentsByReviewId.set(row.review_id, arr);
    });

    // 결과 조립
    const results: Record<string, {
      likes: { likeCount: number; liked: boolean };
      comments: { comments: Array<{
        id: string;
        content: string;
        isDeleted: boolean;
        createdAt: string;
        parentId: string | null;
        authorId: string;
        iconImage: string | null;
        authorDeleted: boolean;
        isMine: boolean;
        likeCount: number;
        liked: boolean;
      }> };
    }> = {};

    for (const id of ids) {
      const likeCount = likeCountMap.get(id) ?? 0;
      const liked = myLikedSet.has(id);

      const rawComments = commentsByReviewId.get(id) ?? [];
      const comments = rawComments
        .filter((row: any) => !(row.is_deleted && row.parent_id))
        .map((row: any) => {
          const p = Array.isArray(row.profile) ? row.profile[0] : row.profile;
          const authorId = p?.username || (p?.email ? maskEmail(p.email) : "익명");
          return {
            id: row.id,
            content: row.is_deleted ? SOFT_DELETED_PARENT_TEXT : row.content,
            isDeleted: row.is_deleted,
            createdAt: row.created_at,
            parentId: row.parent_id ?? null,
            authorId,
            iconImage: p?.icon_image ?? null,
            authorDeleted: !!p?.deleted_at,
            isMine: viewerProfileId ? viewerProfileId === row.profile_id : false,
            likeCount: row.like_count ?? 0,
            liked: commentLikedSet.has(row.id),
          };
        });

      results[id] = {
        likes: { likeCount, liked },
        comments: { comments },
      };
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("POST /api/main/user-review/batch-interactions error:", error);
    return NextResponse.json({ results: {} }, { status: 500 });
  }
}
