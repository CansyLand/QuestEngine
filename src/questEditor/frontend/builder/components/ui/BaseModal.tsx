import React from 'react'

export type ModalSize = 'small' | 'medium' | 'large' | 'xlarge'
export type ModalVariant = 'default' | 'danger' | 'warning'

interface BaseModalProps {
  isOpen: boolean
  title: string
  size?: ModalSize
  variant?: ModalVariant
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

const sizeClasses: Record<ModalSize, string> = {
  small: 'modal-small',
  medium: 'modal-medium',
  large: 'modal-large',
  xlarge: 'modal-xlarge'
}

const variantClasses: Record<ModalVariant, string> = {
  default: 'modal-default',
  danger: 'modal-danger',
  warning: 'modal-warning'
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  title,
  size = 'medium',
  variant = 'default',
  onClose,
  children,
  footer,
  className = ''
}) => {
  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={`modal-overlay ${className}`} onClick={handleOverlayClick}>
      <div
        className={`modal-content ${sizeClasses[size]} ${variantClasses[variant]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
