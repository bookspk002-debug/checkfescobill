# FESCO Bill Online — static website

An independent, AdSense-ready static website for checking, understanding and
paying FESCO (Faisalabad Electric Supply Company) electricity bills in
Pakistan. Built to outrank thin bill-checker sites with genuinely useful
content: a bill checker (format validation only — the real bill is shown on
the official PITC portal), a working bill calculator using the current NEPRA
tariff, a full tariff table, payment / duplicate-bill / complaint guides, city
pages and policy pages.

**Not affiliated with FESCO, PITC or NEPRA.** Rates verified against NEPRA
S.R.O. 279(I)/2026 (effective 12 Feb 2026). Last reviewed: November 2026.

## Structure

- `index.html` — homepage with the bill checker (14-digit Reference No. / 10-digit Customer ID)
- `fesco-bill-calculator/` — bill calculator (vanilla JS in `assets/calculator.js`)
- `fesco-duplicate-bill/` `fesco-bill-payment/` `fesco-previous-bill/`
  `fesco-new-connection/` `fesco-bill-sms-service/` `fesco-unit-rate/`
  `fesco-complaint/` `fesco-load-shedding-schedule/`
  `how-to-read-fesco-bill/` — guides
- `fesco-bill-faisalabad/` `fesco-bill-sargodha/` `fesco-bill-jhang/` — city pages
- `about/` `contact/` `privacy-policy/` `disclaimer/` `terms/` — policy pages
- `assets/style.css` — single shared stylesheet (mobile-first, no frameworks)
- `sitemap.xml`, `robots.txt`, `ads.txt`

19 pages total. Every page has a unique title + meta description, exactly one
H1, JSON-LD (FAQPage / BreadcrumbList / HowTo / Organization / WebSite) and an
"Updated: November 2026" stamp.

## Domain

The site is built for **https://checkfescobill.pk** (confirmed 18 Nov 2026;
the domain itself has NOT been bought yet — buy it from PKNIC, ~Rs 2,100/yr,
when ready). Every absolute URL (canonical, OG tags, sitemap, robots.txt)
already uses it. If the domain ever changes, replace it everywhere with:

```bash
# from inside this folder
find . -type f \( -name '*.html' -o -name '*.xml' -o -name '*.txt' \) \
  -exec sed -i 's#https://checkfescobill.pk#https://NEW-DOMAIN#g' {} +
```

## Deploy to GitHub Pages

1. Create a public repo (e.g. `fesco-bill-online`) and push this folder's
   contents to the `main` branch (root of the repo, not a subfolder).
2. Repo → Settings → Pages → Source: **Deploy from a branch**, Branch:
   **main**, Folder: **/(root)** → Save.
3. The site goes live at `https://<username>.github.io/fesco-bill-online/`.
4. In the same Pages settings, add your custom domain under **Custom domain**
   and enable **Enforce HTTPS** (GitHub provisions the certificate).

## AdSense note — read this first

A `github.io` subdomain **cannot** get AdSense approval. AdSense needs a
custom domain (e.g. `checkfescobill.pk`, a `.pk` from PKNIC, or any `.com`).
So: deploy on GitHub Pages, point the custom domain at it, wait until the
site is indexed and has some traffic, then apply for AdSense and add your
real publisher ID to `ads.txt` (it currently holds only a commented
placeholder — never publish a made-up ID).

## Keeping rates current

NEPRA revises the tariff, FPA changes monthly and QTA quarterly. When a new
notification comes out, update `assets/calculator.js` (the `TARIFF` table and
the FPA default), the tariff tables on `fesco-unit-rate/` and
`fesco-bill-calculator/`, and the "Updated" stamps. The calculator's worked
examples on the calculator page were verified against the JS on 18 Nov 2026:
100 units protected = Rs 1,779.27; 350 units unprotected = Rs 17,410.32;
800 units unprotected = Rs 49,448.94 (all at 1 kW load, FPA +1.1086, QTA 0).
