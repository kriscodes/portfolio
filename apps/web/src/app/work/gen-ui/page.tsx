import Link from 'next/link';
import { GenUiStages } from '@/components/inner-interactions';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'NLP Gen UI — Medical documents, ready in seconds',
  'How Kristian Salmeron re-architected PDF delivery and initial rendering at Highmark Health, from approximately 15 minutes to under 5 seconds, for a shared medical coding capability.',
  '/work/gen-ui/',
);

export default function GenUiPage() {
  return (
    <main id="main" className="ip-main">
      <section aria-labelledby="ip-gen-title">
        <div className="ip-case-hero">
          <Link href="/work" className="ip-back">
            ← Selected work
          </Link>
          <p className="ip-eyebrow">NLP Gen UI / Highmark Health</p>
          <h1 id="ip-gen-title">
            Less waiting.
            <br /> More <span className="ip-accent">working.</span>
          </h1>
          <p className="ip-deck">
            Re-architecting how medical documents
            <br /> reach the people who need them.
          </p>
          <div className="ip-case-facts">
            <p>
              <span>My contribution</span>Delivery & rendering architecture
            </p>
            <p>
              <span>Reach</span>1,500+ medical coders
            </p>
            <p>
              <span>Reuse</span>Five enterprise applications
            </p>
          </div>
        </div>
        <section
          id="impact"
          className="ip-margin-section ip-outcome"
          aria-labelledby="ip-outcome-title"
        >
          <h2 id="ip-outcome-title" className="ip-margin-label">
            Initial PDF rendering
          </h2>
          <div>
            <p className="ip-outcome-value">
              <span>~15 min</span>
              <span className="ip-outcome-arrow" aria-hidden="true">
                →
              </span>
              <strong>&lt;5 sec</strong>
            </p>
            <p className="ip-body ip-outcome-caption">
              A shorter wait, shared across five applications.
            </p>
          </div>
        </section>
        <section id="waiting" className="ip-margin-section">
          <h2 className="ip-margin-label">The problem</h2>
          <div className="ip-prose">
            <h3>The document was the delay.</h3>
            <p>
              Medical coders need documents to do their work. Initial PDF rendering took
              approximately fifteen minutes. That wait sat directly in the coding workflow.
            </p>
            <p>
              I focused on the path from document delivery to the first render: how the PDF was
              prepared, how it arrived, and how the viewer depended on the rest of the application.
            </p>
          </div>
        </section>
        <section id="delivery" className="ip-margin-section">
          <h2 className="ip-margin-label">The architecture</h2>
          <div className="ip-prose ip-architecture">
            <h3>
              Change the path.
              <br /> Change the wait.
            </h3>
            <p>A shared capability built with Apryse. Select a stage to see what changed.</p>
            <GenUiStages />
            <p>
              I also managed the technical relationship and implementation of the Apryse solution,
              and built the shared Gen UI capability for integration into five enterprise
              applications.
            </p>
          </div>
        </section>
        <section className="ip-margin-section">
          <h2 className="ip-margin-label">What carried forward</h2>
          <div className="ip-prose">
            <p className="ip-closing-copy">
              Solve a concrete experience problem. Change the architecture underneath it. Make the
              result useful beyond a single application.
            </p>
            <Link className="ip-text-link" href="/about#leadership">
              More about my leadership work ↗
            </Link>
          </div>
        </section>
        <Link href="/work/care-iq" className="ip-next">
          <span>Next project</span>
          <strong>Care IQ</strong>
          <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
