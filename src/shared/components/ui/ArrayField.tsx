import React, { useState } from 'react'

interface BaseEntity {
	id: string
	name: string
}

interface ArrayFieldProps<T extends BaseEntity> {
	items: T[]
	onAdd: () => void
	onRemove: (index: number) => void
	onReorder?: (fromIndex: number, toIndex: number) => void
	renderItem: (
		item: T,
		index: number,
		onRemove: (index: number) => void
	) => React.ReactNode
	addButtonText?: string
	emptyMessage?: string
	maxHeight?: string
	className?: string
	enableDragDrop?: boolean
}

export function ArrayField<T extends BaseEntity>({
	items,
	onAdd,
	onRemove,
	onReorder,
	renderItem,
	addButtonText = 'Add Item',
	emptyMessage = 'No items yet. Click "Add" to create one.',
	maxHeight = '200px',
	className = '',
	enableDragDrop = false,
}: ArrayFieldProps<T>) {
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

	const handleDragStart = (e: React.DragEvent, index: number) => {
		setDraggedIndex(index)
		e.dataTransfer.effectAllowed = 'move'
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = 'move'
	}

	const handleDrop = (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault()
		if (draggedIndex !== null && draggedIndex !== dropIndex && onReorder) {
			onReorder(draggedIndex, dropIndex)
		}
		setDraggedIndex(null)
	}

	const handleDragEnd = () => {
		setDraggedIndex(null)
	}
	return (
		<div className={`array-field ${className}`.trim()}>
			<div className='array-list' style={{ maxHeight }}>
				{items.length === 0 ? (
					<div className='empty-state'>{emptyMessage}</div>
				) : (
					items.map((item, index) => (
						<div
							key={item.id}
							className={`array-item ${enableDragDrop ? 'drag-handle' : ''} ${
								draggedIndex === index ? 'dragging' : ''
							}`}
							draggable={enableDragDrop}
							onDragStart={
								enableDragDrop ? (e) => handleDragStart(e, index) : undefined
							}
							onDragOver={enableDragDrop ? handleDragOver : undefined}
							onDrop={enableDragDrop ? (e) => handleDrop(e, index) : undefined}
							onDragEnd={enableDragDrop ? handleDragEnd : undefined}
						>
							<div className='array-item-content'>
								{renderItem(item, index, onRemove)}
							</div>
							<button
								type='button'
								className='array-item-remove'
								onClick={() => onRemove(index)}
								title='Remove item'
							>
								×
							</button>
						</div>
					))
				)}
			</div>
			<button type='button' className='add-array-button' onClick={onAdd}>
				{addButtonText}
			</button>
		</div>
	)
}
