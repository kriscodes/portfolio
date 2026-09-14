import { SectionLabel } from '@/components/chrome';
import { ContactCard } from '@/components/field-tools';
export const metadata = {
  title: 'Let’s talk',
  description:
    'Connect with Kristian Salmeron about engineering, architecture, and the next worthwhile problem.',
};
export default function Contact() {
  return (
    <main id="main">
      <section className="page-intro contact-intro">
        <SectionLabel number="04">MAKE CONTACT</SectionLabel>
        <h1>
          A new heading.
          <br />A good <em>conversation.</em>
        </h1>
      </section>
      <section className="section contact-layout">
        <ContactCard />
        <aside className="contact-aside">
          <span className="contact-asterisk" aria-hidden>
            ✳
          </span>
          <p className="handwritten">
            The next adventure
            <br />
            could start right here.
          </p>
          <div>
            <span className="eyebrow">OFF THE CLOCK</span>
            <a
              className="text-link"
              href="https://www.instagram.com/capt_kris"
              target="_blank"
              rel="noreferrer"
            >
              Instagram / @capt_kris ↗
            </a>
          </div>
        </aside>
      </section>
    </main>
  );
}
