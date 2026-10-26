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
    name: 'NLP Gen UI',
    status: 'case-study',
    summary:
      'Re-architected PDF delivery and initial rendering for a shared medical coding capability at Highmark Health.',
    technologies: ['Apryse', 'Progressive PDF delivery', 'Application architecture'],
  },
  {
    slug: 'corner-studio',
    name: 'Corner Studio',
    status: 'design-v1',
    summary:
      'An interactive 3D portfolio studio with two themes, project demonstrations, and accessible case-study pages.',
    technologies: ['Next.js', 'React', 'TypeScript', 'Three.js', 'React Three Fiber', 'Drei'],
  },
];
