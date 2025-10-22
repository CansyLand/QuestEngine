import React from 'react'
import { NPC } from '@/core/models/types'
import { EntityPanel } from './EntityPanel'
import { ImageDisplay } from '@/shared/components/ui/ImagePicker'

interface NPCPanelProps {
	npcs: NPC[]
	onAdd: () => void
	onEdit: (npc: NPC) => void
	onDelete: (npc: NPC) => void
}

export const NPCPanel: React.FC<NPCPanelProps> = ({
	npcs,
	onAdd,
	onEdit,
	onDelete,
}) => {
	return (
		<EntityPanel
			title='NPCs'
			entities={npcs}
			onAdd={onAdd}
			renderEntity={(npc: NPC) => {
				// Use the image link directly as provided
				const displayImage = npc.image

				return (
					<div className='entity-card npc-card'>
						<div className='npc-portrait'>
							<ImageDisplay
								src={displayImage || ''}
								alt={`${npc.name} image`}
								className='portrait-image'
								fallback={<div className='no-portrait'>No Image</div>}
							/>
						</div>
						<div className='npc-details'>
							<h3>{npc.name}</h3>
							<p>State: {npc.state}</p>
						</div>
					</div>
				)
			}}
			onEdit={onEdit}
			onDelete={onDelete}
		/>
	)
}
