import Link from 'next/link';
import { SectionLabel } from '@/components/chrome';

export const metadata = {
  title: 'NLP Gen UI — Medical documents, ready in seconds',
  description:
    'How Kristian Salmeron re-architected PDF delivery and initial rendering at Highmark Health, from approximately 15 minutes to under 5 seconds, for a shared medical coding capability.',
};

export default function GenUI() {
  return (
    <main id="main">
      <section className="page-intro case-intro">
        <Link className="breadcrumb" href="/work">
          ← Selected work
        </Link>
        <div className="eyebrow">FIELD REPORT 001 / NLP GEN UI / HIGHMARK HEALTH</div>
        <h1>
          Less waiting.
          <br />
          <em>More working.</em>
        </h1>
        <p>
          Re-architecting how medical documents reach the people who need them. A shared PDF
          capability for enterprise medical coding applications.
        </p>
        <div className="case-facts">
          <div>
            <span>MY CONTRIBUTION</span>
            <p>Delivery & rendering architecture</p>
          </div>
          <div>
            <span>REACH</span>
            <p>1,500+ medical coders</p>
          </div>
          <div>
            <span>REUSE</span>
            <p>Five enterprise applications</p>
          </div>
        </div>
      </section>
      <div className="case-body">
        <aside className="case-index" aria-label="Case study contents">
          <span>IN THIS REPORT</span>
          <a href="#waiting">01 / The bottleneck</a>
          <a href="#delivery">02 / The architecture</a>
          <a href="#impact">03 / The impact</a>
        </aside>
        <div className="case-main">
          <section id="waiting" className="case-section">
            <SectionLabel number="01">THE BOTTLENECK</SectionLabel>
            <h2>
              The document
              <br />
              was the <em>delay.</em>
            </h2>
            <p>
              Medical coders need documents to do their work. In the applications using Gen UI,
              initial PDF rendering took approximately fifteen minutes. That wait sat directly in
              the coding workflow.
            </p>
            <p>
              My work focused on the path from document delivery to the first render: how the PDF
              was prepared, how it arrived, and how the viewer depended on the rest of the
              application.
            </p>
          </section>
          <section id="delivery" className="case-section">
            <SectionLabel number="02">THE ARCHITECTURE</SectionLabel>
            <h2>
              Change the path.
              <br />
              <em>Change the wait.</em>
            </h2>
            <p>
              I re-architected PDF delivery and rendering using Apryse. The approach combined
              linearized documents, progressive delivery in chunks, and document rendering decoupled
              from application data APIs.
            </p>
            <ol className="delivery-steps">
              <li>
                <span>01</span>
                <div>
                  <h3>Prepare for progressive access.</h3>
                  <p>
                    Linearize the PDFs so the viewer can begin working with the document
                    progressively.
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h3>Deliver in chunks.</h3>
                  <p>Deliver the document progressively, supporting an earlier initial render.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h3>Separate the rendering path.</h3>
                  <p>
                    Decouple document rendering from application data APIs, giving the document
                    workflow its own delivery path.
                  </p>
                </div>
              </li>
            </ol>
            <p>
              I also managed the technical relationship and implementation of the Apryse solution,
              and built the shared Gen UI capability for integration into five enterprise
              applications.
            </p>
          </section>
          <section id="impact" className="case-section">
            <SectionLabel number="03">THE IMPACT</SectionLabel>
            <h2>
              Seconds, with
              <br />
              <em>a wider reach.</em>
            </h2>
            <div className="case-render-result">
              <span>INITIAL PDF RENDERING</span>
              <p>
                ~15 minutes <span aria-hidden="true">→</span> <strong>under 5 seconds</strong>
              </p>
            </div>
            <p>
              The change improved the workflow for more than 1,500 medical coders across the
              applications consuming Gen UI. Building it as a shared capability brought the
              improvement to five applications.
            </p>
            <p>
              This is the kind of work I enjoy: solving a concrete experience problem, changing the
              architecture underneath it, and making the result useful beyond a single application.
            </p>
            <div className="case-stack">
              <span>THE FOCUS</span>
              <p>
                PDF delivery · Apryse · Progressive rendering
                <br />
                Application architecture · Shared capabilities
              </p>
            </div>
            <Link className="text-link" href="/about#leadership">
              More about my leadership work ↗
            </Link>
          </section>
        </div>
      </div>
      <section className="small-cta">
        <p>Have a workflow that needs a clearer path?</p>
        <Link href="/contact" className="button primary">
          Let’s talk it through ↗
        </Link>
      </section>
    </main>
  );
}
