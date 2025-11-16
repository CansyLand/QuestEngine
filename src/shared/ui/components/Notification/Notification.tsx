import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/shared/ui/utils/cn'
import { Button } from '../Button'

export interface NotificationItem {
	id: string
	message: string
	type: 'success' | 'error' | 'warning' | 'info'
	duration?: number
}

export interface NotificationProps {
	notification: NotificationItem
	onRemove: (id: string) => void
}

export const Notification: React.FC<NotificationProps> = ({
	notification,
	onRemove,
}) => {
	const typeStyles = {
		success: 'bg-success/20 border-success text-success',
		error: 'bg-danger/20 border-danger text-danger',
		warning: 'bg-warning/20 border-warning text-warning',
		info: 'bg-primary/20 border-primary text-primary',
	}

	return (
		<motion.div
			initial={{ opacity: 0, x: 300 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: 300 }}
			transition={{ duration: 0.3 }}
			className={cn(
				'flex items-center gap-3 rounded-md border px-4 py-3 shadow-lg backdrop-blur-xl',
				typeStyles[notification.type]
			)}
		>
			<span className="flex-1 font-primary text-sm">{notification.message}</span>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => onRemove(notification.id)}
				className="h-6 w-6 p-0"
			>
				&times;
			</Button>
		</motion.div>
	)
}

export interface NotificationContainerProps {
	notifications: NotificationItem[]
	onRemove: (id: string) => void
	position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
	notifications,
	onRemove,
	position = 'top-right',
}) => {
	const positionClasses = {
		'top-right': 'top-4 right-4',
		'top-left': 'top-4 left-4',
		'bottom-right': 'bottom-4 right-4',
		'bottom-left': 'bottom-4 left-4',
	}

	return (
		<div
			className={cn(
				'fixed z-tooltip flex flex-col gap-2',
				positionClasses[position]
			)}
		>
			<AnimatePresence>
				{notifications.map((notification) => (
					<Notification
						key={notification.id}
						notification={notification}
						onRemove={onRemove}
					/>
				))}
			</AnimatePresence>
		</div>
	)
}

