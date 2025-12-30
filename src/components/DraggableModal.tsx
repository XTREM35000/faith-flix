import React, { useRef, useState } from 'react'
import BaseModal from './base-modal'

export default function DraggableModal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const start = useRef({ x: 0, y: 0 })

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true
    start.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    try { (e.target as Element).setPointerCapture(e.pointerId) } catch {}
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    setPos({ x: e.clientX - start.current.x, y: e.clientY - start.current.y })
  }
  function onPointerUp(e: React.PointerEvent) {
    dragging.current = false
    try { (e.target as Element).releasePointerCapture(e.pointerId) } catch {}
  }

  if (!open) return null
  return (
    <BaseModal open={open} onClose={onClose}>
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        className="bg-background rounded-lg shadow max-w-2xl w-full p-0 overflow-hidden"
      >
        {children}
      </div>
    </BaseModal>
  )
}
