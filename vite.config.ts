import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  base: '/robot-localization-step-by-step/',
  build: { outDir: 'dist' },
})
