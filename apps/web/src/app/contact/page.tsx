import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'Let’s talk',
  'Connect with Kristian Salmeron about engineering, architecture, and the next worthwhile problem.',
  '/contact/',
);

export default function ContactPage() {
  return (
    <main id="main" className="ip-main">
      <section aria-labelledby="ip-contact-title">
        <div className="ip-contact-hero">
          <div>
            <p className="ip-eyebrow">A good place to start</p>
            <h1 id="ip-contact-title">
              Have an
              <br /> interesting
              <br /> <span className="ip-accent">question?</span>
            </h1>
          </div>
          <div className="ip-contact-copy">
            <p>
              Tell me what you’re building, where the hard part is, and what kind of engineering
              leadership would help.
            </p>
            <a
              className="ip-contact-action"
              href="https://www.linkedin.com/in/kristian-salmeron-46295664"
              target="_blank"
              rel="noopener"
            >
              Connect on LinkedIn <span aria-hidden="true">↗</span>
            </a>
            <p className="ip-contact-note">
              The work matters.
              <br /> So does how we work together.
            </p>
          </div>
        </div>
        <section className="ip-margin-section ip-contact-secondary">
          <h2 className="ip-margin-label">Beyond the work</h2>
          <div>
            <p className="ip-body">Hiking, sailing, and seeing things a little differently.</p>
            <a
              className="ip-text-link"
              href="https://www.instagram.com/capt_kris/"
              target="_blank"
              rel="noopener"
            >
              Instagram / @capt_kris ↗
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}
