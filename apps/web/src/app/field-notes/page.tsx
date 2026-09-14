import Link from 'next/link';
import { SectionLabel } from '@/components/chrome';
import { notes } from '@/components/notes';
export const metadata = {
  title: 'Field notes',
  description: 'Notes on architecture, boundaries, judgment, and leaving room for the unknown.',
};
export default function Notes() {
  return (
    <main id="main">
      <section className="page-intro">
        <SectionLabel number="03">THE OPEN NOTEBOOK</SectionLabel>
        <h1>
          Observations
          <br />
          from the <em>field.</em>
        </h1>
        <p>
          Notes on building software, making decisions, and keeping a sense of perspective along the
          way.
        </p>
      </section>
      <section className="section notebook-list">
        {notes.map((note) => (
          <Link key={note.slug} className="notebook-entry" href={`/field-notes/${note.slug}`}>
            <div className="notebook-number">
              {note.number}
              <span>FIELD NOTE</span>
            </div>
            <div>
              <span className="eyebrow">{note.category}</span>
              <h2>{note.title}</h2>
              <p>{note.subtitle}</p>
              <span className="text-link">Read the note ↗</span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
