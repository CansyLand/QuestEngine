import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/ui/utils/cn'
import { Button } from '../Button'

const modalVariants = cva(
	'relative bg-gradient-card border border-border-primary shadow-xl backdrop-blur-xl',
	{
		variants: {
			size: {
				sm: 'max-w-modal-sm',
				md: 'max-w-modal-md w-[90%]',
				lg: 'max-w-modal-lg w-[95%]',
				xl: 'max-w-modal-xl w-[95%]',
			},
			variant: {
				default: 'border-border-primary',
				danger: 'border-danger',
				warning: 'border-warning',
			},
		},
		defaultVariants: {
			size: 'md',
			variant: 'default',
		},
	}
)

export interface ModalProps {
	isOpen: boolean
	onClose: () => void
	title?: string
	children: React.ReactNode
	footer?: React.ReactNode
	size?: 'sm' | 'md' | 'lg' | 'xl'
	variant?: 'default' | 'danger' | 'warning'
	className?: string
	closeOnOverlayClick?: boolean
	closeOnEscape?: boolean
}

export const Modal: React.FC<ModalProps> = ({
	isOpen,
	onClose,
	title,
	children,
	footer,
	size,
	variant,
	className,
	closeOnOverlayClick = true,
	closeOnEscape = true,
}) => {
	useEffect(() => {
		if (!closeOnEscape) return

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose()
			}
		}

		document.addEventListener('keydown', handleEscape)
		return () => document.removeEventListener('keydown', handleEscape)
	}, [isOpen, onClose, closeOnEscape])

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (closeOnOverlayClick && e.target === e.currentTarget) {
			onClose()
		}
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="fixed inset-0 z-modal flex items-center justify-center bg-bg-overlay backdrop-blur-sm"
					onClick={handleOverlayClick}
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: -20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.9, y: -20 }}
						transition={{ duration: 0.3, ease: 'easeOut' }}
						className={cn(
							modalVariants({ size, variant }),
							'max-h-[80vh] overflow-hidden',
							className
						)}
						onClick={(e: React.MouseEvent) => e.stopPropagation()}
						style={{
							clipPath:
								'polygon(10px 0%, calc(100% - 10px) 0%, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0% calc(100% - 10px), 0% 10px)',
						}}
					>
						{/* Gradient overlay */}
						<div
							className="absolute inset-0 pointer-events-none opacity-50"
							style={{
								background:
									'linear-gradient(135deg, rgba(0, 255, 255, 0.15) 0%, transparent 25%, rgba(255, 0, 255, 0.15) 75%, transparent 100%)',
								clipPath:
									'polygon(10px 0%, calc(100% - 10px) 0%, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0% calc(100% - 10px), 0% 10px)',
							}}
						/>

						<div className="relative z-10">
							{title && (
								<div className="border-b border-border-primary bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4">
									<div className="flex items-center justify-between">
										<h2 className="text-xl font-primary text-primary font-light tracking-wider">
											{title}
										</h2>
										<Button
											variant="ghost"
											size="sm"
											onClick={onClose}
											className="h-8 w-8 p-0"
										>
											&times;
										</Button>
									</div>
								</div>
							)}

							<div className="overflow-y-auto max-h-[calc(80vh-120px)] p-6">
								{children}
							</div>

							{footer && (
								<div className="border-t border-border-primary px-6 py-4">
									{footer}
								</div>
							)}
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

