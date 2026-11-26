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
const pages = [{ name: 'index', suffix: '' }, { name: 'overview', suffix: 'overview/' }];
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const layout = await readFile(path.join(root, 'templates/layout.html'), 'utf8');
const templates = Object.fromEntries(await Promise.all(pages.map(async page => [page.name, await readFile(path.join(root, `templates/${page.name}.html`), 'utf8')])));
const english = JSON.parse(await readFile(path.join(root, 'locales/en.json'), 'utf8'));
const keys = Object.keys(english).sort();
const route = (locale, page) => locale.path + page.suffix;
const alternateEntries = page => [...locales.map(l => ({ tag: l.tag, url: origin + route(l, page) })), { tag: 'x-default', url: origin + '/' + page.suffix }];

for (const locale of locales) {
  const copy = JSON.parse(await readFile(path.join(root, `locales/${locale.tag}.json`), 'utf8'));
  if (JSON.stringify(Object.keys(copy).sort()) !== JSON.stringify(keys) || Object.values(copy).some(v => typeof v !== 'string' || !v.trim())) throw new Error(`Incomplete translation: ${locale.tag}`);
  for (const page of pages) {
    const overview = page.name === 'overview';
    const alternateLinks = alternateEntries(page).map(l => `<link rel="alternate" hreflang="${l.tag}" href="${l.url}">`).join('\n    ');
    const languageLinks = locales.map(l => `<li><a href="${route(l, page)}" lang="${l.tag}" hreflang="${l.tag}"${l.tag === locale.tag ? ' aria-current="page"' : ''}><span class="language-name">${l.name}</span><span class="language-detail" lang="${l.tag === 'pt-BR' ? 'pt-BR' : 'en'}">${l.detail}</span>${l.tag === locale.tag ? `<span class="language-current" lang="${locale.tag}">${escape(copy.currentLanguage)}</span>` : ''}</a></li>`).join('\n            ');
    const raw = {
      alternateLinks, languageLinks,
      homeCurrent: overview ? '' : 'aria-current="page"',
      overviewCurrent: overview ? 'aria-current="page"' : '',
      pageScripts: overview ? '' : '<script src="/enny.js" defer></script>\n    <script src="/headline.js" defer></script>',
    };
    const values = { ...copy, lang: locale.tag, canonical: origin + route(locale, page), ogLocale: locale.og, homeUrl: locale.path, overviewUrl: locale.path + 'overview/' };
    if (overview) Object.assign(values, { pageTitle: copy.overviewPageTitle, metaDescription: copy.overviewMeta, ogTitle: copy.overviewPageTitle, ogDescription: copy.overviewMeta, twitterDescription: copy.overviewMeta });
    const render = template => template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (key in raw) return raw[key];
      if (!(key in values)) throw new Error(`Missing template key: ${key}`);
      return escape(values[key]);
    });
    raw.mainContent = render(templates[page.name]);
    const directory = path.join(root, route(locale, page));
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'index.html'), render(layout));
  }
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${pages.flatMap(page => locales.map(l => `  <url>\n    <loc>${origin}${route(l, page)}</loc>\n${alternateEntries(page).map(a => `    <xhtml:link rel="alternate" hreflang="${a.tag}" href="${a.url}"/>`).join('\n')}\n  </url>`)).join('\n')}\n</urlset>\n`;
await writeFile(path.join(root, 'sitemap.xml'), sitemap);
console.log(`Generated ${locales.length * pages.length} static pages and sitemap.xml.`);
