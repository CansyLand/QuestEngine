import React, { createContext, useContext } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/ui/utils/cn'

interface TabsContextValue {
	activeTab: string
	setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

export interface TabsProps {
	children: React.ReactNode
	value: string
	onValueChange: (value: string) => void
	className?: string
}

export const Tabs: React.FC<TabsProps> = ({
	children,
	value,
	onValueChange,
	className,
}) => {
	return (
		<TabsContext.Provider value={{ activeTab: value, setActiveTab: onValueChange }}>
			<div className={cn('w-full', className)}>{children}</div>
		</TabsContext.Provider>
	)
}

export interface TabsListProps {
	children: React.ReactNode
	className?: string
}

export const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
	return (
		<div
			className={cn(
				'inline-flex h-10 items-center justify-center rounded-md bg-bg-card p-1 border border-border-secondary',
				className
			)}
		>
			{children}
		</div>
	)
}

export interface TabsTriggerProps {
	value: string
	children: React.ReactNode
	className?: string
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
	value,
	children,
	className,
}) => {
	const context = useContext(TabsContext)
	if (!context) {
		throw new Error('TabsTrigger must be used within Tabs')
	}

	const { activeTab, setActiveTab } = context
	const isActive = activeTab === value

	return (
		<button
			type="button"
			onClick={() => setActiveTab(value)}
			className={cn(
				'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:pointer-events-none disabled:opacity-50',
				isActive
					? 'bg-primary text-white shadow-md'
					: 'text-text-secondary hover:bg-bg-hover',
				className
			)}
		>
			{children}
		</button>
	)
}

export interface TabsContentProps {
	value: string
	children: React.ReactNode
	className?: string
}

export const TabsContent: React.FC<TabsContentProps> = ({
	value,
	children,
	className,
}) => {
	const context = useContext(TabsContext)
	if (!context) {
		throw new Error('TabsContent must be used within Tabs')
	}

	const { activeTab } = context

	if (activeTab !== value) return null

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			transition={{ duration: 0.2 }}
			className={cn('mt-4', className)}
		>
			{children}
		</motion.div>
	)
}

