import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/ui/utils/cn'

const buttonVariants = cva(
	'inline-flex items-center justify-center rounded-md font-primary text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider',
	{
		variants: {
			variant: {
				primary:
					'bg-primary text-white shadow-md hover:shadow-lg hover:bg-primary-dark active:scale-95',
				secondary:
					'bg-secondary text-white shadow-md hover:shadow-lg active:scale-95',
				danger:
					'bg-danger text-white shadow-md hover:shadow-lg active:scale-95',
				warning:
					'bg-warning text-black shadow-md hover:shadow-lg active:scale-95',
				success:
					'bg-success text-white shadow-md hover:shadow-lg active:scale-95',
				outline:
					'border-2 border-border-primary text-primary hover:bg-bg-hover active:scale-95',
				ghost: 'text-text-primary hover:bg-bg-hover active:scale-95',
			},
			size: {
				sm: 'h-8 px-3 text-xs',
				md: 'h-10 px-4 text-sm',
				lg: 'h-12 px-6 text-base',
			},
		},
		defaultVariants: {
			variant: 'primary',
			size: 'md',
		},
	}
)

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
	variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'outline' | 'ghost'
	size?: 'sm' | 'md' | 'lg'
	children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, children, ...props }, ref) => {
		return (
			<motion.button
				ref={ref}
				className={cn(buttonVariants({ variant, size, className }))}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				{...props}
			>
				{children}
			</motion.button>
		)
	}
)

Button.displayName = 'Button'

