import React from 'react';

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  center?: boolean;
}

export default function BaseModal({ open, onClose, children, center = false }: BaseModalProps) {
  if (!open) return null;

  return (
    <div className={"fixed inset-0 z-50 flex " + (center ? 'items-center' : 'items-start') + " justify-center p-4 pt-8 overflow-y-auto"}>
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />

      <div className={"relative z-10 w-full flex justify-center " + (center ? 'items-center' : 'items-start')}>
        {children}
      </div>
    </div>
  );
}
