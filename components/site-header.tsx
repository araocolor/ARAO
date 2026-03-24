import Link from "next/link";

type SiteHeaderProps = {
  links: Array<{ href: string; label: string }>;
};

export function SiteHeader({ links }: SiteHeaderProps) {
  return (
    <header className="header">
      <Link href="/">logo.svg</Link>
      <nav className="nav">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
