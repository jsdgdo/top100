import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Music } from 'lucide-react'
import type { Song } from '../types'
import { useState } from 'react'

interface SongItemProps {
  song: Song
}

export function SongItem({ song }: SongItemProps) {
  const [imgError, setImgError] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.rank.toString() })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative sketch-panel p-2 mb-3 flex items-center gap-3 group ${isDragging ? 'opacity-80 z-50 scale-[1.01] shadow-[8px_8px_0_var(--color-ink)]' : 'hover:bg-brand-bg/30'
        }`}
    >
      <div className="flex-shrink-0 w-8 text-center font-serif text-[1.1rem] text-ink">
        {song.rank}
      </div>

      <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-brand-surface border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] flex items-center justify-center">
        {song.cover && !imgError ? (
          <img
            src={song.cover}
            alt={song.album}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Music size={20} strokeWidth={2.5} className="text-ink" />
        )}
      </div>

      <div className="flex-grow min-w-0 py-1">
        <h3 className="font-serif font-bold text-ink text-base md:text-lg leading-tight">
          {song.title}
        </h3>
        <p className="text-ink/80 font-hand text-lg md:text-xl leading-snug mt-0.5">
          {song.artist} <span className="mx-1 opacity-50">•</span> {song.album} <span className="mx-1 opacity-50">•</span> {song.year}
        </p>
      </div>

      <button
        className="flex-shrink-0 p-2 text-ink/40 hover:text-brand-accent touch-none cursor-grab active:cursor-grabbing transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={24} />
      </button>
    </div>
  )
}
