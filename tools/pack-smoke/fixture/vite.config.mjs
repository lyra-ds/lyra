// Minimal Vite consumer config for the packed-artifact smoke test.
// A plain object (no `import ... from "vite"`) is used deliberately: this file is
// copied into a throwaway temp fixture that has ONLY the packed @lyra-ds/styles
// tarball installed — `vite` itself is resolved from the monorepo binary, not the
// fixture — so the config must not require `vite` to be resolvable from the fixture.
export default {
  logLevel: 'silent',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: 'main.js',
    },
  },
};
