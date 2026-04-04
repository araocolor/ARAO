import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminCommitListPage } from "@/components/admin-commit-list-page";
import { syncProfile } from "@/lib/profiles";

export default async function AdminWorkListPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;

  let profile = null;
  let profileError: { message?: string; hint?: string } | null = null;

  try {
    profile = await syncProfile({ email, fullName });
  } catch (error) {
    if (error instanceof Error) {
      profileError = { message: error.message };
    } else if (typeof error === "object" && error !== null) {
      profileError = error as { message?: string; hint?: string };
    } else {
      profileError = { message: "Unknown profile sync error" };
    }
  }

  if (profileError) {
    return (
      <main className="page stack">
        <section className="section stack">
          <p className="muted">Admin / Commit List</p>
          <h1>프로필 연결 오류</h1>
          <p className="muted">이 계정의 Supabase profile을 읽는 중 문제가 발생했습니다.</p>
          <p className="muted">message: {profileError.message ?? "없음"}</p>
          <p className="muted">hint: {profileError.hint ?? "없음"}</p>
          <p className="muted">로그인 이메일: {email ?? "없음"}</p>
          <Link href="/admin">관리자 대시보드로 이동</Link>
        </section>
      </main>
    );
  }

  if (!profile || profile.role !== "admin") {
    return (
      <main className="page stack">
        <section className="section stack">
          <p className="muted">Admin / Commit List</p>
          <h1>관리자 권한이 필요합니다</h1>
          <p className="muted">
            현재 로그인한 계정은 관리자 권한이 없습니다. 현재 역할: {profile?.role ?? "unknown"}
          </p>
          <Link href="/account">계정 페이지로 이동</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page admin-work-list-page">
      <section className="admin-panel-card stack admin-work-list-shell">
        <div className="admin-commit-page-head">
          <p className="muted">Admin / Commit List</p>
          <Link href="/admin">관리자 대시보드로 이동</Link>
        </div>
        <AdminCommitListPage />
      </section>
    </main>
  );
}
