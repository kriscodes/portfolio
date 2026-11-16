import Link from 'next/link';
import { CareIqStages } from '@/components/inner-interactions';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'CareIQ — Architecture & product',
  'Inside CareIQ: a separate marketing site, authenticated web app, Express API, and PostgreSQL database supporting front-office workflows for independent medical practices.',
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
          <p className="ip-eyebrow">CareIQ / In development</p>
          <h1 id="ip-care-title">
            Clear workflows.
            <br /> <span className="ip-accent">Deliberate boundaries.</span>
          </h1>
          <p className="ip-deck">
            I’m building CareIQ to help independent medical practices coordinate the work around a
            visit—from scheduling to paperwork and follow-up.
          </p>
          <div className="ip-case-facts">
            <p>
              <span>Context</span>Independent medical practices
            </p>
            <p>
              <span>My work</span>Architecture & implementation
            </p>
            <p>
              <span>Stage</span>In development · Synthetic data
            </p>
          </div>
        </div>

        <section id="terrain" className="ip-margin-section" aria-labelledby="cq-architecture-title">
          <h2 id="cq-architecture-title" className="ip-margin-label">
            01 / The architecture
          </h2>
          <div className="ip-prose">
            <h3>Four parts. Clear responsibilities.</h3>
            <p>
              The marketing site, web application, and API are separate applications in one
              monorepo. PostgreSQL holds the data. Each part has a specific job and an explicit
              boundary.
            </p>
            <div className="cq-architecture-grid">
              <article className="cq-component" aria-labelledby="cq-marketing">
                <p className="ip-small-label">01 / Public experience</p>
                <h4 id="cq-marketing">Marketing site</h4>
                <p className="ip-caption">Next.js · Static export</p>
                <p>
                  Introduces the product, explains its development stage, and collects research
                  requests through a dedicated public API endpoint when enabled. No patient data or
                  direct database access.
                </p>
              </article>
              <article className="cq-component" aria-labelledby="cq-web">
                <p className="ip-small-label">02 / Staff experience</p>
                <h4 id="cq-web">Web app</h4>
                <p className="ip-caption">Next.js · React · TypeScript</p>
                <p>
                  Provides the authenticated workspace for scheduling, patients, paperwork, and
                  practice administration. It presents authorized data and calls the API for
                  application operations.
                </p>
              </article>
              <article className="cq-component" aria-labelledby="cq-api">
                <p className="ip-small-label">03 / Application boundary</p>
                <h4 id="cq-api">API</h4>
                <p className="ip-caption">Node.js · Express · TypeScript</p>
                <p>
                  Owns versioned REST endpoints, validation, practice resolution, authorization,
                  business logic, and audit context. All application database access passes through
                  this layer.
                </p>
              </article>
              <article className="cq-component" aria-labelledby="cq-database">
                <p className="ip-small-label">04 / Data boundary</p>
                <h4 id="cq-database">Database</h4>
                <p className="ip-caption">PostgreSQL · Drizzle ORM & migrations</p>
                <p>
                  Stores practice records and enforces tenant isolation with row-level security.
                  Transaction-local practice context and scoped relationships keep related records
                  within the correct practice.
                </p>
              </article>
            </div>
            <h4>How the parts connect</h4>
            <ul className="ip-plain-list">
              <li>
                <strong>Staff:</strong> Web app → authenticated API → database.
              </li>
              <li>
                <strong>Research requests:</strong> Marketing site → public API endpoint → separate
                business-contact records, when intake is enabled.
              </li>
            </ul>
            <p>
              Marketing runs independently of the staff app. Neither frontend connects directly to
              PostgreSQL, and a research submission does not create a patient or practice.
            </p>
          </div>
        </section>

        <section id="request" className="ip-margin-section" aria-labelledby="cq-boundary-title">
          <h2 id="cq-boundary-title" className="ip-margin-label">
            02 / Identity & access
          </h2>
          <div className="ip-prose">
            <h3>A request carries its practice.</h3>
            <p>
              Clerk establishes identity. CareIQ verifies that identity, resolves the active
              practice, and checks permissions and location access. Database policies reinforce
              those application checks with row-level isolation.
            </p>
            <CareIqStages />
            <p className="ip-caption">
              A simplified patient-and-appointment request path. No patient data.
            </p>
          </div>
        </section>

        <section id="today" className="ip-margin-section" aria-labelledby="cq-functionality-title">
          <h2 id="cq-functionality-title" className="ip-margin-label">
            03 / The functionality
          </h2>
          <div className="ip-prose">
            <h3>The work around a visit.</h3>
            <p>
              The current development scope brings the schedule, patient details, and outstanding
              work into one staff workspace.
            </p>
            <ul className="ip-plain-list">
              <li>
                <strong>Appointments & patients.</strong> Scheduling, availability, patient
                profiles, and the details of upcoming visits.
              </li>
              <li>
                <strong>Forms & visit readiness.</strong> Prepare paperwork, track requests and
                signatures, and see which requirements need attention.
              </li>
              <li>
                <strong>Insurance follow-up.</strong> Record manual coverage observations, flag
                questions, and assign the next step.
              </li>
              <li>
                <strong>Team coordination.</strong> Shared work, practice and location access, and
                protected activity review for authorized staff.
              </li>
            </ul>
            <p className="ip-caption">
              In development and not ready for live patient care. Demonstrations use synthetic data.
              Automated insurance verification and planned external integrations are not available;
              delivery capabilities are still being evaluated.
            </p>
            <a href="https://careiqlabs.com" className="ip-text-link">
              Explore the CareIQ marketing site <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <section id="decisions" className="ip-margin-section" aria-labelledby="cq-decisions-title">
          <h2 id="cq-decisions-title" className="ip-margin-label">
            04 / The decisions
          </h2>
          <div className="ip-prose">
            <h3>Useful boundaries have costs.</h3>
            <div className="ip-principles">
              <div>
                <span className="ip-small-label">A separate API</span>
                <p>
                  One place for business rules and data access, with a reusable interface for future
                  clients. The cost is separate deployment, cross-origin configuration, and
                  coordinated contracts.
                </p>
              </div>
              <div>
                <span className="ip-small-label">Database-enforced isolation</span>
                <p>
                  Practice policies live beside the data. That requires restricted runtime roles,
                  consistent transaction context, and tests for denied and cross-practice access.
                </p>
              </div>
              <div>
                <span className="ip-small-label">Independent public and staff experiences</span>
                <p>
                  Marketing can evolve without shipping the staff app. Shared branding and contracts
                  need deliberate maintenance across the applications.
                </p>
              </div>
            </div>
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
