# Lot 7 — consent and policy for `apps/docs`

Sits on top of `.batuta/brief-6cc-landing.md` — the honesty rules, the conventions, the gates,
the evidence contract and the boundaries in it apply unchanged, reading "the site" as
`apps/docs` where they say `apps/site`. Read it first.

## Goal

The documentation is about to get analytics. It has no consent mechanism and no privacy policy
today, so adding analytics there would collect first and ask later — the exact ordering
`apps/site` avoided in lot 5.

This lot gives `apps/docs` the same three things the site has, plus the deploy hardening that
makes the privacy claim enforceable. **It ships zero analytics.**

`apps/site` already solves every one of these problems. Read it and mirror it. Do not invent a
different shape for anything it already answers.

## 1. The policy is shared, not copied

**Do not create a second privacy page.** The canonical policy lives at
`https://lyra-ds.dev/{lang}/privacy` and is the same document for both properties: same
maintainer, same practices, same storage model. Two copies would drift the day analytics lands,
and the reader would have to guess which one governs.

So this lot **edits the existing policy** in `apps/site` to cover both, rather than duplicating
it. Specifically:

- The "what this site stores" section must say that **both** `lyra-ds.dev` and
  `docs.lyra-ds.dev` store a theme preference and a consent answer, each in its own browser
  storage for its own domain — a choice made on one does not carry to the other, because
  browsers scope storage per origin.
- The "what the host sees" section must say it applies to both.

Keep the copy's voice. Do not rewrite the sections that are already correct.

Put the docs origin's policy URL in one exported constant in `apps/docs`, the way
`apps/site/lib/links.ts` holds `DOCS_ORIGIN`. Do not scatter the URL.

## 2. The consent reader

Create `apps/docs/lib/consent.ts` mirroring `apps/site/lib/consent.ts`:

- `consentStorageKey` exported — **`'lyra-docs-consent'`**, distinct from the site's and from
  `lyra-docs-theme`.
- `readConsent()` and `mayLoadAnalytics()` with the same contracts and the same SSR-safety.

**Export the key and import it wherever the banner is mounted.** Lot 5 shipped that key
declared twice and it took a retry; do not repeat it. One declaration, one import.

This is a deliberate copy of ~20 lines rather than a shared package — the user decided against
extracting one for now. Do not build the package.

## 3. The banner

Mount `CookieBanner` in `apps/docs/app/[lang]/layout.tsx`, after the footer, with
`storageKey={consentStorageKey}` and `policyHref` pointing at the canonical policy for the
current locale.

Body copy, EN:
`This site keeps your theme choice in your browser. You can also allow anonymous usage analytics, which would only ever tell us which pages help people. Neither is needed to read anything here.`

Body copy, pt-BR:
`Este site guarda sua escolha de tema no seu navegador. Você também pode permitir métricas de uso anônimas, que serviriam apenas para saber quais páginas ajudam. Nenhuma das duas é necessária para ler nada aqui.`

Labels: `Allow analytics` / `Permitir métricas` and `Only essentials` / `Apenas o essencial`.
All of it from the message files, like every other string in this app.

Mark the analytics insertion point **in a comment**, stating it must be guarded by
`mayLoadAnalytics()`. No empty component.

## 4. `_headers` for the docs — and the trap in it

Add `apps/docs/public/_headers` mirroring `apps/site/public/_headers`, with the same reasoning:
the policy claims this property loads nothing from anyone else, and a CSP is what turns that
sentence into a rule the browser enforces.

**Two differences from the site's policy, both mandatory:**

1. **`img-src 'self' data:`** — `packages/styles` embeds SVG data URIs in `navigation.css`,
   `forms.css` and `display.css`. Lot 6 shipped `img-src 'self'` and it silently erased every
   chevron and select arrow. Do not repeat it.
2. **`frame-src 'self'`, not `'none'`.** The docs render component examples inside **iframes**
   — see `apps/docs/components/example-view.tsx`. A `frame-src 'none'` would blank every
   isolated preview on the site that documents them. This is the single most likely way to ship
   this lot broken.

Everything else matches the site's file, including `'unsafe-inline'` in `script-src` for Next's
hydration bootstrap and the three hardening headers. **No external origin anywhere.**

Add `apps/docs/DEPLOY.md` the way `apps/site/DEPLOY.md` reads, with the build command verified
from a clean state, the output directory, the Node version, and the note that analytics will
require extending the CSP with the self-hosted origin — and that adding the script without
extending it fails closed.

## 5. Deploy order — write it down

The docs banner links to a policy hosted on `lyra-ds.dev`. **If the docs go live before the
site, that link 404s.** Neither is deployed today, so this costs nothing to get right — but it
has to be stated. Put it in `apps/docs/DEPLOY.md`, plainly: this property must not go live
before `lyra-ds.dev`.

## Acceptance criteria

1. The banner appears on a first visit to any docs page, disappears after a choice, and does not
   return on reload. Prove all three in the built export.
2. `grep -rn "lyra-docs-consent" apps/docs --include='*.ts' --include='*.tsx'` returns exactly
   one line — the declaration. Show it.
3. `mayLoadAnalytics()` is true only for `'all'`; cover it with tests, as lot 5 did.
4. **Zero analytics.** No provider named in code or copy; no third-party origin contacted.
   Report every origin the built pages request.
5. `localStorage` holds only the docs theme key and the docs consent key; `document.cookie` is
   empty. Report both.
6. Served **with `_headers` applied**: zero CSP violations on at least four representative
   routes — the locale index, a component page, a guide, and a page carrying an **isolated
   preview iframe**. Name the routes you used and confirm the preview still renders.
7. `axe.run` clean with the banner visible and after dismissal, both locales, both themes.
8. The shared policy covers both domains and still reads as one document, not two glued
   together.
9. `apps/docs/DEPLOY.md` states the deploy-order constraint.
10. The four CI jobs' commands run, with real output reported and anything unrunnable named.

## Boundaries

- **Do not touch `packages/`.**
- Do not add analytics, name a provider, or add any external origin to any CSP.
- Do not create a second privacy page.
- Do not extract a shared consent package.
- Do not change the docs' content, navigation, search or example machinery.
- In `apps/site`, change **only** the privacy copy needed to cover both domains.
- Do not commit, branch or push.
