import React, { useState, useEffect } from 'react'
import { Project } from '@/shared/types'
import { QuestBuilder } from '@/features/quest-builder/components/QuestBuilder'
import { GamePlayer } from '@/features/game-player/components/GamePlayer'

// Import all CSS files
import '@/shared/styles/base.css'
import '@/shared/styles/header.css'
import '@/shared/styles/tabs.css'
import '@/shared/styles/entity-panel.css'
import '@/shared/styles/modals.css'
import '@/shared/styles/forms.css'
import '@/shared/styles/cards.css'
import '@/shared/styles/utilities.css'

declare global {
	interface Window {
		electronAPI: {
			selectFolder: () => Promise<string | undefined>
			readFile: (folderPath: string, fileName: string) => Promise<string>
			writeFile: (
				folderPath: string,
				fileName: string,
				content: string
			) => Promise<void>
			getProjects: () => Promise<Project[]>
			createProject: (name: string, path: string) => Promise<Project>
			updateProjectLastOpened: (projectId: string) => Promise<void>
			deleteProject: (projectId: string) => Promise<void>
			// QuestEditor API methods
			setQuestEditorProject: (projectPath: string) => Promise<void>
			getQuestEditorProjectPath: () => Promise<string | null>
			getQuestData: (dataType: string) => Promise<any>
			saveQuestData: (dataType: string, data: any) => Promise<void>
			openPlayerWindow: () => Promise<void>
		}
	}
}

