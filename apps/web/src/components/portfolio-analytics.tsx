'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getAnalyticsTracker, trackPortfolioEvent } from '@/lib/analytics';
import './portfolio-analytics.css';

export default function PortfolioAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const tracker = getAnalyticsTracker();
      tracker?.pageview(pathname);
    } catch {
      // Measurement is optional; page navigation remains usable if a browser blocks it.
    }
  }, [pathname]);
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
  return null;
}
