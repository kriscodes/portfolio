import type { Metadata } from 'next';
import { Navigation, Footer } from '@/components/chrome';
import './globals.css';
export const metadata: Metadata = {
  title: {
    default: 'Kristian Salmeron — Engineering, with perspective.',
    template: '%s — Kristian Salmeron',
  },
  description:
    'Software engineering, architecture, and a life outdoors. Selected work and field notes by Kristian Salmeron.',
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
