import Link from 'next/link';
import SailStudy from '@/components/sail-study';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'Making things work.',
  'Lead Software Engineer Kristian Salmeron. 12+ years building interfaces, shaping systems, and making complex work feel simple.',
  '/',
);

export default function HomePage() {
  return (
    <main id="main" className="sail-home">
      <section className="sail-home-hero" aria-labelledby="home-title">
        <div className="sail-home-intro">
          <p className="sail-home-eyebrow">Software engineering &amp; architecture</p>
          <h1 id="home-title">
            <span>Making</span> <span>things</span> <em>work.</em>
          </h1>
          <p className="sail-home-deck">
            12+ years building interfaces, shaping systems, and making complex work feel simple.
          </p>
          <a href="#selected-work" className="sail-home-work-link">
            Explore selected work <span aria-hidden="true">↗</span>
          </a>
          <p className="sail-home-role">Lead Software Engineer · Los Angeles</p>
        </div>
        <div className="sail-home-art">
          <SailStudy />
        </div>
      </section>
      <section
        id="selected-work"
        className="sail-home-work"
        aria-labelledby="selected-work-heading"
      >
        <h2 id="selected-work-heading">Selected work</h2>
        <div className="sail-home-projects">
          <Link href="/work/gen-ui/" className="sail-home-project">
            <h3>NLP Gen UI</h3>
            <p>Medical documents, ready in seconds.</p>
            <span className="sail-home-result">
              <span className="visually-hidden">Document load time: </span>
              ~15 min → &lt;5 sec
            </span>
          </Link>
          <Link href="/work/care-iq/" className="sail-home-project">
            <h3>CareIQ</h3>
            <p>Marketing · Web app · API · Database</p>
            <span className="sail-home-status">
              In development <span aria-hidden="true">↗</span>
            </span>
          </Link>
          <div className="sail-home-more">
            <span>Also exploring</span>
            <a href="https://toolbox.kristiansalmeron.com/" referrerPolicy="origin">
              Toolbox <span aria-hidden="true">↗</span>
            </a>
            <a href="https://lab.kristiansalmeron.com/" referrerPolicy="origin">
              Lab <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
