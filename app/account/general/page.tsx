import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncProfile } from "@/lib/profiles";
import { GeneralSettingsForm } from "@/components/general-settings-form";

export default async function AccountGeneralPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;

  let profile = null;

  try {
    profile = await syncProfile({ email, fullName });
  } catch (error) {
    console.error("Failed to sync profile:", error);
  }

  if (!profile) {
    return (
      <div className="admin-panel-card stack">
        <h1>오류</h1>
        <p className="muted">프로필 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="admin-panel-card stack">
      <p className="muted">General</p>
      <h2>일반설정</h2>
      <p className="muted">기본 계정 정보와 프로필 상태를 확인하고 이후 알림, 연락처, 비밀번호 변경 기능을 이 영역으로 확장할 수 있습니다.</p>
      <GeneralSettingsForm
        email={profile.email}
        fullName={profile.full_name}
        username={profile.username}
        hasPassword={Boolean(profile.password_hash)}
        phone={profile.phone}
      />
    </div>
  );
}
