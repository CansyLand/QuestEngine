import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/ui/utils/cn'

const inputVariants = cva(
	'w-full rounded-md border bg-bg-card px-3 py-2 font-primary text-sm text-text-primary placeholder:text-text-muted transition-all focus:outline-none focus:ring-2 focus:ring-border-focus disabled:cursor-not-allowed disabled:opacity-50',
	{
		variants: {
			variant: {
				default: 'border-border-secondary',
				error: 'border-danger',
				success: 'border-success',
			},
			size: {
				sm: 'h-8 px-2 text-xs',
				md: 'h-10 px-3',
				lg: 'h-12 px-4 text-base',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'md',
		},
	}
)

export interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	variant?: 'default' | 'error' | 'success'
	size?: 'sm' | 'md' | 'lg'
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, variant, size, ...props }, ref) => {
		return (
			<input
				ref={ref}
				className={cn(inputVariants({ variant, size, className }))}
				{...props}
			/>
		)
	}
)

Input.displayName = 'Input'

