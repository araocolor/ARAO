"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export function HeaderProfileLink() {
  const { isSignedIn } = useUser();

  return (
    <Link aria-label="사용자 프로필" className="header-profile-link" href={isSignedIn ? "/account" : "/sign-in"}>
      <span className="header-profile-icon" aria-hidden="true">
        <span className="header-profile-head" />
        <span className="header-profile-body" />
      </span>
    </Link>
  );
}
