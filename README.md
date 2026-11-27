# Truslay Blog

Source of [blog.truslay.com](https://blog.truslay.com) — field notes from the
Truslay team on deterministic, fail-closed security for autonomous AI agents.

Docusaurus 3.10.2 + TypeScript. Same dependency set as `Truslay-Docs`. The blog
plugin is mounted at `/`, so the article list is the site root; there is no docs
plugin here.

## Local development

```bash
npm install
npm start          # http://127.0.0.1:3000
npm run build      # static output in ./build
npm run serve      # serve ./build locally
npm run typecheck  # tsc --noEmit
```

Node 20 or newer.

## Structure

```
blog/
  authors.yml                  # author entities (one: Truslay Engineering)
  tags.yml                     # tag taxonomy and descriptions
  2026-11-18-*.md              # posts, newest first by date
src/
  components/BlogPostingSchema.tsx   # per-article BlogPosting JSON-LD
  css/custom.css                     # brand tokens, reading typography
static/
  img/logo.svg, img/favicon.svg
  robots.txt, llms.txt               # crawler and answer-engine hints
docusaurus.config.ts           # site, blog, sitemap, structured data
Dockerfile, nginx.conf         # production image for Dokploy
```

## Writing a post

Frontmatter fields used here:

```yaml
---
title: 'Sentence case title'
description: 'One sentence, under 160 characters, used for search and social.'
slug: kebab-case-slug
date: 2026-11-18T09:00:00.000Z
authors: [truslay]
tags: [architecture, security]
keywords: [three to five real search phrases]
---
```

Two editorial rules that matter more than the metadata:

1. **Every post carries its own `BlogPostingSchema`.** Import
   `@site/src/components/BlogPostingSchema` and pass the same values as the
   frontmatter, so search and answer engines get `datePublished`, author and
   canonical URL per article.
2. **Write like a person who was in the room.** Concrete numbers, real
   trade-offs, at least one thing the product does not do well. No vendor
   adjectives, no "in today's rapidly evolving landscape".

Insert `<!-- truncate -->` after the opening paragraph so the list page shows a
summary instead of the full text.

## Docker

```bash
docker build -t truslay-blog .
docker run --rm -p 8080:80 truslay-blog
```

Multi-stage: `node:20-alpine` builds the static site, `nginx:alpine` serves it
with gzip, immutable caching for `/assets`, a short cache for feeds, and a
`404.html` fallback.

## Deploy on Dokploy

1. Create an **Application** pointing at `github.com/cochinoraptor/Truslay-Blog`.
2. Build type **Dockerfile**, Dockerfile path `Dockerfile`.
3. Container port **80**. Health check path `/`.
4. Domain `blog.truslay.com`, HTTPS via Let's Encrypt.
5. Enable the webhook so pushes to `main` redeploy.

The build has no git dependency (`sitemap.lastmod` is `null`), so it works from
a plain Docker build context without `.git`.
