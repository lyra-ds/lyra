# One FileManager retry
Read v1-file-manager-icons-brief.md; same scope and contracts. Controller source40/40 each Chromium/WebKit/Firefox, SSR1 and types PASS. Controller applied deterministic Prettier normalization to the initial delivery. The remaining failure is real lint:


/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/file-manager/file-manager.tsx
  144:11  error  Error: Cannot create components during render

Components created during render will reset their state each time they are created. Declare components outside of render.

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/file-manager/file-manager.tsx:144:11
  142 |   const FileIcon = fmIconFor(file);
  143 |
> 144 |   return <FileIcon className="lyra-icon" size={size} aria-hidden="true" />;
      |           ^^^^^^^^ This component is created during render
  145 | }
  146 |
  147 | function defaultActions(file: ManagedFile, labels: Required<FileManagerLabels>): DropdownItem[] {

/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/file-manager/file-manager.tsx:142:20
  140 |
  141 | function FileManagerIcon({ file, size }: { file: ManagedFile; size: number }) {
> 142 |   const FileIcon = fmIconFor(file);
      |                    ^^^^^^^^^^^^^^^ The component is created during render here
  143 |
  144 |   return <FileIcon className="lyra-icon" size={size} aria-hidden="true" />;
  145 | }  react-hooks/static-components

✖ 1 problem (1 error, 0 warnings)


Make the existing fixed-glyph selection compatible with the project's static-components rule. Do not suppress/disable the rule, use createElement to evade it, change public types/DOM/output or extract whole row/button rendering. Keep eligibility/mapping exact, including all current extensions/fallback. Existing Icon's static registry lookup is repository evidence, but no change to global Icon/registry is allowed. No other refactor.
This retry explicitly permits only the pinned prettier --write on this runtime file and pinned eslint on this file; run no build/package managers/browser tests/commits/delegation. Controller reruns all checks. Return exact commands/output and unverified items.
