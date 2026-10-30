import type { MetadataRoute } from 'next';
import { notes } from '@/components/notes';
import { siteUrl } from '@/lib/metadata';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    '/',
    '/work/',
    '/work/gen-ui/',
    '/work/care-iq/',
    '/about/',
    '/contact/',
    '/field-notes/',
    ...notes.map((note) => `/field-notes/${note.slug}/`),
  ].map((path) => ({
    url: `${siteUrl}${path}`,
  }));
}
