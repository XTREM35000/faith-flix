import React from 'react'
import UnifiedFormModal from '@/components/ui/unified-form-modal'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

/**
 * StreamEditorModal - Wrapper pour uniformité
 * @deprecated Utilise désormais UnifiedFormModal en interne
 * Conservé pour compatibilité rétroactive
 */
export default function StreamEditorModal({ open, onClose, title, children }: Props) {
  return (
    <UnifiedFormModal
      open={open}
      onClose={onClose}
      title={title}
      headerClassName="bg-amber-900"
      maxWidth="max-w-2xl"
    >
      {children}
    </UnifiedFormModal>
  )
}
