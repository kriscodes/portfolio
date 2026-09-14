import Link from 'next/link';
import { SectionLabel } from '@/components/chrome';
import { LeadershipEvidence } from '@/components/career';
import { FieldSwitch } from '@/components/field-tools';
export const metadata = {
  title: 'About — A little more perspective',
  description:
    'Engineering, architecture, hiking, sailing, and photography. The perspective behind Kristian Salmeron’s work.',
};
export default function About() {
  return (
    <main id="main">
      <section className="page-intro">
        <SectionLabel number="02">THE PERSON BEHIND THE SYSTEMS</SectionLabel>
        <h1>
          Built with care.
          <br />
          Best with <em>mud.</em>
        </h1>
        <p>
          I’m Kristian Salmeron. Software is how I make ideas useful. Hiking, sailing, and
          photography keep me curious about everything beyond the screen.
        </p>
      </section>
      <LeadershipEvidence />
      <section className="section about-principles">
        <div>
          <span className="eyebrow">HOW I WANT TO WORK</span>
          <h2>
            Clear direction.
            <br />
            <em>Room to explore.</em>
          </h2>
        </div>
        <div className="principles-list">
          <div>
            <span>01</span>
            <h3>Understand the terrain.</h3>
            <p>
              Start with the people, the constraints, and the real problem. A clear model is worth
              more than an early pile of features.
            </p>
          </div>
          <div>
            <span>02</span>
            <h3>Make the reasoning visible.</h3>
            <p>
              Write down why. Name the cost of a decision, so the next person can understand it—and
              change it when the conditions change.
            </p>
          </div>
          <div>
            <span>03</span>
            <h3>Care about the whole journey.</h3>
            <p>
              The interface, the API, the data model, and the way a team works all shape the final
              experience.
            </p>
          </div>
        </div>
      </section>
      <section className="section outside-section">
        <SectionLabel number="03">SOMEWHERE OUTSIDE</SectionLabel>
        <h2>
          Same curiosity.
          <br />
          <em>Different terrain.</em>
        </h2>
        <FieldSwitch />
        <a
          className="text-link instagram-link"
          href="https://www.instagram.com/capt_kris"
          target="_blank"
          rel="noreferrer"
        >
          Find the personal side at @capt_kris ↗
        </a>
      </section>
      <section className="small-cta">
        <p>Want to see how that perspective shows up in software?</p>
        <Link className="text-link" href="/work/care-iq">
          Explore the Care IQ field report ↗
        </Link>
      </section>
    </main>
  );
}
