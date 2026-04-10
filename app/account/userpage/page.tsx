import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncProfile } from "@/lib/profiles";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AccountUserPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string; username?: string; category?: string; index?: string; likesSheet?: string; t?: string }>;
}) {
  const { profileId, category, index, likesSheet } = await searchParams;
  const { userId } = await auth();

  const backHref =
    category && index
      ? `/gallery?category=${encodeURIComponent(category)}&index=${encodeURIComponent(index)}&likesSheet=${likesSheet === "1" ? "1" : "1"}&t=${Date.now()}`
      : "/gallery";

  if (!userId) {
    return (
      <div className="account-panel-card stack account-section-card page-slide-down">
        <h2>사용자프로파일</h2>
        <p className="muted">로그인이 필요합니다.</p>
      </div>
    );
  }

  const me = await currentUser();
  const myEmail = me?.emailAddresses?.[0]?.emailAddress ?? me?.primaryEmailAddress?.emailAddress;
  const myFullName = me?.fullName || null;
  const myProfile = await syncProfile({ email: myEmail, fullName: myFullName });

  // userpage 접근 조건: 현재 로그인 사용자도 아이디(username)를 등록한 상태여야 함
  if (!myProfile?.username) {
    return (
      <div className="account-panel-card stack account-section-card page-slide-down">
        <h2>사용자프로파일</h2>
        <p className="muted">아이디 등록 후 이용 가능합니다.</p>
        <div>
          <Link href="/account/general" prefetch={true}>
            <button type="button" className="gallery-sheet-submit" style={{ width: "auto", padding: "10px 14px" }}>
              아이디 등록하기
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="account-panel-card stack account-section-card page-slide-down">
        <h2>사용자프로파일</h2>
        <p className="muted">사용자 아이디 정보가 없습니다.</p>
      </div>
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, email, icon_image, created_at")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="account-panel-card stack account-section-card page-slide-down">
        <h2>사용자프로파일</h2>
        <p className="muted">해당 사용자를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const displayId = profile.username || profile.email || "사용자";
  const joined = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("ko-KR")
    : "가입일 정보 없음";

  return (
    <div className="account-panel-card stack account-section-card page-slide-down">
      <h2>{displayId}의 사용자프로파일</h2>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {profile.icon_image ? (
          <img
            src={profile.icon_image}
            alt=""
            style={{ width: 44, height: 44, borderRadius: 999, objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 999, background: "#d1d5db", flexShrink: 0 }} />
        )}

        <div style={{ display: "grid", gap: 2 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>아이디: {displayId}</p>
          <p style={{ margin: 0, fontSize: 13, color: "#4b5563" }}>가입일 {joined}</p>
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <p style={{ margin: 0 }}><strong>이메일:</strong> {profile.email}</p>
      </div>

      <section
        style={{
          marginTop: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: "14px 12px",
          background: "#fff",
          display: "grid",
          gap: 10,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>사용자 컬러 프로파일</h3>
        <p style={{ margin: 0, fontSize: 14, color: "#4b5563", lineHeight: 1.45 }}>이 사용자가 남긴 컬러 감성과 분위기를 확인해보세요.</p>
        <p style={{ margin: 0, fontSize: 14, color: "#4b5563", lineHeight: 1.45 }}>좋아요 시트에서 다시 돌아오면 같은 카드 위치를 유지합니다.</p>
        {profile.icon_image ? (
          <img
            src={profile.icon_image}
            alt="사용자 컬러 프로파일 이미지"
            style={{ width: "100%", maxWidth: 260, aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 12 }}
          />
        ) : (
          <img
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='520' height='520' viewBox='0 0 520 520'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23f3f4f6'/%3E%3Cstop offset='1' stop-color='%23d1d5db'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='520' height='520' rx='28' fill='url(%23g)'/%3E%3Ccircle cx='260' cy='205' r='88' fill='%239ca3af'/%3E%3Crect x='106' y='324' width='308' height='120' rx='60' fill='%23bfc5cc'/%3E%3C/svg%3E"
            alt="사용자 컬러 프로파일 기본 이미지"
            style={{ width: "100%", maxWidth: 260, aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 12 }}
          />
        )}
      </section>

      <div style={{ marginTop: 12 }}>
        <Link href={backHref} prefetch={true}>
          <button type="button" className="gallery-sheet-submit" style={{ width: "auto", padding: "10px 14px" }}>
            {"< 돌아가기"}
          </button>
        </Link>
      </div>
    </div>
  );
}
