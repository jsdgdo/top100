import { useState } from 'react'
import { useSongs } from './hooks/useSongs'
import { SongList } from './components/SongList'
import { AdminDashboard } from './components/AdminDashboard'
import { DeleteAuthModal } from './components/DeleteAuthModal'
import { CheckCircle2, Plus, X } from 'lucide-react'

function App() {
  const { songs, loading, reorderSongs, addSong, deleteSong } = useSongs()
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [songToDelete, setSongToDelete] = useState<any | null>(null)
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false })

  const handleAddSong = (song: Omit<any, 'rank'>) => {
    addSong(song)
    setToast({ message: `Agregaste "${song.title}" a la lista!`, visible: true })

    // Auto-hide toast
    setTimeout(() => {
      setToast(t => ({ ...t, visible: false }))
    }, 3000)

    // Scroll to bottom
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      })
    }, 100)
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 pt-4 pb-2 px-4 mb-4">
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center relative">
          <h1 className="text-4xl md:text-7xl font-serif text-brand-accent transform -rotate-2 tracking-wide text-center" style={{ textShadow: '2px 2px 0px var(--color-ink), -1px -1px 0 var(--color-ink), 1px -1px 0 var(--color-ink), -1px 1px 0 var(--color-ink), 1px 1px 0 var(--color-ink)' }}>
            El top 100 de Aye
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-4">
        {isAdminOpen && (
          <div
            className="fixed inset-0 z-40 p-2 md:p-4 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center overflow-y-auto"
            onClick={() => setIsAdminOpen(false)}
          >
            <div
              className="w-full max-w-3xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <AdminDashboard
                onAddSong={(song) => {
                  handleAddSong(song)
                  // We removed setIsAdminOpen(false) to keep search open!
                }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-ink font-hand text-3xl mt-20 animate-pulse">
            Brewing songs...
          </div>
        ) : (
          <SongList
            songs={songs}
            onReorder={reorderSongs}
            onDoubleClickSong={(rank) => setSongToDelete(songs.find(s => s.rank === rank) || null)}
          />
        )}

        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
            }`}
        >
          <div className="sketch-panel px-6 py-3 flex items-center gap-3">
            <CheckCircle2 size={24} className="text-brand-accent" strokeWidth={3} />
            <span className="font-bold text-lg whitespace-nowrap text-ink">{toast.message}</span>
          </div>
        </div>

        {/* Floating Action Button for Add Songs */}
        <button
          onClick={() => setIsAdminOpen(!isAdminOpen)}
          className={`fixed bottom-8 right-8 z-50 p-4 rounded-full border-3 border-ink transition-transform duration-200 shadow-[4px_4px_0px_var(--color-ink)] active:shadow-[1px_1px_0px_var(--color-ink)] active:translate-y-[3px] active:translate-x-[3px] ${isAdminOpen
            ? 'bg-brand-surface text-ink rotate-90 scale-90'
            : 'bg-brand-accent text-brand-surface hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-ink)]'
            }`}
          aria-label={isAdminOpen ? "Close add songs" : "Add new song"}
        >
          {isAdminOpen ? <X size={28} strokeWidth={3} /> : <Plus size={28} strokeWidth={3} />}
        </button>

        <DeleteAuthModal
          isOpen={!!songToDelete}
          songTitle={songToDelete?.title || ''}
          onClose={() => setSongToDelete(null)}
          onConfirm={() => {
            if (songToDelete) {
              deleteSong(songToDelete.rank)
              setToast({ message: `Borraste "${songToDelete.title}"`, visible: true })
              setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
            }
          }}
        />
      </main>
    </div>
  )
}

export default App
