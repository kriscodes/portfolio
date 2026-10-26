'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
export function Navigation() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.classList.toggle('studio-page', path === '/');
    return () => document.body.classList.remove('studio-page');
  }, [path]);
  if (path === '/') return null;
  return (
    <header className="site-header" id="top" tabIndex={-1}>
      <Link href="/" className="wordmark" onClick={() => setOpen(false)}>
        <span className="reading-wordmark">
          KRISTIAN
          <br />
          SALMERON
        </span>
      </Link>
      <button
        className="menu-button"
        aria-expanded={open}
        aria-controls="navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? 'Close −' : 'Explore +'}
      </button>
      <nav
        id="navigation"
        className={open ? 'navigation open' : 'navigation'}
        aria-label="Main navigation"
      >
        {[
          ['/work', 'Work'],
          ['/about', 'About'],
          ['/field-notes', 'Field notes'],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={path.startsWith(href) ? 'page' : undefined}
            onClick={() => setOpen(false)}
          >
            {label}
          </Link>
        ))}
        <Link className="nav-contact" href="/contact" onClick={() => setOpen(false)}>
          Let’s talk <span aria-hidden>↗</span>
        </Link>
      </nav>
    </header>
  );
}
export function Footer() {
  const path = usePathname();
  if (path === '/') return null;
  return (
    <footer className="site-footer">
      <Link className="footer-name" href="/">
        Return to the studio<span aria-hidden>↗</span>
      </Link>
      <div className="footer-meta">
        <span>BUILT WITH INTENT. BEST VIEWED WITH CURIOSITY.</span>
        <span>© {new Date().getFullYear()} · EST. ON EARTH</span>
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('top')?.focus({ preventScroll: true });
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'instant'
                : 'smooth',
            });
          }}
        >
          Back to the surface ↑
        </a>
      </div>
    </footer>
  );
}
export function SectionLabel({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className="section-label">
      <span className="section-number">{number}</span>
      {children}
    </div>
  );
}

const homeSections = [
  { id: 'selected-work', label: '01 / Work' },
  { id: 'field-notes', label: '02 / Notes' },
  { id: 'outside', label: '03 / Outside' },
];

export function PageIndex() {
  const [active, setActive] = useState('selected-work');
  useEffect(() => {
    let observer: IntersectionObserver;
    function observeSections() {
      observer?.disconnect();
      // Vertical percentage margins resolve against width; use viewport-height pixels.
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
        },
        {
          rootMargin: `-${Math.round(window.innerHeight * 0.15)}px 0px -${Math.round(window.innerHeight * 0.65)}px 0px`,
        },
      );
      for (const section of homeSections) {
        const element = document.getElementById(section.id);
        if (element) observer.observe(element);
      }
    }
    observeSections();
    window.addEventListener('resize', observeSections);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', observeSections);
    };
  }, []);
  return (
    <nav className="index-strip page-index" aria-label="On this page">
      <span className="index-caption">WORK, IDEAS & LIFE BEYOND THE SCREEN</span>
      <div>
        {homeSections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active === section.id ? 'location' : undefined}
          >
            {section.label}
          </a>
        ))}
      </div>
      <Link className="index-contact" href="/contact">
        Let’s talk ↗
      </Link>
    </nav>
  );
}
