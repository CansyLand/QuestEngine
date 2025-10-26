import React, { useState, useEffect } from 'react'
import { DialogueSequence, NPC, Quest, QuestStep } from '@/core/models/types'
import { EntityPanel } from './EntityPanel'
import { ImageDisplay } from '@/shared/components/ui/ImagePicker'

interface DialoguePanelProps {
	dialogues: DialogueSequence[]
	npcs: NPC[]
	quests: Quest[]
	onAdd: () => void
	onEdit: (dialogue: DialogueSequence) => void
	onDelete: (dialogue: DialogueSequence) => void
	onAttachQuestSteps: (dialogue: DialogueSequence) => void
}

export const DialoguePanel: React.FC<DialoguePanelProps> = ({
	dialogues,
	npcs,
	quests,
	onAdd,
	onEdit,
	onDelete,
	onAttachQuestSteps,
}) => {
	const [projectPath, setProjectPath] = useState<string | null>(null)

	useEffect(() => {
		const getProjectPath = async () => {
			const electronAPI = (window as any).electronAPI
			const path = electronAPI
				? await electronAPI.getQuestEditorProjectPath()
				: null
			setProjectPath(path)
		}
		getProjectPath()
	}, [])
	return (
		<EntityPanel
			title='Dialogue Sequences'
			entities={dialogues}
			onAdd={onAdd}
			renderEntity={(dialogue: DialogueSequence) => {
				const npc = dialogue.npcId
					? npcs.find((n) => n.id === dialogue.npcId)
					: null

				// Construct image URL with project path
				const displayImage =
					npc?.image && projectPath ? projectPath + npc.image : npc?.image || ''

				// Get quest step assigned to this dialogue
				const allQuestSteps = quests.flatMap((quest) =>
					quest.steps.map((step) => ({
						...step,
						questId: quest.id,
						questTitle: quest.title,
					}))
				)
				const assignedQuestSteps = dialogue.questStepId
					? allQuestSteps.filter((step) => step.id === dialogue.questStepId)
					: []

				return (
					<div className='entity-card dialogue-card'>
						<div className='npc-portrait'>
							<ImageDisplay
								src={displayImage}
								alt={`${npc?.name || 'Unknown'} image`}
								className='portrait-image'
								fallback={<div className='no-portrait'>No NPC</div>}
							/>
						</div>
						<div className='dialogue-details'>
							<h3>{dialogue.name}</h3>
							<div className='assigned-quest-steps'>
								{assignedQuestSteps.length > 0 ? (
									assignedQuestSteps.slice(0, 2).map((step) => (
										<p key={step.id} className='quest-step-ref'>
											{step.questTitle}: {step.name}
										</p>
									))
								) : (
									<p className='no-quest-steps'>No quest steps assigned</p>
								)}
								{assignedQuestSteps.length > 2 && (
									<p className='more-steps'>
										... and {assignedQuestSteps.length - 2} more
									</p>
								)}
							</div>
						</div>
					</div>
				)
			}}
			onEdit={onEdit}
			onDelete={onDelete}
			additionalActions={(dialogue: DialogueSequence) => (
				<button
					onClick={() => onAttachQuestSteps(dialogue)}
					className='attach-quest-button'
					title='Attach Quest Steps'
				>
					📋
				</button>
			)}
		/>
	)
}
