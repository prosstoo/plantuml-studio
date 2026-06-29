import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isGitHubPages =
  process.env.GITHUB_PAGES === 'true' || process.env.GITHUB_ACTIONS === 'true'

const plantumlVersion = JSON.parse(
  readFileSync(new URL('./node_modules/@plantuml/core/package.json', import.meta.url), 'utf8'),
).version as string

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: isGitHubPages ? '/plantuml-studio/' : '/',
  define: {
    __PLANTUML_VERSION__: JSON.stringify(plantumlVersion),
  },
  optimizeDeps: {
    exclude: ['@plantuml/core'],
  },
})
