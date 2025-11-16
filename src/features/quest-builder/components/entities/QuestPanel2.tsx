import React, { useState, useEffect, useCallback } from 'react'
import { Quest, DialogueSequence, NPC, Game } from '@/core/models/types'
import { Card } from '@/shared/ui'
import { ImageDisplay } from '@/shared/components/ui/ImagePicker'

interface QuestPanel2Props {
	quests: Quest[]
	npcs: NPC[]
	dialogues: DialogueSequence[]
	gameData: Game
	onSetGameData?: (data: Game) => void
	onSaveData?: (data?: Game) => Promise<void>
}

export const QuestPanel2: React.FC<QuestPanel2Props> = ({
	quests,
	npcs,
	dialogues,
	gameData,
	onSetGameData,
	onSaveData,
}) => {
	const [projectPath, setProjectPath] = useState<string | null>(null)

	// State for tracking edited dialogue text
	const [editedDialogues, setEditedDialogues] = useState<
		Record<string, string>
	>({})
	const [originalDialogues, setOriginalDialogues] = useState<
		Record<string, string>
	>({})

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

	// Auto-save function with debouncing
	const autoSave = useCallback(async () => {
		if (!onSetGameData || !onSaveData) {
			console.log('QuestPanel2: Auto-save skipped - missing handlers')
			return
		}

		try {
			console.log(
				'QuestPanel2: Starting auto-save with edited dialogues:',
				Object.keys(editedDialogues)
			)

			// Update all dialogues that have edited dialogs
			const updatedDialogues = dialogues.map((dialogue) => {
				const hasEditedDialogs = dialogue.dialogs.some(
					(dialog) => editedDialogues[dialog.id] !== undefined
				)

				if (hasEditedDialogs) {
					console.log(`QuestPanel2: Updating dialogue ${dialogue.id}`)
					// Update this dialogue sequence with edited dialog texts
					const updatedDialogs = dialogue.dialogs.map((dialog) =>
						editedDialogues[dialog.id] !== undefined
							? { ...dialog, text: editedDialogues[dialog.id] }
							: dialog
					)

					return { ...dialogue, dialogs: updatedDialogs }
				}

				return dialogue
			})

			// Create the updated game data
			const updatedGameData: Game = {
				...gameData,
				dialogues: updatedDialogues,
			}

			// Update local state and save
			onSetGameData(updatedGameData)
			console.log('QuestPanel2: Updated local game data, calling onSaveData')
			await onSaveData(updatedGameData)
			console.log('QuestPanel2: Auto-save completed successfully')
		} catch (error) {
			console.error('QuestPanel2: Error auto-saving dialogues:', error)
		}
	}, [dialogues, editedDialogues, gameData, onSetGameData, onSaveData])

	// Handle input changes
	const handleDialogueChange = (
		dialogId: string,
		newText: string,
		originalText: string
	) => {
		setEditedDialogues((prev) => ({ ...prev, [dialogId]: newText }))

		// Store original text if not already stored
		if (!originalDialogues[dialogId]) {
			setOriginalDialogues((prev) => ({ ...prev, [dialogId]: originalText }))
		}

		// Auto-save after a short delay
		setTimeout(() => autoSave(), 500)
	}

	// Handle revert to original
	const handleRevertDialogue = (dialogId: string) => {
		const originalText = originalDialogues[dialogId]
		if (originalText) {
			setEditedDialogues((prev) => {
				const newState = { ...prev }
				delete newState[dialogId]
				return newState
			})

			// Auto-save the revert
			setTimeout(() => autoSave(), 100)
		}
	}
	// Helper function to get NPC name by ID
	const getNpcName = (npcId: string) => {
		const npc = npcs.find((n) => n.id === npcId)
		return npc ? npc.name : `NPC ${npcId}`
	}

	// Helper function to get NPC object by ID
	const getNpcById = (npcId: string) => {
		return npcs.find((n) => n.id === npcId)
	}

	// Helper function to get dialogues for a specific quest step
	const getDialoguesForStep = (questStepId: string) => {
		return dialogues.filter((dialogue) => dialogue.questStepId === questStepId)
	}

	// Helper function to get auto-started dialogues from quest actions
	const getAutoStartedDialoguesForStep = (step: any) => {
		const autoStartedIds: string[] = []

		// Check onStart actions
		if (step.onStart) {
			step.onStart.forEach((action: any) => {
				if (
					action.type === 'startDialogue' &&
					action.params?.dialogueSequenceId
				) {
					autoStartedIds.push(action.params.dialogueSequenceId)
				}
			})
		}

		// Check onComplete actions
		if (step.onComplete) {
			step.onComplete.forEach((action: any) => {
				if (
					action.type === 'startDialogue' &&
					action.params?.dialogueSequenceId
				) {
					autoStartedIds.push(action.params.dialogueSequenceId)
				}
			})
		}

		return dialogues.filter((dialogue) => autoStartedIds.includes(dialogue.id))
	}

	return (
		<div className='w-full space-y-6'>
			<div className='mb-6'>
				<h2 className='text-xl font-primary text-text-primary mb-2'>
					Quest Overview
				</h2>
				<p className='text-text-secondary text-sm'>
					See which dialogues are connected to which quest steps
				</p>
			</div>

			<div className='w-full text-sm'>
				{/* Header Row */}
				<div className='flex w-full border-b border-border-primary mb-4'>
					<div className='w-3/12 font-primary text-primary uppercase tracking-wider py-2'>
						Quest
					</div>
					<div className='w-2/12 font-primary text-primary uppercase tracking-wider py-2'>
						Quest Step
					</div>
					<div className='w-7/12 font-primary text-primary uppercase tracking-wider py-2'>
						NPC Dialogues & Content
					</div>
				</div>

				{/* Quest Rows */}
				<div className='space-y-6'>
					{quests.map((quest) => (
						<div key={quest.id} className='space-y-3'>
							{quest.steps.map((step, stepIndex) => (
								<div key={step.id} className='flex w-full gap-4'>
									{/* Quest Column - only show on first step */}
									{stepIndex === 0 ? (
										<div className='w-3/12'>
											<Card variant='hover' padding='md'>
												<h3 className='font-primary text-text-primary text-lg mb-2'>
													{quest.title}
												</h3>
												<p className='text-text-secondary text-sm mb-1'>
													{quest.chapter}
												</p>
												<p className='text-text-muted text-xs'>
													Order: {quest.order} • {quest.steps.length} steps
												</p>
											</Card>
										</div>
									) : (
										<div className='w-3/12 h-full' />
									)}

									{/* Step Column */}
									<div className='w-2/12'>
										<Card variant='default' padding='sm' className='h-full'>
											<h4 className='font-primary text-text-primary text-sm mb-2'>
												{step.name}
											</h4>

											{/* Objective Type & Params */}
											<div className='mb-3'>
												<p className='text-text-secondary text-xs font-medium mb-1'>
													🎯{' '}
													{step.objectiveType
														.replace(/([A-Z])/g, ' $1')
														.toLowerCase()}
												</p>
												{step.objectiveParams &&
													Object.keys(step.objectiveParams).length > 0 && (
														<div className='text-text-muted text-xs space-y-1'>
															{Object.entries(step.objectiveParams).map(
																([key, value]) => (
																	<div
																		key={key}
																		className='flex justify-between'
																	>
																		<span className='capitalize'>
																			{key
																				.replace(/([A-Z])/g, ' $1')
																				.toLowerCase()}
																			:
																		</span>
																		<span className='text-primary font-medium'>
																			{String(value)}
																		</span>
																	</div>
																)
															)}
														</div>
													)}
											</div>

											{/* On Start Actions */}
											{step.onStart && step.onStart.length > 0 && (
												<div className='mb-3'>
													<p className='text-success text-xs font-medium mb-1'>
														▶ START:
													</p>
													<div className='space-y-1'>
														{step.onStart.map((action, idx) => (
															<div
																key={idx}
																className='text-success text-xs bg-success/10 p-1 rounded'
															>
																{action.type}
																{action.params &&
																	Object.keys(action.params).length > 0 && (
																		<span className='ml-1 text-text-muted'>
																			({Object.values(action.params).join(', ')}
																			)
																		</span>
																	)}
															</div>
														))}
													</div>
												</div>
											)}

											{/* On Complete Actions */}
											{step.onComplete && step.onComplete.length > 0 && (
												<div>
													<p className='text-warning text-xs font-medium mb-1'>
														✓ COMPLETE:
													</p>
													<div className='space-y-1'>
														{step.onComplete.map((action, idx) => (
															<div
																key={idx}
																className='text-warning text-xs bg-warning/10 p-1 rounded'
															>
																{action.type}
																{action.params &&
																	Object.keys(action.params).length > 0 && (
																		<span className='ml-1 text-text-muted'>
																			({Object.values(action.params).join(', ')}
																			)
																		</span>
																	)}
															</div>
														))}
													</div>
												</div>
											)}
										</Card>
									</div>

									{/* Dialogues & Content Column */}
									<div className='w-7/12'>
										<div className='space-y-3'>
											{(() => {
												const questStepDialogues = getDialoguesForStep(step.id)
												const autoStartedDialogues =
													getAutoStartedDialoguesForStep(step)

												// Separate the dialogues into categories for ordering
												const linkedDialogues = questStepDialogues.filter(
													(d) =>
														!autoStartedDialogues.some((ad) => ad.id === d.id)
												)
												const autoStartedOnlyDialogues =
													autoStartedDialogues.filter(
														(d) =>
															!questStepDialogues.some((ld) => ld.id === d.id)
													)
												const overlappingDialogues = questStepDialogues.filter(
													(d) =>
														autoStartedDialogues.some((ad) => ad.id === d.id)
												)

												// Order: Linked (teal) -> Overlapping (green) -> Auto-started (yellow)
												const orderedDialogues = [
													...linkedDialogues,
													...overlappingDialogues,
													...autoStartedOnlyDialogues,
												]

												return orderedDialogues.length > 0 ? (
													orderedDialogues.map((dialogue) => {
														const isLinked = questStepDialogues.some(
															(d) => d.id === dialogue.id
														)
														const isAutoStarted = autoStartedDialogues.some(
															(d) => d.id === dialogue.id
														)
														const isOverlapping = isLinked && isAutoStarted
														const isTalkToStep = step.objectiveType === 'talkTo'
														const isTargetNpc =
															isTalkToStep &&
															dialogue.npcId === step.objectiveParams?.npcId

														let cardVariant: string = 'interactive'
														let cardClassName = 'cursor-pointer'
														let statusBadge = null

														if (isOverlapping) {
															// Green for overlapping (both linked and auto-started)
															statusBadge = (
																<span className='text-success text-xs font-medium px-2 py-1 bg-success/20 rounded flex items-center'>
																	✓ LINKED & AUTO
																</span>
															)
														} else if (isLinked) {
															// Red for dialogues of the target NPC in talkTo steps, teal for others
															const badgeColor = isTargetNpc
																? 'danger'
																: 'primary'
															const badgeText = isTargetNpc
																? '🎯 TALK TRIGGER'
																: '🔗 LINKED'
															statusBadge = (
																<span
																	className={`text-${badgeColor} text-xs font-medium px-2 py-1 bg-${badgeColor}/20 rounded flex items-center`}
																>
																	{badgeText}
																</span>
															)
														} else if (isAutoStarted) {
															// Yellow for auto-started only
															statusBadge = (
																<span className='text-warning text-xs font-medium px-2 py-1 bg-warning/20 rounded'>
																	AUTO-START
																</span>
															)
															cardVariant = 'default'
															cardClassName =
																'cursor-pointer border-warning bg-warning/10'
														}
														return (
															<Card
																key={dialogue.id}
																variant={cardVariant as any}
																padding='md'
																className={cardClassName}
															>
																{/* Status Indicator */}
																<div className='flex items-center justify-between mb-2'>
																	<div className='flex items-center space-x-2'>
																		{statusBadge}
																	</div>
																</div>
																{/* NPC Header */}
																<div className='flex items-center space-x-3 mb-3 pb-2 border-b border-border-secondary'>
																	{(() => {
																		const npc = getNpcById(dialogue.npcId || '')
																		const displayImage =
																			npc?.image && projectPath
																				? projectPath + npc.image
																				: npc?.image || ''

																		return (
																			<>
																				{npc?.image && (
																					<ImageDisplay
																						src={displayImage}
																						alt={`${npc.name} avatar`}
																						className='w-8 h-8 rounded-sm object-cover flex-shrink-0'
																						fallback={
																							<div className='w-8 h-8 rounded-sm bg-bg-hover flex items-center justify-center text-sm text-text-muted'>
																								?
																							</div>
																						}
																					/>
																				)}
																				<div>
																					<span className='font-primary text-secondary text-sm block'>
																						{getNpcName(dialogue.npcId || '')}
																					</span>
																					<span className='text-text-muted text-xs'>
																						{dialogue.name}
																					</span>
																				</div>
																			</>
																		)
																	})()}
																</div>

																{/* Dialog Content */}
																<div className='space-y-4'>
																	{(isTalkToStep
																		? dialogue.dialogs.slice(0, 1)
																		: dialogue.dialogs
																	).map((dialog, dialogIndex) => {
																		const currentText =
																			editedDialogues[dialog.id] ?? dialog.text
																		const hasBeenEdited =
																			editedDialogues[dialog.id] !== undefined
																		const originalText =
																			originalDialogues[dialog.id] ??
																			dialog.text

																		return (
																			<div
																				key={dialog.id}
																				className='space-y-2'
																			>
																				{/* Dialog Text */}
																				<div className='bg-bg-hover p-3 rounded border-l-2 border-primary'>
																					<div className='flex items-start gap-2'>
																						<textarea
																							value={currentText}
																							onChange={(e) =>
																								handleDialogueChange(
																									dialog.id,
																									e.target.value,
																									originalText
																								)
																							}
																							className='flex-1 text-text-primary text-sm leading-relaxed bg-transparent border-none outline-none resize-none min-h-[2rem]'
																							rows={Math.max(
																								2,
																								currentText.split('\n').length
																							)}
																							placeholder='Enter dialogue text...'
																						/>
																						{hasBeenEdited && (
																							<button
																								onClick={() =>
																									handleRevertDialogue(
																										dialog.id
																									)
																								}
																								className='text-warning hover:text-warning-hover text-xs px-2 py-1 bg-warning/10 hover:bg-warning/20 rounded transition-colors flex-shrink-0'
																								title='Revert to original text'
																							>
																								↻
																							</button>
																						)}
																					</div>
																				</div>

																				{/* Response Buttons */}
																				{dialog.isQuestion &&
																					dialog.buttons &&
																					dialog.buttons.length > 0 && (
																						<div className='ml-4 space-y-1'>
																							<p className='text-text-muted text-xs italic mb-2'>
																								Responses:
																							</p>
																							{dialog.buttons.map(
																								(button, buttonIndex) => (
																									<div
																										key={buttonIndex}
																										className='bg-secondary/20 border border-secondary/30 p-2 rounded text-xs'
																									>
																										<span className='text-secondary font-medium'>
																											{button.label}
																										</span>
																										<span className='text-text-muted ml-2'>
																											→ Dialog{' '}
																											{button.goToDialog}
																										</span>
																									</div>
																								)
																							)}
																						</div>
																					)}
																			</div>
																		)
																	})}
																</div>
															</Card>
														)
													})
												) : (
													<div className='text-text-muted text-xs italic py-2 px-3 bg-bg-hover rounded border border-dashed border-border-secondary'>
														No dialogues attached
													</div>
												)
											})()}
										</div>
									</div>
								</div>
							))}

							{/* Separator between quests */}
							{quest !== quests[quests.length - 1] && (
								<div className='border-t border-border-secondary my-6' />
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
