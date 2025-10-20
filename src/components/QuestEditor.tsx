import React, { useState, useEffect } from 'react'
import { Project } from '../types'

interface QuestEditorProps {
	project: Project
	onBack: () => void
}

interface Quest {
	id: string
	title: string
	description: string
	order: number
}

export function QuestEditor({ project, onBack }: QuestEditorProps) {
	const [quests, setQuests] = useState<Quest[]>([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState<
		'quests' | 'npcs' | 'items' | 'locations'
	>('quests')

	useEffect(() => {
		loadQuests()
	}, [])

	const loadQuests = async () => {
		try {
			setLoading(true)
			const data = await window.electronAPI.getQuestData('quests')
			setQuests(data || [])
		} catch (error) {
			console.error('Failed to load quests:', error)
		} finally {
			setLoading(false)
		}
	}

	const loadNPCs = async () => {
		try {
			const data = await window.electronAPI.getQuestData('npcs')
			return data || []
		} catch (error) {
			console.error('Failed to load NPCs:', error)
			return []
		}
	}

	const loadItems = async () => {
		try {
			const data = await window.electronAPI.getQuestData('items')
			return data || []
		} catch (error) {
			console.error('Failed to load items:', error)
			return []
		}
	}

	const loadLocations = async () => {
		try {
			const data = await window.electronAPI.getQuestData('locations')
			return data || []
		} catch (error) {
			console.error('Failed to load locations:', error)
			return []
		}
	}

	const renderQuestsTab = () => (
		<div>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: 20,
				}}
			>
				<h3>Quests</h3>
				<button
					style={{
						padding: '8px 16px',
						backgroundColor: '#28a745',
						color: 'white',
						border: 'none',
						borderRadius: 4,
						cursor: 'pointer',
					}}
				>
					Add Quest
				</button>
			</div>

			{loading ? (
				<p>Loading quests...</p>
			) : (
				<div style={{ display: 'grid', gap: 15 }}>
					{quests.map((quest) => (
						<div
							key={quest.id}
							style={{
								border: '1px solid #ddd',
								borderRadius: 8,
								padding: 15,
								backgroundColor: '#f9f9f9',
							}}
						>
							<h4>{quest.title}</h4>
							<p style={{ margin: '8px 0', color: '#666' }}>
								{quest.description}
							</p>
							<div style={{ display: 'flex', gap: 10 }}>
								<button
									style={{
										padding: '6px 12px',
										backgroundColor: '#007bff',
										color: 'white',
										border: 'none',
										borderRadius: 4,
										cursor: 'pointer',
										fontSize: '14px',
									}}
								>
									Edit
								</button>
								<button
									style={{
										padding: '6px 12px',
										backgroundColor: '#dc3545',
										color: 'white',
										border: 'none',
										borderRadius: 4,
										cursor: 'pointer',
										fontSize: '14px',
									}}
								>
									Delete
								</button>
							</div>
						</div>
					))}
					{quests.length === 0 && (
						<p
							style={{
								textAlign: 'center',
								color: '#666',
								fontStyle: 'italic',
							}}
						>
							No quests yet. Create your first quest to get started!
						</p>
					)}
				</div>
			)}
		</div>
	)

	const renderNPCsTab = () => (
		<div>
			<h3>NPCs</h3>
			<p>NPC management interface will be implemented here.</p>
		</div>
	)

	const renderItemsTab = () => (
		<div>
			<h3>Items</h3>
			<p>Item management interface will be implemented here.</p>
		</div>
	)

	const renderLocationsTab = () => (
		<div>
			<h3>Locations</h3>
			<p>Location management interface will be implemented here.</p>
		</div>
	)

	return (
		<div style={{ padding: 20 }}>
			<div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
				<button
					onClick={onBack}
					style={{
						padding: '8px 16px',
						backgroundColor: '#6c757d',
						color: 'white',
						border: 'none',
						borderRadius: 4,
						cursor: 'pointer',
						marginRight: 20,
					}}
				>
					← Back to Projects
				</button>
				<h1>Quest Editor - {project.name}</h1>
			</div>

			<div style={{ marginBottom: 20 }}>
				<p style={{ color: '#666' }}>Project Path: {project.path}</p>
			</div>

			{/* Tab Navigation */}
			<div style={{ borderBottom: '1px solid #ddd', marginBottom: 20 }}>
				<div style={{ display: 'flex', gap: 0 }}>
					{[
						{ key: 'quests', label: 'Quests' },
						{ key: 'npcs', label: 'NPCs' },
						{ key: 'items', label: 'Items' },
						{ key: 'locations', label: 'Locations' },
					].map((tab) => (
						<button
							key={tab.key}
							onClick={() => setActiveTab(tab.key as any)}
							style={{
								padding: '12px 24px',
								backgroundColor:
									activeTab === tab.key ? '#007bff' : 'transparent',
								color: activeTab === tab.key ? 'white' : '#666',
								border: 'none',
								borderBottom:
									activeTab === tab.key ? '2px solid #0056b3' : 'none',
								cursor: 'pointer',
								fontWeight: activeTab === tab.key ? 'bold' : 'normal',
							}}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{/* Tab Content */}
			<div style={{ padding: 20 }}>
				{activeTab === 'quests' && renderQuestsTab()}
				{activeTab === 'npcs' && renderNPCsTab()}
				{activeTab === 'items' && renderItemsTab()}
				{activeTab === 'locations' && renderLocationsTab()}
			</div>
		</div>
	)
}
