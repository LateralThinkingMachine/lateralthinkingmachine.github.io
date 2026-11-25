import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://lateralthinkingmachines.ai';
const locales = [
  { tag: 'en', path: '/', name: 'English', detail: 'International', og: 'en_US' },
  { tag: 'ja', path: '/ja/', name: '日本語', detail: 'Japanese', og: 'ja_JP' },
  { tag: 'zh-Hans', path: '/zh-hans/', name: '简体中文', detail: 'Simplified Chinese', og: 'zh_CN' },
  { tag: 'ko', path: '/ko/', name: '한국어', detail: 'Korean', og: 'ko_KR' },
  { tag: 'es', path: '/es/', name: 'Español', detail: 'Spanish', og: 'es_ES' },
  { tag: 'fr', path: '/fr/', name: 'Français', detail: 'French', og: 'fr_FR' },
  { tag: 'de', path: '/de/', name: 'Deutsch', detail: 'German', og: 'de_DE' },
  { tag: 'pt-BR', path: '/pt-br/', name: 'Português', detail: 'Brasil', og: 'pt_BR' },
];
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const template = await readFile(path.join(root, 'templates/index.html'), 'utf8');
const english = JSON.parse(await readFile(path.join(root, 'locales/en.json'), 'utf8'));
const keys = Object.keys(english).sort();
const alternateLinks = [...locales.map(l => `<link rel="alternate" hreflang="${l.tag}" href="${origin}${l.path}">`), `<link rel="alternate" hreflang="x-default" href="${origin}/">`].join('\n    ');

for (const locale of locales) {
  const copy = JSON.parse(await readFile(path.join(root, `locales/${locale.tag}.json`), 'utf8'));
  if (JSON.stringify(Object.keys(copy).sort()) !== JSON.stringify(keys) || Object.values(copy).some(v => typeof v !== 'string' || !v.trim())) throw new Error(`Incomplete translation: ${locale.tag}`);
  const languageLinks = locales.map(l => `<li><a href="${l.path}" lang="${l.tag}" hreflang="${l.tag}"${l.tag === locale.tag ? ' aria-current="page"' : ''}><span class="language-name">${l.name}</span><span class="language-detail" lang="${l.tag === 'pt-BR' ? 'pt-BR' : 'en'}">${l.detail}</span>${l.tag === locale.tag ? `<span class="language-current" lang="${locale.tag}">${escape(copy.currentLanguage)}</span>` : ''}</a></li>`).join('\n            ');
  const raw = { alternateLinks, languageLinks };
  const values = { ...copy, lang: locale.tag, canonical: origin + locale.path, ogLocale: locale.og };
  const html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key in raw) return raw[key];
    if (!(key in values)) throw new Error(`Missing template key: ${key}`);
    return escape(values[key]);
  });
  const directory = path.join(root, locale.path);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html);
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${locales.map(l => `  <url>\n    <loc>${origin}${l.path}</loc>\n${[...locales.map(a => `    <xhtml:link rel="alternate" hreflang="${a.tag}" href="${origin}${a.path}"/>`), `    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/"/>`].join('\n')}\n  </url>`).join('\n')}\n</urlset>\n`;
await writeFile(path.join(root, 'sitemap.xml'), sitemap);
console.log(`Generated ${locales.length} static language pages and sitemap.xml.`);
