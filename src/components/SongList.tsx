import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Song } from '../types'
import { SongItem } from './SongItem'

interface SongListProps {
  songs: Song[]
  onReorder: (activeId: string, overId: string) => void
  onDoubleClickSong?: (rank: number) => void
}

export function SongList({ songs, onReorder, onDoubleClickSong }: SongListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // minimum drag distance before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string)
    }
  }

  const items = songs.map((s) => s.rank.toString())

  if (songs.length === 0) {
    return (
      <div className="text-center p-12 sketch-panel">
        <p className="font-hand text-3xl text-ink">Todavía no hay canciones</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col">
          {songs.map((song) => (
            <SongItem key={song.rank} song={song} onDoubleClick={onDoubleClickSong} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
