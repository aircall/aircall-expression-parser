module.exports = {
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
        paths: ['node_modules/', 'node_modules/@types'],
      },
    },
  },
  plugins: ['eslint-plugin-tsdoc', 'simple-import-sort', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  rules: {
    'prettier/prettier': 'error',
    'tsdoc/syntax': 'error',
    'simple-import-sort/imports': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    'import/no-named-as-default': 'off',
  },
  overrides: [
    {
      files: [
        '**/__tests__/**/*.{j,t}s?(x)',
        '**/__mocks__/**/*.{j,t}s?(x)',
        'src/**/*.{spec|test}.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
      },
    },
  ],
};
