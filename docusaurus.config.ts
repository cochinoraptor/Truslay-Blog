import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const SITE_URL = 'https://blog.truslay.com';
const DESCRIPTION =
  'Field notes from Truslay on deterministic, fail-closed security for AI agents: policy graphs, signed verdicts, immutable audit, on-premise deployment.';

const config: Config = {
  title: 'Truslay Blog',
  tagline: 'Sovereign Trust Layer for AI Agents',

  favicon: 'img/favicon.svg',

  // Production origin. The blog is served from the root by Nginx (Dokploy).
  url: SITE_URL,
  baseUrl: '/',

  organizationName: 'cochinoraptor',
  projectName: 'Truslay-Blog',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'warn',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        // The blog is the whole site: no docs plugin, blog mounted at "/".
        docs: false,
        blog: {
          routeBasePath: '/',
          path: 'blog',
          blogTitle: 'Truslay Blog',
          blogDescription: DESCRIPTION,
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 0,
          postsPerPage: 8,
          showReadingTime: true,
          onInlineAuthors: 'ignore',
          onUntruncatedBlogPosts: 'ignore',
          editUrl: 'https://github.com/cochinoraptor/Truslay-Blog/tree/main/',
          feedOptions: {
            type: ['rss', 'atom'],
            title: 'Truslay Blog',
            description: DESCRIPTION,
            copyright: `© ${new Date().getFullYear()} Truslay`,
            language: 'en',
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        // The sitemap is configured explicitly as a plugin below.
        sitemap: false,
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-sitemap',
      {
        filename: 'sitemap.xml',
        changefreq: 'weekly',
        priority: 0.8,
        // No git dependency: the Docker build context has no .git.
        lastmod: null,
        ignorePatterns: ['/tags/**', '/page/**', '/archive'],
      },
    ],
  ],

  themeConfig: {
    metadata: [
      {
        name: 'description',
        content: DESCRIPTION,
      },
      {
        name: 'keywords',
        content:
          'Truslay blog, AI agent security, deterministic guardrails, fail-closed, policy graph, sovereign AI, on-premise AI, agent audit trail, AI agent firewall',
      },
      {property: 'og:type', content: 'website'},
      {property: 'og:site_name', content: 'Truslay Blog'},
      {name: 'twitter:card', content: 'summary'},
    ],
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Truslay Blog',
      logo: {
        alt: 'Truslay',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/',
          position: 'left',
          label: 'Articles',
          activeBaseRegex: '^/(?!tags)',
        },
        {
          href: 'https://docs.truslay.com',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://truslay.com',
          label: 'truslay.com',
          position: 'right',
        },
        {
          href: 'https://academy.truslay.com',
          label: 'Academy',
          position: 'right',
        },
        {
          href: 'https://github.com/cochinoraptor/Truslay-SDK',
          label: 'SDK',
          position: 'right',
        },
        {
          href: 'https://github.com/cochinoraptor/Truslay-Blog',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'Truslay Blog on GitHub',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Read',
          items: [
            {label: 'All articles', to: '/'},
            {label: 'RSS feed', href: `${SITE_URL}/rss.xml`},
            {label: 'Architecture', to: '/eight-layers-without-the-marketing'},
          ],
        },
        {
          title: 'Documentation',
          items: [
            {
              label: 'Quick start',
              href: 'https://docs.truslay.com/docs/introduction/quick-start',
            },
            {
              label: 'SDK methods',
              href: 'https://docs.truslay.com/docs/api-reference/sdk-methods',
            },
            {
              label: 'Verdicts',
              href: 'https://docs.truslay.com/docs/api-reference/verdicts',
            },
          ],
        },
        {
          title: 'Trust',
          items: [
            {
              label: 'Security audit (in progress)',
              href: 'https://docs.truslay.com/docs/security/hackenproof-audit',
            },
            {
              label: 'On-premise deployment',
              href: 'https://docs.truslay.com/docs/security/on-premise-deployment',
            },
            {
              label: 'SDK repository',
              href: 'https://github.com/cochinoraptor/Truslay-SDK',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Truslay. Not affiliated with Trustly or TrustLayer.`,
    },
    prism: {
      theme: prismThemes.dracula,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'diff'],
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 3,
    },
  } satisfies Preset.ThemeConfig,

  // Structured data for search engines and answer engines (GEO).
  headTags: [
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Truslay',
        url: 'https://truslay.com',
        logo: `${SITE_URL}/img/logo.svg`,
        sameAs: [
          'https://github.com/cochinoraptor/Truslay-SDK',
          'https://docs.truslay.com',
          'https://academy.truslay.com',
        ],
        description:
          'Local-first, 8-layer deterministic security pipeline for autonomous AI agents. Decisions are fail-closed, signed, and anchored for immutable audit.',
      }),
    },
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Blog',
        '@id': `${SITE_URL}/`,
        name: 'Truslay Blog',
        url: SITE_URL,
        inLanguage: 'en',
        description: DESCRIPTION,
        publisher: {'@type': 'Organization', name: 'Truslay', url: 'https://truslay.com'},
      }),
    },
  ],
};

export default config;
