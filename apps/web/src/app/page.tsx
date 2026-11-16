import Link from 'next/link';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'Thoughtful interfaces. Reliable systems.',
  'Lead Software Engineer Kristian Salmeron. I build products that make complex work feel simple. Explore CareIQ, Toolbox, and frontend experiments.',
  '/',
);

export default function HomePage() {
  return (
    <main id="main" className="editorial-home">
      <section className="editorial-hero" aria-labelledby="home-title">
        <div className="editorial-intro">
          <p className="ip-eyebrow">Lead Software Engineer</p>
          <h1 id="home-title">
            <span>Thoughtful interfaces.</span>
            <span className="ip-accent">Reliable systems.</span>
          </h1>
          <a href="#selected-work" className="ip-text-link hero-work-link">
            View selected work <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="editorial-aside">
          <p>I build products that make complex work feel simple.</p>
          <Link href="/about/" className="ip-button ip-button-outline">
            About me <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
      <section
        id="selected-work"
        className="editorial-work"
        aria-labelledby="selected-work-heading"
      >
        <div className="editorial-section-heading">
          <h2 id="selected-work-heading">Selected work</h2>
          <span aria-hidden="true">01—03</span>
        </div>
        <div className="editorial-projects">
          <Link href="/work/care-iq/" className="editorial-project">
            <span className="project-number" aria-hidden="true">
              01
            </span>
            <h3>CareIQ</h3>
            <p>Front-desk workflows for independent practices.</p>
            <span className="project-status">In development</span>
            <span className="project-arrow" aria-hidden="true">
              →
            </span>
          </Link>
          <a href="https://toolbox.kristiansalmeron.com/" className="editorial-project">
            <span className="project-number" aria-hidden="true">
              02
            </span>
            <h3>Toolbox</h3>
            <p>Practical tools for everyday work.</p>
            <span className="project-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
          <a href="https://lab.kristiansalmeron.com/" className="editorial-project">
            <span className="project-number" aria-hidden="true">
              03
            </span>
            <h3>Lab</h3>
            <p>Experiments in frontend performance and rendering.</p>
            <span className="project-note">Experiments</span>
            <span className="project-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        </div>
      </section>
    </main>
  );
}
