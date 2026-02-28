import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  server: {
    watch: {
      ignored: ['**/public/songs.json'],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'save-songs-plugin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.method === 'POST' && req.url === '/api/songs') {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', () => {
              try {
                const songs = JSON.parse(body)
                const filePath = path.resolve(__dirname, 'public/songs.json')
                fs.writeFileSync(filePath, JSON.stringify(songs, null, 2), 'utf-8')
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: true }))
              } catch (err: any) {
                console.error('Save Error:', err)
                res.statusCode = 500
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          } else {
            next()
          }
        })
      }
    }
  ],
})
