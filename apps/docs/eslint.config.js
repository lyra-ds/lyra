// Flat ESLint config for @lyra-ds/docs (ESLint 10), mirroring packages/react/eslint.config.js.
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  { ignores: ['.next/**', '.source/**', 'out/**', 'next-env.d.ts', '.source.ts'] },
  ...tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  jsxA11y.flatConfigs.recommended,
  {
    // MDX exports a component whose `components` override map is inherently polymorphic — each
    // override replaces a different element (h1, p, code, ...) with a different prop shape, so
    // there is no single precise prop type to give ComponentType here. Verified: narrowing to
    // `ComponentType<Record<string, unknown>>` breaks tsc (contravariant prop mismatch against
    // each MDX component's real, narrower prop type).
    files: [
      'components/component-page.tsx',
      'components/document-content.tsx',
      'components/foundation-page.tsx',
      'components/guide-page.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // These effects synchronize with genuinely external systems the compiler-oriented rules
    // don't model: a same-origin iframe's own document (IsolatedPreview's portal/theme mirroring
    // — mutating iframeDocument is not React state), a client-only mount flag needed because the
    // iframe/portal work below cannot run during SSR, and re-derivations driven by browser
    // navigation (route change) or post-render DOM content (MDX-rendered headings) rather than by
    // props available during render.
    files: ['components/example-view.tsx', 'components/mobile-nav.tsx', 'components/toc.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
    },
  },
);
