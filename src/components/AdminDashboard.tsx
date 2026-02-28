import { useState, useRef, useEffect } from 'react'
import { searchSongs } from '../services/itunes'
import type { Song } from '../types'
import { Search, PlusCircle, Loader2, Lock } from 'lucide-react'

interface AdminDashboardProps {
  onAddSong: (song: Omit<Song, 'rank'>) => void
}

export function AdminDashboard({ onAddSong }: AdminDashboardProps) {
  // Authentication State (Hardcoded PIN for client-side demo)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const pinInputRef = useRef<HTMLInputElement>(null)

  // Dashboard State
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Omit<Song, 'rank'>[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Focus PIN input on mount
  useEffect(() => {
    if (!isAuthenticated) {
      pinInputRef.current?.focus()
    }
  }, [isAuthenticated])

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === '2024') { // Simple hardcoded PIN
      setIsAuthenticated(true)
      setError(false)
    } else {
      setError(true)
      setPin('')
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const data = await searchSongs(query)
      setResults(data)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAdd = (song: Omit<Song, 'rank'>) => {
    onAddSong(song)
    setQuery('')
    setResults([])
  }

  if (!isAuthenticated) {
    return (
      <div className="sketch-panel p-8 mb-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
        <div className="absolute top-0 left-0 w-full h-2 bg-brand-secondary border-b-3 border-ink"></div>
        <div className="w-16 h-16 rounded-full bg-brand-bg border-3 border-ink shadow-[4px_4px_0_var(--color-ink)] flex items-center justify-center mb-6">
          <Lock size={28} className="text-ink" strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-serif text-brand-accent mb-2" style={{ textShadow: '2px 2px 0px var(--color-ink)' }}>Hola Aye</h2>
        <p className="text-ink font-hand text-2xl mb-6 text-center max-w-xs">
          Solamente vos podés cambiar el top 100, mete el PIN.
        </p>

        <form onSubmit={handleAuth} className="w-full max-w-xs">
          <input
            ref={pinInputRef}
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false) }}
            placeholder="Ingresá el PIN"
            className={`w-full text-center text-xl tracking-widest bg-brand-surface border-3 ${error ? 'border-brand-secondary' : 'border-ink'} rounded-lg px-4 py-3 text-ink focus:outline-none focus:ring-0 shadow-[4px_4px_0_var(--color-ink)] mb-6`}
          />
          <button
            type="submit"
            className="w-full py-3 bg-brand-accent hover:-translate-y-1 active:translate-y-1 border-3 border-ink text-white rounded-lg font-bold shadow-[4px_4px_0_var(--color-ink)] transition-all"
          >
            Empezar a buscar
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="sketch-panel p-4 md:p-6 mb-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-brand-accent border-b-3 border-ink"></div>

      <div className="flex justify-between items-center mb-6 mt-2">
        <h2 className="text-3xl font-serif flex items-center gap-3 text-brand-accent" style={{ textShadow: '2px 2px 0px var(--color-ink)' }}>
          <span className="bg-brand-surface text-ink p-1.5 rounded-lg border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]">
            <Search size={22} strokeWidth={3} />
          </span>
          Agregar una canción
        </h2>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Artista o canción..."
          className="flex-grow bg-brand-surface border-3 border-ink shadow-[4px_4px_0_var(--color-ink)] rounded-lg px-4 py-2 text-ink text-lg font-bold focus:outline-none placeholder:text-ink/40"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="w-full md:w-auto px-6 py-3 bg-brand-secondary border-3 border-ink shadow-[4px_4px_0_var(--color-ink)] hover:-translate-y-1 active:translate-y-1 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
        >
          {isSearching ? <Loader2 size={24} className="animate-spin" /> : 'Buscá'}
        </button>
      </form>

      {results.length > 0 && (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-3 custom-scrollbar">
          {results.map((song, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-brand-bg border-3 border-ink shadow-[4px_4px_0_var(--color-ink)] hover:-translate-y-0.5 transition-transform group">
              <img src={song.cover || 'fallback.jpg'} alt="cover" className="w-12 h-12 rounded-md object-cover border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] bg-brand-surface" />
              <div className="flex-grow min-w-0 py-1">
                <h4 className="font-bold text-ink text-base md:text-xl leading-tight">{song.title}</h4>
                <p className="text-ink/80 font-hand text-lg md:text-xl leading-snug">{song.artist} • {song.year}</p>
              </div>
              <button
                onClick={() => handleAdd(song)}
                className="p-2 bg-brand-surface border-2 border-ink text-ink shadow-[2px_2px_0_var(--color-ink)] active:translate-y-1 active:shadow-none hover:bg-brand-accent hover:text-white rounded-full transition-all flex-shrink-0"
                title="Add to Top 100"
              >
                <PlusCircle size={24} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
