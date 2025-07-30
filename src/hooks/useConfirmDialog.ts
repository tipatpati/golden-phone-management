import { useState, useCallback } from "react";

interface ConfirmDialogState<T = any> {
  isOpen: boolean;
  item: T | null;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
}

interface UseConfirmDialogReturn<T = any> {
  dialogState: ConfirmDialogState<T>;
  showConfirmDialog: (options: {
    item: T;
    title: string;
    message: string;
    onConfirm: () => void;
  }) => void;
  hideConfirmDialog: () => void;
  confirmAction: () => void;
}

export function useConfirmDialog<T = any>(): UseConfirmDialogReturn<T> {
  const [dialogState, setDialogState] = useState<ConfirmDialogState<T>>({
    isOpen: false,
    item: null,
    title: "",
    message: "",
    onConfirm: null
  });

  const showConfirmDialog = useCallback((options: {
    item: T;
    title: string;
    message: string;
    onConfirm: () => void;
  }) => {
    setDialogState({
      isOpen: true,
      item: options.item,
      title: options.title,
      message: options.message,
      onConfirm: options.onConfirm
    });
  }, []);

  const hideConfirmDialog = useCallback(() => {
    setDialogState({
      isOpen: false,
      item: null,
      title: "",
      message: "",
      onConfirm: null
    });
  }, []);

  const confirmAction = useCallback(() => {
    if (dialogState.onConfirm) {
      dialogState.onConfirm();
    }
    hideConfirmDialog();
  }, [dialogState.onConfirm, hideConfirmDialog]);

  return {
    dialogState,
    showConfirmDialog,
    hideConfirmDialog,
    confirmAction
  };
}