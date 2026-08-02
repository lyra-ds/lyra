# Lot 8 — OpenPanel, behind the consent gate, in both apps

Sits on top of `.batuta/brief-6cc-landing.md` — the honesty rules, the conventions, the gates,
the evidence contract and the boundaries in it apply unchanged. Read it first.

## Goal

Wire self-hosted OpenPanel into `apps/site` and `apps/docs`, so it loads **only** after the
visitor allows it and **only** when the deployment provides the configuration.

Lots 5 and 7 built the decision and the reader. This lot connects them to something real.

## Why the script and not the SDK

`@openpanel/nextjs` depends on `@openpanel/web`, which depends on `rrweb` — a session-replay
library, 5.7 MB unpacked. Session recording is off for this project, so shipping its code to
prove it is unused is the wrong trade. **Load OpenPanel's script from the configured instance
instead.** No npm dependency, nothing extra in the bundle, and the version is the instance's to
control.

The script is `op1.js`, served from the OpenPanel origin, exposing `window.op(...)`. Read the
official SDK docs for the exact init call and options rather than guessing them; if the option
you need is not documented, stop and report instead of improvising.

## Configuration comes from the environment, never from source

Two build-time variables, `NEXT_PUBLIC_` because a static export inlines them:

- `NEXT_PUBLIC_OPENPANEL_URL` — the self-hosted instance origin.
- `NEXT_PUBLIC_OPENPANEL_CLIENT_ID` — **one project covers both domains**, so the same value
  goes to both apps.

Neither is a secret: a client id in a static bundle is public by construction, and so is the
instance hostname. They live in the environment so deployment configuration is not baked into
source — not to hide anything. Do not treat them as credentials.

**If either is missing, nothing loads and nothing changes.** No script, no CSP entry, no console
warning that leaks the other value. `pnpm dev` with no configuration must behave exactly as it
does today.

## The `_headers` file is generated, not edited

This is the crux of the lot. `public/_headers` is a static file Cloudflare serves directly —
**Next never processes it, so it cannot interpolate an environment variable.** Hardcoding the
origin there would create a second source of truth for something that already lives in the
environment, and the two would drift. That is exactly the defect that cost lot 5 a retry with
the consent key.

Each app gets a prebuild step that **generates** `public/_headers` from a committed template plus
the environment:

- With `NEXT_PUBLIC_OPENPANEL_URL` set, the generated policy adds that exact origin to
  **`script-src` and `connect-src`** — the script is fetched from it, and the events are sent to
  it. Nowhere else.
- With it unset, the generated file is byte-identical to what ships today.
- The generated file is gitignored; the template is committed.
- The generator **throws** if the URL is set but unparseable. A malformed origin that silently
  widens or breaks a CSP is worse than a failed build.

Keep every existing directive. In the docs that includes `frame-src 'self'` (its examples render
in iframes) and `style-src 'self' 'unsafe-inline'` — read `apps/docs/DEPLOY.md` for why both are
there, and do not "tidy" them away.

## Accepting must start analytics without a reload

This is the design trap of the lot.

Today each layout mounts the banner next to a comment marking where analytics goes. If you mount
the script beside it and read consent once at render, a visitor who clicks "allow" gets nothing
until they navigate or reload: the read already happened. The pageview that motivated the
consent is lost, and it looks like the choice did nothing.

So consent has to be **state**, not a one-time read:

- A client component owns the consent value, renders `CookieBanner`, and injects the script only
  when that value is `'all'`.
- `onAccept` updates the state, so the script loads immediately.
- `onEssentials` leaves it absent.
- Initial state comes from `readConsent()`, so a returning visitor who accepted before gets
  analytics without seeing the banner again.
- The script is injected **once**. Re-renders must not append a second tag.

`mayLoadAnalytics()` stays the contract for anything outside React. Do not delete it and do not
duplicate its storage key — import it, as lots 5 and 7 do.

This replaces the comment placeholder in both layouts, and it is the only structural change this
lot makes to what those lots shipped.

## What must not be collected

- **No session recording.** Whatever the option is called, it is off. Verify no recording
  requests leave the page.
- **No identify call**, no user id, nothing that correlates visits into a person. The policy
  says the project builds no profile; keep that true.
- If the script's defaults do any of the above, stop and report — do not ship it and patch the
  policy to match.

## The policy has to name it now

The shared policy at `apps/site/app/[lang]/privacy` says analytics is not running, and promises
the provider will be named before anything is collected. **This lot is when that promise comes
due.**

Update the analytics section, both locales, to say: it runs only after consent; it is OpenPanel,
self-hosted by the maintainer, so the measurements do not go to a third-party company; it counts
page views and events, does not record sessions and builds no profile; and "only essentials"
keeps it off.

Also add, in the storage section, that **consent is per domain**: accepting on `lyra-ds.dev` does
not carry to `docs.lyra-ds.dev`, because browsers scope storage per origin. A reader who sees the
banner twice should find that explained rather than assume it is broken.

Keep the surrounding voice. Do not rewrite sections that are already correct.

## Acceptance criteria

1. **Unconfigured:** no script tag, no request off-origin, and the generated `_headers` is
   byte-identical to today's. Prove it with a diff.
2. **Configured** with a fake origin: the generated `_headers` carries it in `script-src` and
   `connect-src` and nowhere else. Paste the file.
3. Clicking "allow" loads the script **without a reload** — show the request appearing after the
   click, not before.
4. Clicking "only essentials" produces **zero** requests to that origin, before and after.
5. A returning visitor with `'all'` stored gets the script on load and sees no banner.
6. The script tag is injected exactly once across re-renders and route changes.
7. No recording and no identify call. Report every request the page makes to the configured
   origin, with its path.
8. Both apps serve with zero CSP violations on the routes lots 6 and 7 used — including the docs
   page whose example renders in an iframe.
9. The policy names OpenPanel, says it is self-hosted, says sessions are not recorded, and
   explains that consent is per domain — both locales.
10. `axe.run` still clean with the banner visible and dismissed, both apps, both locales.
11. The four CI jobs' commands run, with real output reported and anything unrunnable named.

## Boundaries

- **Do not touch `packages/`.**
- Do not install an OpenPanel npm package.
- Do not add any origin other than the configured one to any CSP directive.
- Do not enable recording, heatmaps, or anything that captures interaction.
- Do not add a second provider or a fallback.
- Do not extract a shared package for the consent/analytics wiring — the user decided against it
  for now; the duplication between the two apps is accepted and known.
- Do not commit, branch or push.
