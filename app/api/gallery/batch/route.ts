import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncProfile } from "@/lib/profiles";
import { getGalleryComments } from "@/lib/gallery-interactions";

/**
 * POST /api/gallery/batch
 * body: { cards: Array<{ category: string; index: number }> }
 * 여러 갤러리 카드의 좋아요/댓글 수를 한 번에 반환
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { cards?: unknown; withComments?: string[] };
    if (!Array.isArray(body.cards) || body.cards.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const cards = (body.cards as Array<unknown>)
      .filter((c): c is { category: string; index: number } =>
        typeof (c as any)?.category === "string" && typeof (c as any)?.index === "number"
      )
      .slice(0, 20);

    const withComments: string[] = Array.isArray(body.withComments)
      ? (body.withComments as unknown[]).filter((c): c is string => typeof c === "string").slice(0, 10)
      : [];

    if (cards.length === 0) return NextResponse.json({ results: [] });

    // 로그인 사용자 프로필 조회
    let profileId: string | null = null;
    try {
      const { userId } = await auth();
      if (userId) {
        const user = await currentUser();
        const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
        if (email) {
          const profile = await syncProfile({ email });
          profileId = profile?.id ?? null;
        }
      }
    } catch {}

    const supabase = createSupabaseAdminClient();

    // 좋아요 수 한 번에 조회
    const likeFilters = cards.map((c) => `item_category.eq.${c.category},item_index.eq.${c.index}`);
    const { data: likeRows } = await supabase
      .from("gallery_item_likes")
      .select("item_category, item_index, profile_id")
      .or(likeFilters.join(","));

    // 내가 좋아요한 카드
    const myLikedSet = new Set<string>();
    if (profileId) {
      (likeRows ?? []).forEach((r) => {
        if (r.profile_id === profileId) {
          myLikedSet.add(`${r.item_category}:${r.item_index}`);
        }
      });
    }

    // 좋아요 수 집계
    const likeCountMap = new Map<string, number>();
    (likeRows ?? []).forEach((r) => {
      const key = `${r.item_category}:${r.item_index}`;
      likeCountMap.set(key, (likeCountMap.get(key) ?? 0) + 1);
    });

    // 첫 번째 좋아요 사용자 프로필 ID 수집
    const firstLikerProfileIds = new Map<string, string>();
    (likeRows ?? []).forEach((r) => {
      const key = `${r.item_category}:${r.item_index}`;
      if (!firstLikerProfileIds.has(key)) {
        firstLikerProfileIds.set(key, r.profile_id);
      }
    });

    // 첫 번째 좋아요 사용자 이름 조회
    const uniqueProfileIds = Array.from(new Set(firstLikerProfileIds.values()));
    const firstLikerMap = new Map<string, string | null>();
    if (uniqueProfileIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", uniqueProfileIds);
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.username ?? null]));
      firstLikerProfileIds.forEach((pid, key) => {
        firstLikerMap.set(key, profileMap.get(pid) ?? null);
      });
    }

    // 댓글 수 한 번에 조회
    const { data: commentRows } = await supabase
      .from("gallery_comments")
      .select("item_category, item_index")
      .or(likeFilters.join(","));

    const commentCountMap = new Map<string, number>();
    (commentRows ?? []).forEach((r) => {
      const key = `${r.item_category}:${r.item_index}`;
      commentCountMap.set(key, (commentCountMap.get(key) ?? 0) + 1);
    });

    // 결과 조립
    const results = cards.map((c) => {
      const key = `${c.category}:${c.index}`;
      return {
        category: c.category,
        index: c.index,
        count: likeCountMap.get(key) ?? 0,
        liked: myLikedSet.has(key),
        firstLiker: firstLikerMap.get(key) ?? null,
        commentCount: commentCountMap.get(key) ?? 0,
      };
    });

    // 댓글 목록 병렬 조회 (withComments 카테고리, index=0 고정)
    const commentsList: Record<string, unknown[]> = {};
    if (withComments.length > 0) {
      const commentResults = await Promise.all(
        withComments.map((category) => getGalleryComments(category, 0))
      );
      withComments.forEach((category, i) => {
        commentsList[category] = commentResults[i];
      });
    }

    return NextResponse.json({ results, commentsList });
  } catch (error) {
    console.error("POST /api/gallery/batch error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
