/**
 * JSON-LD helpers for juicetopia.
 *
 * Every public page emits a `@graph`-shaped document so multiple entities
 * on one page (e.g. a chapter plus its breadcrumb) share nodes via @id.
 * Helpers below build the individual nodes; callers compose them into an
 * array and stringify for <script type="application/ld+json">.
 *
 * Schema vocabulary:
 *   - Site root → WebSite + Organization/Person (site-wide, in BaseLayout)
 *   - Novel chapter → Article
 *   - Character → Person + FictionalCharacter
 *   - Mondo (world note) → DefinedTerm in MONDO-DI NOTA
 *   - Lexicon → DefinedTermSet containing many DefinedTerm
 *   - Cronika entry → BlogPosting
 * Plus: BreadcrumbList for any detail page.
 */

export const PUBLISHER_ID = '#publisher';
export const WEBSITE_ID = '#website';
export const SITE_NAME = 'juicetopia';
export const SITE_DESCRIPTION =
  'juicetopia — pana-di leyda-mono & montra-mesa. 小説とビジュアルを公開する小さなアーカイブ。';
export const PUBLISHER_NAME = 'scrovolakka';
export const PUBLISHER_URL = 'https://github.com/scrovolakka';

type JsonLdNode = Record<string, unknown>;

/**
 * Absolute URL, given a path (which may or may not include the base) and the
 * configured Astro.site origin. Falls back to the input if site is undefined.
 */
export function absoluteUrl(pathOrUrl: string, site: URL | undefined): string {
  if (!site) return pathOrUrl;
  try {
    return new URL(pathOrUrl, site).toString();
  } catch {
    return pathOrUrl;
  }
}

/** Site-wide publisher (the author/operator behind juicetopia). */
export function buildPublisherNode(siteOrigin: string): JsonLdNode {
  return {
    '@type': ['Organization', 'Person'],
    '@id': `${siteOrigin}${PUBLISHER_ID}`,
    name: PUBLISHER_NAME,
    url: PUBLISHER_URL,
  };
}

/** Site root. Include once per page via BaseLayout. */
export function buildWebSiteNode(siteOrigin: string, siteUrl: string): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': `${siteOrigin}${WEBSITE_ID}`,
    url: siteUrl,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: 'ja',
    publisher: { '@id': `${siteOrigin}${PUBLISHER_ID}` },
  };
}

export interface ArticleInput {
  url: string;              // canonical URL (absolute)
  headline: string;
  description?: string;
  datePublished: string;    // ISO date
  articleSection?: string;  // series name
  imageUrl?: string;        // absolute
  siteOrigin: string;       // for publisher / website @id refs
}

export function buildArticleNode(a: ArticleInput): JsonLdNode {
  return {
    '@type': 'Article',
    '@id': `${a.url}#article`,
    url: a.url,
    headline: a.headline,
    ...(a.description && { description: a.description }),
    datePublished: a.datePublished,
    ...(a.articleSection && { articleSection: a.articleSection }),
    ...(a.imageUrl && { image: a.imageUrl }),
    inLanguage: 'ja',
    author: { '@id': `${a.siteOrigin}${PUBLISHER_ID}` },
    publisher: { '@id': `${a.siteOrigin}${PUBLISHER_ID}` },
    isPartOf: { '@id': `${a.siteOrigin}${WEBSITE_ID}` },
  };
}

export interface PersonInput {
  url: string;
  name: string;
  alternateNames?: string[];
  description?: string;
  imageUrl?: string;
  faction?: string;  // memberOf
  role?: string;
}

/** Characters are fictional; use a Person + FictionalCharacter hybrid so
    search engines get a structured entity while AI readers understand the
    character is in-fiction. */
export function buildCharacterNode(c: PersonInput): JsonLdNode {
  const node: JsonLdNode = {
    '@type': ['Person', 'FictionalCharacter'],
    '@id': `${c.url}#character`,
    url: c.url,
    name: c.name,
    ...(c.alternateNames?.length && {
      alternateName: c.alternateNames.filter(Boolean),
    }),
    ...(c.description && { description: c.description }),
    ...(c.imageUrl && { image: c.imageUrl }),
    ...(c.role && { jobTitle: c.role }),
  };
  if (c.faction) {
    node.memberOf = {
      '@type': 'Organization',
      name: c.faction,
    };
  }
  return node;
}

