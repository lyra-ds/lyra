// Flat ESLint config for @lyra-ds/react (ESLint 10, RESEARCH Open Question 2).
//
// The load-bearing rule is RCT-03: `no-restricted-imports` bans every `.css` import inside
// packages/react/src. This package publishes with `sideEffects: false`, so a stray CSS import
// would be SILENTLY DROPPED by consumer bundlers — appearance must flow only through the
// .lyra-* classes shipped by @lyra-ds/styles. This lint rule is the CI-enforced guard.
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  { ignores: ['dist/**'] },
  ...tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  jsxA11y.flatConfigs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*.css', '**/*.css'],
              message:
                'No CSS imports in @lyra-ds/react/src. Appearance lives only in @lyra-ds/styles (.lyra-* classes). This package is sideEffects:false, so a CSS import would be silently dropped by consumer bundlers (RCT-03).',
            },
          ],
        },
      ],
    },
  },
);
