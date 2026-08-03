# Deploying Lyra

Two properties come out of this repository, both as static exports on Cloudflare Pages:

| Property          | App         | Domain             |
| ----------------- | ----------- | ------------------ |
| Marketing landing | `apps/site` | `lyra-ds.dev`      |
| Documentation     | `apps/docs` | `docs.lyra-ds.dev` |

**The build runs on GitHub Actions, not on Cloudflare.** Every push to `main` runs
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds both apps and
publishes the ready-made `out/` directories to two Cloudflare Pages projects via
`wrangler pages deploy` (Direct Upload). Cloudflare never builds anything — it only serves
files that were built and gated here.

Each app has its own `DEPLOY.md` with the reasoning behind its Content-Security-Policy; this
file is the operational walkthrough.

## Why the build does not run on Cloudflare

It used to be configured that way, and it failed. The failure looks unrelated to memory:

```
packages/react build: ESM ⚡️ Build success in 2946ms
packages/react build: Error [ERR_WORKER_OUT_OF_MEMORY]:
  Worker terminated due to reaching memory limit: JS heap out of memory
```

The JavaScript bundles compile in about three seconds. What runs out of memory is the
**declaration build**: `@lyra-ds/react` has 51 entry points, one per component, and generating
their `.d.ts` files pushes `rollup-plugin-dts` past 2 GB of heap in a worker thread. Measured,
not guessed: the build fails at 2048 MB and succeeds at 2560 MB. Cloudflare's build container
kept failing on exactly this even after the requirement was identified, while GitHub Actions
runners build it reliably with `NODE_OPTIONS=--max-old-space-size=8192` (set in the workflow,
~60% headroom). Rather than fighting an opaque build container, the build moved here.

Building in one place also means one gate: the artifact that ships is produced by the same
runner family that ran CI, and a Cloudflare-side build can never drift from it. If a future
change raises the memory cost further, the workflow's `NODE_OPTIONS` value is the first thing
to raise; the real fix is the planned move from tsup to tsdown.

## Before you start

- The domain `lyra-ds.dev` must have its DNS managed by Cloudflare.
- You need a Cloudflare API token (see below) — this is the one real secret in the pipeline.
  The two analytics variables are public by construction: a client id shipped in a static
  bundle is readable by anyone who opens the page.

## Creating the Pages projects

The projects must be **Direct Upload** projects — a Pages project connected to Git cannot
receive `wrangler pages deploy`. If the projects exist today as Git-connected builds, delete
them (or create new ones under different names and move the domains after the first deploy).

With `wrangler` authenticated against the right account:

```sh
npx wrangler pages project create lyra-ds-site --production-branch=main
npx wrangler pages project create lyra-ds-docs --production-branch=main
```

The names `lyra-ds-site` and `lyra-ds-docs` are hardcoded in `deploy.yml`; if you pick
different ones, change them there in the same commit.

## GitHub configuration

In the repository settings (**Settings → Secrets and variables → Actions**):

**Secrets** — used by the deploy step only:

| Secret                  | Value                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | An API token with the **Cloudflare Pages: Edit** permission, scoped to this account. Nothing else — least privilege holds. |
| `CLOUDFLARE_ACCOUNT_ID` | The account id shown on the Cloudflare dashboard's overview page.                                                          |

**Variables** — public by construction, so they are variables, not secrets:

| Variable                          | Value                                                                |
| --------------------------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_OPENPANEL_URL`       | your self-hosted instance origin, e.g. `https://metrics.example.com` |
| `NEXT_PUBLIC_OPENPANEL_CLIENT_ID` | the project's client id                                              |

One OpenPanel project covers both domains, so **the same client id serves both properties**.
That is what makes the journey from landing to documentation show up as one path rather than
two unrelated visits.

They are `NEXT_PUBLIC_` because a static export has no server: the values are inlined into the
bundle at build time. Changing either one requires a redeploy (re-run the workflow).

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

## Deploy order

**The landing publishes before the docs, in the same workflow run.** The documentation's
consent banner links to the privacy policy hosted on `lyra-ds.dev`; if the docs went live
first, that link would 404 until the landing followed. The workflow encodes this — the two
`wrangler pages deploy` steps run sequentially, landing first.

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

## When deploys happen

Every push to `main` deploys both properties — they share the library in `packages/`, so
narrowing by path would skip real changes. The workflow can also be run by hand from the
Actions tab (`workflow_dispatch`), which is how you redeploy after changing an analytics
variable. Runs queue rather than cancel each other, so a deploy is never interrupted
mid-publish; a queued run redeploys both properties from the newest commit.

> Note: the react build script uses a POSIX inline env assignment (`NODE_OPTIONS='...' tsdown`).
> Windows contributors should build via WSL; the repo tooling is Linux-first.
