# joshstrauss.me — personal site

Personal website for **Josh Strauss** — builder & founder. A **one-page
résumé-style document** ("dossier"): a dimmed cream sheet with a navy
letterhead band, floating on a deep navy field with animated aurora glows
and a cursor-following dot-grid reveal. Hand-written HTML + CSS + one tiny
script (`script.js` feeds the cursor position to CSS — everything else is
pure CSS). No framework, no build step.

Canonical domain: **https://joshstrauss.me** (chosen 2026-07-11; $26.99/yr,
available but not yet purchased — buy it before deploying).

## Design system

"**Dossier — GumGauge Navy**" (2026-07-13 restructure inspired by the
construction of a reference résumé-site; 2026-07-16 recolored to GumGauge's
brand blues at the owner's request — brand source: ~/gumgauge-dental
tailwind.config.js).

- Tokens: field **deep navy `#0E1F35`** (gradient to `#1E3A5F`) · paper
  `#EDE9DE` (dimmed cream, gradient on the sheet) · ink `#1C1917` · accent
  **GumGauge navy `#1E3A5F`** · hover `#152942` · **sky `#7DD3FC` is
  decorative ONLY** (letterhead italic, selection, glow, OG card — never
  text on cream) · live dot `#3F8D57`. **Green means LIVE only.**
- The letterhead band (`.masthead`) bleeds to the sheet edges via negative
  `--sheet-pad` margins — keep that variable in sync with `.sheet` padding.
- Motion (all gated behind `prefers-reduced-motion`): sheet-landing +
  interleaved panel cascade on load, light sweep across the letterhead,
  drifting aurora glows, cursor-following glow + dot-grid (`.glow` +
  `script.js`), panel hover lift, pulsing live dots.
- **Bump the `styles.css?v=N` query param on every CSS change** — browsers
  cache aggressively and the owner has been bitten once.
- Type: **Newsreader** (name + italic accents) · **Hanken Grotesk** (body) ·
  **Fragment Mono** (panel titles, meta lines, contacts). Self-hosted WOFF2
  in `fonts/`, preloaded, `font-display: swap`.
- Light only — dark mode was removed 2026-07-11 by owner decision. Don't
  reintroduce orange accents or a recolored dark mode. (The green "Ledger
  Green" accent was replaced 2026-07-16 — don't bring it back either.)
- Layout: `.sheet` (max 72rem, radius, shadow) → `.masthead` → `.dossier`
  two-column grid (narrow facts column left, work column right) → panels
  (`.panel` with mono `.panel__title` bar) → `.entry` rows (bold name +
  mono meta + 1–3 sentences + mono links).

## Structure

```
.
├── index.html            the whole site (one page)
├── books/index.html      full book list (linked from the Reading panel)
├── papers/index.html     the GumGauge literature — 66 verified citations, 8 themed panels
├── about/ work/ now/     redirect stubs → /#anchor (old URLs, noindex)
├── 404.html              not-found (noindex)
├── styles.css            full design system
├── script.js             the only JS: cursor position → CSS --mx/--my
├── robots.txt            allows traditional + AI crawlers; points at sitemap
├── sitemap.xml           one URL, with lastmod
├── llms.txt              summary for AI answer engines (anchor links)
├── site.webmanifest      icons manifest
├── favicon.svg           JS monogram (PNG fallbacks in assets/)
├── fonts/                self-hosted WOFF2
├── assets/               og.png, icon PNGs, og-/icon-template.html (generators)
├── CONTENT-TODO.md       ← the fill-in list: everything the site needs from Josh
└── README.md
```

## Local preview

```bash
cd ~/Projects/personal-website
python3 -m http.server 5500
# → http://localhost:5500
```

## Placeholder / draft system

`<html data-draft="true">` on index.html makes each `.ph` placeholder render
with a green highlight + dashed outline. Every placeholder has
`data-todo="<id>"` and a hover `title` — ids map to `CONTENT-TODO.md`.

- `.ph-frame` image placeholders (headshot) are **not** gated — they keep
  their styling until replaced with a real `<img>`.
- Placeholder links (socials, résumé, store links) have **no `href`** — they
  become links by adding one, and can't dead-click meanwhile.

Leaving draft mode when content is real:

```bash
sed -i '' 's/ data-draft="true"//' index.html
grep -n 'data-todo' index.html && echo 'NOT READY' || echo 'clean'
```

## Changing the domain

```bash
grep -rln 'joshstrauss\.me' . | xargs sed -i '' 's/joshstrauss\.me/newdomain.com/g'
```

Then regenerate `assets/og.png` (the domain is printed on it).

## SEO / AI-search baseline (wired in)

- `robots.txt` (2026 AI-crawler list), `sitemap.xml`, `llms.txt` at root.
- JSON-LD `@graph` on the page: `ProfilePage` (with `dateCreated` /
  `dateModified`) → `Person` (`https://joshstrauss.me/#person`, full, with
  `knowsAbout`) + `WebSite` + `MobileApplication`/`SoftwareApplication` nodes
  per venture. No `SearchAction` (no search endpoint — deliberate deviation
  from the global checklist).
- GumGauge copy anywhere on this site must keep its regulatory line:
  *investigational device pursuing FDA 510(k) clearance; not cleared or
  approved by the FDA.*
- Work order is GumGauge-first (owner decision 2026-07-11).
- No analytics, no forms, no cookies ⇒ no privacy policy required yet.

### When the page changes (same-commit rule)

- [ ] `sitemap.xml` `<lastmod>`
- [ ] JSON-LD `dateModified` + the visible "Updated" date in the Status panel
- [ ] `llms.txt` if sections/links changed
- [ ] OG tags still describe the page

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
