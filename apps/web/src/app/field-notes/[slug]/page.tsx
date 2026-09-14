import Link from 'next/link';
import { notFound } from 'next/navigation';
import { notes } from '@/components/notes';
export function generateStaticParams() {
  return notes.map((n) => ({ slug: n.slug }));
}
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = notes.find((n) => n.slug === slug);
  return { title: n?.title ?? 'Note not found', description: n?.subtitle };
}
export default async function Note({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = notes.find((n) => n.slug === slug);
  if (!note) notFound();
  return (
    <main id="main">
      <article className="article-page">
        <Link className="breadcrumb" href="/field-notes">
          ← Back to the notebook
        </Link>
        <div className="eyebrow">
          FIELD NOTE {note.number} / {note.category}
        </div>
        <h1>{note.title}</h1>
        <p className="article-deck">{note.subtitle}</p>
        <div className="article-byline">
          BY KRISTIAN SALMERON <span>THINKING IN THE OPEN</span>
        </div>
        {note.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))}
        <div className="article-end">
          <span>END OF NOTE / {note.number}</span>
          <Link className="text-link" href="/work/care-iq">
            Explore the working example ↗
          </Link>
        </div>
      </article>
    </main>
  );
}
