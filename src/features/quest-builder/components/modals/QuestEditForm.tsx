import React, { useState } from 'react'
import {
	Quest,
	QuestStep,
	NPC,
	Item,
	Location,
	DialogueSequence,
} from '@/core/models/types'
import { QuestStepEditModal } from './QuestStepEditModal'

interface QuestEditFormProps {
	quest: Quest
	onUpdate: (updates: Partial<Quest>) => void
	npcs: NPC[]
	items: Item[]
	locations: Location[]
	quests: Quest[]
	dialogues: DialogueSequence[]
}

export const QuestEditForm: React.FC<QuestEditFormProps> = ({
	quest,
	onUpdate,
	npcs,
	items,
	locations,
	quests,
	dialogues,
}) => {
	const [stepModalOpen, setStepModalOpen] = useState(false)
	const [editingStep, setEditingStep] = useState<QuestStep | null>(null)
	const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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

	const handleDragStart = (
		e: React.DragEvent<HTMLDivElement>,
		index: number
	) => {
		setDraggedIndex(index)
		e.dataTransfer.effectAllowed = 'move'
		e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
		e.currentTarget.style.opacity = '0.5'
	}

	const handleDragOver = (
		e: React.DragEvent<HTMLDivElement>,
		index: number
	) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = 'move'
		setDragOverIndex(index)
	}

	const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
		e.currentTarget.style.opacity = '1'
		setDraggedIndex(null)
		setDragOverIndex(null)
	}

	const handleDrop = (
		e: React.DragEvent<HTMLDivElement>,
		dropIndex: number
	) => {
		e.preventDefault()
		const dragIndex = draggedIndex

		if (dragIndex === null || dragIndex === dropIndex) {
			return
		}

		const newSteps = [...quest.steps]
		const [draggedStep] = newSteps.splice(dragIndex, 1)
		newSteps.splice(dropIndex, 0, draggedStep)

		onUpdate({ steps: newSteps })
		setDraggedIndex(null)
		setDragOverIndex(null)
	}

	const handleDragLeave = () => {
		setDragOverIndex(null)
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
					<div className='array-list'>
						{quest.steps.map((step, index) => (
							<div
								key={index}
								className={`array-item step-item ${
									draggedIndex === index ? 'dragging' : ''
								} ${dragOverIndex === index ? 'drag-over' : ''}`}
								draggable
								onDragStart={(e) => handleDragStart(e, index)}
								onDragOver={(e) => handleDragOver(e, index)}
								onDragEnd={handleDragEnd}
								onDrop={(e) => handleDrop(e, index)}
								onDragLeave={handleDragLeave}
							>
								<div className='step-info'>
									<div className='step-name'>{step.name}</div>
									<div className='step-type'>{step.objectiveType}</div>
									<div className='step-actions'>
										<button
											type='button'
											className='edit-step-button'
											onClick={() => handleEditStep(step, index)}
										>
											Edit
										</button>
										<button
											type='button'
											className='remove-button'
											onClick={() => handleRemoveStep(index)}
										>
											Remove
										</button>
									</div>
								</div>
							</div>
						))}
						<button
							type='button'
							className='add-array-button'
							onClick={handleAddStep}
						>
							Add Step
						</button>
					</div>
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
				onSave={handleSaveStep}
				onCancel={() => setStepModalOpen(false)}
			/>
		</>
	)
}
