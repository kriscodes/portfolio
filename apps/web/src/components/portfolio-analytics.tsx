'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getAnalyticsTracker, outboundTarget, trackPortfolioEvent } from '@/lib/analytics';
import './portfolio-analytics.css';

export default function PortfolioAnalytics() {
  const pathname = usePathname();
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    try {
      const tracker = getAnalyticsTracker();
      if (tracker?.notice) setNotice(tracker.notice);
      tracker?.pageview(pathname);
    } catch {
      // Measurement is optional; page navigation remains usable if a browser blocks it.
    }
  }, [pathname]);
  useEffect(() => {
    const clicked = (event: MouseEvent) => {
      if (event.type === 'auxclick' && event.button !== 1) return;
      const node = event.target;
      if (!(node instanceof Element)) return;
      const link = node.closest<HTMLAnchorElement>('a[href]');
      if (!link) return;
      const target = outboundTarget(link.href);
      if (target) trackPortfolioEvent('outbound_click', { target });
    };
    document.addEventListener('click', clicked, { capture: true });
    document.addEventListener('auxclick', clicked, { capture: true });
    return () => {
      document.removeEventListener('click', clicked, { capture: true });
      document.removeEventListener('auxclick', clicked, { capture: true });
    };
  }, []);
  useEffect(() => {
    const work = document.getElementById('selected-work');
    if (pathname !== '/' || !work || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        trackPortfolioEvent('studio_section_open', { section: 'work' });
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(work);
    return () => observer.disconnect();
  }, [pathname]);
  if (!notice) return null;
  return (
    <aside className="portfolio-analytics-note" aria-label="Analytics preference" role="status">
      <p>{notice}</p>
      <button
        type="button"
        onClick={() => setNotice(null)}
        aria-label="Dismiss analytics preference confirmation"
      >
        Dismiss
      </button>
    </aside>
  );
}
