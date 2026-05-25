// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import starlightGiscus from 'starlight-giscus';

// https://astro.build/config
export default defineConfig({
  site: 'https://docs.j0kz.dev',
  base: '/',
  integrations: [
    mermaid({
      theme: 'forest',
      autoTheme: true,
    }),
    starlight({
      title: 'jkz docs',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/j0KZ/jkz-docs' },
      ],
      sidebar: [
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
        {
          label: 'API Reference',
          collapsed: true,
          autogenerate: { directory: 'api-reference' },
        },
      ],
      plugins: [
        starlightGiscus({
          repo: 'j0KZ/jkz-docs',
          repoId: 'R_kgDOSYL5XA',
          category: 'Wiki feedback',
          categoryId: 'DIC_kwDOSYL5XM4C9Eg2',
          mapping: 'pathname',
          reactions: true,
          inputPosition: 'bottom',
          theme: { light: 'light', dark: 'dark_dimmed' },
          lazy: true,
        }),
      ],
    }),
  ],
});
