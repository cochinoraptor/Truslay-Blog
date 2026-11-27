import React from 'react';
import Head from '@docusaurus/Head';

interface BlogPostingSchemaProps {
  headline: string;
  description: string;
  /** ISO 8601 date, e.g. 2026-11-18T09:00:00.000Z */
  datePublished: string;
  /** Post slug without leading slash, e.g. deterministic-verdicts-not-probability */
  slug: string;
  keywords: readonly string[];
}

/**
 * Per-article BlogPosting structured data.
 *
 * Docusaurus emits OpenGraph and Twitter tags for blog posts, but no JSON-LD,
 * and answer engines lean on schema.org to decide what a page is about. Import
 * this component in a post and give it the post's own frontmatter values:
 *
 *   import BlogPostingSchema from '@site/src/components/BlogPostingSchema';
 *   <BlogPostingSchema headline="..." description="..." datePublished="..."
 *     slug="..." keywords={[...]} />
 */
export default function BlogPostingSchema({
  headline,
  description,
  datePublished,
  slug,
  keywords,
}: BlogPostingSchemaProps): React.ReactElement {
  const url = `https://blog.truslay.com/${slug.replace(/^\//, '')}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    description,
    url,
    mainEntityOfPage: {'@type': 'WebPage', '@id': url},
    datePublished,
    dateModified: datePublished,
    inLanguage: 'en',
    keywords: keywords.join(', '),
    image: 'https://blog.truslay.com/img/logo.svg',
    author: {
      '@type': 'Organization',
      name: 'Truslay Engineering',
      url: 'https://truslay.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Truslay',
      url: 'https://truslay.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://blog.truslay.com/img/logo.svg',
      },
    },
  };

  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Head>
  );
}
