"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function SimpleHeader() {
  const router = useRouter();

  return (
    <div className="header header-full">
      <div className="simple-header-inner">
        <button
          type="button"
          className="simple-header-back"
          onClick={() => router.back()}
          aria-label="뒤로가기"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <Link href="/" className="simple-header-logo">
          <Image src="/logo.svg" alt="ARAO logo" width={80} height={28} priority />
        </Link>
      </div>
    </div>
  );
}
