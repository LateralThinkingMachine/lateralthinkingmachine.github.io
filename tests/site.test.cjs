"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const origin = "https://lateralthinkingmachines.ai";
// Public routes are the contract, independent of the generator's locale list.
const locales = [
  { tag: "en", route: "/", name: "English" },
  { tag: "ja", route: "/ja/", name: "日本語" },
  { tag: "zh-Hans", route: "/zh-hans/", name: "简体中文" },
  { tag: "ko", route: "/ko/", name: "한국어" },
  { tag: "es", route: "/es/", name: "Español" },
  { tag: "fr", route: "/fr/", name: "Français" },
  { tag: "de", route: "/de/", name: "Deutsch" },
  { tag: "pt-BR", route: "/pt-br/", name: "Português" },
];
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const page = locale => read(`${locale.route.slice(1)}index.html`);
const copy = locale => JSON.parse(read(`locales/${locale.tag}.json`));
const decode = value => value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
  if (entity.startsWith("#x")) return String.fromCodePoint(parseInt(entity.slice(2), 16));
  if (entity.startsWith("#")) return String.fromCodePoint(Number(entity.slice(1)));
  return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[entity];
});
const text = html => decode(html.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
const attributes = source => Object.fromEntries([...source.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g)].map(match => [match[1], decode(match[2] ?? match[3] ?? "")]));
const tags = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, "gi"))].map(match => attributes(match[1]));
// These paired elements are not nested inside elements of the same type.
const elements = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, "gi"))].map(match => ({ attrs: attributes(match[1]), body: match[2] }));
const hasClass = (attrs, name) => (attrs.class || "").split(/\s+/).includes(name);
const alternates = html => Object.fromEntries(tags(html, "link").filter(link => link.rel === "alternate").map(link => [link.hreflang, link.href]));
const expectedAlternates = Object.fromEntries([...locales.map(locale => [locale.tag, origin + locale.route]), ["x-default", origin + "/"]]);

test("all eight locales have complete, nonempty translations rather than English fallbacks", () => {
  const english = copy(locales[0]);
  const keys = Object.keys(english).sort();
  const brandOnly = new Set(["menuGithub", "menuTagline", "menuFeatureEyebrow", "footerCopyright"]);
  assert.deepEqual(fs.readdirSync(path.join(root, "locales")).filter(name => name.endsWith(".json")).sort(), locales.map(locale => `${locale.tag}.json`).sort());
  for (const locale of locales) {
    const translation = copy(locale);
    assert.deepEqual(Object.keys(translation).sort(), keys, `${locale.tag}: key parity`);
    for (const key of keys) {
      assert.equal(typeof translation[key], "string", `${locale.tag}.${key}: string required`);
      assert.ok(translation[key].trim(), `${locale.tag}.${key}: empty translation`);
      if (locale.tag !== "en" && !brandOnly.has(key)) {
        assert.notEqual(translation[key], english[key], `${locale.tag}.${key}: English fallback`);
      }
    }
  }
  assert.match(copy(locales[1]).heroDescription, /[\p{Script=Hiragana}\p{Script=Katakana}]/u);
  assert.match(copy(locales[2]).heroDescription, /\p{Script=Han}/u);
  assert.match(copy(locales[3]).heroDescription, /\p{Script=Hangul}/u);
});

test("every public route contains its translated text and seven accessible headline messages without JavaScript", () => {
  const templateKeys = new Set([...read("templates/index.html").matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1]));
  for (const locale of locales) {
    const html = page(locale);
    const translation = copy(locale);
    assert.equal(tags(html, "html")[0].lang, locale.tag);
    assert.doesNotMatch(html, /\{\{\w+\}\}/, `${locale.tag}: unresolved placeholder`);
    const decoded = decode(html);
    for (const [key, value] of Object.entries(translation)) {
      if (templateKeys.has(key)) assert.ok(decoded.includes(value), `${locale.tag}.${key}: missing rendered copy`);
    }
    const headings = elements(html, "h1");
    assert.equal(headings.length, 1, `${locale.tag}: one main heading`);
    const spans = elements(headings[0].body, "span");
    const visual = spans.filter(span => hasClass(span.attrs, "headline-message"));
    const messages = Array.from({ length: 7 }, (_, index) => translation[`headline${index + 1}`]);
    assert.deepEqual(visual.map(span => text(span.body)), messages, `${locale.tag}: rotation content`);
    assert.deepEqual(visual.map(span => Object.hasOwn(span.attrs, "data-active")), [true, false, false, false, false, false, false], `${locale.tag}: static first message`);
    assert.ok(visual.every(span => span.attrs["aria-hidden"] === "true"));
    const accessible = spans.filter(span => hasClass(span.attrs, "visually-hidden"));
    assert.equal(accessible.length, 1);
    assert.equal(text(accessible[0].body), messages.join(" "));
    assert.ok(!Object.hasOwn(headings[0].attrs, "aria-live"), "headlines must not be repeatedly announced");
  }
});

test("each language has self-canonical metadata and a complete reciprocal alternate set", () => {
  for (const locale of locales) {
    const html = page(locale);
    const translation = copy(locale);
    const links = tags(html, "link");
    const metadata = tags(html, "meta");
    assert.deepEqual(links.filter(link => link.rel === "canonical").map(link => link.href), [origin + locale.route]);
    assert.equal(metadata.find(meta => meta.property === "og:url")?.content, origin + locale.route);
    assert.equal(elements(html, "title")[0] && text(elements(html, "title")[0].body), translation.pageTitle);
    assert.equal(metadata.find(meta => meta.name === "description")?.content, translation.metaDescription);
    assert.equal(metadata.find(meta => meta.property === "og:description")?.content, translation.ogDescription);
    assert.equal(metadata.find(meta => meta.name === "twitter:description")?.content, translation.twitterDescription);
    assert.equal(links.filter(link => link.rel === "alternate").length, 9);
    assert.deepEqual(alternates(html), expectedAlternates, `${locale.tag}: reciprocal hreflang`);
    assert.ok(!metadata.some(meta => meta.name === "robots" && /noindex/.test(meta.content)), `${locale.tag}: public page must be indexable`);
  }
});

