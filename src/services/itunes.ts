import type { Song } from '../types'

export async function searchSongs(term: string): Promise<Omit<Song, 'rank'>[]> {
  const query = term.trim()
  if (!query) return []

  try {
    // 1. Check for Spotify URL
    if (query.includes('open.spotify.com/track')) {
      const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Spotify oEmbed failed')
      const data = await res.json()

      let title = data.title || 'Unknown Title'
      let artist = data.author_name || 'Spotify'

      // Spotify titles in oEmbed are usually "Song Name by Artist Name"
      if (title.includes(' by ')) {
        const parts = title.split(' by ')
        title = parts[0].trim()
        artist = parts[1].trim()
      }

      return [{
        title,
        artist,
        album: 'Spotify Link',
        year: new Date().getFullYear(),
        cover: data.thumbnail_url || ''
      }]
    }

    // 2. Check for YouTube URL
    if (query.includes('youtube.com/watch') || query.includes('youtu.be/')) {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(query)}&format=json`)
      if (!res.ok) throw new Error('YouTube oEmbed failed')
      const data = await res.json()

      let artist = data.author_name || 'YouTube'
      let title = data.title || 'Unknown Video'

      if (title.includes(' - ')) {
        const parts = title.split(' - ')
        artist = parts[0].trim()
        title = parts.slice(1).join(' - ').trim()
      }

      return [{
        title,
        artist,
        album: 'YouTube Video',
        year: new Date().getFullYear(),
        cover: data.thumbnail_url || ''
      }]
    }

    // 3. iTunes Search: Use JSONP directly for maximum compatibility across browsers/mobile
    // We avoid standard fetch for iTunes because it often fails CORS on client-side,
    // and the fallback delay was causing issues on mobile devices.

    // Robust trim for mobile keyboards (handles non-breaking spaces)
    const cleanQuery = query.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '').trim()

    // Using country=AR as there's strong evidence of the user being in Argentina.
    // Explicit country often helps when mobile networks route traffic through different gateways.
    // Also added a cache buster and removed redundant media=music.
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=song&limit=50&country=AR&at=${Date.now()}`

    return new Promise((resolve) => {
      const callbackName = `itunes_cb_${Math.floor(Math.random() * 1000000)}`
      const script = document.createElement('script')

      let isResolved = false

      const cleanup = () => {
        if ((window as any)[callbackName]) {
          try {
            delete (window as any)[callbackName]
          } catch (e) {
            (window as any)[callbackName] = undefined
          }
        }
        if (script.parentNode) script.parentNode.removeChild(script)
      }

      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true
          cleanup()
          console.warn('iTunes Search timed out for:', cleanQuery)
          resolve([])
        }
      }, 10000) // 10s timeout for flaky mobile connections

        ; (window as any)[callbackName] = (data: any) => {
          if (isResolved) return
          isResolved = true
          clearTimeout(timeout)
          cleanup()

          if (!data || !data.results || data.results.length === 0) {
            console.log('No iTunes results found for:', cleanQuery)
            resolve([])
            return
          }

          const results = data.results.map((item: any): Omit<Song, 'rank'> => ({
            title: item.trackName || item.collectionName || 'Canción Desconocida',
            artist: item.artistName || 'Artista Desconocido',
            album: item.collectionName || 'Álbum Desconocido',
            year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : new Date().getFullYear(),
            cover: item.artworkUrl100
              ? item.artworkUrl100.replace('100x100bb', '400x400bb')
              : 'https://placehold.co/400x400/216bb9/white?text=Top100',
          }))
          resolve(results)
        }

      script.src = `${itunesUrl}&callback=${callbackName}`
      script.onerror = (e) => {
        if (isResolved) return
        isResolved = true
        clearTimeout(timeout)
        cleanup()
        console.error('iTunes JSONP script error:', e)
        resolve([])
      }

      document.body.appendChild(script)
    })
  } catch (error) {
    console.error('Search general error:', error)
    return []
  }
}
