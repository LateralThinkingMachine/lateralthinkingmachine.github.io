# Lateral Thinking Machines

The public landing page for Lateral Thinking Machines, AtoposDB, and Enny. A small static website hosted on GitHub Pages, with no build step, external fonts, analytics, or third-party scripts. The only client-side script is Enny's optional cursor response.

The page leads with AtoposDB's product promise: agents build expertise as they work. Supporting copy explains continuity across sessions, channels, and providers; evidence, decisions, and corrections; and scoped knowledge reuse. The technical description identifies the native temporal graph database. Engine, integrated components, and collaborative workspace are stated as development directions, not released offerings. Keep the hero, illustrative evidence-to-correction example, product copy, and search/social metadata consistent with this positioning.

## Development

Edit `index.html` and `styles.css`. Start a local preview from the repository root:

```sh
python3 -m http.server 8767 --bind 127.0.0.1
```

Open `http://127.0.0.1:8767`. Check desktop and mobile layouts, keyboard focus, navigation, local assets, and the 404 page before publishing. Product copy presents work in progress; only add product documentation, downloads, or capability claims when their public destinations and availability are verified.

The supplied original 6000 × 2000 banner is retained in `assets/` for social previews. The page itself uses native text and inline vector icons. Lucide's database and orbit icons retain the [upstream license notices](assets/LUCIDE-LICENSE.txt).

The header and footer use [`assets/ltm-logo-monochrome.svg`](assets/ltm-logo-monochrome.svg), a vector interpretation of the supplied brand sheet's monochrome logo: three overlapping rounded tiles with white separation lines and a rounded lowercase `ltm` wordmark, in a single navy ink. [`favicon.svg`](favicon.svg) uses the same tile geometry. Both remain sharp at any resolution, and CSS preserves the lockup's proportions. Keep logo edits in these SVG sources; the full-color social-preview banner is a separate supplied asset.

## Enny mascot

[`assets/enny.png`](assets/enny.png) is the supplied transparent artwork, copied without alteration. The hero displays it in normal document flow above the illustrative example. It is decorative, takes no focus, and cannot cover or intercept controls. Its SVG viewBox removes transparent padding without modifying the source image.

[`enny.js`](enny.js) gives both inner eye details one shared gaze direction. Fixed SVG clips preserve the eye outlines and the entire body stays still. Travel is capped to an ellipse of five horizontal and three vertical SVG units (about 1.05 × 0.63 screen pixels at the desktop size), with brief easing and no idle animation loop. No eye or body rotation is used. Mouse/pen movement is supported only with a fine, hover-capable pointer; touch, reduced motion, offscreen, and hidden-page states retain the static artwork. Leaving the page or blurring the window restores a neutral gaze. Without JavaScript, the original artwork remains visible.

Run `node --test tests/enny.test.cjs` for the focused interaction checks. For visual verification, move the pointer across the hero and then outside the page, confirm the body stays anchored, and check both the desktop and mobile layouts.

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
