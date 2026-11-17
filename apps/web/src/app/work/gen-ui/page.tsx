import Link from 'next/link';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'Medical document viewer: 15 minutes to under 5 seconds',
  'A React and Next.js rebuild at Highmark Health: decoupling PDF rendering from NLP/OCR data with Apryse, linearization, and progressive delivery for 1,500+ medical coders.',
  '/work/gen-ui/',
);

export default function MedicalDocumentViewerPage() {
  return (
    <main id="main" className="ip-main">
      <article aria-labelledby="viewer-title">
        <header className="ip-case-hero">
          <Link href="/work/" className="ip-back">← Selected work</Link>
          <p className="ip-eyebrow">Medical document viewer / Highmark Health</p>
          <h1 id="viewer-title">15 minutes to<br /><span className="ip-accent">under 5 seconds.</span></h1>
          <p className="ip-deck">Make the document readable.<br />Let the analysis catch up.</p>
          <div className="ip-case-facts">
            <p><span>My contribution</span>React / Next.js rebuild &amp; delivery architecture</p>
            <p><span>Reach</span>1,500+ medical coders</p>
            <p><span>Reuse</span>Five enterprise applications</p>
          </div>
        </header>
        <section id="impact" className="ip-margin-section ip-outcome">
          <h2 className="ip-margin-label">Time to first page</h2>
          <div><p className="ip-outcome-value"><span>~15 min</span><span className="ip-outcome-arrow" aria-hidden="true">→</span><strong>&lt;5 sec</strong></p>
            <p className="ip-body ip-outcome-caption">Reported prior average wait → reported first-page rendering after the re-architecture.</p></div>
        </section>
        <section className="ip-margin-section">
          <h2 className="ip-margin-label">01 / The starting point</h2>
          <div className="ip-prose"><h3>Two kinds of complexity.</h3>
            <p>The original application was a vanilla HTML, CSS, and JavaScript interface concentrated in a single file. I rebuilt it in React and Next.js with reusable components, making the viewer easier to evolve and share.</p>
            <p>The request sequence created a second problem: the application requested NLP/OCR data first, then requested the PDF. Coders waited for analysis to finish before they could even see the document. The average wait was approximately 15 minutes.</p>
          </div>
        </section>
        <section className="viewer-flow" aria-labelledby="flow-title">
          <div className="case-visual-heading"><p className="ip-small-label">The dependency changed</p><h2 id="flow-title">Reading no longer waits for analysis.</h2></div>
          <div className="viewer-flow-pair">
            <div className="viewer-flow-panel"><h3>Before <span>Sequential</span></h3>
              <ol className="viewer-sequence"><li>Request NLP/OCR data</li><li>Wait for analysis to finish</li><li>Request the PDF</li><li>Render the first page</li></ol>
              <p className="viewer-flow-result">~15-minute average wait</p>
            </div>
            <div className="viewer-flow-panel viewer-flow-after"><h3>After <span>Independent paths</span></h3>
              <div className="viewer-lanes"><div><strong>Document path</strong><ol className="viewer-sequence"><li>Request linearized PDF</li><li>Stream the data needed to display it</li><li>Render the first page with Apryse</li></ol><p className="viewer-flow-result">First page in &lt;5 seconds</p></div>
                <div className="viewer-analysis-lane"><strong>Analysis path</strong><p>NLP/OCR data loads independently.</p><p>It can enrich the experience without blocking the document.</p></div></div>
            </div>
          </div>
          <p className="ip-caption">Conceptual dependency diagram, not a captured network trace. The boxes do not represent measured request durations.</p>
        </section>
        <section className="ip-margin-section">
          <h2 className="ip-margin-label">02 / The engineering</h2>
          <div className="ip-prose"><h3>Change what the first page depends on.</h3>
            <div className="ip-principles">
              <div><span className="ip-small-label">A maintainable frontend</span><p>Replace the single-file interface with a React/Next.js application and reusable components. Give the shared viewer a foundation other applications can use.</p></div>
              <div><span className="ip-small-label">An earlier useful render</span><p>Use Apryse with PDF linearization and progressive delivery so the viewer can display the first page without waiting for the complete document and unrelated application data.</p></div>
              <div><span className="ip-small-label">Independent loading</span><p>Separate document delivery from NLP/OCR API completion. A slow analysis response should not prevent a coder from starting to read.</p></div>
            </div>
            <p>I managed the Apryse technical relationship and implementation, and built the medical document viewer as a shared capability integrated into five enterprise applications.</p>
          </div>
        </section>
        <section className="ip-margin-section">
          <h2 className="ip-margin-label">03 / Measurement &amp; scope</h2>
          <div className="ip-prose"><h3>First useful page, not every request finished.</h3>
            <p>The relevant user-facing milestone is the first visible PDF page. The reported result moved from an average wait of approximately 15 minutes to first-page rendering under 5 seconds. This does not mean NLP/OCR finished in five seconds.</p>
            <p>Historical raw traces, document sizes, and p50/p95 distributions are not available for this public case study. I do not present those figures as measured results.</p>
            <details className="case-measurement"><summary>How I would validate a repeatable comparison today</summary>
              <ul className="ip-plain-list"><li>Start timing when the user opens the document; stop at the viewer’s first visible page event. Record analysis completion separately.</li><li>Compare the same synthetic documents across page-count and file-size bands, including scanned and text-based PDFs.</li><li>Run repeated cold- and warm-cache trials under fixed device and network conditions. Publish sample counts, p50 and p95 for each cohort.</li><li>Inspect request traces and main-thread work. Record failures alongside successful renders, and verify that a delayed analysis request cannot block the PDF.</li></ul>
              <p>Page virtualization and worker execution are useful profiling questions, but are not claimed here as custom implementations from this project.</p>
            </details>
            <p><a href="https://lab.kristiansalmeron.com/experiments/pdf-rendering/" className="ip-text-link">Explore the separate synthetic PDF experiment ↗</a></p>
          </div>
        </section>
        <Link href="/work/care-iq/" className="ip-next"><span>Next project</span><strong>CareIQ</strong><span aria-hidden="true">→</span></Link>
      </article>
    </main>
  );
}
