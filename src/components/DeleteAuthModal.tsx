import { useState, useRef, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'

interface DeleteAuthModalProps {
  songTitle: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteAuthModal({ songTitle, isOpen, onClose, onConfirm }: DeleteAuthModalProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const pinInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setPin('')
      setError(false)
      // Small timeout to ensure modal is focused after transition
      setTimeout(() => pinInputRef.current?.focus(), 50)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === '2024') {
      onConfirm()
      onClose()
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] p-4 bg-brand-bg/90 backdrop-blur-md flex items-center justify-center overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm sketch-panel p-8 relative overflow-hidden flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-brand-secondary border-b-3 border-ink"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-brand-bg/50 rounded-lg transition-colors border-2 border-transparent hover:border-ink"
        >
          <X size={20} className="text-ink" />
        </button>

        <div className="w-16 h-16 rounded-full bg-brand-surface border-3 border-ink shadow-[4px_4px_0_var(--color-ink)] flex items-center justify-center mb-6">
          <Trash2 size={28} className="text-brand-secondary" strokeWidth={2.5} />
        </div>

        <h2 className="text-3xl font-serif text-brand-secondary mb-2 text-center" style={{ textShadow: '2px 2px 0px var(--color-ink)' }}>
          ¿Borrar canción?
        </h2>

        <p className="text-ink font-hand text-xl mb-6 text-center">
          Estás por borrar <span className="font-bold underline">"{songTitle}"</span>.<br /> Meté el PIN para confirmar.
        </p>

        <form onSubmit={handleSubmit} className="w-full">
          <input
            ref={pinInputRef}
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false) }}
            placeholder="PIN"
            className={`w-full text-center text-xl tracking-widest bg-brand-surface border-3 ${error ? 'border-brand-secondary' : 'border-ink'} rounded-lg px-4 py-3 text-ink focus:outline-none focus:ring-0 shadow-[4px_4px_0_var(--color-ink)] mb-6`}
          />
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={onClose}
              className="py-3 bg-brand-bg hover:bg-brand-surface border-3 border-ink text-ink rounded-lg font-bold shadow-[2px_2px_0_var(--color-ink)] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-3 bg-brand-secondary hover:-translate-y-1 active:translate-y-1 border-3 border-ink text-white rounded-lg font-bold shadow-[4px_4px_0_var(--color-ink)] transition-all"
            >
              Borrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
