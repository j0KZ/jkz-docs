// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://j0kz.dev',
  base: '/docs',
  integrations: [
    starlight({
      title: 'jkz docs',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/j0KZ/jkz-docs' },
      ],
      sidebar: [
        {
          label: 'Reference',
          items: [{ autogenerate: { directory: 'reference' } }],
        },
      ],
    }),
  ],
});
