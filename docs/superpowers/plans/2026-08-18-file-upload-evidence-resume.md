# Resume: FileUpload Manual Evidence Preview

## Where to resume

- Working branch: `docs/data-files-family-design`
- Temporary remote ref: `evidence/file-upload-manual`
- Last preview implementation commit: `2d8880ccb7555a9df226203c1931a69d5847f99f`
- Styled immutable preview: <https://40d8af3c.lyra-ds-docs.pages.dev/pt-BR/file-upload-evidence/>
- Workflow run: <https://github.com/lyra-ds/lyra/actions/runs/32144718528>

The temporary ref is intentionally separate from `main`. Its workflow can publish only the
`lyra-ds-docs` preview on the `file-upload-evidence` Pages branch; the production `deploy` job
is skipped for this ref. Do not use the branch alias as a manual-evidence record URL.

## Completed work

- The manual evidence harness, contract gates, immutable-preview policy, and remote scenario
  traversal were implemented and independently reviewed.
- `5c482ac` fixes the preview workflow's smoke argument forwarding. The preceding preview run
  completed successfully, including its remote smoke.
- `2d8880c` applies the existing Lyra evidence shell, tokens, sections, fields, cards, and
  buttons to the static no-JavaScript and delayed-Alpine fixtures. It preserves native multipart
  forms and their semantic IDs.
- The new visual output was inspected at a Galaxy-class viewport. The static asset served by the
  URL above contains the Lyra classes and stylesheet.

## Latest verification

- Harness Node suite: 178/178 passing.
- Static-output regression: 13/13 passing.
- Harness typecheck and preview build: passing.
- Formatting, diff check, and Impeccable detector: passing (`[]`).
- Local full Browser Mode is not runnable on this host because cached WebKit requires
  `libicudata.so.74`; do not install host libraries or weaken the test. The official Playwright
  image remains the supported environment for the full matrix.

## Current deployment caveat

The workflow in run `32144718528` built and published the preview, then resolved the immutable
URL. Its final smoke failed because the native multipart Function returned a revision that did
not yet match the just-published static revision. This occurred immediately after deployment;
the page and CSS at the immutable URL are the new revision. Do not mark M04 as passed from that
run. On the next authorized continuation, diagnose Function/static propagation with the exact
smoke command before changing code or rerunning a workflow.

## Manual validation to perform

On the Samsung Galaxy S25 Ultra, record only the observations the device can actually support:

1. Open the immutable PT-BR URL and confirm the displayed revision begins with `2d8880c`.
2. In `DF-FU-M03`, use touch in portrait and landscape. Check no horizontal overflow, reachable
   actions, cancel/retry/remove behavior, focus recovery where observable, and retained long-file
   identity.
3. Increase browser text scaling or page zoom as far as the device permits and repeat the overflow
   and reachability checks.
4. Test the native form and delayed Alpine form with a small local file. If the response revision
   differs from the page revision, capture it as a failure artifact instead of marking it passed.
5. Attach screenshots or a screen recording to the recorder, then export only evidence that the
   guided checklist truthfully supports.

Do not attest M01 (Windows + NVDA), M02 (macOS + VoiceOver + Safari), or the full M04 no-JS
scenario from the Galaxy. Complete those later on the required platforms.

## Safe next commands

```text
rtk git fetch origin evidence/file-upload-manual
rtk git log --oneline --decorate -8 origin/evidence/file-upload-manual
rtk git status --short --branch
```

If continuation includes a new preview deployment, first verify that the temporary ref points to
the reviewed commit, push it without force, dispatch `deploy.yml` explicitly on
`evidence/file-upload-manual`, and require the production `deploy` job to be skipped. Preserve
the immutable URL and any exported manual artifacts; do not deploy `main` or the landing site.
