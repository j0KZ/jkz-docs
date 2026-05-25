// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import starlightGiscus from 'starlight-giscus';

// Starlight `autogenerate` does not work with this site's custom content
// loader (`base: './wiki'` in src/content.config.ts) -- it resolves `directory`
// against src/content/docs/ which does not exist here. Build the items
// programmatically from the wiki/ directory instead.
function sidebarFromWiki(dir) {
  const fullPath = path.join('./wiki', dir);
  if (!fs.existsSync(fullPath)) return [];
  return fs.readdirSync(fullPath)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
    .sort()
    .map((f) => ({ slug: `${dir}/${f.replace(/\.md$/, '')}` }));
}

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
          items: sidebarFromWiki('reference'),
        },
        {
          label: 'API Reference',
          collapsed: true,
          items: sidebarFromWiki('api-reference'),
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
