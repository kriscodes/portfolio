import type { Metadata } from 'next';
import { Navigation, Footer } from '@/components/chrome';
import PortfolioAnalytics from '@/components/portfolio-analytics';
import { siteUrl } from '@/lib/metadata';
import './globals.css';
import './base.css';
import './editorial.css';
import './sail-home.css';
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Kristian Salmeron — Thoughtful interfaces. Reliable systems.',
    template: '%s — Kristian Salmeron',
  },
  description:
    'Frontend engineering lead Kristian Salmeron. React, Next.js, reusable component systems, performance, and complex interfaces.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/dm-serif-display-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/instrument-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <PortfolioAnalytics />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="ip-shell site-shell">
          <Navigation />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
