import { useState, useEffect, useCallback } from 'react'
import type { Song } from '../types'
import { arrayMove } from '@dnd-kit/sortable'
import { supabase } from '../lib/supabase'

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  // 1. Initial Load from Supabase
  useEffect(() => {
    async function loadSongs() {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .order('rank', { ascending: true })

        if (error) throw error

        if (data && data.length > 0) {
          setSongs(data)
        } else {
          setSongs([])
        }
      } catch (err) {
        console.error('Error with Supabase load:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSongs()
  }, [])

  // 2. Helper to sync all ranks (used for reordering and deleting)
  const syncRanksToSupabase = async (updatedSongs: Song[]) => {
    const { error } = await supabase.from('songs').upsert(
      updatedSongs.map((song) => {
        const { id, created_at, ...s } = song as any
        return s
      }),
      { onConflict: 'rank' }
    )
    if (error) console.error('Error syncing ranks:', error)
  }

  const reorderSongs = useCallback(async (activeId: string, overId: string) => {
    setSongs((currentSongs) => {
      const oldIndex = currentSongs.findIndex((s) => s.rank.toString() === activeId)
      const newIndex = currentSongs.findIndex((s) => s.rank.toString() === overId)

      const newOrder = arrayMove(currentSongs, oldIndex, newIndex)
      const reRanked = newOrder.map((song, idx) => ({
        ...song,
        rank: idx + 1,
      }))

      // Async sync to Supabase
      syncRanksToSupabase(reRanked)

      return reRanked
    })
  }, [])

  const addSong = useCallback(async (newSong: Omit<Song, 'rank'>) => {
    const nextRank = songs.length + 1
    const songWithRank = { ...newSong, rank: nextRank }

    const { data, error } = await supabase
      .from('songs')
      .insert([songWithRank])
      .select()

    if (!error && data) {
      setSongs((current) => [...current, data[0]])
    } else {
      console.error('Error adding song to Supabase:', error)
    }
  }, [songs.length])

  const deleteSong = useCallback(async (rank: number) => {
    // Delete from Supabase
    const { error: deleteError } = await supabase
      .from('songs')
      .delete()
      .eq('rank', rank)

    if (deleteError) {
      console.error('Error deleting from Supabase:', deleteError)
      return
    }

    // Re-rank remaining in state and Supabase
    setSongs((current) => {
      const filtered = current.filter((s) => s.rank !== rank)
      const reRanked = filtered.map((song, idx) => ({
        ...song,
        rank: idx + 1,
      }))

      syncRanksToSupabase(reRanked)
      return reRanked
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
