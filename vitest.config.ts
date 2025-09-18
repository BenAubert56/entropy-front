/// <reference types="vitest" />
import { defineConfig, configDefaults, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// viteConfig est une fonction => on l'appelle avec le mode "test"
export default mergeConfig(
  viteConfig({ mode: 'test', command: 'serve' }),
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: './',
    },
  }),
)
