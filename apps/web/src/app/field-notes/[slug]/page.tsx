import Link from 'next/link';
import { notFound } from 'next/navigation';
import { notes } from '@/components/notes';
import { pageMetadata } from '@/lib/metadata';

export function generateStaticParams() {
  return notes.map((note) => ({ slug: note.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = notes.find((item) => item.slug === slug);
  if (!note) notFound();
  return pageMetadata(note.title, note.subtitle, `/field-notes/${note.slug}/`);
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = notes.find((item) => item.slug === slug);
  if (!note) notFound();

  return (
    <main id="main" className="ip-main">
      <article className="ip-article" aria-labelledby="ip-note-title">
        <header className="ip-case-hero">
          <Link className="ip-back" href="/field-notes">
            ← Back to the notebook
          </Link>
          <p className="ip-eyebrow">
            Field note {note.number} / {note.category.toLowerCase()}
          </p>
          <h1 id="ip-note-title">{note.title}</h1>
          <p className="ip-deck">{note.subtitle}</p>
          <p className="ip-small-label">By Kristian Salmeron / Thinking in the open</p>
        </header>
        {note.sections.map((section) => (
          <section key={section.heading} className="ip-margin-section">
            <h2 className="ip-margin-label">{section.heading}</h2>
            <div className="ip-prose">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
        <div className="ip-ending">
          <p className="ip-small-label">End of note / {note.number}</p>
          <Link className="ip-text-link" href="/work/care-iq">
            Explore the working example ↗
          </Link>
        </div>
      </article>
    </main>
  );
}
