// tsdown build contract for @lyra-ds/alpine — same filename contract as @lyra-ds/react:
// entry keys are the emitted dist basenames and MUST match the package.json exports-map
// subpaths. Single "." entry: the plugin registers every Alpine.data() on install, so
// per-component subpaths would not enable any extra tree-shaking (Alpine components are
// resolved by name at runtime, not by import).
//
// - Dual format + dts: true emits .js/.cjs plus split .d.ts/.d.cts so attw sees
//   per-condition types (no FalseCJS/FalseESM).
// - alpinejs is a peer and never bundled. The public plugin signature uses the local
//   structural LyraAlpine type, so the emitted d.ts has no import of 'alpinejs' —
//   consumers do not need @types/alpinejs for our types to resolve.
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: true,
  target: 'es2022',
  outExtensions: ({ format }) =>
    format === 'cjs' ? { js: '.cjs', dts: '.d.cts' } : { js: '.js', dts: '.d.ts' },
  sourcemap: true,
  clean: true,
  treeshake: true,
  outputOptions: { codeSplitting: false },
  deps: { neverBundle: ['alpinejs'] },
});
