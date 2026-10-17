/// <reference types="vitest/config" />
import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env['VITE_BASE'] ?? '/'

const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf8')) as {
  version: string
}

/** Short commit of this build, for "which version am I on?" in Settings. */
function buildSha(): string {
  const fromCi = process.env['GITHUB_SHA']
  if (fromCi) return fromCi.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'dev'
  }
}

/** Pages cannot send headers, so the CSP ships as a meta tag. Build only: dev needs injected styles. */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' blob: data:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'self' https://generativelanguage.googleapis.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function contentSecurityPolicy(): Plugin {
  return {
    name: 'haqse:csp',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
        injectTo: 'head-prepend',
      },
    ],
  }
}

/**
 * First visits land on /welcome (see main.tsx). Preload that route's chunks with the
 * entry script, so the router does not discover them only after the entry has run.
 */
function preloadFirstRoute(entry = 'src/features/onboarding/index.ts'): Plugin {
  return {
    name: 'haqse:preload-first-route',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return []
        const chunks = Object.values(bundle).filter((c) => c.type === 'chunk')
        const route = chunks.find((c) => c.facadeModuleId?.endsWith(entry))
        const main = chunks.find((c) => c.isEntry)
        if (!route || !main) return []
        const already = new Set([main.fileName, ...main.imports])
        const files = new Set<string>()
        const visit = (fileName: string): void => {
          if (already.has(fileName) || files.has(fileName)) return
          files.add(fileName)
          const chunk = bundle[fileName]
          if (chunk?.type === 'chunk') chunk.imports.forEach(visit)
        }
        visit(route.fileName)
        return [...files].map((file) => ({
          tag: 'link',
          attrs: { rel: 'modulepreload', crossorigin: '', href: `${base}${file}` },
          injectTo: 'head' as const,
        }))
      },
    },
  }
}

/** GitHub Pages has no rewrites: serve the SPA shell for unknown paths. */
function spaFallback(): Plugin {
  let outDir = resolve(import.meta.dirname, 'dist')
  return {
    name: 'haqse:spa-404',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const index = resolve(outDir, 'index.html')
      if (existsSync(index)) copyFileSync(index, resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_SHA__: JSON.stringify(buildSha()),
  },
  resolve: { alias: { '@': resolve(import.meta.dirname, 'src') } },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    VitePWA({
      // Prompt mode: a new deploy waits until the user taps "Update now" (PwaProvider + UpdateBanner).
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'HaqSe — Gig Worker Companion',
        short_name: 'HaqSe',
        description:
          'Track real earnings, find schemes, keep documents ready and draft complaints.',
        id: base,
        lang: 'en',
        dir: 'ltr',
        categories: ['finance', 'productivity', 'utilities'],
        prefer_related_applications: false,
        // Reopen the existing window when launched again (e.g. from a shortcut).
        launch_handler: { client_mode: ['navigate-existing', 'auto'] },
        scope: base,
        start_url: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f7f7f5',
        theme_color: '#0f766e',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
        shortcuts: [
          {
            name: 'Log earnings',
            short_name: 'Log',
            url: `${base}kamai?log=1`,
            icons: [{ src: 'shortcut-log.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'SOS',
            short_name: 'SOS',
            url: `${base}suraksha?sos=1`,
            icons: [{ src: 'shortcut-sos.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'Complaints',
            short_name: 'Complaints',
            url: `${base}shikayat`,
            icons: [{ src: 'shortcut-complaint.png', sizes: '96x96', type: 'image/png' }],
          },
        ],
        screenshots: [
          {
            src: 'screenshots/narrow-home.jpg',
            sizes: '720x1520',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'Today’s take-home and alerts',
          },
          {
            src: 'screenshots/narrow-earnings.jpg',
            sizes: '720x1520',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'Earnings insights and payout drops',
          },
          {
            src: 'screenshots/wide-home.jpg',
            sizes: '1280x800',
            type: 'image/jpeg',
            form_factor: 'wide',
            label: 'HaqSe on a larger screen',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        // Precache only what may be needed offline before it is ever used. The Gemini SDK
        // (online-only by nature), Hindi/Punjabi strings and their script fonts are cached
        // on first use instead, which keeps the first-visit install download small on 3G.
        globIgnores: [
          '**/assets/web-*.js',
          '**/assets/hi-*.js',
          '**/assets/pa-*.js',
          '**/assets/noto-sans-*',
          '**/assets/devanagari-*.css',
          '**/assets/gurmukhi-*.css',
        ],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'generativelanguage.googleapis.com',
            handler: 'NetworkOnly',
          },
          {
            // Content-hashed files never change, so cache-first is always correct.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.includes('/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'haqse-lazy-assets',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
    }),
    contentSecurityPolicy(),
    preloadFirstRoute(),
    spaFallback(),
  ],
  build: { target: 'es2022', reportCompressedSize: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/features/*/logic/**/*.ts'],
      exclude: ['**/*.test.ts', 'src/lib/db/dexie.ts'],
      thresholds: { lines: 70, functions: 70, statements: 70, branches: 60 },
    },
  },
})
