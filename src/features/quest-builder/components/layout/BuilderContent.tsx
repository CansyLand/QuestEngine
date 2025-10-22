import React from 'react'
import { Game, Location, Quest, NPC, Item, Portal } from '@/core/models/types'
import { LocationPanel } from '../entities/LocationPanel'
import { QuestPanel } from '../entities/QuestPanel'
import { NPCPanel } from '../entities/NPCPanel'
import { ItemPanel } from '../entities/ItemPanel'
import { PortalPanel } from '../entities/PortalPanel'
import { LinksPanel } from '../entities/LinksPanel'

interface BuilderContentProps {
	activeTab: string
	gameData: Game
	onAddLocation: () => void
	onEditLocation: (location: Location) => void
	onDeleteLocation: (location: Location) => void
	onAddQuest: () => void
	onEditQuest: (quest: Quest) => void
	onDeleteQuest: (quest: Quest) => void
	onAddNPC: () => void
	onEditNPC: (npc: NPC) => void
	onDeleteNPC: (npc: NPC) => void
	onAddItem: () => void
	onEditItem: (item: Item) => void
	onDeleteItem: (item: Item) => void
	onAddPortal: () => void
	onEditPortal: (portal: Portal) => void
	onDeletePortal: (portal: Portal) => void
}

export const BuilderContent: React.FC<BuilderContentProps> = ({
	activeTab,
	gameData,
	onAddLocation,
	onEditLocation,
	onDeleteLocation,
	onAddQuest,
	onEditQuest,
	onDeleteQuest,
	onAddNPC,
	onEditNPC,
	onDeleteNPC,
	onAddItem,
	onEditItem,
	onDeleteItem,
	onAddPortal,
	onEditPortal,
	onDeletePortal,
}) => {
	return (
		<div className='builder-content'>
			{activeTab === 'locations' && (
				<LocationPanel
					locations={gameData.locations}
					onAdd={onAddLocation}
					onEdit={onEditLocation}
					onDelete={onDeleteLocation}
				/>
			)}

			{activeTab === 'quests' && (
				<QuestPanel
					quests={gameData.quests}
					onAdd={onAddQuest}
					onEdit={onEditQuest}
					onDelete={onDeleteQuest}
				/>
			)}

			{activeTab === 'npcs' && (
				<NPCPanel
					npcs={(gameData as any).npcs || []}
					onAdd={onAddNPC}
					onEdit={onEditNPC}
					onDelete={onDeleteNPC}
				/>
			)}

			{activeTab === 'items' && (
				<ItemPanel
					items={(gameData as any).items || []}
					onAdd={onAddItem}
					onEdit={onEditItem}
					onDelete={onDeleteItem}
				/>
			)}

			{activeTab === 'portals' && (
				<PortalPanel
					portals={(gameData as any).portals || []}
					onAdd={onAddPortal}
					onEdit={onEditPortal}
					onDelete={onDeletePortal}
				/>
			)}

			{activeTab === 'links' && <LinksPanel gameData={gameData} />}
		</div>
	)
}
