import { defineCollection, z } from 'astro:content';

const novel = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    chapterNumber: z.number().int().positive(),
    publishedAt: z.coerce.date(),
    summary: z.string().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().int().optional(),
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
      portrait: image(),
      charId: z.string(),
      order: z.number().int().default(0),
    }),
});

export const collections = { novel, gallery, characters };
