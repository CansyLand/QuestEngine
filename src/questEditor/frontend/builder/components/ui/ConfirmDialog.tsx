import React from 'react'
import { ConfirmDialogState } from '../../hooks/useConfirmDialog'

interface ConfirmDialogProps {
  confirmDialog: ConfirmDialogState
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ confirmDialog }) => {
  if (!confirmDialog.isOpen) return null

  return (
    <div className="modal-overlay" onClick={() => confirmDialog.onCancel()}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-header">
          <h2 className="danger-title">{confirmDialog.title}</h2>
        </div>
        <div className="confirm-body">
          <div className="warning-icon">⚠️</div>
          <p className="danger-message">{confirmDialog.message}</p>
        </div>
        <div className="confirm-footer">
          <button className="confirm-button cancel" onClick={confirmDialog.onCancel}>
            ABORT
          </button>
          <button className="confirm-button danger-confirm" onClick={confirmDialog.onConfirm}>
            CONFIRM DESTRUCTION
          </button>
        </div>
      </div>
    </div>
  )
}
