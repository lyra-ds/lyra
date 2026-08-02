# Lot 6c-c/5 — retry

The delivery is correct and I verified it independently: the privacy routes build and carry
the copy, no third-party origin is contacted, `document.cookie` stays empty, the banner
appears once and stays away after a choice, focus is not stolen, axe is clean with the banner
**visible** and after dismissal in both locales and both themes, and neither policy page names
a provider.

**One defect.** Fix only this.

## `consentStorageKey` is declared twice

`apps/site/lib/consent.ts` declares it, and `apps/site/app/[lang]/layout.tsx` declares its own
copy to pass to `CookieBanner`. Two literals, one meaning.

If either one is ever edited alone, the banner writes to one key while `mayLoadAnalytics()`
reads the other. The visible symptom would be a banner that reappears forever, or — worse and
silent — a consent decision that the analytics guard never sees. On a consent mechanism, a
divergence like that is not a style problem.

**This repo already learned this exact lesson on the theme key.** `apps/docs/app/layout.tsx`
carries the comment explaining why the pre-paint script and the provider must read one
constant: _"the pre-paint script below and the ThemeProvider that takes over after hydration
must read the same key, or the site would boot with one theme and switch to another."_ Same
shape, higher stakes.

Export the key from `apps/site/lib/consent.ts` and import it in the layout. One declaration,
one import, no second literal anywhere.

## Acceptance

1. `grep -rn "lyra-site-consent" apps/site --include='*.ts' --include='*.tsx'` returns exactly
   one line: the declaration in `lib/consent.ts`. Show the output.
2. The banner still stores under that key and still stays away after a choice — re-check in the
   built artifact, not by reading the code.
3. `pnpm --filter @lyra-ds/site run test`, `run typecheck` and `run build` pass; report output.

## Do not change anything else

The privacy copy, the footer link, the banner labels, the comment marking the analytics mount
point, and the consent tests are all correct. Do not restructure them.

Do not touch `packages/`. Do not commit, branch or push.
