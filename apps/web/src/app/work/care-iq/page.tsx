import Link from 'next/link';
import { CareIqStages } from '@/components/inner-interactions';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'Care IQ — Trust starts at the boundary',
  'An architecture field report on practice context, transaction-local configuration, PostgreSQL row-level security, and tenant-safe relationships in Care IQ.',
  '/work/care-iq/',
);

export default function CareIqPage() {
  return (
    <main id="main" className="ip-main">
      <section aria-labelledby="ip-care-title">
        <div className="ip-case-hero">
          <Link href="/work" className="ip-back">
            ← Selected work
          </Link>
          <p className="ip-eyebrow">Care IQ / In development</p>
          <h1 id="ip-care-title">
            Trust starts
            <br /> at the <span className="ip-accent">boundary.</span>
          </h1>
          <p className="ip-deck">
            A healthcare operations platform for independent practices.
            <br /> A small first workflow, with a deliberate foundation.
          </p>
          <div className="ip-case-facts">
            <p>
              <span>Context</span>Independent medical practices
            </p>
            <p>
              <span>Focus</span>Architecture & implementation
            </p>
            <p>
              <span>Stage</span>First working vertical slice
            </p>
          </div>
        </div>
        <section id="terrain" className="ip-margin-section">
          <h2 className="ip-margin-label">The starting point</h2>
          <div className="ip-prose">
            <h3>
              Shared infrastructure.
              <br /> Separate practices.
            </h3>
            <p>
              The first slice connects authentication, patient records, and appointment scheduling.
              Practices can share the platform, but the data boundary between them has to be
              explicit.
            </p>
          </div>
        </section>
        <section id="request" className="ip-margin-section">
          <h2 className="ip-margin-label">Follow a request</h2>
          <div className="ip-prose">
            <h3>From identity to integrity.</h3>
            <p>Follow the practice context through the system.</p>
            <CareIqStages />
            <p className="ip-caption">An illustrated request path. No patient data.</p>
          </div>
        </section>
        <section id="decisions" className="ip-margin-section">
          <h2 className="ip-margin-label">The tradeoffs</h2>
          <div className="ip-prose">
            <h3>
              Good choices
              <br /> have costs.
            </h3>
            <p>
              Architecture becomes more useful when the tradeoffs are visible. These are the
              consequences of the structure in the current implementation.
            </p>
            <div className="ip-principles">
              <div>
                <span className="ip-small-label">01 / A separate API boundary</span>
                <p>
                  A versioned interface keeps data access and practice resolution in one place. It
                  asks for separate deployment, cross-origin configuration, and care around
                  contracts between the web app and API.
                </p>
              </div>
              <div>
                <span className="ip-small-label">02 / Database-enforced isolation</span>
                <p>
                  Tenant policy sits alongside the data, with the practice included in
                  patient–appointment relationships. It asks for correct database roles, consistent
                  transaction context, and tests for denied and cross-practice access.
                </p>
              </div>
              <div>
                <span className="ip-small-label">03 / One complete workflow first</span>
                <p>
                  A connected path through UI, identity, API, and database comes before the platform
                  grows wider. It asks for restraint: features beyond the first patient and
                  appointment slice remain future work.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="today" className="ip-margin-section">
          <h2 className="ip-margin-label">What exists today</h2>
          <div className="ip-prose">
            <h3>One complete workflow first.</h3>
            <ul className="ip-plain-list">
              <li>Authenticated patient creation and listing</li>
              <li>Appointment creation and listing</li>
              <li>Practice context and database row-level security</li>
              <li>Patient–appointment relationships scoped to the practice</li>
              <li>Version-controlled schema migrations</li>
            </ul>
            <p className="ip-caption">
              Active development. Operational outcomes will be added when available.
            </p>
          </div>
        </section>
        <section className="ip-margin-section">
          <h2 className="ip-margin-label">The tools</h2>
          <div className="ip-prose">
            <p>
              Next.js · React · TypeScript
              <br /> Express · PostgreSQL · Drizzle · Clerk
            </p>
          </div>
        </section>
        <Link href="/field-notes/the-boundary-is-the-feature" className="ip-next">
          <span>From the notebook</span>
          <strong>The boundary is the feature.</strong>
          <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
