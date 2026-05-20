import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// Static 360 paths that bypass the React SPA
const STATIC_360_PATHS = [
  { prefix: '/cleopatras-path', dir: 'cleopatras-path' },
  { prefix: '/salt-lake',       dir: 'salt-lake' },
]

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'serve-static-360-pages',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? '/'
          const cleanUrl = url.split('?')[0]

          for (const { prefix, dir } of STATIC_360_PATHS) {
            // Match exactly the prefix or prefix/ — let sub-assets fall through
            if (cleanUrl === prefix || cleanUrl === prefix + '/') {
              const htmlPath = path.resolve(__dirname, 'public', dir, 'index.html')
              if (fs.existsSync(htmlPath)) {
                res.setHeader('Content-Type', 'text/html; charset=utf-8')
                res.end(fs.readFileSync(htmlPath, 'utf-8'))
                return
              }
            }
          }

          next()
        })
      },
    },
  ],
})

