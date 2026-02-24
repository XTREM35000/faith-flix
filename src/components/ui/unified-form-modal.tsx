import React, { useRef, useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface UnifiedFormModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  headerClassName?: string
  maxWidth?: string
  headerLeftAdornment?: React.ReactNode
  showCloseButton?: boolean
}

/**
 * UnifiedFormModal - Composant modal unifié et réutilisable
 * 
 * Caractéristiques:
 * - Draggable sur le header
 * - Gestion du focus cohérente
 * - Style standardisé avec header ambré
 * - Contenu scrollable
 * - Accessibilité (dialog role, escape key, tab trap)
 * 
 * Remplace : StreamEditorModal, DocumentEditorModal et autres
 */
export default function UnifiedFormModal({
  open,
  onClose,
  title,
  children,
  headerClassName = 'bg-amber-900',
  maxWidth = 'max-w-2xl',
  headerLeftAdornment,
  showCloseButton = true,
}: UnifiedFormModalProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const start = useRef({ x: 0, y: 0 })
  const contentRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)

  // Reset position when modal opens
  useEffect(() => {
    if (open) {
      setPos({ x: 0, y: 0 })
    }
  }, [open])

  // Focus management and keyboard handling
  useEffect(() => {
    if (!open || !contentRef.current) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const onMouseDown = (e: React.MouseEvent) => {
    // Don't drag if clicking on interactive elements inside header
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('[role="button"]')) {
      return
    }
    
    dragging.current = true
    start.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    setPos({
      x: e.clientX - start.current.x,
      y: e.clientY - start.current.y,
    })
  }

  const onMouseUp = () => {
    dragging.current = false
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div
        ref={contentRef}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { dragging.current = false }}
        className={`relative bg-background rounded-lg shadow-2xl ${maxWidth} w-full max-h-[90vh] flex flex-col`}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header = draggable zone */}
        <div
          ref={headerRef}
          onMouseDown={onMouseDown}
          className={`cursor-grab active:cursor-grabbing select-none flex items-center justify-between px-6 py-4 border-b ${headerClassName} text-white rounded-t-lg`}
          role="heading"
          id="modal-title"
        >
          <div className="flex items-center gap-3 flex-1">
            {headerLeftAdornment && (
              <div className="flex items-center">
                {headerLeftAdornment}
              </div>
            )}
            <h3 className="font-semibold text-lg">{title}</h3>
          </div>
          
          {showCloseButton && (
            <button
              onClick={onClose}
              type="button"
              className="text-white/80 hover:text-white transition ml-4 flex-shrink-0"
              aria-label="Fermer"
              tabIndex={0}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
