import React, { useEffect, useState } from 'react'

interface NotificationProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger animation
    setVisible(true)

    // Auto-hide after 3 seconds
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300) // Wait for fade out animation
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`notification notification--${type} ${visible ? 'notification--visible' : ''}`}>
      <span>{message}</span>
      <button onClick={() => setVisible(false)} className="notification-close">
        &times;
      </button>
    </div>
  )
}

interface NotificationContainerProps {
  notifications: Array<{ id: string; message: string; type: 'success' | 'error' }>
  onRemove: (id: string) => void
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onRemove }) => {
  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  )
}
