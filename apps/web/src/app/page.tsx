import Link from 'next/link';
import CornerStudio from '@/components/studio/CornerStudio';

export const metadata = {
  alternates: { canonical: '/' },
};

export default function Home() {
  return (
    <main id="main" className="studio-home" tabIndex={-1}>
      <h1 className="sr-only">Kristian Salmeron — Corner Studio</h1>
      <p className="sr-only">
        Software engineering, architecture, creative experiments, sailing, and photography. Explore
        Work Avenue, Life Lane, and About Way in the studio, or browse the pages below.
      </p>
      <CornerStudio />
      <noscript>
        <p className="studio-script-note">
          The interactive studio needs JavaScript. You can explore the work, background, and notes
          through the links below.
        </p>
      </noscript>
      <nav className="studio-page-links" aria-label="Portfolio pages">
        <span>Browse the pages</span>
        <Link href="/work">Work</Link>
        <Link href="/about">About</Link>
        <Link href="/field-notes">Notes</Link>
        <Link href="/contact">Contact ↗</Link>
      </nav>
    </main>
  );
}
