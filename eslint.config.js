const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/**'] },
  { files: ['tests/**/*.js'], languageOptions: { globals: { process: 'readonly' } } },
]);
