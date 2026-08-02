# Deploying Lyra

Two properties come out of this repository, both as static exports on Cloudflare Pages:

| Property          | App         | Domain             |
| ----------------- | ----------- | ------------------ |
| Marketing landing | `apps/site` | `lyra-ds.dev`      |
| Documentation     | `apps/docs` | `docs.lyra-ds.dev` |

They are two separate Cloudflare Pages projects reading the same repository. Each app has its
own `DEPLOY.md` with the reasoning behind its Content-Security-Policy; this file is the
operational walkthrough.

## Before you start

- The domain `lyra-ds.dev` must have its DNS managed by Cloudflare.
- Nothing here needs a secret. The two analytics variables are public by construction — a
  client id shipped in a static bundle is readable by anyone who opens the page.

## Deploy the landing first

**Order matters.** The documentation's consent banner links to the privacy policy hosted on
`lyra-ds.dev`. If the docs go live first, that link 404s until the landing follows.

## Creating a project

In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, then pick
the `lyra-ds/lyra` repository.

| Setting                | Landing                                    | Documentation                              |
| ---------------------- | ------------------------------------------ | ------------------------------------------ |
| Production branch      | `main`                                     | `main`                                     |
| Framework preset       | None                                       | None                                       |
| Root directory         | `/`                                        | `/`                                        |
| Build command          | `pnpm --filter @lyra-ds/site... run build` | `pnpm --filter @lyra-ds/docs... run build` |
| Build output directory | `apps/site/out`                            | `apps/docs/out`                            |

Two things about the build command that look like typos and are not:

- **The trailing `...` is pnpm syntax**, not an ellipsis. It means "this package _and its
  workspace dependencies_", which is what makes `@lyra-ds/react` build before the app that
  imports it. Without it the build fails on a missing `dist`.
- **Root directory stays `/`.** The command is a workspace filter that only resolves from the
  repository root. Pointing Cloudflare at `apps/site` breaks it.

Node and pnpm need no configuration: `.nvmrc` pins Node 24 and `packageManager` pins
pnpm 11.13.1, and Cloudflare reads both.

## Environment variables

Set these on **both** projects, for **Production and Preview**:

| Variable                          | Value                                                                |
| --------------------------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_OPENPANEL_URL`       | your self-hosted instance origin, e.g. `https://metrics.example.com` |
| `NEXT_PUBLIC_OPENPANEL_CLIENT_ID` | the project's client id                                              |

One OpenPanel project covers both domains, so **the same client id goes to both Pages
projects**. That is what makes the journey from landing to documentation show up as one path
rather than two unrelated visits.

They are `NEXT_PUBLIC_` because a static export has no server: the values are inlined into the
bundle at build time. Changing either one requires a redeploy.

### What happens if you leave them out

Nothing breaks. The build succeeds, the site ships, and:

- no analytics script is loaded,
- the generated `_headers` is byte-identical to the version without analytics,
- the consent banner still appears and still records the choice.

This is deliberate. The Content-Security-Policy is generated from the same variable that
configures the script, so a missing value cannot produce a page that loads analytics past a
policy that forbids it. It fails closed.

### If your instance serves its API elsewhere

The integration derives the API endpoint as `<origin>/api`, which is what OpenPanel's
self-hosting guide documents. If your deployment puts the API on a different host, that
derivation is the one place to change — `apps/*/components/consent-analytics.tsx`.

## Custom domains

After the first green deploy, each project gets its domain under **Custom domains**:

- landing → `lyra-ds.dev` (add `www.lyra-ds.dev` as a redirect if you want one)
- documentation → `docs.lyra-ds.dev`

## Verifying a deploy

The `*.pages.dev` URL is enough to check everything below before pointing a domain at it.

1. **The policy is served.** `curl -sI <url> | grep -i content-security-policy` must return a
   policy. If it is missing, `_headers` did not reach the output directory.
2. **Analytics respects the choice.** Open the page with the network panel: nothing should be
   requested from the OpenPanel origin until you click "allow", and clicking it should load the
   script without a reload.
3. **"Only essentials" is silent.** Choosing it must produce zero requests to that origin.
4. **The docs previews render.** On any component page, the isolated example iframes must show
   content. A blank frame means the CSP lost `frame-src 'self'`.

## Both projects rebuild on every push

They share a repository, so a push to `main` triggers both builds. That is expected. If it
becomes noisy, Cloudflare's build-watch paths can narrow each project to its own directory —
but note that both apps depend on `packages/`, so any such filter has to include it.
