'use client';

import { Fragment, useId, useState } from 'react';

const genSteps = [
  {
    name: 'Prepare',
    title: 'Prepare for progressive access.',
    copy: 'Linearize the PDFs so the viewer can begin working with the document progressively.',
  },
  {
    name: 'Deliver',
    title: 'Deliver in chunks.',
    copy: 'Deliver the document progressively, supporting an earlier initial render.',
  },
  {
    name: 'Render',
    title: 'Separate the rendering path.',
    copy: 'Decouple document rendering from application data APIs, giving the document workflow its own delivery path.',
  },
];

export function GenUiStages() {
  const [selected, setSelected] = useState(0);
  const detailId = useId();
  const stage = genSteps[selected];

  return (
    <>
      <div className="ip-flow" role="group" aria-label="Document delivery stages">
        {genSteps.map((item, index) => (
          <Fragment key={item.name}>
            {index > 0 && (
              <span className="ip-flow-arrow" aria-hidden="true">
                →
              </span>
            )}
            <button
              type="button"
              data-gen-step={index}
              aria-pressed={selected === index}
              aria-controls={detailId}
              onClick={() => setSelected(index)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {item.name}
            </button>
          </Fragment>
        ))}
      </div>
      <div className="ip-step-detail" id={detailId} aria-live="polite" aria-atomic="true">
        <h4>{stage.title}</h4>
        <p>{stage.copy}</p>
      </div>
      <noscript>
        <ol className="ip-nojs-stages" aria-label="All document delivery stages">
          {genSteps.map((item) => (
            <li key={item.name}>
              <h4>{item.title}</h4>
              <p>{item.copy}</p>
            </li>
          ))}
        </ol>
      </noscript>
    </>
  );
}

const careSteps = [
  {
    name: 'Identity',
    label: 'Clerk / Authentication',
    title: 'Establish identity.',
    copy: 'The request begins with an authenticated identity and an active organization. Identity answers who is making the request.',
  },
  {
    name: 'Practice',
    label: 'API / Practice resolution',
    title: 'Resolve the practice.',
    copy: 'Carry the active organization into the API and resolve the practice context for the request.',
  },
  {
    name: 'Transaction',
    label: 'Database / Transaction context',
    title: 'Set the context locally.',
    copy: 'Set practice context inside the transaction so the data boundary follows the current request.',
  },
  {
    name: 'Boundary',
    label: 'PostgreSQL / Row-level security',
    title: 'Apply the data boundary.',
    copy: 'Use database policies to scope access to the active practice.',
  },
  {
    name: 'Relationships',
    label: 'Schema / Relationships',
    title: 'Keep relationships local.',
    copy: 'Include the practice in patient–appointment relationships so related records stay within the same practice.',
  },
];

export function CareIqStages() {
  const [selected, setSelected] = useState(0);
  const detailId = useId();
  const stage = careSteps[selected];

  return (
    <>
      <div className="ip-request" role="group" aria-label="Practice context stages">
        {careSteps.map((item, index) => (
          <button
            key={item.name}
            type="button"
            data-care-step={index}
            aria-pressed={selected === index}
            aria-controls={detailId}
            onClick={() => setSelected(index)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span> {item.name}
          </button>
        ))}
      </div>
      <div className="ip-step-detail" id={detailId} aria-live="polite" aria-atomic="true">
        <p className="ip-small-label">{stage.label}</p>
        <h4>{stage.title}</h4>
        <p>{stage.copy}</p>
      </div>
      <noscript>
        <ol className="ip-nojs-stages" aria-label="All practice context stages">
          {careSteps.map((item) => (
            <li key={item.name}>
              <p className="ip-small-label">{item.label}</p>
              <h4>{item.title}</h4>
              <p>{item.copy}</p>
            </li>
          ))}
        </ol>
      </noscript>
    </>
  );
}

const interests = [
  {
    name: 'On land',
    title: 'A different\nperspective.',
    copy: 'Hiking is a reason to slow down, follow a line, and see what changes around the next bend.',
  },
  {
    name: 'At sea',
    title: 'A little room\nto explore.',
    copy: 'Sailing is one of the ways I follow my curiosity beyond the screen.',
  },
  {
    name: 'Through a lens',
    title: 'Look a little\ncloser.',
    copy: 'Photography is another way I explore ideas and keep a sense of perspective.',
  },
];

export function PersonalInterests() {
  const [selected, setSelected] = useState(0);
  const detailId = useId();
  const interest = interests[selected];

  return (
    <>
      <div className="ip-interests" role="group" aria-label="Personal interests">
        {interests.map((item, index) => (
          <button
            key={item.name}
            type="button"
            data-interest={index}
            aria-pressed={selected === index}
            aria-controls={detailId}
            onClick={() => setSelected(index)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="ip-interest-detail" id={detailId} aria-live="polite" aria-atomic="true">
        <span className="ip-interest-word" style={{ whiteSpace: 'pre-line' }}>
          {interest.title}
        </span>
        <p>{interest.copy}</p>
      </div>
      <noscript>
        <ul className="ip-nojs-stages" aria-label="All personal interests">
          {interests.map((item) => (
            <li key={item.name}>
              <h4>{item.name}</h4>
              <p>{item.copy}</p>
            </li>
          ))}
        </ul>
      </noscript>
    </>
  );
}
