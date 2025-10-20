import React, { useState, useEffect } from 'react'
import { DialogueSequence, NPC, Quest, QuestStep } from '../../../../models'
import { QuestStepSelector } from './QuestStepSelector'
import { generateIdFromApi } from '../../../shared/utils'

interface DialogueEditFormProps {
	dialogue: DialogueSequence
	onUpdate: (updates: Partial<DialogueSequence>) => void
	onOpenDialogueEditor: () => void
	onUpdateQuestStep?: (
		questId: string,
		stepId: string,
		updates: Partial<QuestStep>
	) => void
	availableNpcs?: NPC[]
	availableQuests?: Quest[]
	availableQuestSteps?: QuestStep[]
}

export const DialogueEditForm: React.FC<DialogueEditFormProps> = ({
	dialogue,
	onUpdate,
	onOpenDialogueEditor,
	onUpdateQuestStep,
	availableNpcs = [],
	availableQuests = [],
	availableQuestSteps = [],
}) => {
	const [showQuestStepSelector, setShowQuestStepSelector] = useState(false)
	const npc = dialogue.npcId
		? availableNpcs.find((n) => n.id === dialogue.npcId)
		: null

	// Auto-generate ID when name changes
	useEffect(() => {
		if (dialogue.name) {
			const currentId = dialogue.id

			// Generate ID immediately when name changes
			generateIdFromApi(dialogue.name, 'dialogue', currentId, dialogue.npcId)
				.then((response) => {
					if (
						response.success &&
						response.data?.id &&
						response.data.id !== currentId
					) {
						onUpdate({ id: response.data.id })
					}
				})
				.catch((error) => {
					console.error('Failed to generate dialogue ID:', error)
				})
		}
	}, [dialogue.name, dialogue.npcId, onUpdate])

	// Get the quest step that this dialogue references
	const assignedQuestStep = dialogue.questStepId
		? availableQuestSteps.find((step) => step.id === dialogue.questStepId)
		: null

	const handleSelectQuestStep = (questStepId: string) => {
		// Update the dialogue to reference this quest step
		onUpdate({ questStepId: questStepId || null })
	}

	const handleDeselectQuestStep = () => {
		// Remove the quest step reference from this dialogue
		onUpdate({ questStepId: null })
	}

	return (
		<div className='dialogue-edit-form'>
			<div className='form-group'>
				<label>NPC:</label>
				<select
					value={dialogue.npcId || ''}
					onChange={(e) => onUpdate({ npcId: e.target.value || undefined })}
					className='npc-select'
				>
					<option value=''>No NPC Assigned</option>
					{availableNpcs.map((availableNpc) => (
						<option key={availableNpc.id} value={availableNpc.id}>
							{availableNpc.name} ({availableNpc.id})
						</option>
					))}
				</select>
			</div>

			{npc && (
				<div className='form-group npc-display'>
					<label>Selected NPC:</label>
					<div className='npc-info'>
						<div className='npc-portrait'>
							{npc.image ? (
								<img
									src={npc.image}
									alt={`${npc.name} portrait`}
									className='portrait-image'
								/>
							) : (
								<div className='no-portrait'>No Image</div>
							)}
						</div>
						<div className='npc-details'>
							<h4>{npc.name}</h4>
							<p>ID: {npc.id}</p>
						</div>
					</div>
				</div>
			)}
			<div className='form-group'>
				<label>Name:</label>
				<input
					type='text'
					value={dialogue.name}
					onChange={(e) => onUpdate({ name: e.target.value })}
					placeholder='Dialogue sequence name'
				/>
			</div>

			<div className='form-group'>
				<label>Assigned Quest Step:</label>
				<div className='quest-step-summary'>
					{assignedQuestStep ? (
						<div className='quest-step-item'>
							<div className='quest-step-info'>
								<span className='quest-title'>
									{
										availableQuests.find((q) =>
											q.steps.some((s) => s.id === assignedQuestStep.id)
										)?.title
									}
									:
								</span>
								<span className='step-name'>{assignedQuestStep.name}</span>
								<span className='step-id'>({assignedQuestStep.id})</span>
							</div>
							<button
								type='button'
								className='remove-step-button'
								onClick={handleDeselectQuestStep}
							>
								×
							</button>
						</div>
					) : (
						<div className='no-quest-steps'>No quest step assigned</div>
					)}
				</div>
				{!assignedQuestStep && (
					<button
						type='button'
						className='add-quest-step-button'
						onClick={() => setShowQuestStepSelector(true)}
					>
						+ Assign Quest Step
					</button>
				)}
			</div>

			<div className='form-group'>
				<label>Dialogues ({dialogue.dialogs.length}):</label>
				<div className='dialogue-summary'>
					{dialogue.dialogs.length > 0 ? (
						<div className='dialogue-list'>
							{dialogue.dialogs.slice(0, 3).map((dialog, index) => (
								<div key={dialog.id} className='dialogue-item'>
									<span className='dialogue-text'>
										{dialog.text.length > 50
											? `${dialog.text.substring(0, 50)}...`
											: dialog.text}
									</span>
									{dialog.isQuestion && (
										<span className='dialogue-badge question'>Question</span>
									)}
									{dialog.isEndOfDialog && (
										<span className='dialogue-badge end'>End</span>
									)}
								</div>
							))}
							{dialogue.dialogs.length > 3 && (
								<div className='dialogue-more'>
									... and {dialogue.dialogs.length - 3} more dialogs
								</div>
							)}
						</div>
					) : (
						<div className='no-dialogues'>No dialogues defined</div>
					)}
				</div>
				<button
					type='button'
					className='edit-dialogue-button'
					onClick={onOpenDialogueEditor}
				>
					{dialogue.dialogs.length > 0 ? 'Edit Dialogues' : 'Add Dialogues'}
				</button>
			</div>

			{showQuestStepSelector && (
				<QuestStepSelector
					availableQuests={availableQuests}
					availableQuestSteps={availableQuestSteps}
					availableDialogues={[]} // Not needed in edit form context
					availableNpcs={availableNpcs}
					selectedQuestStepIds={assignedQuestStep ? [assignedQuestStep.id] : []}
					onSelectQuestStep={handleSelectQuestStep}
					onDeselectQuestStep={handleDeselectQuestStep}
					onClose={() => setShowQuestStepSelector(false)}
					dialogueNpcId={dialogue.npcId}
					dialogueId={dialogue.id}
				/>
			)}
		</div>
	)
}
