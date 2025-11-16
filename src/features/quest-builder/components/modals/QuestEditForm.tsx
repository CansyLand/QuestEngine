import React, { useState } from 'react'
import {
	Quest,
	QuestStep,
	NPC,
	Item,
	Location,
	DialogueSequence,
	Portal,
} from '@/core/models/types'
import { QuestStepEditModal } from './QuestStepEditModal'
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
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/shared/ui'

interface QuestEditFormProps {
	quest: Quest
	onUpdate: (updates: Partial<Quest>) => void
	npcs: NPC[]
	items: Item[]
	locations: Location[]
	quests: Quest[]
	dialogues: DialogueSequence[]
	portals: Portal[]
}

export const QuestEditForm: React.FC<QuestEditFormProps> = ({
	quest,
	onUpdate,
	npcs,
	items,
	locations,
	quests,
	dialogues,
	portals,
}) => {
	const [stepModalOpen, setStepModalOpen] = useState(false)
	const [editingStep, setEditingStep] = useState<QuestStep | null>(null)
	const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	const handleEditStep = (step: QuestStep, index: number) => {
		setEditingStep(step)
		setEditingStepIndex(index)
		setStepModalOpen(true)
	}

	const handleAddStep = () => {
		setEditingStep(null)
		setEditingStepIndex(null)
		setStepModalOpen(true)
	}

	const handleSaveStep = (step: QuestStep) => {
		let newSteps: QuestStep[]
		if (editingStepIndex !== null) {
			// Edit existing step
			newSteps = [...quest.steps]
			newSteps[editingStepIndex] = step
		} else {
			// Add new step
			newSteps = [...quest.steps, step]
		}
		onUpdate({ steps: newSteps })
		setStepModalOpen(false)
	}

	const handleRemoveStep = (index: number) => {
		const newSteps = quest.steps.filter((_, i) => i !== index)
		onUpdate({ steps: newSteps })
	}

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event

		if (over && active.id !== over.id) {
			const oldIndex = quest.steps.findIndex(
				(_, index) => `step-${index}` === active.id
			)
			const newIndex = quest.steps.findIndex(
				(_, index) => `step-${index}` === over.id
			)

			if (oldIndex !== -1 && newIndex !== -1) {
				const newSteps = [...quest.steps]
				const [draggedStep] = newSteps.splice(oldIndex, 1)
				newSteps.splice(newIndex, 0, draggedStep)
				onUpdate({ steps: newSteps })
			}
		}
	}

	return (
		<>
			<div className='edit-form'>
				<div className='form-group'>
					<label>Chapter:</label>
					<input
						type='text'
						value={quest.chapter}
						onChange={(e) => onUpdate({ chapter: e.target.value })}
					/>
				</div>
				<div className='form-group'>
					<label>Title:</label>
					<input
						type='text'
						value={quest.title}
						onChange={(e) => onUpdate({ title: e.target.value })}
					/>
				</div>
				<div className='form-group'>
					<label>Description:</label>
					<textarea
						value={quest.description}
						onChange={(e) => onUpdate({ description: e.target.value })}
						rows={3}
					/>
				</div>
				<div className='form-group'>
					<label>Order:</label>
					<input
						type='number'
						value={quest.order}
						onChange={(e) => onUpdate({ order: parseInt(e.target.value) })}
					/>
				</div>
				<div className='form-group'>
					<label>Completed:</label>
					<input
						type='checkbox'
						checked={quest.completed}
						onChange={(e) => onUpdate({ completed: e.target.checked })}
					/>
				</div>
				<div className='form-group'>
					<label>Steps: {quest.steps.length} steps</label>
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={quest.steps.map((_, index) => `step-${index}`)}
							strategy={verticalListSortingStrategy}
						>
							<div className='space-y-2 mb-4'>
								{quest.steps.map((step, index) => (
									<SortableStepItem
										key={`step-${index}`}
										id={`step-${index}`}
										step={step}
										index={index}
										onEdit={() => handleEditStep(step, index)}
										onRemove={() => handleRemoveStep(index)}
									/>
								))}
							</div>
						</SortableContext>
					</DndContext>
					<Button onClick={handleAddStep} variant="outline" size="sm">
						Add Step
					</Button>
				</div>
			</div>

			<QuestStepEditModal
				isOpen={stepModalOpen}
				step={editingStep}
				npcs={npcs}
				items={items}
				locations={locations}
				quests={quests}
				dialogues={dialogues}
				portals={portals}
				onSave={handleSaveStep}
				onCancel={() => setStepModalOpen(false)}
			/>
		</>
	)
}

interface SortableStepItemProps {
	id: string
	step: QuestStep
	index: number
	onEdit: () => void
	onRemove: () => void
}

const SortableStepItem: React.FC<SortableStepItemProps> = ({
	id,
	step,
	index,
	onEdit,
	onRemove,
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-center gap-2 rounded-md border border-border-secondary bg-bg-card p-3 ${
				isDragging ? 'shadow-lg' : ''
			}`}
		>
			<button
				type="button"
				{...attributes}
				{...listeners}
				className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary px-2"
				title="Drag to reorder"
			>
				⋮⋮
			</button>
			<div className="flex-1">
				<div className="text-text-primary font-medium">{step.name}</div>
				<div className="text-text-muted text-sm">{step.objectiveType}</div>
			</div>
			<div className="flex gap-2">
				<Button onClick={onEdit} variant="outline" size="sm">
					Edit
				</Button>
				<Button onClick={onRemove} variant="danger" size="sm">
					Remove
				</Button>
			</div>
		</div>
	)
}
