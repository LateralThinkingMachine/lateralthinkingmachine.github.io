# Lateral Thinking Machines

The public landing page for Lateral Thinking Machines, AtoposDB, and Enny. A small static website hosted on GitHub Pages, with no runtime dependencies, external fonts, analytics, or third-party scripts. A dependency-free Node script generates the sixteen pages across eight languages before publication. Small client-side scripts provide the expandable header, Enny's optional cursor response, and the rotating headline.

The homepage gives AtoposDB a permanent product definition: a native temporal graph database for AI memory engineering. The reading order is the centered hero, AtoposDB and Enny product overview, an explicitly illustrative four-step release workflow, a six-card capability grid, development status, and concrete next steps. Lateral Thinking Machines is the organization; AtoposDB is the database; Enny is the planned memory companion and mascot.

The capability grid follows the user’s Relate cookbook reference: three columns on wide screens, two at 1000px and below, one at 600px and below. Cards use monochrome vector icons, adjoining thin borders, left-aligned copy, equal heights within each row, and flexible heights for translations. Each whole card is a native link with an accessible heading label and leads to a real section in that language’s technical overview. The product pair retains its borderless, centered treatment.

The technical overview lives at `/overview/` and at `/<locale>/overview/` for the other seven languages. It explains the intended data model and database/model responsibility boundary, then preserves the full approved continuity, shared-memory, reconstruction, situational-awareness, graph-representation, and scenario copy. Long-form paragraphs are left-aligned. A native disclosure makes all thirteen banner messages available as ordinary readable text. Every page includes a factual public-vs-in-development section; illustrative workflows, graph learning and scenario capabilities must not be presented as released features or a runnable demo.

The primary action opens the translated technical overview. Follow-development, roadmap and question links target the public documentation repository at `https://github.com/LateralThinkingMachine/atoposdb`. This is a documentation entry point, not an engine download. The organization profile links to the same six overview sections so both public destinations use consistent positioning.

## Development

Edit the page bodies in `templates/index.html` and `templates/overview.html`, the shared `templates/layout.html`, the copy in `locales/*.json`, and `styles.css`. Do not edit the sixteen generated `index.html` files directly. The generator shares navigation, metadata and footer rendering across both page families. Regenerate and verify before previewing or publishing:

```sh
node scripts/build.mjs
node --test tests/*.test.cjs
```

Start a local preview from the repository root:

```sh
python3 -m http.server 8767 --bind 127.0.0.1
```

Open `http://127.0.0.1:8767`. Check desktop and mobile layouts, keyboard focus, navigation, local assets, and the 404 page before publishing. Product copy presents work in progress; only add product documentation, downloads, or capability claims when their public destinations and availability are verified.

The supplied original 6000 × 2000 banner is retained in `assets/` for social previews. The page itself uses native text and inline vector icons. Lucide's database and orbit icons retain the [upstream license notices](assets/LUCIDE-LICENSE.txt).

The footer uses [`assets/ltm-logo-monochrome.svg`](assets/ltm-logo-monochrome.svg), a vector interpretation of the supplied brand sheet's monochrome logo: three overlapping rounded tiles with white separation lines and a rounded lowercase `ltm` wordmark, in a single navy ink. The SVG remains sharp at any resolution, and CSS preserves the lockup's proportions. Keep logo edits in the SVG source; the full-color social-preview banner is a separate supplied asset.

The browser tab icon uses [`favicon-layered-l.png`](favicon-layered-l.png), the supplied “Layered Three-Color L Icon.png” copied unchanged at 1254 × 1254 pixels with transparency. The shared page template and the 404 page reference this PNG, so all language routes use the same three-color icon. Its distinct filename separates it from the previously cached monochrome favicon.

## Header and languages

The header follows the floating pill and expandable-panel pattern from the user’s Lilly reference. Its left pill pairs the monochrome LTM lockup with a hamburger; the right pill has a sharp vector globe. The white-on-dark logo in `assets/ltm-logo-light.svg` uses the same geometry as the footer logo, with separation strokes matching the header background.

`navigation.js` enhances native `<details>` disclosures. Click, Enter, and Space open the panels. On fine pointers, hovering over the logo/menu pill opens navigation after 140 ms; leaving closes it after 220 ms unless focus remains inside. The menu remains open while crossing into its panel. Escape closes it and returns focus to its trigger; outside clicks and focus leaving the header dismiss it. Only one panel is open at a time. Reduced motion removes panel animation. Without JavaScript, both native disclosures and all language links still work. The panels are nonmodal: normal page navigation and keyboard traversal remain available.

The eight complete translations are published at these stable URLs:

| Language | Path |
| --- | --- |
| English | `/` |
| Japanese | `/ja/` |
| Simplified Chinese | `/zh-hans/` |
| Korean | `/ko/` |
| Spanish | `/es/` |
| French | `/fr/` |
| German | `/de/` |
| Brazilian Portuguese | `/pt-br/` |

