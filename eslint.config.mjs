import globals from 'globals';
//eslint-disable-next-line
import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      parser: tsParser,
      globals: globals.browser,
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      ...ts.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': [
        'warn', // Exibe apenas um aviso, em vez de erro
        {
          fixToUnknown: false, // Não sugere corrigir para `unknown`
          ignoreRestArgs: true, // Permite `...args: any[]` em funções
        },
      ],
    },
  },
];
