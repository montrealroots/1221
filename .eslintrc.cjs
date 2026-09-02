module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-hooks'],
  ignorePatterns: ['dist', 'node_modules', '*.cjs', 'functions'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-restricted-syntax': [
      'error',
      {
        selector: "NewExpression[callee.name='Date'][arguments.length=0]",
        message: 'SLATE law: never read wall-clock time directly. Use the world clock (engine/core/time).'
      },
      {
        selector: "MemberExpression[object.name='Date'][property.name='now']",
        message: 'SLATE law: never read wall-clock time directly. Use the world clock (engine/core/time).'
      },
      {
        selector: "MemberExpression[object.name='Math'][property.name='random']",
        message: 'SLATE law: never use Math.random. Use the seeded deterministic RNG (engine/core/rng).'
      }
    ]
  },
  overrides: [
    {
      files: ['src/engine/core/time.ts', 'src/engine/core/realclock.ts', 'src/ui/**/*.tsx', 'tests/**/*.ts'],
      rules: { 'no-restricted-syntax': 'off' }
    }
  ]
};
