'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CONTACT_EMAIL, RESUME_PDF_URL } from '@/lib/contact';

export function Navigation() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className={`ip-header${isHome ? ' sail-home-header' : ''}`} id="top">
      <Link href="/" className="ip-name" aria-label="Kristian Salmeron — Home">
        {!isHome && (
          <span className="ip-monogram" aria-hidden="true">
            ks
          </span>
        )}
        <span>Kristian Salmeron{isHome ? '.' : ''}</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/work/" aria-current={pathname.startsWith('/work') ? 'page' : undefined}>
          Work
        </Link>
        <Link href="/about/" aria-current={pathname.startsWith('/about') ? 'page' : undefined}>
          About
        </Link>
        {isHome ? (
          <Link href="/field-notes/">Field notes</Link>
        ) : (
          <a href="https://lab.kristiansalmeron.com/" referrerPolicy="origin">
            Lab
          </a>
        )}
        <Link
          href="/contact/"
          className={isHome ? 'sail-home-contact-link' : undefined}
          aria-current={pathname.startsWith('/contact') ? 'page' : undefined}
        >
          {isHome ? (
            <>
              Let’s talk <span aria-hidden="true">→</span>
            </>
          ) : (
            'Contact'
          )}
        </Link>
      </nav>
    </header>
  );
}

export function Footer() {
  const pathname = usePathname();

  if (pathname === '/') {
    return (
      <footer className="sail-home-footer">
        <p>Built with intent.</p>
        <div className="sail-home-social" aria-label="Contact, résumé, social profiles and privacy">
          <a href={`mailto:${CONTACT_EMAIL}`}>Email</a>
          <a href={RESUME_PDF_URL} target="_blank" rel="noopener noreferrer">
            Download résumé (PDF)
          </a>
          <Link href="/privacy/">Privacy</Link>
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
        <p>© {new Date().getFullYear()}</p>
      </footer>
    );
  }

  return (
    <footer className="ip-footer">
      <div className="footer-invitation">
        <p>Have something in mind? Let’s talk.</p>
        <Link href="/contact/" className="ip-button">
          Get in touch <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="footer-social" aria-label="Contact, résumé, social profiles and privacy">
        <a href={`mailto:${CONTACT_EMAIL}`}>Email</a>
        <a href={RESUME_PDF_URL} target="_blank" rel="noopener noreferrer">
          Download résumé (PDF)
        </a>
        <Link href="/privacy/">Privacy</Link>
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
