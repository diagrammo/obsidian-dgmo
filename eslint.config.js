import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import obsidianmd from 'eslint-plugin-obsidianmd';
// Deep path: the package has no `exports` map, and is pinned exactly.
import { DEFAULT_BRANDS } from 'eslint-plugin-obsidianmd/dist/lib/rules/ui/brands.js';

export default tseslint.config(
  { ignores: ['dist', 'main.js', 'node_modules'] },
  // Obsidian's own rules — the set its community-directory release scan runs
  // (issue diagrammo/diagrammo#1010). First, so the project's choices below
  // win wherever the two overlap; scoped to src/, which is what the scan reads.
  // Its package.json entries are dropped: they switch the parser to JSON, and
  // `extends` under a `files` glob would apply that to every .ts file.
  {
    files: ['src/**/*.ts'],
    extends: [...obsidianmd.configs.recommended].filter(
      (c) => !c.files?.includes('package.json')
    ),
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // The default brand list includes Cursor (the IDE), which pushes the
      // ordinary word "cursor" to a capital, so it is dropped; Slate is our
      // palette's name and Ctrl/Cmd-P a key chord, not prose. The release scan does not report
      // this rule (checked on the 1.38.7 scan, 2026-10-01).
      'obsidianmd/ui/sentence-case': [
        'warn',
        {
          brands: DEFAULT_BRANDS.filter((b) => b !== 'Cursor'),
          ignoreWords: ['Slate'],
          ignoreRegex: ['^Ctrl/Cmd-'],
        },
      ],
    },
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // The `no-unsafe-*` family and the two assertion rules below are ON here,
      // against the dgmo + app convention of switching them off. Obsidian's
      // store scorecard reports them, and this source satisfies all of them
      // today (verified 2026-08-03), so leaving them enabled is what stops the
      // count creeping back up between releases. Turn one off only with a
      // reason written next to it.
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/no-implied-eval': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    files: ['*.mjs', 'scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
    ...tseslint.configs.disableTypeChecked,
  }
);
