import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Fonts are bundled by Vite with hashed filenames, so the preload hints can't
 * be hard-coded in index.html. This injects them after the bundle is built,
 * for the two weights that render above the fold on every page: 400 for body
 * copy and 800 for the wordmark and headlines.
 *
 * Without this the browser only discovers the fonts after parsing the CSS,
 * which costs a round trip on the largest text on the page.
 */
function preloadCriticalFonts() {
  const CRITICAL = [/poppins-latin-400-normal-.*\.woff2$/, /poppins-latin-800-normal-.*\.woff2$/]

  return {
    name: 'gw-preload-critical-fonts',
    enforce: 'post',
    apply: 'build',
    transformIndexHtml(html, ctx) {
      const files = Object.keys(ctx.bundle ?? {}).filter((file) =>
        CRITICAL.some((pattern) => pattern.test(file)),
      )
      return files.map((file) => ({
        tag: 'link',
        attrs: {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          href: `${ctx.server ? '' : '/'}${file}`.replace('//', '/'),
          crossorigin: '',
        },
        injectTo: 'head-prepend',
      }))
    },
  }
}

// The single-file preview (npm run preview:file) has to end up as exactly one
// JS file and one CSS file, because it gets inlined into a single document.
// Route splitting and a vendor chunk are the opposite of what that build wants.
const singleFile = Boolean(process.env.VITE_HASH_ROUTER)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), preloadCriticalFonts()],
  build: {
    cssCodeSplit: !singleFile,
    rollupOptions: {
      output: singleFile
        ? { inlineDynamicImports: true }
        : {
            // Keeps React and the router in their own long-lived chunk, so
            // shipping a copy change doesn't invalidate the whole bundle in
            // everyone's cache.
            manualChunks(id) {
              if (id.includes('node_modules')) return 'vendor'
            },
          },
    },
  },
})
