import { useState, useEffect, useCallback, useRef } from 'react'
import type { Song } from '../types'
import { arrayMove } from '@dnd-kit/sortable'

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const isInitialMount = useRef(true)

  useEffect(() => {
    const savedSongs = localStorage.getItem('top100_songs')
    if (savedSongs) {
      setSongs(JSON.parse(savedSongs))
      setLoading(false)
    } else {
      fetch('/songs.json')
        .then((res) => res.json())
        .then((data) => {
          setSongs(data)
          setLoading(false)
          localStorage.setItem('top100_songs', JSON.stringify(data))
        })
        .catch((err) => {
          console.error('Error fetching songs:', err)
          setLoading(false)
        })
    }
  }, [])

  // Persist to localStorage whenever songs change
  useEffect(() => {
    if (songs.length > 0) {
      localStorage.setItem('top100_songs', JSON.stringify(songs))

      // Skip the initial sync to disk to prevent the refresh loop
      if (isInitialMount.current) {
        isInitialMount.current = false
        return
      }

      // Sync to disk (only in dev/local environment)
      fetch('/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(songs),
      }).catch(err => console.error('Error syncing to disk:', err))
    }
  }, [songs])

  const reorderSongs = useCallback((activeId: string, overId: string) => {
    setSongs((currentSongs) => {
      const oldIndex = currentSongs.findIndex((s) => s.rank.toString() === activeId)
      const newIndex = currentSongs.findIndex((s) => s.rank.toString() === overId)

      const newOrder = arrayMove(currentSongs, oldIndex, newIndex)
      // Update ranks based on new array order
      return newOrder.map((song, idx) => ({
        ...song,
        rank: idx + 1,
      }))
    })
  }, [])

  const addSong = useCallback((newSong: Omit<Song, 'rank'>) => {
    setSongs((current) => {
      const nextRank = current.length + 1
      return [...current, { ...newSong, rank: nextRank }]
    })
  }, [])

  const deleteSong = useCallback((rank: number) => {
    setSongs((current) => {
      const filtered = current.filter((s) => s.rank !== rank)
      // Re-rank remaining songs
      return filtered.map((song, idx) => ({
        ...song,
        rank: idx + 1,
      }))
    })
  }, [])

  const exportToJson = useCallback(() => {
    const dataStr = JSON.stringify(songs, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'songs.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [songs])

  return { songs, loading, reorderSongs, addSong, deleteSong, exportToJson }
}
