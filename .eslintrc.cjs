module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'i18next'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',

    'i18next/no-literal-string': [
      'error', 
      {
        'markupOnly': true, 
        'ignoreAttribute': ['className', 'style', 'type', 'key', 'id'], 
        'onlyAttributes': ['placeholder', 'alt', 'title', 'label'] 
      }
    ],
  },
};