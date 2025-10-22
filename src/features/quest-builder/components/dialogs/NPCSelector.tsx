import React from 'react'
import { NPC } from '@/core/models/types'
import { NPCSelectorState } from '@/features/quest-builder/types'

interface NPCSelectorProps {
	npcSelector: NPCSelectorState
	onClose: () => void
	onSelectNpc: (npc: NPC) => void
	onMouseEnter: (npc: NPC, e: React.MouseEvent) => void
	onMouseLeave: () => void
}

export const NPCSelector: React.FC<NPCSelectorProps> = ({
	npcSelector,
	onClose,
	onSelectNpc,
	onMouseEnter,
	onMouseLeave,
}) => {
	if (!npcSelector.isOpen) return null

	return (
		<div className='modal-overlay' onClick={onClose}>
			<div
				className='modal-content npc-selector'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='modal-header'>
					<h2>Select NPC to Add</h2>
					<button className='modal-close' onClick={onClose}>
						&times;
					</button>
				</div>
				<div className='modal-body'>
					<div className='selector-help'>
						<p>
							💡 Hold <kbd>Shift</kbd> to select multiple NPCs. Release to add
							all selected NPCs.
						</p>
						{npcSelector.selectedNpcs.length > 0 && (
							<p className='selection-count'>
								{npcSelector.selectedNpcs.length} NPC
								{npcSelector.selectedNpcs.length !== 1 ? 's' : ''} selected
							</p>
						)}
					</div>
					{npcSelector.availableNpcs.length === 0 ? (
						<div className='no-npcs'>
							<p>
								No NPCs available or all NPCs are already added to this
								location.
							</p>
						</div>
					) : (
						<div className='npc-grid'>
							{npcSelector.availableNpcs.map((npc) => (
								<div
									key={npc.id}
									className={`npc-slot ${
										npcSelector.selectedNpcs.some(
											(selected) => selected.id === npc.id
										)
											? 'selected'
											: ''
									}`}
									onClick={(e) => {
										if (npcSelector.isShiftPressed) {
											// Multi-selection mode - handled in EditModal
											return
										} else {
											// Single selection mode
											onSelectNpc(npc)
										}
									}}
									onMouseEnter={(e) => onMouseEnter(npc, e)}
									onMouseLeave={onMouseLeave}
								>
									<div className='npc-image-container'>
										{npc.image ? (
											<img
												src={npc.image}
												alt={npc.name}
												className='npc-image'
											/>
										) : (
											<div className='no-image'>No Image</div>
										)}
									</div>
									<div className='npc-name'>{npc.name}</div>
								</div>
							))}
						</div>
					)}
				</div>
				<div className='modal-footer'>
					<button className='cancel-button' onClick={onClose}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	)
}
