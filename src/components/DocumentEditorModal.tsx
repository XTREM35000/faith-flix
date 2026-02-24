import React from 'react'
import UnifiedFormModal from '@/components/ui/unified-form-modal'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  headerClassName?: string
}

/**
 * DocumentEditorModal - Wrapper pour uniformité
 * @deprecated Utilise désormais UnifiedFormModal en interne
 * Conservé pour compatibilité rétroactive
 */
export default function DocumentEditorModal({
  open,
  onClose,
  title,
  children,
  headerClassName = 'bg-amber-900',
}: Props) {
  return (
    <UnifiedFormModal
      open={open}
      onClose={onClose}
      title={title}
      headerClassName={headerClassName}
      maxWidth="max-w-2xl"
    >
      {children}
    </UnifiedFormModal>
  )
}
