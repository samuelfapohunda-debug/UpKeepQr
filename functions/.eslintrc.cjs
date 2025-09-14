/** @type {import('eslint').Linter.Config} */
module.exports = {
  env: { node: true, es2021: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'script' },
  rules: {
    'object-curly-spacing': 'off'
  }
};
