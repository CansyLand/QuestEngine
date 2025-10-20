import React from 'react'
import { BaseModal, ModalVariant } from './BaseModal'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ModalVariant
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel
}) => {
  const footer = (
    <div className="confirm-modal-footer">
      <button className="modal-button cancel" onClick={onCancel}>
        {cancelText}
      </button>
      <button className="modal-button confirm" onClick={onConfirm}>
        {confirmText}
      </button>
    </div>
  )

  return (
    <BaseModal isOpen={isOpen} title={title} variant={variant} onClose={onCancel} footer={footer}>
      <div className="confirm-message">
        <div className="warning-icon">⚠️</div>
        <p>{message}</p>
      </div>
    </BaseModal>
  )
}