The language grid identifies each language by its own name and a secondary English name or regional variant. Switching languages preserves the current page family (homepage or technical overview) and uses ordinary links; there is no IP detection, automatic redirect, third-party translation widget, or stored preference. Every page includes translated visible copy, accessible labels, search/social metadata, its own canonical URL, and reciprocal `hreflang` links. `scripts/build.mjs` validates translation-key parity and regenerates all sixteen pages and their multilingual sitemap. Shared assets use root-relative URLs; in-page navigation stays in the selected language. The existing English `404.html` is the common GitHub Pages fallback.

After copy changes, run the generator and focused checks, then inspect the header and the longest headlines on desktop and mobile. Publish the generated pages with their source files in the same commit.

## Rotating headline

[`headline.js`](headline.js) cycles through thirteen translated hero messages, in this order:

1. Bring your own AI. Keep your knowledge.
2. Help agents communicate with other agents.
3. One workspace for people and AI agents.
4. Revisit past decisions with new evidence.
5. Give your agents a shared language.
6. Help agents understand each other’s context.
7. Continue the work. Keep the context.
8. Turn experience into reusable knowledge.
9. Keep decisions connected to their evidence.
10. A native temporal graph database for AI agents.
11. Memory for AI agents.
12. Help your agents understand what’s happening—and what changed.
13. Help your agents explore “what if?”

Each has a six-second reading interval, fading out and then in over 240 ms each so letters never overlap. All messages occupy the same CSS grid cell so the tallest phrase reserves space at every screen size. The heading has one concise stable accessible product definition; changes are not announced repeatedly to screen readers. All thirteen messages are also available in the technical overview’s native disclosure, with no JavaScript required.

There is no visible playback control. Rotation pauses while a mouse or pen hovers over the headline or keyboard focus is within the hero copy. Offscreen and hidden-page states also suspend the timer; returning starts a fresh six-second reading interval. Reduced-motion preferences keep the first headline static. Without JavaScript, the first headline remains visible. Check all messages at desktop and mobile widths and verify automatic pause/resume before publishing.

## Enny mascot

[`assets/enny.png`](assets/enny.png) is the supplied transparent artwork, copied without alteration. The hero displays it in normal document flow, centered above the headline and supporting copy. It is decorative, takes no focus, and cannot cover or intercept controls. Its SVG viewBox removes transparent padding without modifying the source image.

[`enny.js`](enny.js) gives both inner eye details one shared gaze direction. SVG clips preserve the eye outlines, while the whole mascot gently leans toward the pointer. Eye travel is capped to an ellipse of five horizontal and three vertical SVG units (about 1.05 × 0.63 screen pixels at the desktop size). Body sway is capped at 7° with up to 4 px horizontal and 2.5 px vertical movement, eased over 220 ms around a lower-body pivot. The untransformed wrapper keeps pointer geometry and surrounding layout stable. Eyes never rotate independently of the body, and there is no idle animation loop.

Mouse/pen movement is supported only with a fine, hover-capable pointer. Touch and reduced-motion preferences retain the static artwork. Leaving the page, scrolling Enny out of view, hiding the page, or blurring the window restores a neutral gaze and body position. Without JavaScript, the original artwork remains visible.

Run `node --test tests/enny.test.cjs` for the focused interaction checks. For visual verification, move the pointer left, right, above, and below the hero, then outside the page. Confirm Enny leans toward it and settles back to neutral, the eyes stay attached to the face, and the wrapper and surrounding text stay anchored. Check both desktop and mobile layouts.

## GitHub Pages

Repository: `LateralThinkingMachine/lateralthinkingmachine.github.io`.

Publish from the `main` branch and repository root. `.nojekyll` disables Jekyll processing. A push to `main` triggers the Pages deployment. The intended canonical URL is [lateralthinkingmachines.ai](https://lateralthinkingmachines.ai/).

Configure the custom domain in repository Settings → Pages before changing DNS. Once custom-domain routing is activated, `CNAME` must contain exactly `lateralthinkingmachines.ai`. Enable **Enforce HTTPS** after GitHub provisions the certificate.

## Domain routing

Both domains are managed through Squarespace. The plural domain is the GitHub Pages primary domain; the singular domain is an HTTPS-capable permanent redirect to the same landing page.

For `lateralthinkingmachines.ai`, use these web-routing records:

| Type | Host | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `lateralthinkingmachine.github.io` |

Keep GitHub's organization-verification TXT record at `_github-pages-challenge-LateralThinkingMachine`. Replace only the conflicting Squarespace website defaults (including its old HTTPS address hints); retain unrelated email, verification, and domain-connect records.

For `lateralthinkingmachine.ai`, configure Squarespace domain forwarding for `@` and `www` to `lateralthinkingmachines.ai`, using a permanent 301 redirect, SSL enabled, and Remove paths so requests arrive at the single landing page. GitHub also redirects the plural `www` hostname to the plural apex when both DNS records are configured correctly.

After setup, verify the main domain serves the site over HTTPS, the singular domain redirects to it, the plural `www` domain redirects to it, and HTTP redirects to HTTPS. DNS and certificate provisioning can take time; saved settings alone do not prove live routing.

References: [GitHub custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [domain verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages), and [Squarespace forwarding](https://support.squarespace.com/hc/en-us/articles/214767107-Forwarding-a-domain).
