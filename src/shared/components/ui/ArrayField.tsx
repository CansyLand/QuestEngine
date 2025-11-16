import React from 'react'
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/shared/ui'

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

interface SortableItemProps<T extends BaseEntity> {
	item: T
	index: number
	onRemove: (index: number) => void
	renderItem: (
		item: T,
		index: number,
		onRemove: (index: number) => void
	) => React.ReactNode
	enableDragDrop: boolean
}

function SortableItem<T extends BaseEntity>({
	item,
	index,
	onRemove,
	renderItem,
	enableDragDrop,
}: SortableItemProps<T>) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: item.id, disabled: !enableDragDrop })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-center gap-2 rounded-md border border-border-secondary bg-bg-card p-2 ${
				isDragging ? 'shadow-lg' : ''
			}`}
		>
			{enableDragDrop && (
				<button
					type="button"
					{...attributes}
					{...listeners}
					className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary px-2"
					title="Drag to reorder"
				>
					⋮⋮
				</button>
			)}
			<div className="flex-1">{renderItem(item, index, onRemove)}</div>
			<button
				type="button"
				onClick={() => onRemove(index)}
				className="text-danger hover:text-danger/80 px-2"
				title="Remove item"
			>
				×
			</button>
		</div>
	)
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
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event

		if (over && active.id !== over.id && onReorder) {
			const oldIndex = items.findIndex((item) => item.id === active.id)
			const newIndex = items.findIndex((item) => item.id === over.id)
			onReorder(oldIndex, newIndex)
		}
	}

	const itemIds = items.map((item) => item.id)

	return (
		<div className={className}>
			<div style={{ maxHeight }} className="overflow-y-auto space-y-2 mb-4">
				{items.length === 0 ? (
					<div className="text-text-muted text-sm py-4 text-center">
						{emptyMessage}
					</div>
				) : enableDragDrop && onReorder ? (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={itemIds}
							strategy={verticalListSortingStrategy}
						>
							<div className="space-y-2">
								{items.map((item, index) => (
									<SortableItem
										key={item.id}
										item={item}
										index={index}
										onRemove={onRemove}
										renderItem={renderItem}
										enableDragDrop={enableDragDrop}
									/>
								))}
							</div>
						</SortableContext>
					</DndContext>
				) : (
					<div className="space-y-2">
						{items.map((item, index) => (
							<div
								key={item.id}
								className="flex items-center gap-2 rounded-md border border-border-secondary bg-bg-card p-2"
							>
								<div className="flex-1">{renderItem(item, index, onRemove)}</div>
								<button
									type="button"
									onClick={() => onRemove(index)}
									className="text-danger hover:text-danger/80 px-2"
									title="Remove item"
								>
									×
								</button>
							</div>
						))}
					</div>
				)}
			</div>
			<Button onClick={onAdd} variant="outline" size="sm">
				{addButtonText}
			</Button>
		</div>
	)
}
