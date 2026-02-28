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
      return [{
        title: data.title || 'Unknown Title',
        artist: data.provider_name || 'Spotify', // Spotify oembed doesn't reliably give artist, but title often includes it for some embeds, or provider_name is fallback.
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

      // YouTube titles usually format as "Artist - Song Title"
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

    // 3. Fallback to iTunes Search
    const url = new URL('https://itunes.apple.com/search')
    url.searchParams.set('term', query)
    url.searchParams.set('media', 'music')
    url.searchParams.set('entity', 'song')
    url.searchParams.set('limit', '10')

    const response = await fetch(url.toString())
    if (!response.ok) throw new Error('Network response was not ok')

    const data = await response.json()

    return data.results.map((item: any): Omit<Song, 'rank'> => ({
      title: item.trackName || item.collectionName || 'Unknown Title',
      artist: item.artistName || 'Unknown Artist',
      album: item.collectionName || 'Unknown Album',
      year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : new Date().getFullYear(),
      cover: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : '',
    }))
  } catch (error) {
    console.error('Error fetching song data:', error)
    return []
  }
}
