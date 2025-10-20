import { useState } from 'react'
import { generateId } from '../../shared/utils'

export interface Notification {
  id: string
  message: string
  type: 'success' | 'error'
}

export interface NotificationsHook {
  notifications: Notification[]
  showNotification: (message: string, type: 'success' | 'error') => void
  removeNotification: (id: string) => void
}

export const useNotifications = (): NotificationsHook => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = (message: string, type: 'success' | 'error') => {
    const id = generateId()
    setNotifications((prev) => [...prev, { id, message, type }])
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return {
    notifications,
    showNotification,
    removeNotification
  }
}
