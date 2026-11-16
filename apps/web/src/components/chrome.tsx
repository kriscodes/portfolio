'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();
  return (
    <header className="ip-header" id="top">
      <Link href="/" className="ip-name" aria-label="Kristian Salmeron — Home">
        <span className="ip-monogram" aria-hidden="true">
          ks
        </span>
        <span>Kristian Salmeron</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link
          href="/work/"
          aria-current={pathname.startsWith('/work') ? 'page' : undefined}
          className={pathname === '/' ? 'nav-home-work' : undefined}
        >
          Work
        </Link>
        <Link href="/about/" aria-current={pathname.startsWith('/about') ? 'page' : undefined}>
          About
        </Link>
        <a href="https://lab.kristiansalmeron.com/">Lab</a>
        <Link href="/contact/" aria-current={pathname.startsWith('/contact') ? 'page' : undefined}>
          Contact
        </Link>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="ip-footer">
      <div className="footer-invitation">
        <p>Have something in mind? Let’s talk.</p>
        <Link href="/contact/" className="ip-button">
          Get in touch <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className="footer-social" aria-label="Social profiles">
        <a href="https://github.com/kriscodes" target="_blank" rel="noopener noreferrer">
          GitHub <span aria-hidden="true">↗</span>
        </a>
        <a
          href="https://www.linkedin.com/in/kristian-salmeron-46295664"
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn <span aria-hidden="true">↗</span>
        </a>
      </div>
    </footer>
  );
}
