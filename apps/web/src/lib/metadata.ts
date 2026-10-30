import type { Metadata } from 'next';

export const siteUrl = 'https://kristiansalmeron.com';
export const siteName = 'Kristian Salmeron';

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title: { absolute: `${title} — ${siteName}` },
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} — ${siteName}`,
      description,
      url: path,
      siteName,
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: '/social-preview.png',
          width: 1200,
          height: 630,
          alt: 'Kristian Salmeron — Making things work.',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — ${siteName}`,
      description,
      images: ['/social-preview.png'],
    },
  };
}
