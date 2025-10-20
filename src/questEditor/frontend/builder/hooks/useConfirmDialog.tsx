import { useState } from 'react'

export interface ConfirmDialogState {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export interface ConfirmDialogHook {
  confirmDialog: ConfirmDialogState
  openConfirmDialog: (title: string, message: string, onConfirm: () => void, onCancel: () => void) => void
  closeConfirmDialog: () => void
}

export const useConfirmDialog = (): ConfirmDialogHook => {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  })

  const openConfirmDialog = (title: string, message: string, onConfirm: () => void, onCancel: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      onCancel
    })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
      onCancel: () => {}
    })
  }

  return {
    confirmDialog,
    openConfirmDialog,
    closeConfirmDialog
  }
}
