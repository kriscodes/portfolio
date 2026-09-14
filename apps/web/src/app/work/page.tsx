import Link from 'next/link';
import { SectionLabel } from '@/components/chrome';
export const metadata = {
  title: 'Selected work',
  description:
    'Professional impact at Highmark Health, the Care IQ architecture field report, and the engineering decisions behind this portfolio.',
};
export default function Work() {
  return (
    <main id="main">
      <section className="page-intro">
        <SectionLabel number="01">SELECTED WORK</SectionLabel>
        <h1>
          Every system
          <br />
          has a <em>story.</em>
        </h1>
        <p>
          The interesting part is how it got there. The boundaries, the tradeoffs, and the decisions
          that make the next step possible.
        </p>
      </section>
      <section className="section work-list">
        <Link className="work-list-item" href="/work/gen-ui">
          <div className="work-index">001 / HIGHMARK HEALTH</div>
          <div>
            <span className="eyebrow">MEDICAL CODING / SHARED PLATFORM</span>
            <h2>NLP Gen UI</h2>
            <p>Medical documents, ready in seconds.</p>
            <div className="tags">
              <span>Frontend architecture</span>
              <span>Performance</span>
              <span>Shared capabilities</span>
            </div>
            <p className="muted">
              Initial PDF rendering reduced from approximately 15 minutes to under 5 seconds. A
              shared capability for five applications, supporting 1,500+ medical coders.
            </p>
          </div>
          <span className="large-arrow" aria-hidden>
            ↗
          </span>
        </Link>
        <Link className="work-list-item" href="/work/care-iq">
          <div className="work-index">002 / ACTIVE DEVELOPMENT</div>
          <div>
            <span className="eyebrow">HEALTHCARE OPERATIONS</span>
            <h2>Care IQ</h2>
            <p>Trust starts at the boundary.</p>
            <div className="tags">
              <span>System architecture</span>
              <span>Tenant isolation</span>
              <span>Full-stack implementation</span>
            </div>
            <p className="muted">
              A first complete patient and appointment workflow, with practice context carried from
              identity to database policy.
            </p>
          </div>
          <span className="large-arrow" aria-hidden>
            ↗
          </span>
        </Link>
        <div className="work-list-item site-entry">
          <div className="work-index">003 / YOU ARE HERE</div>
          <div>
            <span className="eyebrow">PERSONAL WEBSITE</span>
            <h2>This field guide.</h2>
            <p>A portfolio with a little more perspective.</p>
            <div className="tags">
              <span>Next.js</span>
              <span>React</span>
              <span>Design system</span>
            </div>
            <p className="muted">
              Fast, readable pages. Deliberate interactions. A shared home for the frontend, API
              foundation, and architecture notes.
            </p>
            <Link className="text-link" href="/field-notes/leave-room-for-the-unknown">
              Read the thinking behind it ↗
            </Link>
          </div>
        </div>
      </section>
      <section className="small-cta">
        <p>The work matters. So does how we work together.</p>
        <Link href="/about" className="text-link">
          Get to know me ↗
        </Link>
      </section>
    </main>
  );
}
