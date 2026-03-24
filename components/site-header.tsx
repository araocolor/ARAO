"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type SiteHeaderProps = {
  links: Array<{ href: string; label: string }>;
  action?: ReactNode;
  fullWidth?: boolean;
  leading?: ReactNode;
};

export function SiteHeader({ links, action, fullWidth = false, leading }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={fullWidth ? "header header-full" : "header"}>
      <div className={fullWidth ? "header-inner" : "header-inner-inline"}>
        <Link className="brand" href="/">
          <Image src="/logo.svg" alt="ARAO logo" width={80} height={28} priority />
        </Link>
        <div className="header-actions">
          <nav className="nav">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          {action}
          {leading}
        </div>
        <button
          aria-expanded={menuOpen}
          aria-label="Open menu"
          className="header-menu-toggle"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen ? (
        <div className="header-menu-popover">
          <div className="header-menu-sheet">
            <div className="header-menu-list">
              {links.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
            </div>
            {leading ? <div className="header-menu-extra">{leading}</div> : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
