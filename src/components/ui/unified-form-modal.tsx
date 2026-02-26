import React from 'react'
import DraggableResizableModal from './draggable-resizable-modal'

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
 * UnifiedFormModal - wrapper around DraggableResizableModal that provides
 * common header styling and padding for form modals used throughout the app.
 *
 * Historically this component handled its own drag logic and focus trapping.
 * The implementation has been simplified by delegating those behaviours to
 * DraggableResizableModal (which also adds resize support and dragging from
 * any non-interactive area).  Consumers can continue using the same props.
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
  if (!open) return null

  return (
    <DraggableResizableModal
      open={open}
      onClose={onClose}
      center={true}
      maxWidthClass={maxWidth}
      title={title}
      headerClassName={headerClassName}
    >
      <div className="overflow-y-auto flex-1 p-6">
        {children}
      </div>
    </DraggableResizableModal>
  )
}
