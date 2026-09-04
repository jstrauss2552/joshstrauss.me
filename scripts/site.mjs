import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = `https://${readFileSync(join(root, 'CNAME'), 'utf8').trim()}`;
const files = ['index.html', '404.html', 'styles.css', 'robots.txt', 'sitemap.xml', 'llms.txt', 'site.webmanifest', 'favicon.svg', 'CNAME', '.nojekyll'];
const routes = readdirSync(root, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'dist' && existsSync(join(root, entry.name, 'index.html')))
  .map(entry => entry.name);
const pages = ['index.html', '404.html', ...routes.map(route => `${route}/index.html`)];
const errors = [];
const read = file => readFileSync(join(root, file), 'utf8');
const fail = (file, message) => errors.push(`${file}: ${message}`);
const html = new Map(pages.map(file => [file, read(file).replace(/<!--[\s\S]*?-->/g, '')]));
const pageURL = file => new URL(file.replace(/index\.html$/, ''), `${origin}/`).href;

// This checks the site's static attributes; browser testing covers HTML layout.
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map(match => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]]));
}

function checkLink(file, reference, base = pageURL(file)) {
  let url;
  try { url = new URL(reference.replaceAll('&amp;', '&'), base); }
  catch { fail(file, `invalid URL: ${reference}`); return; }
  if (url.origin !== origin) return;

  let target = decodeURIComponent(url.pathname).replace(/^\//, '');
  if (!target || (existsSync(join(root, target)) && statSync(join(root, target)).isDirectory())) target += `${target && !target.endsWith('/') ? '/' : ''}index.html`;
  if (!existsSync(join(root, target))) {
    fail(file, `missing local file: ${reference}`);
  } else if (url.hash && html.has(target)) {
    const ids = [...html.get(target).matchAll(/\bid\s*=\s*(["'])(.*?)\1/g)].map(match => match[2]);
    if (!ids.includes(decodeURIComponent(url.hash.slice(1)))) fail(file, `missing anchor: ${reference}`);
  }
}

const publicURLs = new Set();
for (const [file, source] of html) {
  const tags = [...source.matchAll(/<[a-z][\w:-]*\b[^>]*>/gi)].map(match => ({ tag: match[0], attrs: attributes(match[0]) }));
  const meta = Object.fromEntries(tags.filter(({ tag }) => /^<meta\b/i.test(tag)).map(({ attrs }) => [attrs.name || attrs.property, attrs.content]));
  const canonical = tags.find(({ tag, attrs }) => /^<link\b/i.test(tag) && attrs.rel === 'canonical')?.attrs.href;
  const noindex = /\bnoindex\b/i.test(meta.robots || '');
  const ids = tags.map(({ attrs }) => attrs.id).filter(Boolean);
  if (new Set(ids).size !== ids.length) fail(file, 'duplicate HTML id');
  if (!/<title>\s*\S[\s\S]*?<\/title>/i.test(source)) fail(file, 'missing page title');
  if (!meta.viewport) fail(file, 'missing viewport');
  for (const { attrs } of tags) {
    for (const field of ['href', 'src']) if (attrs[field]) checkLink(file, attrs[field]);
    for (const field of ['aria-labelledby', 'aria-describedby']) {
      for (const id of (attrs[field] || '').split(/\s+/).filter(Boolean)) if (!ids.includes(id)) fail(file, `${field} points to missing id: ${id}`);
    }
  }
  const schemas = [...source.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, json] of schemas) {
    try {
      const data = JSON.parse(json);
      if (!data || data['@context'] !== 'https://schema.org') fail(file, 'JSON-LD requires the Schema.org context');
    } catch (error) { fail(file, `invalid JSON-LD: ${error.message}`); }
  }
  if (noindex) continue;
  publicURLs.add(pageURL(file));
  for (const key of ['description', 'og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    if (!meta[key]?.trim()) fail(file, `missing ${key}`);
  }
  if (canonical !== pageURL(file)) fail(file, `canonical must be ${pageURL(file)}`);
  if (meta['og:url'] !== canonical) fail(file, 'og:url must match canonical');
  for (const key of ['og:image', 'twitter:image']) if (meta[key]) checkLink(file, meta[key]);
  if (!schemas.length) fail(file, 'missing JSON-LD');
  const main = source.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '';
  const bodyLinks = new Set([...main.matchAll(/<a\b[^>]*>/gi)].flatMap(([tag]) => {
    const href = attributes(tag).href;
    if (!href) return [];
    const url = new URL(href, pageURL(file));
    return url.origin === origin && url.pathname !== new URL(pageURL(file)).pathname ? [url.pathname] : [];
  }));
  if (bodyLinks.size < 2) fail(file, 'main content needs links to at least two other site pages');
}

for (const match of read('styles.css').matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/g)) {
  checkLink('styles.css', match[1] ?? match[2] ?? match[3]);
}
const manifest = JSON.parse(read('site.webmanifest'));
for (const icon of manifest.icons || []) checkLink('site.webmanifest', icon.src);

const sitemapURLs = new Set();
for (const [, entry] of read('sitemap.xml').matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const url = entry.match(/<loc>(.*?)<\/loc>/)?.[1];
  const date = entry.match(/<lastmod>(.*?)<\/lastmod>/)?.[1];
  if (!url || !publicURLs.has(url)) fail('sitemap.xml', `unexpected public URL: ${url}`);
  if (sitemapURLs.has(url)) fail('sitemap.xml', `duplicate URL: ${url}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || Number.isNaN(Date.parse(date))) fail('sitemap.xml', `invalid lastmod for ${url}`);
  sitemapURLs.add(url);
}
for (const url of publicURLs) if (!sitemapURLs.has(url)) fail('sitemap.xml', `missing ${url}`);

const robots = read('robots.txt');
const crawlerGroups = new Map();
let agents = [];
let hasRules = false;
for (const line of robots.split('\n').map(line => line.replace(/#.*/, '').trim()).filter(Boolean)) {
  const [key, ...parts] = line.split(':');
  const value = parts.join(':').trim();
  if (key.toLowerCase() === 'user-agent') {
    if (hasRules) agents = [];
    agents.push(value);
    hasRules = false;
  } else if (key.toLowerCase() === 'allow' || key.toLowerCase() === 'disallow') {
    hasRules = true;
    for (const agent of agents) {
      if (!crawlerGroups.has(agent)) crawlerGroups.set(agent, []);
      crawlerGroups.get(agent).push(`${key.toLowerCase()}:${value}`);
    }
  }
}
for (const agent of ['*', 'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Codex-Web', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot', 'Applebot-Extended', 'Bingbot', 'DuckAssistBot', 'YouBot', 'Meta-ExternalAgent', 'Amazonbot', 'cohere-ai', 'Bytespider', 'Diffbot']) {
  if (!crawlerGroups.get(agent)?.includes('allow:/')) fail('robots.txt', `missing explicit Allow: / for ${agent}`);
}
if (!robots.trimEnd().endsWith(`Sitemap: ${origin}/sitemap.xml`)) fail('robots.txt', 'must end with canonical sitemap URL');
for (const [, link] of read('llms.txt').matchAll(/\]\((https?:\/\/[^\s)]+)\)/g)) checkLink('llms.txt', link);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Static checks passed: ${pages.length} HTML files, ${publicURLs.size} indexable routes, local assets and anchors, metadata, JSON-LD, sitemap, and crawlers.`);

if (process.argv[2] === 'build') {
  const output = join(root, 'dist');
  rmSync(output, { recursive: true, force: true });
  mkdirSync(output);
  for (const entry of [...files, ...routes, 'assets', 'fonts']) cpSync(join(root, entry), join(output, entry), { recursive: true });
  console.log('Built static site in dist/. GitHub Pages continues to deploy main from the repository root.');
}
