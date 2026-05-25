import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';

export const collections = {
  docs: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './wiki' }),
    schema: docsSchema({
      extend: z.object({
        editUrl: z.union([z.string(), z.boolean(), z.null()]).optional(),
        deprecated_since: z.string().nullable().optional(),
      }),
    }),
  }),
};
