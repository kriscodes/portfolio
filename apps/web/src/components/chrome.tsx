'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();
  return (
    <header className="ip-header" id="top">
      <Link href="/" className="ip-name">
        Kristian Salmeron.
      </Link>
      <nav aria-label="Main navigation">
        {[
          ['/work/', 'Work'],
          ['/about/', 'About'],
          ['/field-notes/', 'Field notes'],
          ['/contact/', 'Let’s talk ↗'],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname.startsWith(href.slice(0, -1)) ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="ip-footer">
      <p>Built with intent. Best viewed with curiosity.</p>
      <span>© {new Date().getFullYear()}</span>
      <Link href="/contact/">Let’s talk ↗</Link>
    </footer>
  );
}
