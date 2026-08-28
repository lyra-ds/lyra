import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const revisionPattern = /^[a-f0-9]{40}$/u;
const utcTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

function requiredRevision(): string {
  const revision = process.env.LYRA_EVIDENCE_REVISION;
  if (revision === undefined || !revisionPattern.test(revision)) {
    throw new Error('LYRA_EVIDENCE_REVISION must be a full 40-character lowercase Git SHA.');
  }
  return revision;
}

function requiredBuildTime(): string {
  const buildTime = process.env.LYRA_EVIDENCE_BUILD_TIME;
  const parsed = buildTime === undefined ? Number.NaN : Date.parse(buildTime);
  if (
    buildTime === undefined ||
    !utcTimestampPattern.test(buildTime) ||
    !Number.isFinite(parsed) ||
    new Date(parsed).toISOString() !== buildTime
  ) {
    throw new Error('LYRA_EVIDENCE_BUILD_TIME must be an ISO 8601 UTC timestamp.');
  }
  return buildTime;
}

if (process.env.FILE_UPLOAD_EVIDENCE !== '1') {
  throw new Error('FILE_UPLOAD_EVIDENCE must be exactly "1".');
}

const revision = requiredRevision();
const buildTime = requiredBuildTime();
const root = import.meta.dirname;

export default defineConfig({
  root,
  base: '/',
  define: {
    __LYRA_EVIDENCE_REVISION__: JSON.stringify(revision),
    __LYRA_EVIDENCE_BUILD_TIME__: JSON.stringify(buildTime),
  },
  plugins: [
    {
      name: 'lyra-file-upload-evidence-metadata',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          return html
            .replaceAll('__LYRA_EVIDENCE_REVISION__', revision)
            .replaceAll('__LYRA_EVIDENCE_BUILD_TIME__', buildTime);
        },
      },
    },
  ],
  build: {
    outDir: resolve(root, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'en/file-upload-evidence/index': resolve(root, 'en/file-upload-evidence/index.html'),
        'pt-BR/file-upload-evidence/index': resolve(root, 'pt-BR/file-upload-evidence/index.html'),
      },
      output: {
        entryFileNames: 'assets/evidence-[name]-[hash].js',
        chunkFileNames: 'assets/evidence-[name]-[hash].js',
        assetFileNames: 'assets/evidence-[name]-[hash][extname]',
      },
    },
  },
});
