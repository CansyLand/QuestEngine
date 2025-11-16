import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/ui/utils/cn'

export interface LoadingProps {
	size?: 'sm' | 'md' | 'lg'
	className?: string
}

export const Loading: React.FC<LoadingProps> = ({ size = 'md', className }) => {
	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-8 h-8',
		lg: 'w-12 h-12',
	}

	return (
		<div className={cn('flex items-center justify-center', className)}>
			<motion.div
				className={cn(
					'border-2 border-border-primary border-t-primary rounded-full',
					sizeClasses[size]
				)}
				animate={{ rotate: 360 }}
				transition={{
					duration: 1,
					repeat: Infinity,
					ease: 'linear',
				}}
			/>
		</div>
	)
}

