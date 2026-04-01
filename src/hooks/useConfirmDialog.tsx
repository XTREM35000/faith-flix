import { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export const useConfirmDialog = () => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    if (resolvePromise) resolvePromise(true);
    setOpen(false);
  };

  const handleCancel = () => {
    if (resolvePromise) resolvePromise(false);
    setOpen(false);
  };

  const DialogComponent = () => {
    if (!options) return null;

    return (
      <AlertDialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setOptions(null);
            setResolvePromise(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {options.cancelText || 'Annuler'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={options.variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {options.confirmText || 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return { confirm, DialogComponent };
};
