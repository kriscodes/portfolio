import Link from 'next/link';
import { SectionLabel } from '@/components/chrome';

export function GenUIFeature() {
  return (
    <article className="career-feature">
      <div className="career-feature-copy">
        <span className="eyebrow">HIGHMARK HEALTH / FRONTEND ARCHITECTURE</span>
        <h3>
          <Link href="/work/gen-ui">NLP Gen UI</Link>
        </h3>
        <p>Medical documents, ready in seconds.</p>
        <p className="muted">
          I re-architected PDF delivery and rendering, then built the shared capability for five
          enterprise applications.
        </p>
        <Link className="text-link" href="/work/gen-ui">
          Read the performance story ↗
        </Link>
      </div>
      <div className="career-result">
        <span className="eyebrow">TIME TO INITIAL PDF RENDER</span>
        <div className="render-result">
          <span>
            <b>~15</b> minutes
          </span>
          <span aria-hidden="true">→</span>
          <span>
            <b>&lt;5</b> seconds
          </span>
        </div>
        <div className="result-context">
          <p>
            <strong>1,500+</strong> medical coders
          </p>
          <p>
            <strong>5</strong> enterprise applications
          </p>
        </div>
        <p className="result-caption">
          A change to the delivery architecture. A faster start to the coding workflow.
        </p>
      </div>
    </article>
  );
}

export function LeadershipEvidence() {
  return (
    <section className="section leadership-section" id="leadership" tabIndex={-1}>
      <SectionLabel number="01">LEADERSHIP IN PRACTICE</SectionLabel>
      <div className="leadership-intro">
        <h2>
          Make the work
          <br />
          <em>work better.</em>
        </h2>
        <div>
          <p>Lead Software Engineer, Advanced Analytics at Highmark Health.</p>
          <p className="muted">
            My work spans architecture, delivery, and the shared foundations other engineers build
            on.
          </p>
        </div>
      </div>
      <div className="leadership-notes">
        <article>
          <span className="eyebrow">01 / CONNECT THE SYSTEMS</span>
          <h3>
            Eight applications.
            <br />
            One shared direction.
          </h3>
          <p>
            I architected One ClaimHub to consolidate health insurance claims workflows and data
            from eight applications and more than ten teams. With participating engineers, I
            established a shared data model, database schema, and API structure, reducing duplicated
            developer overhead.
          </p>
        </article>
        <article>
          <span className="eyebrow">02 / ENABLE THE TEAMS</span>
          <h3>
            Five initiatives.
            <br />A common foundation.
          </h3>
          <p>
            I lead technical delivery across five concurrent healthcare initiatives, coordinating
            approximately 25 contributors across engineering, QA, product, project management,
            design, data, and analytics. I established frontend standards and technical
            documentation covering architecture, authentication, and development practices.
          </p>
        </article>
        <article>
          <span className="eyebrow">03 / DEVELOP THE CRAFT</span>
          <h3>
            Lead closely.
            <br />
            Stay hands-on.
          </h3>
          <p>
            At CrossComm, I led and mentored three frontend engineers through code reviews,
            one-on-ones, estimation, and project planning while remaining approximately 80%
            hands-on.
          </p>
        </article>
      </div>
      <Link className="text-link" href="/work/gen-ui">
        See that approach in the Gen UI field report ↗
      </Link>
    </section>
  );
}
