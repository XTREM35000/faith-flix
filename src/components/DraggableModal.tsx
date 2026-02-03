import React, { useRef, useState, useEffect } from 'react'
import BaseModal from './base-modal'

interface Props {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  verticalOnly?: boolean
  draggableOnMobile?: boolean
  dragHandleOnly?: boolean
  initialY?: number
  center?: boolean
  maxWidthClass?: string
}

export default function DraggableModal({ open, onClose, children, verticalOnly = true, draggableOnMobile = false, dragHandleOnly = false, initialY = 0, center = false, maxWidthClass = 'max-w-4xl' }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [posY, setPosY] = useState(initialY)
  const [posX, setPosX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragging = useRef(false)
  const startY = useRef(0)
  const startX = useRef(0)

  useEffect(() => {
    setPosY(initialY)
    setPosX(0)
  }, [initialY, open])

  function isTouchDevice() {
    return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }

  function isInteractiveTarget(target: EventTarget | null) {
    try {
      const el = target as Element | null
      if (!el) return false
      const tag = el.tagName?.toLowerCase()
      if (!tag) return false
      const interactive = ['input', 'textarea', 'select', 'button', 'a', 'svg', 'path', 'label']
      if (interactive.includes(tag)) return true
      if (el.closest && el.closest('button, a, input, textarea, select, label')) return true
      return false
    } catch {
      return false
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!open) return
    if (isTouchDevice() && !draggableOnMobile) return
    if (dragHandleOnly) {
      // Only start dragging when the target is a designated drag handle
      try {
        const el = e.target as Element | null
        if (!el) return
        const handle = el.closest('[data-drag-handle]')
        if (!handle) return
      } catch (err) { void err; return }
    }
    // If interacting with inputs/buttons etc, don't start a drag (even when full-surface drag is enabled)
    if (isInteractiveTarget(e.target)) return
    dragging.current = true
    setIsDragging(true)
    // store start offsets for both axes
    startY.current = e.clientY - posY
    startX.current = e.clientX - posX
    try { (e.target as Element).setPointerCapture(e.pointerId) } catch (err) { void err; }
    try { document.body.style.userSelect = 'none' } catch { /* ignore */ }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return

    // Vertical movement
    let newY = e.clientY - startY.current
    const vMax = Math.max(200, window.innerHeight - 160)
    newY = Math.max(-vMax, Math.min(vMax, newY))

    if (verticalOnly) {
      setPosY(newY)
      return
    }

    // Horizontal movement (only if verticalOnly is false)
    let newX = e.clientX - startX.current
    // compute reasonable horizontal bounds so the modal stays visible
    const hMax = Math.max(200, Math.floor(window.innerWidth / 2) - 80)
    newX = Math.max(-hMax, Math.min(hMax, newX))

    setPosY(newY)
    setPosX(newX)
  }

  function onPointerUp(e: React.PointerEvent) {
    dragging.current = false
    setIsDragging(false)
    try { (e.target as Element).releasePointerCapture(e.pointerId) } catch (err) { void err; }
    try { document.body.style.userSelect = '' } catch { /* ignore */ }
  }

  if (!open) return null

  return (
    <BaseModal open={open} onClose={onClose} center={center}>
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ transform: `translate(${posX}px, ${posY}px)`, touchAction: 'none' as const }}
        className={"bg-background rounded-lg shadow " + maxWidthClass + " w-full p-0 overflow-hidden " + (isDragging ? 'cursor-grabbing' : 'cursor-grab')}
      >
        {children}
      </div>
    </BaseModal>
  )
}
