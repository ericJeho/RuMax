import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/**
 * ESLint flat config.
 *
 * Next 16 removed the `next lint` command, so linting now runs through the ESLint CLI
 * directly. `eslint-config-next` 16 exports native flat-config arrays, so this needs no
 * `FlatCompat` shim — the arrays spread straight in.
 *
 * The rules below are carried over unchanged from the previous .eslintrc.json.
 */
const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: ['node_modules/**', '.next/**', 'prisma/migrations/**', 'prisma/seed.ts'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'react/no-unescaped-entities': 'off',

      // --- React Compiler rules, new in Next 16 -------------------------------------
      // These arrived with eslint-config-next 16 and flagged 22 existing call sites.
      // Two were genuine and are fixed in this change: an animation loop started during
      // render in components/motion.tsx, and a clock read during render in the lecturer
      // assignment composer.
      //
      // The rest are reported as warnings rather than errors, for two distinct reasons:
      //
      //   `purity` fires only on server components here — reading Date.now() while
      //   rendering a page that runs once per request is the intended behaviour, not an
      //   impurity. The rule assumes a component the React Compiler will memoise, which
      //   server components are not.
      //
      //   `set-state-in-effect`, `refs` and `immutability` fire on real client
      //   components, but on the standard SSR patterns: a mounted flag before portalling,
      //   rehydrating a draft from localStorage, and setting document.documentElement.dir
      //   inside an event handler. Rewriting those is a behavioural change to tested code
      //   and belongs in its own change, not bundled into a framework upgrade.
      //
      // They stay visible in every lint run rather than being switched off.
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
];

export default config;