test("the sitemap lists precisely the eight canonical pages and reciprocal language alternatives", () => {
  const sitemap = read("sitemap.xml");
  const entries = elements(sitemap, "url");
  assert.equal(entries.length, locales.length);
  assert.deepEqual(entries.map(entry => text(elements(entry.body, "loc")[0].body)).sort(), locales.map(locale => origin + locale.route).sort());
  for (const entry of entries) {
    const links = tags(entry.body, "xhtml:link");
    assert.equal(links.length, 9);
    assert.ok(links.every(link => link.rel === "alternate"));
    assert.deepEqual(Object.fromEntries(links.map(link => [link.hreflang, link.href])), expectedAlternates);
  }
  assert.match(read("robots.txt"), /Sitemap: https:\/\/lateralthinkingmachines\.ai\/sitemap\.xml/);
});

test("native disclosures and real language links remain usable when scripts do not run", () => {
  for (const locale of locales) {
    const html = page(locale);
    const panels = elements(html, "details").filter(panel => Object.hasOwn(panel.attrs, "data-header-panel"));
    assert.equal(panels.length, 2, `${locale.tag}: native menu and language disclosures`);
    assert.ok(panels[0].attrs.name, "native grouping must prevent overlapping open panels without JS");
    assert.equal(panels[0].attrs.name, panels[1].attrs.name);
    for (const panel of panels) {
      assert.match(panel.body.trimStart(), /^<summary\b/, "summary must be the disclosure's first element");
      const summary = elements(panel.body, "summary")[0];
      assert.ok(summary);
      assert.ok(!Object.hasOwn(summary.attrs, "aria-expanded"), "native expanded state must not be overridden by stale static ARIA");
      assert.ok(!Object.hasOwn(summary.attrs, "hidden"));
      assert.notEqual(summary.attrs.tabindex, "-1");
      assert.ok(text(summary.body), "summary needs a text label");
      const ids = tags(panel.body, "[a-z][a-z0-9:-]*").map(tag => tag.id).filter(Boolean);
      assert.ok(ids.includes(summary.attrs["aria-controls"]), "disclosure control must identify its panel");
    }
    const languagePanel = panels.find(panel => panel.attrs["data-header-panel"] === "languages");
    const links = elements(languagePanel.body, "a");
    assert.equal(links.length, locales.length);
    assert.deepEqual(links.map(link => link.attrs.href).sort(), locales.map(other => other.route).sort());
    for (const other of locales) {
      const link = links.find(link => link.attrs.href === other.route);
      assert.equal(link.attrs.hreflang, other.tag);
      assert.equal(link.attrs.lang, other.tag);
      assert.ok(text(link.body).includes(other.name), `${locale.tag}: native language name for ${other.tag}`);
      assert.equal(link.attrs["aria-current"], other.tag === locale.tag ? "page" : undefined);
    }
  }
});

test("nested routes have resolvable local assets, anchors, and accessibility references", () => {
  for (const locale of locales) {
    const html = page(locale);
    const allTags = tags(html, "[a-z][a-z0-9:-]*");
    const ids = allTags.map(tag => tag.id).filter(Boolean);
    assert.equal(new Set(ids).size, ids.length, `${locale.tag}: duplicate ID`);
    for (const tag of allTags) {
      for (const attribute of ["aria-controls", "aria-labelledby", "aria-describedby"]) {
        if (tag[attribute]) for (const id of tag[attribute].split(/\s+/)) assert.ok(ids.includes(id), `${locale.tag}: missing ${attribute} target ${id}`);
      }
      for (const attribute of ["href", "src"]) {
        const value = tag[attribute];
        if (!value) continue;
        if (value.startsWith("#")) {
          assert.ok(ids.includes(value.slice(1)), `${locale.tag}: missing anchor ${value}`);
          continue;
        }
        const url = new URL(value, origin + locale.route);
        if (url.origin !== origin) continue;
        const relative = decodeURIComponent(url.pathname).replace(/^\//, "");
        const target = path.join(root, relative, url.pathname.endsWith("/") ? "index.html" : "");
        assert.ok(fs.statSync(target).isFile(), `${locale.tag}: missing local destination ${value}`);
      }
    }
    for (const asset of ["/styles.css", "/navigation.js", "/enny.js", "/headline.js", "/assets/enny.png"]) {
      assert.ok(allTags.some(tag => tag.href === asset || tag.src === asset), `${locale.tag}: missing shared asset ${asset}`);
    }
  }
});

test("checked-in pages and sitemap reproduce from translation sources in an isolated build", t => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "ltm-site-check-"));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  for (const directory of ["scripts", "templates", "locales"]) {
    fs.cpSync(path.join(root, directory), path.join(temporary, directory), { recursive: true });
  }
  execFileSync(process.execPath, [path.join(temporary, "scripts/build.mjs")], { cwd: temporary, stdio: "pipe" });
  for (const relative of [...locales.map(locale => `${locale.route.slice(1)}index.html`), "sitemap.xml"]) {
    assert.equal(read(relative), fs.readFileSync(path.join(temporary, relative), "utf8"), `${relative}: run node scripts/build.mjs after source changes`);
  }
});
