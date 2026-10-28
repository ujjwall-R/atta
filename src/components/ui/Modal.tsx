import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

export function Modal({ open, onClose, title, description, children, size = 'md' }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; size?: 'md' | 'lg' }) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])
  if (!open) return null
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#111b16]/35 p-4 backdrop-blur-[3px]" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`animate-fade-up max-h-[92vh] w-full overflow-y-auto rounded-[24px] border border-white/60 bg-white p-5 shadow-float sm:p-7 ${size === 'lg' ? 'max-w-2xl' : 'max-w-lg'}`}>
      <header className="mb-5 flex items-start justify-between gap-4">
        <div><h2 id="modal-title" className="font-display text-xl font-bold tracking-tight text-ink">{title}</h2>{description && <p className="mt-1 text-sm leading-5 text-muted">{description}</p>}</div>
        <Button type="button" variant="ghost" size="icon" aria-label="Close dialog" onClick={onClose}><X size={18} /></Button>
      </header>
      {children}
    </section>
  </div>
}
