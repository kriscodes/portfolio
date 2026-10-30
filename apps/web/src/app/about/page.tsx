import Link from 'next/link';
import { PersonalInterests } from '@/components/inner-interactions';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'About — A little more perspective',
  'Engineering, architecture, hiking, sailing, and photography. The perspective behind Kristian Salmeron’s work.',
  '/about/',
);

export default function AboutPage() {
  return (
    <main id="main" className="ip-main">
      <section aria-labelledby="ip-about-title">
        <div className="ip-about-hero">
          <div>
            <p className="ip-eyebrow">The person behind the work</p>
            <h1 id="ip-about-title">
              A little more
              <br /> <span className="ip-accent">perspective.</span>
            </h1>
          </div>
          <div className="ip-about-intro">
            <p className="ip-intro-name">I’m Kristian.</p>
            <p>
              Software is how I make ideas useful. Hiking, sailing, and photography keep me curious
              about everything beyond the screen.
            </p>
            <p className="ip-role">
              Lead Software Engineer
              <br /> Advanced Analytics, Highmark Health
            </p>
          </div>
        </div>
        <section className="ip-margin-section">
          <h2 className="ip-margin-label">How I work</h2>
          <div className="ip-prose">
            <h3>
              Clear direction.
              <br /> Room to explore.
            </h3>
            <p>
              My work spans architecture, delivery, and the shared foundations other engineers build
              on.
            </p>
            <div className="ip-principles">
              <div>
                <span className="ip-small-label">01 / Understand the terrain</span>
                <p>Start with the people, the constraints, and the real problem.</p>
              </div>
              <div>
                <span className="ip-small-label">02 / Make the reasoning visible</span>
                <p>
                  Write down why. Name the cost of a decision, so the next person can understand it.
                </p>
              </div>
              <div>
                <span className="ip-small-label">03 / Care about the whole journey</span>
                <p>
                  The interface, the API, the data model, and the way a team works all shape the
                  final experience.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="leadership" className="ip-margin-section">
          <h2 className="ip-margin-label">Leadership in practice</h2>
          <div className="ip-prose">
            <h3>Make the work work better.</h3>
            <p>
              I architected One ClaimHub to connect claims workflows and data from eight
              applications and more than ten teams, establishing a shared data model, database
              schema, and API structure with participating engineers.
            </p>
            <p>
              I lead technical delivery across five concurrent healthcare initiatives, coordinating
              approximately 25 contributors across engineering, QA, product, design, data, and
              delivery.
            </p>
            <Link href="/work/gen-ui" className="ip-text-link">
              See the approach in practice ↗
            </Link>
          </div>
        </section>
        <section className="ip-margin-section ip-outside">
          <h2 className="ip-margin-label">Away from the desk</h2>
          <div>
            <h3>
              Same curiosity.
              <br /> Different terrain.
            </h3>
            <PersonalInterests />
            <a
              href="https://www.instagram.com/capt_kris/"
              target="_blank"
              rel="noopener"
              className="ip-text-link"
            >
              Photographs & field trips ↗
            </a>
          </div>
        </section>
        <div className="ip-ending">
          <p>The work matters. So does how we work together.</p>
          <Link href="/contact">Let’s talk ↗</Link>
        </div>
      </section>
    </main>
  );
}
