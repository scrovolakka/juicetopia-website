import { defineCollection, z } from 'astro:content';

const novel = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      chapterNumber: z.number().int().positive(),
      publishedAt: z.coerce.date(),
      summary: z.string().optional(),
      series: z.string().optional(),
      seriesOrder: z.number().int().optional(),
      indent: z.boolean().default(true),
      // Hero image — doubles as OG/Twitter Card image for social shares.
      heroImage: image().optional(),
      heroAlt: z.string().optional(),
      heroCaption: z.string().optional(),
      // Aspect for the in-page hero figure. Does not affect the OG image
      // (which is always cropped to 1200×630 for social).
      heroAspect: z.enum(['16:9', '4:3', '3:2', '1:1', '1.91:1']).default('16:9'),
    }),
});

const gallery = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      image: image(),
      alt: z.string(),
      createdAt: z.coerce.date(),
      medium: z.string().default('DIGITAL'),
      dimensions: z.string().optional(),
      order: z.number().int().default(0),
    }),
});

const characters = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      reading: z.string().optional(),
      // Portrait becomes optional so we can stub in characters before art exists.
      portrait: image().optional(),
      charId: z.string(),
      order: z.number().int().default(0),
      // Faction / clan grouping — drives the list page sections.
      // Examples: 主人公 / 王のフルーツ / 導管民 / 緑の一族 / ドマロンの道具たち /
      // ミューズ / 大坂 / 修繕班 / くまちゃん読書会 / 脚注の王 / 異形
      faction: z.string().default('その他'),
      // Role / short title within the faction (e.g. 「古代の王リーダー」「触媒」).
      role: z.string().optional(),
      // One-line descriptor used on the list card. Keep short (~60 chars).
      tagline: z.string().optional(),
      // Era: 古代 / 沈黙紀 / 再生紀 / 現代紀 / 遺跡の時代 — optional
      era: z.string().optional(),
      // Cross-refs — the detail page renders these as structured links.
      mondoRefs: z.array(z.string()).default([]),
      leksikoRefs: z.array(z.string()).default([]),
      novelRefs: z.array(z.string()).default([]), // slugs into the novel collection
    }),
});

// MONDO — world notes. Structured concepts that appear across the fiction.
// Slug examples: sacrabolla, komanda, suk-forna, suktonium, nota-di-dol, zuk-sha.
const codex = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),            // 日本語の見出し（例：「聖杯」）
      reading: z.string().optional(),
      label: z.string(),            // juicetopian label （例：「SACRABOLLA」）
      codexId: z.string(),          // M.001 形式
      order: z.number().int().default(0),
      summary: z.string(),          // 1 行要約（index 用）
      // Clusters allow grouping in the index, e.g. "器", "詩", "制度"
      cluster: z.string().optional(),
      // Cross-refs
      seeAlso: z.array(z.string()).default([]),      // other codex slugs
      leksikoRefs: z.array(z.string()).default([]),  // lexicon slugs
      // Hero image / OG
      heroImage: image().optional(),
      heroAlt: z.string().optional(),
      heroCaption: z.string().optional(),
      heroAspect: z.enum(['16:9', '4:3', '3:2', '1:1', '1.91:1']).default('16:9'),
    }),
});

// LEKSIKO — dictionary of juicetopian language.
// Entries may be short (1-2 sentences); the page renders them as a dictionary grid.
const lexicon = defineCollection({
  type: 'content',
  schema: z.object({
    word: z.string(),              // 見出し語（例：「LEYDA-MONO」）
    reading: z.string().optional(),// 読み or カタカナ
    partOfSpeech: z.string().optional(), // n. / v. / adj. / prefix など
    gloss: z.string(),             // 日本語の短訳
    definition: z.string().optional(), // 長めの定義（1-3 文）
    etymology: z.string().optional(),  // 仮の語源メモ
    // Grouping: 'core' (固有名詞的) / 'common' (日常語) / 'compound' (合成語)
    category: z.enum(['core', 'common', 'compound', 'affix']).default('core'),
    order: z.number().int().default(0),
    seeAlso: z.array(z.string()).default([]),    // other lexicon slugs
    mondoRefs: z.array(z.string()).default([]),  // codex slugs
  }),
});

// CRONIKA — editor's log. Dated entries describing what changed in the archive
// and any commentary the editor wants to attach. Not the novel itself.
const cronika = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      loggedAt: z.coerce.date(),
      entryId: z.string(),           // C.A02.001 形式（VOLA / 巻 / 通し）
      kind: z.enum(['add', 'fix', 'note', 'release']).default('note'),
      order: z.number().int().default(0),
      heroImage: image().optional(),
      heroAlt: z.string().optional(),
      heroCaption: z.string().optional(),
      heroAspect: z.enum(['16:9', '4:3', '3:2', '1:1', '1.91:1']).default('16:9'),
    }),
});

// TRAKTATO — papers / specs / notes. Horizontal-only, 1 or 2 column layout,
// supports LaTeX ($..$ / $$..$$) and Mermaid diagrams (```mermaid blocks).
// Slugs correspond to the original filename stem (e.g. fantasy_paper_command_verse).
const traktato = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),                           // 日本語の主タイトル
      label: z.string().optional(),                // 英字サブタイトル / 原題
      paperId: z.string(),                         // T.001 形式
      // Document classification — drives section icon/chip on the list page.
      kind: z.enum(['paper', 'spec', 'rfc', 'note']).default('paper'),
      // Body column layout. 'double' is 2-column at wide viewports;
      // 'single' forces 1-column everywhere (for long-form specs / notes).
      layout: z.enum(['single', 'double']).default('single'),
      abstract: z.string().optional(),             // 冒頭 abstract（枠付きで表示）
      authors: z.array(z.string()).default([]),    // 列挙可
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      version: z.string().optional(),              // "v1.2" など
      order: z.number().int().default(0),
      // Hero image / OG
      heroImage: image().optional(),
      heroAlt: z.string().optional(),
      heroCaption: z.string().optional(),
      heroAspect: z.enum(['16:9', '4:3', '3:2', '1:1', '1.91:1']).default('16:9'),
      // Cross-refs
      seeAlso: z.array(z.string()).default([]),    // other traktato slugs
      mondoRefs: z.array(z.string()).default([]),
      leksikoRefs: z.array(z.string()).default([]),
      // Tags — free-form keywords shown in the footer
      tags: z.array(z.string()).default([]),
    }),
});

export const collections = { novel, gallery, characters, codex, lexicon, cronika, traktato };
