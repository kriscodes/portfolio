import Link from 'next/link';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'Selected work',
  'Professional impact at Highmark Health, the Care IQ architecture field report, and the engineering decisions behind the work.',
  '/work/',
);

export default function WorkPage() {
  return (
    <main id="main" className="ip-main">
      <section aria-labelledby="ip-work-title">
        <div className="ip-hero ip-work-hero">
          <p className="ip-eyebrow">Selected work</p>
          <h1 id="ip-work-title">
            Every system
            <br /> has a <span className="ip-accent">story.</span>
          </h1>
          <p className="ip-deck">
            The boundaries, the tradeoffs, and the decisions
            <br /> that make the next step possible.
          </p>
        </div>
        <div className="ip-work-list">
          <Link href="/work/gen-ui" className="ip-work-entry">
            <span className="ip-entry-number">01 / Highmark Health</span>
            <span className="ip-entry-copy">
              <span className="ip-entry-title">
                NLP Gen UI <span aria-hidden="true">↗</span>
              </span>
              <span className="ip-entry-description">
                Medical documents,
                <br /> ready in seconds.
              </span>
              <span className="ip-entry-result">~15 min → &lt;5 sec</span>
              <span className="ip-entry-link">
                Read the story <span aria-hidden="true">↗</span>
              </span>
            </span>
            <span className="ip-study ip-document-study" aria-hidden="true">
              <span className="ip-paper ip-paper-back"></span>
              <span className="ip-paper ip-paper-middle"></span>
              <span className="ip-paper ip-paper-front">
                <span className="ip-paper-label">Gen UI / 01</span>
                <span className="ip-paper-line"></span>
                <span className="ip-paper-line"></span>
                <span className="ip-paper-line ip-short"></span>
                <span className="ip-document-block"></span>
                <span className="ip-paper-line"></span>
                <span className="ip-paper-line ip-short"></span>
              </span>
              <span className="ip-study-caption">Progressive delivery</span>
            </span>
          </Link>
          <Link href="/work/care-iq" className="ip-work-entry">
            <span className="ip-entry-number">02 / Independent project</span>
            <span className="ip-entry-copy">
              <span className="ip-entry-title">
                Care IQ <span aria-hidden="true">↗</span>
              </span>
              <span className="ip-entry-description">
                Trust starts
                <br /> at the boundary.
              </span>
              <span className="ip-entry-result">In development</span>
              <span className="ip-entry-link">
                Read the story <span aria-hidden="true">↗</span>
              </span>
            </span>
            <span className="ip-study ip-boundary-study" aria-hidden="true">
              <span className="ip-orbit ip-orbit-one"></span>
              <span className="ip-orbit ip-orbit-two"></span>
              <span className="ip-orbit ip-orbit-three"></span>
              <span className="ip-orbit-label">Practice context</span>
              <span className="ip-study-caption">Identity → data boundary</span>
            </span>
          </Link>
        </div>
        <div className="ip-ending">
          <p>Have a system worth thinking through?</p>
          <Link href="/contact">Let’s talk it through ↗</Link>
        </div>
      </section>
    </main>
  );
}
