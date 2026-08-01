// tsup build contract for @lyra-ds/react (RESEARCH Pattern 1, D-13).
//
// - Object-form `entry`: the KEYS are the emitted dist basenames and MUST match the
//   package.json exports-map subpaths (`.` -> index, `./button` -> button, ...). The
//   03-08 dist assertions and publint/attw gates depend on this 1:1 filename contract.
// - `splitting: false`: tsup's default ESM code-splitting would hoist shared code into
//   chunk-*.js files, breaking the exports-map <-> filename mapping. The only shared
//   internal code is tiny cx/scale utilities, so per-entry duplication is negligible.
// - Dual `format: ['esm','cjs']` + `dts: true` emits .js/.cjs plus split .d.ts/.d.cts so
//   attw sees per-condition types (no FalseCJS/FalseESM).
// - RSC `"use client";` directive: emitted deterministically on EVERY js/cjs output by the
//   `onSuccess` post-write step below. tsup 8.5.1's `banner` option does NOT work for this —
//   tsup routes esbuild output through Rollup (unconditionally, and always when `treeshake` is
//   on), and Rollup strips leading `"use client"`/`"use strict"` directive prologues from the
//   bundle. esbuild's own banner is therefore discarded before write. The post-write prepend is
//   the reliable mechanism; the dist grep + next-app RSC fixture verify it in plan 03-08.
//   (Trade-off: prepending one line makes sourcemaps off-by-one for the directive line only —
//   the standard, tolerated cost of this well-known tsup+"use client" workaround.)
// - `external`: react/react-dom/jsx-runtime are peers and never bundled. lucide-react is a
//   runtime dependency, so tsup auto-externalizes it — never bundle the icon set.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { defineConfig } from 'tsup';

const USE_CLIENT = '"use client";';

/** Guarantee the RSC directive is the first line of every emitted JS/CJS chunk. */
async function ensureUseClientDirective(distDir = 'dist'): Promise<void> {
  const files = await readdir(distDir);
  await Promise.all(
    files
      .filter((f) => f.endsWith('.js') || f.endsWith('.cjs'))
      .map(async (f) => {
        const path = join(distDir, f);
        const code = await readFile(path, 'utf8');
        if (/^\s*["']use client["']/.test(code)) return;
        await writeFile(path, `${USE_CLIENT}\n${code}`);
      }),
  );
}

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    button: 'src/button/index.ts',
    input: 'src/input/index.ts',
    textarea: 'src/textarea/index.ts',
    checkbox: 'src/checkbox/index.ts',
    radio: 'src/radio/index.ts',
    switch: 'src/switch/index.ts',
    'file-upload': 'src/file-upload/index.ts',
    'file-manager': 'src/file-manager/index.ts',
    dialog: 'src/dialog/index.ts',
    drawer: 'src/drawer/index.ts',
    'create-workspace-dialog': 'src/create-workspace-dialog/index.ts',
    'workspace-switcher': 'src/workspace-switcher/index.ts',
    icon: 'src/icon/index.ts',
    'icon-button': 'src/icon-button/index.ts',
    badge: 'src/badge/index.ts',
    tag: 'src/tag/index.ts',
    card: 'src/card/index.ts',
    container: 'src/container/index.ts',
    shell: 'src/shell/index.ts',
    navbar: 'src/navbar/index.ts',
    'nav-link': 'src/nav-link/index.ts',
    footer: 'src/footer/index.ts',
    brand: 'src/brand/index.ts',
    'table-of-contents': 'src/table-of-contents/index.ts',
    'code-block': 'src/code-block/index.ts',
    'segmented-control': 'src/segmented-control/index.ts',
    grid: 'src/grid/index.ts',
    'page-header': 'src/page-header/index.ts',
    stack: 'src/stack/index.ts',
    'theme-provider': 'src/theme-provider/index.ts',
    avatar: 'src/avatar/index.ts',
    alert: 'src/alert/index.ts',
    spinner: 'src/spinner/index.ts',
    skeleton: 'src/skeleton/index.ts',
    progress: 'src/progress/index.ts',
    stat: 'src/stat/index.ts',
    'empty-state': 'src/empty-state/index.ts',
    breadcrumb: 'src/breadcrumb/index.ts',
    tabs: 'src/tabs/index.ts',
    accordion: 'src/accordion/index.ts',
    stepper: 'src/stepper/index.ts',
    pagination: 'src/pagination/index.ts',
    tooltip: 'src/tooltip/index.ts',
    select: 'src/select/index.ts',
    dropdown: 'src/dropdown/index.ts',
    combobox: 'src/combobox/index.ts',
    table: 'src/table/index.ts',
    'sidebar-group': 'src/sidebar-group/index.ts',
    toast: 'src/toast/index.ts',
    'cookie-banner': 'src/cookie-banner/index.ts',
    'command-palette': 'src/command-palette/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  target: 'es2022',
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  onSuccess: () => ensureUseClientDirective(),
});
