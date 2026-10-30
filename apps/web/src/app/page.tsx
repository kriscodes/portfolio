import Link from 'next/link';
import SailStudy from '@/components/sail-study';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'Making things work.',
  'I build systems, explore ideas, and follow the interesting questions. Software engineering and architecture by Kristian Salmeron.',
  '/',
);

export default function HomePage() {
  return (
    <main id="main" className="home-main">
      <SailStudy>
        <div className="t3-intro">
          <p className="t3-role">Software engineering &amp; architecture</p>
          <h1>
            <span className="t3-highlight">Making</span>
            <br />
            things work.
          </h1>
          <p className="t3-description">
            I build systems, explore ideas,
            <br />
            and follow the interesting questions.
          </p>
        </div>
      </SailStudy>
      <section id="selected-work" className="t3-work" aria-labelledby="selected-work-heading">
        <h2 id="selected-work-heading">Selected work</h2>
        <div className="t3-projects">
          <Link href="/work/gen-ui" className="t3-project">
            <span className="t3-project-copy">
              <span className="t3-project-name">NLP Gen UI</span>
              <span className="t3-project-description">Medical documents, ready in seconds.</span>
            </span>
            <span className="t3-project-result">~15 min → &lt;5 sec</span>
            <span className="t3-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
          <Link href="/work/care-iq" className="t3-project">
            <span className="t3-project-copy">
              <span className="t3-project-name">Care IQ</span>
              <span className="t3-project-description">Trust starts at the boundary.</span>
            </span>
            <span className="t3-project-result">In development</span>
            <span className="t3-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        </div>
      </section>
      <div className="home-about">
        <p>Away from the desk: sailing &amp; photography.</p>
        <Link href="/about">
          The person behind the work <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
