import type { Metadata } from 'next';
import { Navigation, Footer } from '@/components/chrome';
import { siteUrl } from '@/lib/metadata';
import './globals.css';
import './base.css';
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Kristian Salmeron — Making things work.',
    template: '%s — Kristian Salmeron',
  },
  description:
    'I build systems, explore ideas, and follow the interesting questions. Software engineering, architecture, selected work, and field notes by Kristian Salmeron.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/instrument-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
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
