# Lateral Thinking Machines

The public landing page for Lateral Thinking Machines, AtoposDB, and Enny. A small static website hosted on GitHub Pages, with no build step, external fonts, analytics, or third-party scripts.

## Development

Edit `index.html` and `styles.css`. Start a local preview from the repository root:

```sh
python3 -m http.server 8767 --bind 127.0.0.1
```

Open `http://127.0.0.1:8767`. Check desktop and mobile layouts, keyboard focus, navigation, local assets, and the 404 page before publishing. Product copy presents work in progress; only add product documentation, downloads, or capability claims when their public destinations and availability are verified.

The supplied original 6000 × 2000 banner is retained in `assets/` for social previews. The page itself uses native text and inline vector icons. Lucide's database and orbit icons retain the [upstream license notices](assets/LUCIDE-LICENSE.txt).

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