export interface DefinedTermInput {
  url: string;
  name: string;
  alternateName?: string;
  description: string;
  termCode?: string;
  inSetName?: string;
  inSetUrl?: string;
}

export function buildDefinedTermNode(t: DefinedTermInput): JsonLdNode {
  const node: JsonLdNode = {
    '@type': 'DefinedTerm',
    '@id': `${t.url}#term`,
    url: t.url,
    name: t.name,
    ...(t.alternateName && { alternateName: t.alternateName }),
    description: t.description,
    ...(t.termCode && { termCode: t.termCode }),
    inLanguage: 'ja',
  };
  if (t.inSetName) {
    node.inDefinedTermSet = {
      '@type': 'DefinedTermSet',
      name: t.inSetName,
      ...(t.inSetUrl && { url: t.inSetUrl }),
    };
  }
  return node;
}

export interface DefinedTermSetInput {
  url: string;
  name: string;
  description?: string;
  terms: Array<{
    name: string;
    alternateName?: string;
    description: string;
  }>;
}

export function buildDefinedTermSetNode(s: DefinedTermSetInput): JsonLdNode {
  return {
    '@type': 'DefinedTermSet',
    '@id': `${s.url}#termset`,
    url: s.url,
    name: s.name,
    ...(s.description && { description: s.description }),
    inLanguage: 'ja',
    hasDefinedTerm: s.terms.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.name,
      ...(t.alternateName && { alternateName: t.alternateName }),
      description: t.description,
    })),
  };
}

export interface BlogPostingInput {
  url: string;
  headline: string;
  datePublished: string;
  siteOrigin: string;
}

export function buildBlogPostingNode(p: BlogPostingInput): JsonLdNode {
  return {
    '@type': 'BlogPosting',
    '@id': `${p.url}#post`,
    url: p.url,
    headline: p.headline,
    datePublished: p.datePublished,
    inLanguage: 'ja',
    author: { '@id': `${p.siteOrigin}${PUBLISHER_ID}` },
    publisher: { '@id': `${p.siteOrigin}${PUBLISHER_ID}` },
  };
}

export interface ScholarlyArticleInput {
  url: string;
  headline: string;
  description?: string;
  abstract?: string;
  datePublished: string;
  dateModified?: string;
  authors?: string[];       // author display names
  version?: string;
  keywords?: string[];
  imageUrl?: string;
  siteOrigin: string;
}

/** TRAKTATO papers use ScholarlyArticle — a richer Article subtype with
    fields for abstract / version / authors that Google Scholar and AI
    readers can consume. Falls back gracefully in plain search if the
    fields aren't understood. */
export function buildScholarlyArticleNode(a: ScholarlyArticleInput): JsonLdNode {
  const authors =
    a.authors && a.authors.length > 0
      ? a.authors.map((name) => ({ '@type': 'Person', name }))
      : [{ '@id': `${a.siteOrigin}${PUBLISHER_ID}` }];
  return {
    '@type': 'ScholarlyArticle',
    '@id': `${a.url}#paper`,
    url: a.url,
    headline: a.headline,
    ...(a.description && { description: a.description }),
    ...(a.abstract && { abstract: a.abstract }),
    datePublished: a.datePublished,
    ...(a.dateModified && { dateModified: a.dateModified }),
    ...(a.version && { version: a.version }),
    ...(a.keywords?.length && { keywords: a.keywords }),
    ...(a.imageUrl && { image: a.imageUrl }),
    inLanguage: 'ja',
    author: authors,
    publisher: { '@id': `${a.siteOrigin}${PUBLISHER_ID}` },
    isPartOf: { '@id': `${a.siteOrigin}${WEBSITE_ID}` },
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string; // absolute
}

export function buildBreadcrumbNode(items: BreadcrumbItem[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Wrap nodes into a full @graph document for embedding. */
export function toJsonLdGraph(nodes: JsonLdNode[]): string {
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': nodes,
    },
    null,
    // Pretty print in dev for debugging; minified in production is fine either way
    2,
  );
}
