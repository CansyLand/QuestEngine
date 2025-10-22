import React, { useState, useEffect } from 'react'
import '@/shared/styles/DialoguePanel.css'

interface Dialog {
	id: string
	text: string
	buttons?: Array<{ label: string; goToDialog: number; size: number }>
	isEndOfDialog: boolean
	onNext?: any[]
}

interface DialogueSequence {
	id: string
	name: string
	dialogs: Dialog[]
	npcImage?: string | null
}

interface DialoguePanelProps {
	dialogueSequence: DialogueSequence
	currentDialogIndex: number
	onClose: () => void
	onDialogChange: (dialogId: string) => void
}

export const DialoguePanel: React.FC<DialoguePanelProps> = ({
	dialogueSequence,
	currentDialogIndex,
	onClose,
	onDialogChange,
}) => {
	const currentDialog = dialogueSequence.dialogs[currentDialogIndex]

	if (!currentDialog) {
		return null
	}

	const handleButtonClick = (goToDialog: number) => {
		// Use the dialog index directly
		const nextDialog = dialogueSequence.dialogs[goToDialog]
		if (nextDialog) {
			onDialogChange(nextDialog.id)
		} else {
			// If dialog not found, close the dialogue
			onClose()
		}
	}

	const handleNext = () => {
		// Move to next dialog in sequence
		const nextIndex = currentDialogIndex + 1
		if (nextIndex < dialogueSequence.dialogs.length) {
			// Go to next dialog
			const nextDialog = dialogueSequence.dialogs[nextIndex]
			onDialogChange(nextDialog.id)
		} else {
			// No more dialogs, close
			onClose()
		}
	}

	return (
		<div className='dialogue-overlay'>
			<div className='dialogue-panel'>
				<button className='close-button' onClick={onClose}>
					×
				</button>

				<div className='dialogue-content'>
					{dialogueSequence.npcImage && (
						<div className='dialogue-portrait'>
							<img
								src={dialogueSequence.npcImage}
								alt='NPC Portrait'
								className='npc-portrait-image'
							/>
						</div>
					)}
					<div className='dialogue-text'>{currentDialog.text}</div>

					{currentDialog.buttons && currentDialog.buttons.length > 0 ? (
						<div className='dialogue-buttons'>
							{currentDialog.buttons.map((button, index) => (
								<button
									key={index}
									className='dialogue-button'
									onClick={() => handleButtonClick(button.goToDialog)}
								>
									{button.label}
								</button>
							))}
						</div>
					) : (
						<div className='dialogue-buttons'>
							<button
								className='dialogue-button next-button'
								onClick={handleNext}
							>
								Next
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
