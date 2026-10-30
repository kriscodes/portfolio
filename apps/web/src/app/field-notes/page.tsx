import Link from 'next/link';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'Field notes',
  'Notes on architecture, boundaries, judgment, and leaving room for the unknown.',
  '/field-notes/',
);

export default function FieldNotesPage() {
  return (
    <main id="main" className="ip-main">
      <section aria-labelledby="ip-notes-title">
        <div className="ip-hero">
          <p className="ip-eyebrow">The open notebook</p>
          <h1 id="ip-notes-title">
            Notes from
            <br /> the <span className="ip-accent">field.</span>
          </h1>
          <p className="ip-deck">
            On building software, making decisions,
            <br /> and keeping a sense of perspective.
          </p>
        </div>
        <div className="ip-notes-list">
          <Link href="/field-notes/the-boundary-is-the-feature" className="ip-note">
            <span className="ip-note-number">001</span>
            <span>
              <span className="ip-small-label">Engineering</span>
              <h2>
                The boundary
                <br /> is the feature.
              </h2>
              <p>Why practice context belongs inside the transaction.</p>
            </span>
            <span className="ip-note-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
          <Link href="/field-notes/leave-room-for-the-unknown" className="ip-note">
            <span className="ip-note-number">002</span>
            <span>
              <span className="ip-small-label">Perspective</span>
              <h2>
                Leave room
                <br /> for the unknown.
              </h2>
              <p>A direction can be clear without pretending the whole route is known.</p>
            </span>
            <span className="ip-note-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        </div>
        <div className="ip-ending">
          <p>Interesting questions tend to lead somewhere.</p>
          <Link href="/contact">Start a conversation ↗</Link>
        </div>
      </section>
    </main>
  );
}
