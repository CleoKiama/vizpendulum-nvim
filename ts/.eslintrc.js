module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  env: {
    es2021: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'import', 'prettier', "promise", "node"],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:prettier/recommended'
  ],
  overrides: [
    {
      "files": ["tests/**/*", "**/*.test.js", "**/*.test.ts", "**/*.spec.js", "**/*.spec.ts"],
      "plugins": ["jest"],
      "env": {
        "jest": true,
        "jest/globals": true
      },
      "extends": ["plugin:jest/recommended"],
      parserOptions: {
        sourceType: "module",
      },
    }
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    'import/order': ['error', { 'alphabetize': { order: 'asc', caseInsensitive: true } }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    "jest/no-disabled-tests": "warn",
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
    "jest/prefer-to-have-length": "warn",
    "jest/valid-expect": "error",
    "promise/always-return": "error",
    "promise/no-return-wrap": "error",
    "promise/param-names": "error",
    "promise/catch-or-return": "error",
    "promise/no-native": "off",
    "promise/no-nesting": "warn",
    "promise/no-promise-in-callback": "warn",
    "promise/no-callback-in-promise": "warn",
    "promise/avoid-new": "warn",
    "promise/no-new-statics": "error",
    "promise/no-return-in-finally": "warn",
    "promise/valid-params": "warn"
  },
};
