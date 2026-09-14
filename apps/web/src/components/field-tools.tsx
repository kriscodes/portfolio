'use client';
import { useRef, useState } from 'react';
const steps = [
  {
    title: 'Establish identity',
    layer: 'CLERK / AUTHENTICATION',
    body: 'The request begins with an authenticated identity and an active organization. Identity answers who is making the request; it does not, by itself, define which patient records are accessible.',
    detail: 'Identity → authenticated user + organization',
    question: 'Where does the practice ID come from?',
    answer:
      'The API resolves the active organization to a practice. It is not selected from an arbitrary practice ID in the request body.',
  },
  {
    title: 'Resolve the practice',
    layer: 'EXPRESS / API BOUNDARY',
    body: 'The API maps the active organization to its practice. That server-resolved practice becomes the context for the operation.',
    detail: 'Organization → server-resolved practice',
    question: 'Why keep this in the API?',
    answer:
      'The same boundary applies to callers of the versioned API. The frontend does not own the data-access decision.',
  },
  {
    title: 'Set transaction context',
    layer: 'POSTGRESQL / TRANSACTION',
    body: 'The database transaction receives the practice ID using transaction-local configuration. Data access runs inside that context.',
    detail: "set_config('app.practice_id', practiceId, true)",
    question: 'Why transaction-local?',
    answer:
      'The context belongs to the operation rather than remaining as session state on a pooled connection. Every tenant-scoped operation must establish it.',
  },
  {
    title: 'Apply the data boundary',
    layer: 'POSTGRESQL / ROW-LEVEL SECURITY',
    body: 'Row-level security policies use the practice context to scope patient and appointment access. Migrations also enable FORCE ROW LEVEL SECURITY for the tenant tables.',
    detail: 'Practice context → policy → scoped rows',
    question: 'Is a policy the whole security story?',
    answer:
      'No. Database roles, correct transaction use, permissions, and negative-path testing still matter. This diagram explains implemented safeguards, not a security certification.',
  },
  {
    title: 'Keep relationships local',
    layer: 'DATABASE / REFERENTIAL INTEGRITY',
    body: 'An appointment links to a patient through a composite foreign key that includes the practice ID. The relationship carries the same practice boundary as the rows.',
    detail: '(practice_id, patient_id) → patient in the same practice',
    question: 'What prevents a cross-practice relationship?',
    answer:
      'The composite foreign key makes the practice part of referential integrity. The relationship is constrained by the database, as well as by application logic.',
  },
];
export function RequestTrace() {
  const [active, setActive] = useState(0);
  const step = steps[active];
  return (
    <div className="request-trace">
      <div className="trace-heading">
        <span>FOLLOW ONE REQUEST</span>
        <span>0{active + 1} / 05</span>
      </div>
      <div className="trace-grid">
        <div className="trace-stops" aria-label="Request stages">
          {steps.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              aria-controls="trace-detail"
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              {s.title}
              <span aria-hidden>↗</span>
            </button>
          ))}
        </div>
        <div className="trace-detail" id="trace-detail" aria-live="polite" aria-atomic="true">
          <span className="eyebrow">{step.layer}</span>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
          <code>{step.detail}</code>
          <details key={active}>
            <summary>{step.question}</summary>
            <p>{step.answer}</p>
          </details>
        </div>
      </div>
      <div className="trace-bottom">
        <span>ILLUSTRATED FROM IMPLEMENTED SOURCE · NO LIVE PATIENT DATA</span>
        <button className="text-link" onClick={() => setActive((active + 1) % steps.length)}>
          {active === 4 ? 'Start again' : 'Next stage'} →
        </button>
      </div>
    </div>
  );
}
const scenes = [
  {
    label: 'On land',
    image: 'instagram-redwoods',
    width: 512,
    height: 640,
    title: 'A little dirt. A different perspective.',
    copy: 'Hiking is a reason to slow down, follow a line, and see what changes around the next bend.',
    source: 'https://www.instagram.com/capt_kris/p/C-LVlWlSs_p/',
    alt: 'A sunlit road winding beneath towering redwoods',
  },
  {
    label: 'At sea',
    image: 'instagram-sailing',
    width: 640,
    height: 482,
    title: 'Eyes on the horizon.',
    copy: 'Sailing asks for attention: to the conditions, to the course, and to the people along for the ride.',
    source: 'https://www.instagram.com/capt_kris/p/C48ZE1Lpljh/',
    alt: 'Two people aboard a sailboat, surrounded by rigging and open water',
  },
  {
    label: 'Through a lens',
    image: 'instagram-city',
    width: 640,
    height: 360,
    title: 'Look. Then look again.',
    copy: 'Photography is a way to notice what would otherwise slip past. Light, texture, and the small things that make a place feel like itself.',
    source: 'https://www.instagram.com/capt_kris/p/DJ5WSxZpN3x/',
    alt: 'An aerial view across city streets, rooftops, and a stadium',
  },
];
export function FieldSwitch() {
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const scene = scenes[active];
  return (
    <div className="field-switch">
      <div className="field-selector" aria-label="Explore my interests">
        {scenes.map((s, i) => (
          <button key={s.label} aria-pressed={active === i} onClick={() => setActive(i)}>
            <span>0{i + 1}</span>
            {s.label}
          </button>
        ))}
      </div>
      <div className="field-content">
        <button
          className="field-image-button"
          onClick={() => dialog.current?.showModal()}
          aria-label={`Enlarge photograph: ${scene.alt}`}
        >
          <img
            src={`/images/${scene.image}.jpg`}
            alt={scene.alt}
            width={scene.width}
            height={scene.height}
            loading="lazy"
          />
          <span>VIEW FRAME ↗</span>
        </button>
        <div className="field-text" aria-live="polite">
          <span className="eyebrow">OFF THE CLOCK / 0{active + 1}</span>
          <h3>{scene.title}</h3>
          <p>{scene.copy}</p>
          <p className="image-disclosure">
            From my Instagram.
            <br />
            <a href={scene.source} target="_blank" rel="noreferrer">
              @capt_kris ↗
            </a>
          </p>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="photo-dialog"
        aria-label="Photograph from my Instagram"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div>
          <button className="dialog-close" onClick={() => dialog.current?.close()} autoFocus>
            Close ×
          </button>
          <img src={`/images/${scene.image}.jpg`} alt={scene.alt} />
          <p>
            From my Instagram ·{' '}
            <a href={scene.source} target="_blank" rel="noreferrer">
              @capt_kris ↗
            </a>
          </p>
        </div>
      </dialog>
    </div>
  );
}
export function ContactCard() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  async function copyAddress() {
    try {
      await navigator.clipboard.writeText('https://kristiansalmeron.com');
      setCopied(true);
      setError(false);
    } catch {
      setError(true);
    }
  }
  return (
    <div className="contact-card">
      <span className="eyebrow">A GOOD PLACE TO START</span>
      <h2>
        Have a system
        <br />
        worth <em>thinking through?</em>
      </h2>
      <p>
        Tell me what you’re building, where the hard part is, and what kind of engineering
        leadership would help.
      </p>
      <a
        className="button primary"
        href="https://www.linkedin.com/in/kristian-salmeron-46295664"
        target="_blank"
        rel="noreferrer"
      >
        Connect on LinkedIn ↗
      </a>
      <div className="contact-copy">
        <button className="text-link" onClick={copyAddress}>
          {copied ? 'Website address copied ✓' : 'Copy website address'}
        </button>
        <span role="status">
          {error
            ? 'kristiansalmeron.com — select and copy this address.'
            : copied
              ? 'Ready to share.'
              : ''}
        </span>
      </div>
    </div>
  );
}