function App() {
	const [projects, setProjects] = useState<Project[]>([])
	const [showCreateForm, setShowCreateForm] = useState<boolean>(false)
	const [newProjectName, setNewProjectName] = useState<string>('')
	const [selectedPath, setSelectedPath] = useState<string>('')
	const [loading, setLoading] = useState<boolean>(false)
	const [currentProject, setCurrentProject] = useState<Project | null>(null)
	const [showQuestEditor, setShowQuestEditor] = useState<boolean>(false)
	const [openingProject, setOpeningProject] = useState<boolean>(false)

	// Check if we're in player mode (accessed via /player route or #/player/ hash)
	const isPlayerMode =
		window.location.pathname.startsWith('/player') ||
		window.location.hash.startsWith('#/player')

	useEffect(() => {
		loadProjects()
	}, [])

	const loadProjects = async () => {
		try {
			const projectList = await window.electronAPI.getProjects()
			setProjects(projectList)
		} catch (error) {
			console.error('Failed to load projects:', error)
		}
	}

	const handleSelectFolder = async () => {
		try {
			const path = await window.electronAPI.selectFolder()
			if (path) {
				setSelectedPath(path)
			}
		} catch (error) {
			console.error('Failed to select folder:', error)
		}
	}

	const handleCreateProject = async () => {
		if (!newProjectName.trim() || !selectedPath) {
			alert('Please enter a project name and select a folder.')
			return
		}

		setLoading(true)
		try {
			const newProject = await window.electronAPI.createProject(
				newProjectName.trim(),
				selectedPath
			)
			setProjects((prev) => [...prev, newProject])
			setNewProjectName('')
			setSelectedPath('')
			setShowCreateForm(false)
		} catch (error) {
			console.error('Failed to create project:', error)
			alert('Failed to create project. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	const handleOpenProject = async (project: Project) => {
		try {
			console.log('Opening project:', project.name, project.path)
			setOpeningProject(true)
			await window.electronAPI.updateProjectLastOpened(project.id)
			setCurrentProject(project)

			// Initialize questEditor with the project path BEFORE showing the builder
			console.log('Setting quest editor project path:', project.path)
			await window.electronAPI.setQuestEditorProject(project.path)

			setShowQuestEditor(true)
			console.log('Project opened successfully')
		} catch (error) {
			console.error('Failed to open project:', error)
			alert('Failed to open project. Please try again.')
		} finally {
			setOpeningProject(false)
		}
	}

	const handleDeleteProject = async (project: Project) => {
		const confirmDelete = window.confirm(
			`Are you sure you want to delete the project "${project.name}"?\n\nThis action cannot be undone.`
		)

		if (!confirmDelete) return

		try {
			await window.electronAPI.deleteProject(project.id)
			setProjects((prev) => prev.filter((p) => p.id !== project.id))
		} catch (error) {
			console.error('Failed to delete project:', error)
			alert('Failed to delete project. Please try again.')
		}
	}

	const handleBackToProjects = () => {
		setCurrentProject(null)
		setShowQuestEditor(false)
	}

	const handleProjectPathChange = async (projectPath: string) => {
		// Find the project that matches the new path
		const projects = await window.electronAPI.getProjects()
		const newProject = projects.find((p) => p.path === projectPath)
		if (newProject) {
			setCurrentProject(newProject)
		}
	}

	// Render Player interface if accessed via /player route
	if (isPlayerMode) {
		return (
			<div style={{ height: '100vh', width: '100vw' }}>
				<GamePlayer />
			</div>
		)
	}

	// Render Builder interface if a project is selected
	if (showQuestEditor && currentProject) {
		return (
			<div style={{ height: '100vh', width: '100vw' }}>
				<QuestBuilder
					onBack={handleBackToProjects}
					project={currentProject}
					onProjectPathChange={handleProjectPathChange}
					enableAutoProjectSwitch={false}
				/>
			</div>
		)
	}

	return (
		<div className='builder'>
			<div
				className='builder-content'
				style={{ maxWidth: 800, margin: '0 auto' }}
			>
				<h1
					style={{
						textAlign: 'center',
						marginBottom: 30,
						color: '#00ffff',
						textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
						letterSpacing: '2px',
					}}
				>
					QuestEngine
				</h1>

				{/* Existing Projects */}
				<div style={{ marginBottom: 40 }}>
					<h2 style={{ color: '#00ffff', marginBottom: '1rem' }}>
						Your Projects
					</h2>
					{projects.length === 0 ? (
						<p style={{ color: '#666', fontStyle: 'italic' }}>
							No projects yet. Create your first project below!
						</p>
					) : (
						<div style={{ display: 'grid', gap: 15 }}>
							{projects.map((project) => (
								<div
									key={project.id}
									className={`entity-card ${openingProject ? 'disabled' : ''}`}
									style={{
										cursor: openingProject ? 'not-allowed' : 'pointer',
										opacity: openingProject ? 0.7 : 1,
										padding: '1rem',
										background: 'rgba(255, 255, 255, 0.05)',
										border: '1px solid rgba(0, 255, 255, 0.2)',
										borderRadius: '8px',
										transition: 'all 0.3s ease',
										boxShadow: openingProject
											? 'none'
											: '0 0 10px rgba(0, 255, 255, 0.1)',
									}}
									onMouseEnter={(e) => {
										if (!openingProject) {
											e.currentTarget.style.background =
												'rgba(0, 255, 255, 0.1)'
											e.currentTarget.style.borderColor =
												'rgba(0, 255, 255, 0.4)'
											e.currentTarget.style.transform = 'translateY(-2px)'
											e.currentTarget.style.boxShadow =
												'0 0 15px rgba(0, 255, 255, 0.3)'
										}
									}}
									onMouseLeave={(e) => {
										if (!openingProject) {
											e.currentTarget.style.background =
												'rgba(255, 255, 255, 0.05)'
											e.currentTarget.style.borderColor =
												'rgba(0, 255, 255, 0.2)'
											e.currentTarget.style.transform = 'translateY(0)'
											e.currentTarget.style.boxShadow =
												'0 0 10px rgba(0, 255, 255, 0.1)'
										}
									}}
									onClick={() => !openingProject && handleOpenProject(project)}
								>
									<h3 style={{ margin: '0 0 8px 0' }}>
										{project.name}
										{openingProject && (
											<span
												style={{
													marginLeft: 10,
													fontSize: '14px',
													color: '#00ffff',
													textShadow: '0 0 5px rgba(0, 255, 255, 0.3)',
													fontWeight: 'bold',
													letterSpacing: '0.5px',
												}}
											>
												Opening...
											</span>
										)}
									</h3>
									<p
										style={{
											margin: '0 0 8px 0',
											color: '#b0b0b0',
											fontSize: '14px',
											fontFamily: 'monospace',
										}}
									>
										{project.path}
									</p>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											marginBottom: '8px',
										}}
									>
										<p
											style={{
												margin: 0,
												color: '#888',
												fontSize: '12px',
												fontFamily: 'inherit',
											}}
										>
											Created:{' '}
											{new Date(project.createdAt).toLocaleDateString()}
											{project.lastOpenedAt && (
												<span style={{ marginLeft: 15, color: '#b0b0b0' }}>
													Last opened:{' '}
													{new Date(project.lastOpenedAt).toLocaleDateString()}
												</span>
											)}
										</p>
										<button
											onClick={(e) => {
												e.stopPropagation()
												handleDeleteProject(project)
											}}
											className='remove-button'
											style={{
												padding: '4px 8px',
												fontSize: '12px',
												backgroundColor: '#dc3545',
												color: 'white',
												border: 'none',
												borderRadius: 4,
												cursor: 'pointer',
												transition: 'background-color 0.2s',
												fontFamily: 'inherit',
												textTransform: 'uppercase',
												letterSpacing: '0.5px',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.backgroundColor = '#c82333'
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.backgroundColor = '#dc3545'
											}}
										>
											Delete
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Create New Project */}
				<div
					style={{
						borderTop: '1px solid rgba(0, 255, 255, 0.2)',
						paddingTop: 30,
					}}
				>
					{!showCreateForm ? (
						<button
							onClick={() => setShowCreateForm(true)}
							className='edit-button'
							style={{
								padding: '12px 24px',
								fontSize: '16px',
								backgroundColor: '#007bff',
								color: 'white',
								border: 'none',
								borderRadius: 6,
								cursor: 'pointer',
								fontFamily: 'inherit',
								textTransform: 'uppercase',
								letterSpacing: '1px',
							}}
						>
							Create New Project
						</button>
					) : (
						<div
							className='edit-form'
							style={{
								border: '1px solid rgba(0, 255, 255, 0.2)',
								borderRadius: '8px',
								padding: '1.5rem',
								background: 'rgba(255, 255, 255, 0.05)',
								boxShadow: '0 0 10px rgba(0, 255, 255, 0.1)',
							}}
						>
							<h3
								style={{
									color: '#00ffff',
									marginBottom: '1rem',
									textShadow: '0 0 5px rgba(0, 255, 255, 0.3)',
								}}
							>
								Create New Project
							</h3>
							<div className='form-group'>
								<label>Project Name:</label>
								<input
									type='text'
									value={newProjectName}
									onChange={(e) => setNewProjectName(e.target.value)}
									placeholder='Enter project name...'
								/>
							</div>
							<div className='form-group'>
								<label>Project Location:</label>
								<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
									<input
										type='text'
										value={selectedPath}
										readOnly
										placeholder='Select a folder...'
										style={{
											flex: 1,
											padding: '0.75rem',
											border: '1px solid rgba(0, 255, 255, 0.3)',
											background:
												'linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(255, 0, 255, 0.05) 100%)',
											color: '#e0e0e0',
											fontFamily: 'inherit',
											fontSize: '0.9rem',
											borderRadius: '4px',
											transition: 'all 0.3s ease',
										}}
									/>
									<button
										onClick={handleSelectFolder}
										className='edit-button'
										style={{
											padding: '8px 16px',
											backgroundColor: '#6c757d',
											color: 'white',
											border: 'none',
											borderRadius: 4,
											cursor: 'pointer',
										}}
									>
										Browse
									</button>
								</div>
							</div>
							<div style={{ display: 'flex', gap: 10 }}>
								<button
									onClick={handleCreateProject}
									disabled={loading || !newProjectName.trim() || !selectedPath}
									className='edit-button'
									style={{
										padding: '10px 20px',
										backgroundColor: loading ? '#6c757d' : '#28a745',
										color: 'white',
										border: 'none',
										borderRadius: 4,
										cursor: loading ? 'not-allowed' : 'pointer',
									}}
								>
									{loading ? 'Creating...' : 'Create Project'}
								</button>
								<button
									onClick={() => {
										setShowCreateForm(false)
										setNewProjectName('')
										setSelectedPath('')
									}}
									disabled={loading}
									className='remove-button'
									style={{
										padding: '10px 20px',
										backgroundColor: '#dc3545',
										color: 'white',
										border: 'none',
										borderRadius: 4,
										cursor: loading ? 'not-allowed' : 'pointer',
									}}
								>
									Cancel
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default App
