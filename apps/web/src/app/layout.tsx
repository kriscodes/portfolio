import type { Metadata } from 'next';
import { Navigation, Footer } from '@/components/chrome';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://kristiansalmeron.com'),
  title: {
    default: 'Kristian Salmeron — Corner Studio',
    template: '%s — Kristian Salmeron',
  },
  description:
    'Explore Kristian Salmeron’s corner studio: software engineering, selected projects, creative experiments, and life beyond the screen.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Kristian Salmeron',
    title: 'Kristian Salmeron — Corner Studio',
    description:
      'An interactive studio for software engineering, selected projects, and life beyond the screen.',
  },
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}
