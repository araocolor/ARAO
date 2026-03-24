"use client";

import Link from "next/link";
import { SignOutButton, useUser } from "@clerk/nextjs";

export function LandingAuthControls() {
  const { isLoaded, isSignedIn, user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return (
      <div className="auth-switch">
        <Link className="auth-switch-link auth-switch-link-email" href="/account">
          {email ?? "Account"}
        </Link>
        <SignOutButton>
          <button className="auth-switch-link" type="button">
            로그아웃
          </button>
        </SignOutButton>
      </div>
    );
  }

  return (
    <div className="auth-switch">
      <Link className="auth-switch-link auth-switch-link-active" href="/sign-in">
        로그인
      </Link>
      <Link className="auth-switch-link" href="/sign-up">
        가입하기
      </Link>
    </div>
  );
}
