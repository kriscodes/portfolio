export type HealthResponse = { status: 'ok'; service: 'portfolio-api'; version: 'v1' };
export type Project = {
  slug: string;
  name: string;
  status: 'active-development' | 'design-v1' | 'case-study';
  summary: string;
  technologies: readonly string[];
};
export const projects: readonly Project[] = [
  {
    slug: 'care-iq',
    name: 'Care IQ',
    status: 'active-development',
    summary:
      'Patient and appointment workflows with practice context and database-enforced tenant boundaries.',
    technologies: ['Next.js', 'React', 'Express', 'PostgreSQL', 'Drizzle', 'Clerk'],
  },
  {
    slug: 'gen-ui',
    name: 'Medical document viewer',
    status: 'case-study',
    summary:
      'Re-architected PDF delivery and initial rendering for a shared medical coding capability at Highmark Health.',
    technologies: ['Apryse', 'Progressive PDF delivery', 'Application architecture'],
  },
  {
    slug: 'portfolio',
    name: 'Portfolio',
    status: 'design-v1',
    summary:
      'A statically exported engineering portfolio with architecture case studies, field notes, and an interactive sail study.',
    technologies: ['Next.js', 'React', 'TypeScript', 'SVG'],
  },
];
