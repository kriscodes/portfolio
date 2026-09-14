import Link from 'next/link';
import { GenUIFeature } from '@/components/career';
import WindStudy from '@/components/wind-study';
import { PageIndex, SectionLabel } from '@/components/chrome';
export default function Home() {
  return (
    <main id="main">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="small-cross">✳</span> ENGINEERING / ARCHITECTURE / EXPLORATION
          </div>
          <h1>
            Good systems.
            <br />
            Wild <em>places.</em>
          </h1>
          <p className="hero-experience">12+ years in software. Still curious.</p>
          <p className="hero-intro">
            I’m Kristian. I build software with clear boundaries, practical architecture, and room
            to grow.
          </p>
          <p className="hero-detail">
            Complex problems. Clear direction.
            <br />A little dirt on my shoes.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#selected-work">
              Explore my work <span aria-hidden>↓</span>
            </a>
            <a className="hero-experiment" href="#field-instrument">
              Try the wind study <span aria-hidden>↗</span>
            </a>
          </div>
          <span className="handwritten hero-note">Always take the scenic route.</span>
        </div>
        <div className="hero-visual">
          <div className="vertical-caption">FIELD STUDY / OFF THE CLOCK</div>
          <figure className="mountain-print">
            <img
              src="/images/instagram-redwoods.jpg"
              alt="Sunlight falling across a winding road beneath towering redwoods"
              width="512"
              height="640"
              fetchPriority="high"
            />
            <figcaption>
              <span>01 / A LITTLE FURTHER OUT</span>
              <span>↗</span>
            </figcaption>
          </figure>
          <figure className="sailing-print">
            <span className="tape" aria-hidden />
            <img
              src="/images/instagram-sailing.jpg"
              alt="Two people aboard a sailboat on open water"
              width="640"
              height="482"
            />
            <figcaption>Chasing the horizon.</figcaption>
          </figure>
          <span className="round-stamp" aria-label="Built to explore">
            BUILT TO
            <br />
            <b>EXPLORE</b>
            <br />
            LAND & SEA
          </span>
          <a
            className="photo-credit"
            href="https://www.instagram.com/capt_kris"
            target="_blank"
            rel="noreferrer"
          >
            From my Instagram · @capt_kris ↗
          </a>
        </div>
      </section>
      <PageIndex />
      <section className="home-work section" id="selected-work" tabIndex={-1}>
        <div className="section-heading">
          <SectionLabel number="01">SELECTED WORK</SectionLabel>
          <Link className="text-link" href="/work">
            View the work ↗
          </Link>
        </div>
        <h2>
          Built for the
          <br />
          <em>real world.</em>
        </h2>
        <GenUIFeature />
        <article className="project-feature">
          <div className="project-info">
            <span className="eyebrow">HEALTHCARE / SYSTEM ARCHITECTURE</span>
            <h3>
              <Link href="/work/care-iq">Care IQ</Link>
            </h3>
            <p>Trust starts at the boundary.</p>
            <p className="project-description">
              Designing tenant isolation into the first patient and appointment workflows of a
              healthcare platform.
            </p>
            <div className="tags">
              <span>Next.js</span>
              <span>Express</span>
              <span>PostgreSQL</span>
            </div>
            <Link href="/work/care-iq" className="text-link">
              Open the field report ↗
            </Link>
          </div>
          <Link
            href="/work/care-iq#request"
            className="project-diagram"
            aria-label="Follow a request through the Care IQ architecture"
          >
            <div className="diagram-top">
              <b>Care IQ</b>
              <span>ARCHITECTURE STUDY / 001</span>
            </div>
            <div className="system-node">
              Identity <span>01</span>
            </div>
            <div className="connector-line" />
            <div className="system-node">
              Practice context <span>02</span>
            </div>
            <div className="connector-line" />
            <div className="system-boundary">
              <span>ISOLATION BOUNDARY</span>
              <div className="system-node">
                Patient & appointment data <span>03</span>
              </div>
            </div>
            <div className="diagram-bottom">
              Follow a request through the system<span>↗</span>
            </div>
          </Link>
        </article>
      </section>
      <section className="section notes-preview" id="field-notes" tabIndex={-1}>
        <div className="section-heading">
          <SectionLabel number="02">FIELD NOTES</SectionLabel>
          <Link className="text-link" href="/field-notes">
            Open the notebook ↗
          </Link>
        </div>
        <h2>
          Things worth
          <br />
          <em>thinking through.</em>
        </h2>
        <Link className="note-row" href="/field-notes/the-boundary-is-the-feature">
          <span>001 / ENGINEERING</span>
          <h3>The boundary is the feature.</h3>
          <span>Read note ↗</span>
        </Link>
        <Link className="note-row" href="/field-notes/leave-room-for-the-unknown">
          <span>002 / PERSPECTIVE</span>
          <h3>Leave room for the unknown.</h3>
          <span>Read note ↗</span>
        </Link>
      </section>
      <section className="perspective section" id="outside" tabIndex={-1}>
        <SectionLabel number="03">THE PERSON BEHIND THE SYSTEMS</SectionLabel>
        <div className="perspective-grid">
          <h2>
            Curiosity doesn’t
            <br />
            clock <em>out.</em>
          </h2>
          <div>
            <p className="large-copy">
              A trail changes your perspective. Sailing makes you pay attention. Photography makes
              you look again.
            </p>
            <p>
              I want to bring that same care to software: understand the terrain, make a clear
              decision, and leave things better than I found them.
            </p>
            <Link href="/about" className="text-link">
              A little more about me ↗
            </Link>
          </div>
        </div>
        <div className="hobby-strip">
          <span>01 / BOOTS ON THE GROUND</span>
          <span>02 / EYES ON THE HORIZON</span>
          <span>03 / ONE MORE FRAME</span>
        </div>
        <WindStudy />
      </section>
      <section className="contact-band" id="make-contact" tabIndex={-1}>
        <span className="eyebrow">THE NEXT GOOD THING STARTS WITH A CONVERSATION.</span>
        <Link href="/contact">
          Let’s build
          <br />
          <em>something that matters.</em>
          <span aria-hidden>↗</span>
        </Link>
        <div className="contact-band-bottom">
          <span>ENGINEERING · ARCHITECTURE · A SHARED SENSE OF CURIOSITY</span>
          <span>END OF PAGE. START OF SOMETHING.</span>
        </div>
      </section>
    </main>
  );
}
