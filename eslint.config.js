import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  { languageOptions: { globals: { window: 'readonly', document: 'readonly', navigator: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly', console: 'readonly', URL: 'readonly', Blob: 'readonly', fetch: 'readonly', localStorage: 'readonly', sessionStorage: 'readonly', HTMLElement: 'readonly', Event: 'readonly', KeyboardEvent: 'readonly', MouseEvent: 'readonly', requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly', IntersectionObserver: 'readonly', ResizeObserver: 'readonly', MutationObserver: 'readonly', AbortController: 'readonly', FormData: 'readonly', Headers: 'readonly', Request: 'readonly', Response: 'readonly', crypto: 'readonly', performance: 'readonly', structuredClone: 'readonly', queueMicrotask: 'readonly', atob: 'readonly', btoa: 'readonly', alert: 'readonly', confirm: 'readonly', prompt: 'readonly' } } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
    },
  },
  eslintConfigPrettier,
)
