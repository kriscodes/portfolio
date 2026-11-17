import Link from 'next/link';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'Selected work',
  'CareIQ, useful tools, frontend experiments, and engineering case studies by Kristian Salmeron.',
  '/work/',
);

export default function WorkPage() {
  return (
    <main id="main" className="ip-main">
      <section aria-labelledby="work-title">
        <div className="ip-hero">
          <p className="ip-eyebrow">Selected work</p>
          <h1 id="work-title">
            Ideas made
            <br />
            <span className="ip-accent">useful.</span>
          </h1>
          <p className="ip-deck">
            Products, practical tools, and a closer look at the engineering behind them.
          </p>
        </div>
        <div className="editorial-projects">
          <Link href="/work/care-iq/" className="editorial-project">
            <span className="project-number" aria-hidden="true">
              01
            </span>
            <h3>CareIQ</h3>
            <p>A healthcare product, from architecture to front-desk workflows.</p>
            <span className="project-status">In development</span>
            <span className="project-arrow" aria-hidden="true">
              →
            </span>
          </Link>
          <a
            href="https://toolbox.kristiansalmeron.com/"
            referrerPolicy="origin"
            className="editorial-project"
          >
            <span className="project-number" aria-hidden="true">
              02
            </span>
            <h3>Toolbox</h3>
            <p>Practical tools for everyday work.</p>
            <span className="project-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
          <a
            href="https://lab.kristiansalmeron.com/"
            referrerPolicy="origin"
            className="editorial-project"
          >
            <span className="project-number" aria-hidden="true">
              03
            </span>
            <h3>Lab</h3>
            <p>Experiments in frontend performance and rendering.</p>
            <span className="project-note">Experiments</span>
            <span className="project-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
          <Link href="/work/gen-ui/" className="editorial-project">
            <span className="project-number" aria-hidden="true">
              04
            </span>
            <h3>NLP Gen UI</h3>
            <p>Medical documents, ready in seconds. A progressive-rendering case study.</p>
            <span className="project-note">Engineering</span>
            <span className="project-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
        <div className="work-note">
          <p>Notes on architecture, decisions, and the work in between.</p>
          <Link href="/field-notes/" className="ip-text-link">
            Read the field notes <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
