import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/ui/utils/cn'

const cardVariants = cva(
	'bg-gradient-card border border-border-primary backdrop-blur-xl transition-all',
	{
		variants: {
			variant: {
				default: 'border-border-primary',
				hover: 'border-border-primary hover:border-primary hover:shadow-lg',
				interactive:
					'border-border-primary cursor-pointer hover:border-primary hover:shadow-lg hover:bg-bg-hover',
			},
			padding: {
				none: 'p-0',
				sm: 'p-3',
				md: 'p-4',
				lg: 'p-6',
			},
		},
		defaultVariants: {
			variant: 'default',
			padding: 'md',
		},
	}
)

export interface CardProps extends HTMLMotionProps<"div"> {
	variant?: 'default' | 'hover' | 'interactive'
	padding?: 'none' | 'sm' | 'md' | 'lg'
	children: React.ReactNode
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
	({ className, variant, padding, children, ...props }, ref) => {
		return (
			<motion.div
				ref={ref}
				className={cn(
					cardVariants({ variant, padding }),
					className
				)}
				whileHover={variant === 'interactive' ? { scale: 1.02 } : undefined}
				style={{
					clipPath:
						'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
				}}
				{...props}
			>
				{/* Gradient overlay */}
				<div
					className="absolute inset-0 pointer-events-none opacity-30"
					style={{
						background:
							'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, transparent 25%, rgba(255, 0, 255, 0.1) 75%, transparent 100%)',
						clipPath:
							'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
					}}
				/>
				<div className="relative z-10">{children}</div>
			</motion.div>
		)
	}
)

Card.displayName = 'Card'

