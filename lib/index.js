// @local/dsh-mobile-ui — host half: standalone PWA manifest, app icons, and
// the iOS home-screen icon link.
//
// Forked from @canary-builds/dsh-mobile-ui 1.1.2 (MIT) and maintained locally.
// On top of the upstream manifest route this fork owns exactly two more things:
//
//   - the PNG app icons, served from its own routes so each response carries a
//     real `content-type: image/png`. The harness static server's MIME table has
//     no .png entry and would send `application/octet-stream` instead.
//
//   - the `<link rel="apple-touch-icon">`, injected through webServer.tapIndex.
//     iOS ignores SVG for that rel, so without this link it falls back to a page
//     screenshot for the home-screen icon.
//
// Both ride the plugin fiber, so disabling the row reverts every route and tap.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const inject = ['webServer']

const HERE = dirname(fileURLToPath(import.meta.url))
const ICON_ROOT = join(HERE, '..', 'icons')

/** Public path -> file name in ../icons. */
const ICON_ROUTES = {
  '/apple-touch-icon.png': 'apple-touch-icon-180.png',
  '/icon-192.png': 'icon-192.png',
  '/icon-512.png': 'icon-512.png',
}

const MANIFEST = JSON.stringify({
  id: '/',
  name: 'DeepSeek Harness',
  short_name: 'DSH',
  description: 'DeepSeek Harness - local agent workspace.',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  display_override: ['standalone'],
  background_color: '#ffffff',
  theme_color: '#ffffff',
  icons: [
    { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
  ],
})

const APPLE_TOUCH_ICON =
  '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">'

export function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/manifest.webmanifest',
    handler: (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'no-cache',
      })
      res.end(MANIFEST)
    },
  }), 'dsh-mobile-ui: PWA manifest route')

  for (const [path, file] of Object.entries(ICON_ROUTES)) {
    let bytes
    try {
      bytes = readFileSync(join(ICON_ROOT, file))
    } catch (error) {
      ctx.logger?.warn?.(`dsh-mobile-ui: icon ${file} is unreadable: ${String(error)}`)
      continue
    }
    const body = bytes
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path,
      handler: (req, res) => {
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': body.byteLength,
          'Cache-Control': 'no-cache',
        })
        res.end(req.method === 'HEAD' ? undefined : body)
      },
    }), `dsh-mobile-ui: icon route ${path}`)
  }

  ctx.effect(() => ctx.webServer.tapIndex((html) => (
    html.includes('rel="apple-touch-icon"')
      ? html
      : html.replace('</head>', `  ${APPLE_TOUCH_ICON}\n</head>`)
  )), 'dsh-mobile-ui: apple-touch-icon link')
}
