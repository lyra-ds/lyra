// tsdown build contract for @lyra-ds/react (RESEARCH Pattern 1, D-13).
//
// - The keys in `entries` are the emitted dist basenames and MUST match the package.json
//   exports-map subpaths (`.` -> index, `./button` -> button, ...). The 03-08 dist
//   assertions and publint/attw gates depend on this 1:1 filename contract.
// - Each entry builds in its own tsdown config, with `outputOptions.codeSplitting: false`
//   explicitly set on every build. This prevents shared code from being hoisted into
//   chunk-*.js files. The only shared internal code is tiny cx/scale utilities, so
//   per-entry duplication is negligible.
// - Dual `format: ['esm','cjs']` + `dts: true` emits .js/.cjs plus split .d.ts/.d.cts so
//   attw sees per-condition types (no FalseCJS/FalseESM).
// - RSC `"use client";` directive: emitted deterministically on EVERY js/cjs output by the
//   `scripts/use-client.mjs` post-build step. Rolldown strips leading directive prologues
//   from bundles, so adding it after all tsdown builds finish is the reliable mechanism.
//   The dist grep + next-app RSC fixture verify it in plan 03-08.
//   (Trade-off: prepending one line makes sourcemaps off-by-one for the directive line only —
//   the standard, tolerated cost of this well-known bundler workaround.)
// - `deps.neverBundle`: react/react-dom/jsx-runtime are peers and never bundled. lucide-react
//   is a runtime dependency, so it is also externalized — never bundle the icon set.
import { defineConfig } from 'tsdown';

const entries = {
  index: 'src/index.ts',
  button: 'src/button/index.ts',
  input: 'src/input/index.ts',
  textarea: 'src/textarea/index.ts',
  checkbox: 'src/checkbox/index.ts',
  radio: 'src/radio/index.ts',
  'radio-group': 'src/radio-group/index.ts',
  'checkbox-group': 'src/checkbox-group/index.ts',
  fieldset: 'src/fieldset/index.ts',
  separator: 'src/separator/index.ts',
  switch: 'src/switch/index.ts',
  'file-upload': 'src/file-upload/index.ts',
  'file-manager': 'src/file-manager/index.ts',
  calendar: 'src/calendar/index.ts',
  'time-picker': 'src/time-picker/index.ts',
  'date-picker': 'src/date-picker/index.ts',
  'date-range-picker': 'src/date-range-picker/index.ts',
  dialog: 'src/dialog/index.ts',
  drawer: 'src/drawer/index.ts',
  'bottom-sheet': 'src/bottom-sheet/index.ts',
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
  popover: 'src/popover/index.ts',
  combobox: 'src/combobox/index.ts',
  table: 'src/table/index.ts',
  'data-table': 'src/data-table/index.ts',
  'person-cell': 'src/person-cell/index.ts',
  'action-bar': 'src/action-bar/index.ts',
  'sidebar-group': 'src/sidebar-group/index.ts',
  'app-sidebar': 'src/app-sidebar/index.ts',
  'bottom-nav': 'src/bottom-nav/index.ts',
  toast: 'src/toast/index.ts',
  'toast-provider': 'src/toast-provider/index.ts',
  'cookie-banner': 'src/cookie-banner/index.ts',
  'command-palette': 'src/command-palette/index.ts',
};

export default defineConfig(
  Object.entries(entries).map(([name, entry], index) => ({
    entry: { [name]: entry },
    format: ['esm', 'cjs'],
    dts: true,
    target: 'es2022',
    outExtensions: ({ format }) =>
      format === 'cjs' ? { js: '.cjs', dts: '.d.cts' } : { js: '.js', dts: '.d.ts' },
    sourcemap: true,
    clean: index === 0,
    treeshake: true,
    outputOptions: {
      codeSplitting: false,
    },
    deps: {
      neverBundle: ['react', 'react-dom', 'react/jsx-runtime', 'lucide-react'],
    },
  })),
);
