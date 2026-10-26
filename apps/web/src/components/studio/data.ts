export interface AboutPage {
  eyebrow: string;
  title: string;
  body: string;
  proof: string;
  proofLabel: string;
}
export interface AboutSection {
  title: string;
  kind: string;
  eyebrow: string;
  accent: string;
  subtitle: string;
  pages: AboutPage[];
}
export interface StudioProject {
  id: string;
  title: string;
  category: string;
  summary: string;
  stack: string[];
  status: string;
  repo: string | null;
}

export const KRISTIAN_ABOUT: Record<string, AboutSection> = {
  story: {
    title: 'Background',
    kind: 'book',
    eyebrow: 'KRISTIAN SALMERON',
    accent: '#dfae75',
    subtitle: '12+ years. Still curious.',
    pages: [
      {
        eyebrow: 'SOFTWARE / ARCHITECTURE / LEADERSHIP',
        title: 'A builder, still curious.',
        body: 'I’m Kristian, a software engineer and technical leader. Across 12+ years, my work has moved between interfaces, architecture, and delivery—making complex systems easier for people to use and teams to build.',
        proof: '12+',
        proofLabel: 'years in software',
      },
      {
        eyebrow: 'STAYING CLOSE TO THE WORK',
        title: 'From the big picture to the code.',
        body: 'I like connecting the big picture to the implementation: understanding the constraint, making the decision clear, and following it through the interface, API, and data model.',
        proof: 'Think. Build. Connect.',
        proofLabel: 'Architecture and hands-on engineering',
      },
    ],
  },
  experience: {
    title: 'Experience',
    kind: 'folder',
    eyebrow: 'PROJECTS / PEOPLE / OUTCOMES',
    accent: '#89e1d7',
    subtitle: 'The work behind the story.',
    pages: [
      {
        eyebrow: 'HIGHMARK HEALTH',
        title: 'Engineering at scale.',
        body: 'As Lead Software Engineer, Advanced Analytics at Highmark Health, my work spans architecture, technical delivery, and shared engineering foundations for healthcare applications.',
        proof: 'Highmark Health',
        proofLabel: 'Lead Software Engineer, Advanced Analytics',
      },
      {
        eyebrow: 'HIGHMARK HEALTH / NLP GEN UI',
        title: 'Make the wait smaller.',
        body: 'I redesigned PDF delivery and rendering for medical coding workflows. Progressive delivery, linearized documents, and a shared rendering capability brought the initial render time down.',
        proof: '~15 min → <5 sec',
        proofLabel: 'Initial PDF rendering · 1,500+ coders · 5 apps',
      },
      {
        eyebrow: 'HIGHMARK HEALTH / ONE CLAIMHUB',
        title: 'Connect the systems.',
        body: 'I architected a shared foundation for claims workflows across eight applications and more than ten teams, working with engineers on the data model, database schema, and API structure.',
        proof: '8',
        proofLabel: 'applications · more than 10 teams',
      },
      {
        eyebrow: 'HIGHMARK HEALTH / TECHNICAL DELIVERY',
        title: 'Make room for teams.',
        body: 'I led technical delivery across five concurrent healthcare initiatives, coordinating about 25 contributors across disciplines. Frontend standards and documentation made architecture, authentication, and development practices easier to share.',
        proof: '5',
        proofLabel: 'concurrent initiatives · ~25 contributors',
      },
      {
        eyebrow: 'CROSSCOMM / FRONTEND ENGINEERING',
        title: 'Lead closely. Keep building.',
        body: 'At CrossComm, I led and mentored three frontend engineers through code reviews, one-on-ones, estimation, and planning, while staying approximately 80% hands-on.',
        proof: '~80%',
        proofLabel: 'hands-on · mentoring 3 frontend engineers',
      },
    ],
  },
  approach: {
    title: 'How I work',
    kind: 'blueprint',
    eyebrow: 'PROCESS / PRACTICE',
    accent: '#bfa3ed',
    subtitle: 'How the pieces fit together.',
    pages: [
      {
        eyebrow: '01 / UNDERSTAND THE PROBLEM',
        title: 'Start with the constraint.',
        body: 'I start with the people using a system and what is slowing them down. The Gen UI work began with coders waiting for documents, then focused on the delivery-to-first-render path.',
        proof: 'People → problem → path',
        proofLabel: 'Before choosing features or tools',
      },
      {
        eyebrow: '02 / MAKE THE REASONING VISIBLE',
        title: 'Leave a clear decision trail.',
        body: 'I document the context, decision, costs, and what would make us revisit a choice. Standards, architecture notes, and concise decision records give a team something shared to work from.',
        proof: 'Context. Decision. Tradeoff.',
        proofLabel: 'A shared understanding the team can revisit',
      },
      {
        eyebrow: '03 / CARE ABOUT THE WHOLE JOURNEY',
        title: 'Follow the complete path.',
        body: 'I think about interfaces, APIs, data models, and team practices together. A complete workflow reveals more than isolated features, especially when the boundaries need to hold across an entire system.',
        proof: 'Interface → API → data',
        proofLabel: 'One complete workflow, end to end',
      },
    ],
  },
};
export const KRISTIAN_PROJECTS: StudioProject[] = [
  {
    id: 'careiq',
    title: 'CareIQ',
    category: 'Practice operations',
    summary: 'Intake, scheduling, and referral workflows for independent medical practices.',
    stack: ['TypeScript', 'Next.js', 'PostgreSQL'],
    status: 'In development · Demo data',
    repo: 'https://github.com/kriscodes/careiq',
  },
  {
    id: 'neon-drift',
    title: 'Neon Drift',
    category: 'Interactive experiment',
    summary:
      'A playground of light trails. Stir the current, bend an orbit, and find a different color.',
    stack: ['Canvas', 'Creative coding'],
    status: 'Prototype',
    repo: null,
  },
];
