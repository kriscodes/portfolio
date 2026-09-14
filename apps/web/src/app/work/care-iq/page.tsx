import Link from 'next/link';
import { SectionLabel } from '@/components/chrome';
import { RequestTrace } from '@/components/field-tools';
export const metadata = {
  title: 'Care IQ — Trust starts at the boundary',
  description:
    'An architecture field report on practice context, transaction-local configuration, PostgreSQL row-level security, and tenant-safe relationships in Care IQ.',
};
export default function CareIQ() {
  return (
    <main id="main">
      <section className="page-intro case-intro">
        <Link className="breadcrumb" href="/work">
          ← Selected work
        </Link>
        <div className="eyebrow">FIELD REPORT 002 / CARE IQ / ACTIVE DEVELOPMENT</div>
        <h1>
          Trust starts
          <br />
          at the <em>boundary.</em>
        </h1>
        <p>
          A healthcare operations platform for independent practices. A small first workflow, with a
          deliberate foundation.
        </p>
        <div className="case-facts">
          <div>
            <span>CONTEXT</span>
            <p>Independent medical practices</p>
          </div>
          <div>
            <span>FOCUS</span>
            <p>Architecture & implementation</p>
          </div>
          <div>
            <span>CURRENT STAGE</span>
            <p>First working vertical slice</p>
          </div>
        </div>
      </section>
      <div className="case-body">
        <aside className="case-index" aria-label="Case study contents">
          <span>IN THIS REPORT</span>
          <a href="#terrain">01 / The terrain</a>
          <a href="#request">02 / Follow a request</a>
          <a href="#decisions">03 / The tradeoffs</a>
          <a href="#today">04 / What exists today</a>
        </aside>
        <div className="case-main">
          <section id="terrain" className="case-section">
            <SectionLabel number="01">THE TERRAIN</SectionLabel>
            <h2>
              Shared infrastructure.
              <br />
              <em>Separate practices.</em>
            </h2>
            <p>
              Care IQ starts with a practical problem: give independent practices a connected home
              for patient and appointment workflows. Practices can share the platform, but the data
              boundary between them has to be explicit.
            </p>
            <p>
              The first slice connects authentication, patient records, and appointment scheduling.
              That is enough surface area to work through identity, tenant context, relationships,
              and a usable interface together.
            </p>
            <blockquote>
              Make the boundary part of the system, then carry it through the workflow.
            </blockquote>
          </section>
          <section id="request" className="case-section">
            <SectionLabel number="02">FOLLOW A REQUEST</SectionLabel>
            <h2>
              From identity
              <br />
              <em>to integrity.</em>
            </h2>
            <p>Select a stage to follow the practice context through the system.</p>
            <RequestTrace />
          </section>
          <section id="decisions" className="case-section">
            <SectionLabel number="03">THE DECISION LEDGER</SectionLabel>
            <h2>
              Good choices
              <br />
              have <em>costs.</em>
            </h2>
            <p>
              Architecture becomes more useful when the tradeoffs are visible. These are the
              consequences of the structure in the current implementation.
            </p>
            <div className="decision-ledger">
              <details open>
                <summary>
                  <span>01</span> A separate API boundary <span>+</span>
                </summary>
                <div className="tradeoff-grid">
                  <div>
                    <b>What it gives</b>
                    <p>
                      A versioned interface with data access and practice resolution in one place.
                    </p>
                  </div>
                  <div>
                    <b>What it asks</b>
                    <p>
                      Separate deployment, cross-origin configuration, and care around contracts
                      between the web app and API.
                    </p>
                  </div>
                </div>
              </details>
              <details>
                <summary>
                  <span>02</span> Database-enforced isolation <span>+</span>
                </summary>
                <div className="tradeoff-grid">
                  <div>
                    <b>What it gives</b>
                    <p>
                      Tenant policy alongside the data, with the practice included in
                      patient–appointment relationships.
                    </p>
                  </div>
                  <div>
                    <b>What it asks</b>
                    <p>
                      Correct database roles, consistent transaction context, and tests for denied
                      and cross-practice access.
                    </p>
                  </div>
                </div>
              </details>
              <details>
                <summary>
                  <span>03</span> One complete workflow first <span>+</span>
                </summary>
                <div className="tradeoff-grid">
                  <div>
                    <b>What it gives</b>
                    <p>
                      A connected path through UI, identity, API, and database before the platform
                      grows wider.
                    </p>
                  </div>
                  <div>
                    <b>What it asks</b>
                    <p>
                      Restraint: features beyond the first patient and appointment slice remain
                      future work.
                    </p>
                  </div>
                </div>
              </details>
            </div>
          </section>
          <section id="today" className="case-section">
            <SectionLabel number="04">WHAT EXISTS TODAY</SectionLabel>
            <h2>
              A foundation
              <br />
              you can <em>point to.</em>
            </h2>
            <ul className="check-list">
              <li>Authenticated patient creation and listing</li>
              <li>Appointment creation and listing</li>
              <li>Next.js UI and versioned Express REST API</li>
              <li>
                Practice context, transaction-local configuration, and row-level security migrations
              </li>
              <li>Composite patient–appointment relationships that include the practice</li>
              <li>Version-controlled schema migrations</li>
            </ul>
            <p className="evidence-note">
              Implementation snapshot: the patient and appointment workflow is in active
              development. This report covers code and schema decisions; measured operational
              outcomes will be added when available.
            </p>
            <div className="case-stack">
              <span>THE TOOLS</span>
              <p>
                Next.js · React · TypeScript · Tailwind CSS
                <br />
                Express · PostgreSQL · Drizzle · Clerk · pnpm
              </p>
            </div>
            <Link className="text-link" href="/field-notes/the-boundary-is-the-feature">
              Go deeper: The boundary is the feature ↗
            </Link>
          </section>
        </div>
      </div>
      <section className="small-cta">
        <p>Have a boundary, a bottleneck, or a big next step?</p>
        <Link href="/contact" className="button primary">
          Let’s talk it through ↗
        </Link>
      </section>
    </main>
  );
}
