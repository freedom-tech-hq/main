import 'eslint-plugin-import-extensions';
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsdoc from 'eslint-plugin-tsdoc';
import _import from 'eslint-plugin-import';
import preferArrow from 'eslint-plugin-prefer-arrow';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import { merge } from 'lodash-es';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

const baseConfig = [
  {
    ignores: [
      '**/indexHtml.ts',
      '**/coverage/**/*',
      '**/lib/**/*',
      '**/eslint.config.mjs',
      '**/jest.config.mjs',
      '.prettierrc.mjs',
      '**/src/assets/**/index.ts'
    ]
  },
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:import/errors',
      'plugin:import/warnings',
      'plugin:import/typescript',
      'plugin:prettier/recommended',
      'plugin:import-extensions/recommended',
      'prettier'
    )
  ),
  {
    plugins: {
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
      tsdoc,
      import: fixupPluginRules(_import),
      'prefer-arrow': preferArrow,
      prettier: fixupPluginRules(prettier),
      'simple-import-sort': simpleImportSort,
      react: fixupPluginRules(react),
      'react-hooks': fixupPluginRules(reactHooks)
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',

      parserOptions: {
        project: ['tsconfig.json'],

        ecmaFeatures: {
          jsx: true,
          modules: true
        }
      }
    },

    settings: {
      'import/resolver': {
        node: {
          paths: ['src'],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          moduleDirectory: ['node_modules', 'src']
        }
      },
      react: {
        version: 'detect'
      }
    },

    rules: {
      'import/namespace': 'off',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'separate-type-imports' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],

      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'no-constant-condition': 'off',
      'no-extra-boolean-cast': 'off',
      'no-unused-labels': 'off',
      eqeqeq: ['error', 'always'],

      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-unresolved': ['error', { ignore: ['\\.js$'] }],
      'import-extensions/require-extensions': ['error', { expectedExtensions: ['ts', 'tsx', 'mjs', 'cjs', 'js'] }],
      'import-extensions/require-index': ['error', { expectedExtensions: ['ts', 'tsx', 'mjs', 'cjs', 'js'] }],

      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'tsdoc/syntax': 'warn'
    }
  }
];

const makeConfig = ({ files, enableReact, rules }) => {
  const config = { files, rules };

  if (enableReact) {
    merge(config, { rules: react.configs.recommended.rules });
    merge(config, {
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/display-name': 'off',
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off'
      }
    });
  }

  return [config];
};

export default [
  ...baseConfig,
  ...makeConfig({ files: ['web-packages/**/*.ts?(x)'], enableReact: true }),
  ...makeConfig({ files: ['apps/**/*.ts?(x)'], enableReact: true })
];
