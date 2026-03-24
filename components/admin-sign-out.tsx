"use client";

import { SignOutButton } from "@clerk/nextjs";

export function AdminSignOut() {
  return (
    <SignOutButton>
      <button className="sign-out-button" type="button">
        로그아웃
      </button>
    </SignOutButton>
  );
}
