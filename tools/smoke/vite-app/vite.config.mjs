// Vite consumer config for the @lyra-ds/react scratch-app smoke test (D-27).
//
// Unlike the pack-smoke fixture (which resolves the monorepo's vite binary and so
// avoids importing vite), THIS fixture pins and installs its OWN vite +
// @vitejs/plugin-react (review fix: the plugin resolves vite as a peer, so a
// self-contained install is the only reproducible shape). Importing the plugin here
// is therefore safe — it is a real installed dependency of the temp fixture copy.
//
// `vite build` runs in production mode: it defines `process.env.NODE_ENV = "production"`,
// which is what dead-code-eliminates the Icon dev-only `console.warn` guard — the
// 03-05 production-silence proof that smoke.mjs asserts against the emitted JS.
import react from '@vitejs/plugin-react';

export default {
  logLevel: 'silent',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
};
