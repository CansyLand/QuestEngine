import React from 'react'
import { Game } from '@/core/models/types'

interface BuilderTabsProps {
	activeTab: string
	gameData: Game
	onTabChange: (tab: string) => void
	unlinkedCount?: number
}

export const BuilderTabs: React.FC<BuilderTabsProps> = ({
	activeTab,
	gameData,
	onTabChange,
	unlinkedCount = 0,
}) => {
	const linksClass =
		activeTab === 'links' ? 'active' : unlinkedCount > 0 ? 'has-changes' : ''

	return (
		<div className='builder-tabs'>
			<button
				className={activeTab === 'locations' ? 'active' : ''}
				onClick={() => onTabChange('locations')}
			>
				Locations ({gameData.locations.length})
			</button>
			<button
				className={activeTab === 'quests' ? 'active' : ''}
				onClick={() => onTabChange('quests')}
			>
				Quests ({gameData.quests.length})
			</button>
			<button
				className={activeTab === 'quests-2' ? 'active' : ''}
				onClick={() => onTabChange('quests-2')}
			>
				Quests-2 ({gameData.quests.length})
			</button>
			<button
				className={activeTab === 'npcs' ? 'active' : ''}
				onClick={() => onTabChange('npcs')}
			>
				NPCs ({(gameData as any).npcs?.length || 0})
			</button>
			<button
				className={activeTab === 'items' ? 'active' : ''}
				onClick={() => onTabChange('items')}
			>
				Items ({(gameData as any).items?.length || 0})
			</button>
			<button
				className={activeTab === 'portals' ? 'active' : ''}
				onClick={() => onTabChange('portals')}
			>
				Portals ({(gameData as any).portals?.length || 0})
			</button>
			<button
				className={activeTab === 'dialogues' ? 'active' : ''}
				onClick={() => onTabChange('dialogues')}
			>
				Dialogues ({(gameData.dialogues || []).length})
			</button>
			<button className={linksClass} onClick={() => onTabChange('links')}>
				LINKS ({unlinkedCount})
			</button>
		</div>
	)
}
