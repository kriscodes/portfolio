export const notes = [
  {
    slug: 'the-boundary-is-the-feature',
    number: '001',
    category: 'ENGINEERING',
    title: 'The boundary is the feature.',
    subtitle: 'Why practice context belongs inside the transaction.',
    sections: [
      {
        heading: 'Identity is the beginning.',
        paragraphs: [
          'An authenticated request tells a system who is asking. In a shared healthcare platform, that is only the first question. The next one is which practice the operation belongs to—and how that answer stays attached to the data access.',
          'Care IQ resolves the active organization to a practice in the API. The frontend can express an intent, but it does not get to choose an arbitrary practice boundary.',
        ],
      },
      {
        heading: 'Context has a lifetime.',
        paragraphs: [
          'A database connection can outlive a request. That makes the lifetime of tenant context an architectural concern, not a small implementation detail.',
          'The current implementation establishes practice context inside the transaction using transaction-local configuration. The operation gets a bounded context. Data access needs to happen inside that same transaction.',
        ],
      },
      {
        heading: 'Relationships need boundaries too.',
        paragraphs: [
          'Scoping a row is not the same thing as scoping a relationship. An appointment points to a patient, and that association should carry the practice boundary as well.',
          'Care IQ includes the practice ID in the appointment-to-patient foreign key. The database constrains the relationship, rather than leaving the entire rule to application code.',
        ],
      },
      {
        heading: 'A safeguard is a starting point.',
        paragraphs: [
          'Row-level security and referential integrity make useful guarantees only within the system that runs them. Roles, permissions, transaction discipline, and negative-path tests still need attention.',
          'The architectural principle is simple: make the important boundary explicit in more than one place, and be precise about what each layer is responsible for.',
        ],
      },
    ],
  },
  {
    slug: 'leave-room-for-the-unknown',
    number: '002',
    category: 'PERSPECTIVE',
    title: 'Leave room for the unknown.',
    subtitle: 'A direction can be clear without pretending the whole route is known.',
    sections: [
      {
        heading: 'Start with a complete path.',
        paragraphs: [
          'A wide list of features can hide a missing connection. A small workflow that reaches from the interface to the database makes the connections visible.',
          'For Care IQ, patients and appointments form that first path. For this portfolio, the first path is a visitor understanding the work, inspecting a decision, and finding a way to start a conversation.',
        ],
      },
      {
        heading: 'Keep the expensive parts deliberate.',
        paragraphs: [
          'A separate API is useful when a clear boundary earns its cost. It also adds deployment and contract work. A database is useful when information needs to change and persist. A static page does not need one simply because the rest of the stack supports it.',
          'This portfolio keeps the Next.js frontend and Express API foundation in one workspace. The reading experience is statically generated; it does not wait on an API to explain the work.',
        ],
      },
      {
        heading: 'Write down the turn you took.',
        paragraphs: [
          'An architecture decision record does not need to be a thesis. State the context, name the decision, describe the cost, and say what would make it worth revisiting.',
          'That leaves the next person with something more useful than a rule: a reason.',
        ],
      },
      {
        heading: 'Keep enough room to notice.',
        paragraphs: [
          'Hiking, sailing, and photography each reward paying attention. That is the quality I want this portfolio to carry: a clear direction, curiosity about the conditions, and enough space to look again.',
          'The next step should be informed by what the current one reveals.',
        ],
      },
    ],
  },
];
