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

    // 3. iTunes Search: Try standard Fetch first, then fallback to JSONP
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=20`

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout for fetch

      const response = await fetch(itunesUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return data.results.map((item: any): Omit<Song, 'rank'> => ({
            title: item.trackName || item.collectionName || 'Unknown Title',
            artist: item.artistName || 'Unknown Artist',
            album: item.collectionName || 'Unknown Album',
            year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : new Date().getFullYear(),
            cover: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : '',
          }));
        }
      }
    } catch (e) {
      console.warn('iTunes Fetch failed, trying JSONP...', e);
    }

    // 4. JSONP Fallback (for Safari/Mobile CORS issues)
    return new Promise((resolve) => {
      const callbackName = 'itunesCallback_' + Date.now();
      const script = document.createElement('script');

      const cleanup = () => {
        if ((window as any)[callbackName]) delete (window as any)[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
        clearTimeout(timeout);
      };

      const timeout = setTimeout(() => {
        cleanup();
        resolve([]);
      }, 6000);

      (window as any)[callbackName] = (data: any) => {
        cleanup();
        if (!data || !data.results) {
          resolve([]);
          return;
        }

        const results = data.results.map((item: any): Omit<Song, 'rank'> => ({
          title: item.trackName || item.collectionName || 'Unknown Title',
          artist: item.artistName || 'Unknown Artist',
          album: item.collectionName || 'Unknown Album',
          year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : new Date().getFullYear(),
          cover: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : '',
        }));
        resolve(results);
      };

      script.src = `${itunesUrl}&callback=${callbackName}&_cb=${Math.random().toString(36).substring(7)}`;
      script.onerror = () => {
        cleanup();
        resolve([]);
      };
      document.body.appendChild(script);
    });
  } catch (error) {
    console.error('Search general error:', error)
    return []
  }
}
