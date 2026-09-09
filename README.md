# joshstrauss.me — personal site

Personal website for **Josh Strauss**, builder and founder. A light, spacious
portfolio with oversized navy typography, dedicated venture sections, and
reading collections. Hand-written HTML and CSS with a small, optional JavaScript
scroll animation; no framework, runtime dependencies, or required compilation step.

Canonical domain: **https://joshstrauss.me**. Live on GitHub Pages.

## Design system

Updated 2026-09-09. The personal portfolio leads with Josh's name and mission,
then ventures (GumGauge first), projects, sites, background, reading, and contact.

- Colors: pale blue canvas `#f6f8fb`, navy ink `#152942`, blue accent `#234f85`,
  muted text `#56667a`, blue surface `#e6edf6`, white `#ffffff`.
- Type: self-hosted **Hanken Grotesk** for name, navigation, and body;
  **Newsreader** for the mission and reading links. Only these two normal
  faces are preloaded.
- Layout: `.site-shell` → compact header → oversized name and current-work
  index → `.venture-grid` → background and native `<details>` disclosures →
  reading links → contact. Books, papers, and 404 share `.sheet` and `.masthead`.
- Responsive single-column layouts on mobile; visible keyboard focus, a skip
  link, and reduced-motion support. The name has a brief entrance animation;
  a blue line traces the homepage's outer gutter as you scroll. The line is
  decorative, ignores pointer input, and is hidden with reduced motion or JavaScript off.
- Light only. Keep orange and green accents out; green dots indicate a live
  site, and existing venture logos retain their own brand colors.
- **Bump the `styles.css?v=N` query parameter on every CSS change**, in all
  four styled HTML pages. Browsers cache aggressively.

## Structure

```
index.html               home portfolio
books/index.html         full book list
papers/index.html        66 research citations in 8 themed sections
about/ work/ now/         noindex redirects to existing home anchors
404.html                 not-found page (noindex)
styles.css               shared responsive design system
robots.txt               traditional and AI crawler access
sitemap.xml              public routes and modification dates
llms.txt                 summary and navigation for AI answer engines
site.webmanifest         icons and browser theme
fonts/                   self-hosted WOFF2 fonts
assets/                  resume PDF, venture logos, icons, and social share card
assets/scroll-trail.*     homepage scroll decoration; disabled with reduced motion
scripts/site.mjs          dependency-free static validator and export
CONTENT-TODO.md           outstanding content items
```

## Local preview and validation

```bash
python3 -m http.server 5500
# Open http://localhost:5500
```

With Node.js 20 or newer (no install step):

```bash
npm run lint
npm run build
```

Lint checks public-route metadata, JSON-LD, local links/assets/anchors,
internal links, sitemap entries, and crawler rules. Build repeats validation
and exports the site to ignored `dist/`. GitHub Pages still serves the repository
root from `main`; it does not require or deploy the local `dist/` directory.
Use desktop and mobile browser checks for visual changes.

## Content maintenance

`CONTENT-TODO.md` tracks outstanding content and optional additions. Keep
existing factual claims, venture status, public contact details, and literature
citations intact when changing the design. Use the existing IDs for inbound
anchor links; do not add a headshot or product imagery until a real asset exists.

The homepage and contact section link to `assets/Josh-Strauss-Resume.pdf`.
Replace that file when updating the resume so saved links keep working; update
its `DigitalDocument` JSON-LD date and the resume date in `llms.txt` at the same time.
The resume uses a navy sidebar and pale blue main column, with selectable text
and clickable contact links. Its editable source is `scripts/build_resume.py` (Python 3.10+ with
`python-docx`). Running it writes `output/docs/Josh-Strauss-Resume.docx`.
Export that document to PDF and visually check its page layout before replacing
the public asset. Local deliverables and render checks in `output/` and `tmp/`
are gitignored; `npm run build` copies the verified PDF already in `assets/`.

## Changing the domain

```bash
grep -rln 'joshstrauss\.me' . | xargs sed -i '' 's/joshstrauss\.me/newdomain.com/g'
```

Then regenerate `assets/og.png` (the domain is printed on it).

## SEO / AI-search baseline (wired in)

- `robots.txt` (2026 AI-crawler list), `sitemap.xml`, `llms.txt` at root.
- JSON-LD `@graph` on the page: `ProfilePage` (with `dateCreated` /
  `dateModified`) → `Person` (`https://joshstrauss.me/#person`, full, with
  `knowsAbout`) + `WebSite`, a referenced GumGauge `Organization`, and
  `MobileApplication`/`SoftwareApplication` nodes
  per venture. No `SearchAction` (no search endpoint — deliberate deviation
  from the global checklist).
- GumGauge copy anywhere on this site must state that the concept is
  investigational, no hardware or clinical performance data exists, it is not
  cleared or approved by the FDA, and its premarket pathway remains under
  review.
- Work order is GumGauge-first (owner decision 2026-07-11).
- No analytics, no forms, no cookies ⇒ no privacy policy required yet.

### When the page changes (same-commit rule)

- [ ] `sitemap.xml` `<lastmod>`
- [ ] JSON-LD `dateModified` + the visible "Updated" date in the Right now note
- [ ] `llms.txt` if sections/links changed
- [ ] OG tags still describe the page
- [ ] `npm run lint` and `npm run build`
- [ ] Desktop/mobile layout and keyboard navigation

## Regenerating the share image

`assets/og.png` (1200×630) is a screenshot of `assets/og-template.html` at
exactly 1200×630. Same for icons via `assets/icon-template.html` at 512×512,
then `sips -z` down to 192/180/32. Keep og.png under 300 KB.

## Deploying — LIVE on GitHub Pages

The site ships from **github.com/jstrauss2552/joshstrauss.me** via GitHub Pages
(source: `main` / root; custom domain set by the `CNAME` file). **To redeploy,
just `git push`** — Pages rebuilds automatically.

DNS at GoDaddy (apex `joshstrauss.me`):
- Four **A** records → `185.199.108.153`, `185.199.109.153`,
  `185.199.110.153`, `185.199.111.153`
- One **CNAME**: `www` → `jstrauss2552.github.io`
- Then repo **Settings → Pages → Enforce HTTPS** once the cert issues (24–48h).

After it resolves: register in **Bing Webmaster Tools** (ChatGPT search runs on
Bing's index) and Google Search Console; submit the sitemap in both.
