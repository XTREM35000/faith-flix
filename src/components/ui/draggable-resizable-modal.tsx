import React, { useRef, useEffect, useState } from 'react';
import BaseModal from '../base-modal';

export interface DraggableResizableModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Title shown inside the header bar. Can be a string or any React node (icon + text, etc.) */
  title?: React.ReactNode;
  className?: string;
  center?: boolean;
  draggableOnMobile?: boolean;
  dragHandleOnly?: boolean;
  verticalOnly?: boolean;
  maxWidthClass?: string;
  /** optional class applied to the header bar; useful for custom colors */
  headerClassName?: string;
  /** initial position offsets in pixels. Both support negative values. */
  initialX?: number;
  initialY?: number;
  /** minimum dimensions in pixels or css units (e.g. "300px" or "20rem") */
  minWidth?: string;
  minHeight?: string;
  /** the handle size in px used for resizing, defaults to 10 */
  resizeHandleSize?: number;
}

export const DraggableResizableModal: React.FC<DraggableResizableModalProps> = ({
  open,
  onClose,
  children,
  title,
  className = '',
  center = false,
  draggableOnMobile = false,
  dragHandleOnly = false,
  verticalOnly = false,
  maxWidthClass = 'max-w-4xl',
  headerClassName = 'bg-amber-800',
  initialX = 0,
  initialY = 0,
  minWidth = '200px',
  minHeight = '150px',
  resizeHandleSize = 10,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const resizing = useRef(false);
  const startY = useRef(0);
  const startX = useRef(0);
  const startW = useRef(0);
  const startH = useRef(0);
  const pos = useRef({ x: 0, y: 0 });

  function isTouchDevice() {
    return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }

  function isInteractiveTarget(target: EventTarget | null) {
    try {
      const el = target as Element | null;
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      if (!tag) return false;
      const interactive = ['input', 'textarea', 'select', 'button', 'a', 'svg', 'path', 'label'];
      if (interactive.includes(tag)) return true;
      if (el.closest && el.closest('button, a, input, textarea, select, label')) return true;
      return false;
    } catch {
      return false;
    }
  }

  // initialise dimensions when modal becomes visible
  useEffect(() => {
    if (!open) return;
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      // make explicit width/height so css resize works nicely
      ref.current.style.width = rect.width + 'px';
      ref.current.style.height = rect.height + 'px';
      ref.current.style.minWidth = minWidth;
      ref.current.style.minHeight = minHeight;
    }
    // reset drag position (optionally offset)
    pos.current = { x: initialX, y: initialY };
    if (ref.current) {
      ref.current.style.transform = `translate(${initialX}px, ${initialY}px)`;
    }
  }, [open, minWidth, minHeight, initialX, initialY]);

  function onPointerDown(e: React.PointerEvent) {
    if (!open) return;
    if (isTouchDevice() && !draggableOnMobile) return;

    // resize handle?
    const handleEl = (e.target as Element).closest('[data-resize-handle]');
    if (handleEl) {
      e.stopPropagation();
      resizing.current = true;
      startX.current = e.clientX;
      startY.current = e.clientY;
      if (ref.current) {
        startW.current = ref.current.getBoundingClientRect().width;
        startH.current = ref.current.getBoundingClientRect().height;
      }
      try { (e.target as Element).setPointerCapture(e.pointerId); } catch {
        // ignore: pointer capture may not be supported in older browsers
      }
      return;
    }

    if (dragHandleOnly) {
      const el = e.target as Element | null;
      if (!el?.closest('[data-drag-handle]')) return;
    }

    if (isInteractiveTarget(e.target)) return;

    dragging.current = true;
    startY.current = e.clientY - pos.current.y;
    startX.current = e.clientX - pos.current.x;
    try { (e.target as Element).setPointerCapture(e.pointerId); } catch {
      // ignore
    }
    try { document.body.style.userSelect = 'none'; } catch {
      // harmless if style can't be applied (e.g. older browsers)
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (resizing.current && ref.current) {
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;
      let newW = startW.current + dx;
      let newH = startH.current + dy;
      // clamp to min sizes
      if (ref.current) {
        const computedMinW = parseFloat(getComputedStyle(ref.current).minWidth) || 0;
        const computedMinH = parseFloat(getComputedStyle(ref.current).minHeight) || 0;
        newW = Math.max(newW, computedMinW);
        newH = Math.max(newH, computedMinH);
      }
      ref.current.style.width = newW + 'px';
      ref.current.style.height = newH + 'px';
      return;
    }

    if (!dragging.current || !ref.current) return;

    let newY = e.clientY - startY.current;
    const vMax = Math.max(200, window.innerHeight - 160);
    newY = Math.max(-vMax, Math.min(vMax, newY));

    if (verticalOnly) {
      pos.current.y = newY;
      ref.current.style.transform = `translate(0px, ${newY}px)`;
      return;
    }

    let newX = e.clientX - startX.current;
    const hMax = Math.max(200, Math.floor(window.innerWidth / 2) - 80);
    newX = Math.max(-hMax, Math.min(hMax, newX));

    pos.current = { x: newX, y: newY };
    ref.current.style.transform = `translate(${newX}px, ${newY}px)`;
  }

  function onPointerUp(e: React.PointerEvent) {
    dragging.current = false;
    resizing.current = false;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {
      // ignore failure to release
    }
    try { document.body.style.userSelect = ''; } catch {
      // ignore
    }
  }

  if (!open) return null;

  return (
    <BaseModal open={open} onClose={onClose} center={center}>
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ touchAction: 'none' as const }}
        className={
          `bg-background rounded-lg shadow ${maxWidthClass} w-full p-0 overflow-auto cursor-grab resize-both ` +
          className
        }
      >
        {title && (
          <div
            data-drag-handle
            className={`flex items-center justify-between px-4 py-3 ${headerClassName} text-white rounded-t-lg cursor-grab select-none`}
            role="button"
            aria-label="Poignée de déplacement"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-start mr-2">
                <div className="w-14 h-1.5 bg-white/80 rounded-full shadow-sm mb-1" aria-hidden />
                <div className="text-xs text-white/90">Déplacer</div>
              </div>
              <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <button onClick={onClose} className="text-white hover:opacity-90" aria-label="Fermer">
              ✕
            </button>
          </div>
        )}
        <div className="relative">
          <div className="p-4 overflow-auto">{children}</div>
          {/* resize handle bottom-right */}
          <div
            data-resize-handle
            className="absolute right-0 bottom-0 cursor-se-resize"
            style={{ width: resizeHandleSize, height: resizeHandleSize }}
          />
        </div>
      </div>
    </BaseModal>
  );
};

export default DraggableResizableModal;
