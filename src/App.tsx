import React, { useState, useEffect } from 'react'
import { Project } from '@/shared/types'
import { QuestBuilder } from '@/features/quest-builder/components/QuestBuilder'
import { GamePlayer } from '@/features/game-player/components/GamePlayer'

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

	// Check if we're in player mode (accessed via /player route)
	const isPlayerMode = window.location.pathname.startsWith('/player')

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
		<div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
			<h1 style={{ textAlign: 'center', marginBottom: 30 }}>QuestEngine</h1>

			{/* Existing Projects */}
			<div style={{ marginBottom: 40 }}>
				<h2>Your Projects</h2>
				{projects.length === 0 ? (
					<p style={{ color: '#666', fontStyle: 'italic' }}>
						No projects yet. Create your first project below!
					</p>
				) : (
					<div style={{ display: 'grid', gap: 15 }}>
						{projects.map((project) => (
							<div
								key={project.id}
								style={{
									border: '1px solid #ddd',
									borderRadius: 8,
									padding: 15,
									cursor: openingProject ? 'not-allowed' : 'pointer',
									transition: 'all 0.2s',
									backgroundColor: openingProject ? '#e9ecef' : '#f9f9f9',
									opacity: openingProject ? 0.7 : 1,
								}}
								onMouseEnter={(e) => {
									if (!openingProject) {
										e.currentTarget.style.backgroundColor = '#f0f0f0'
										e.currentTarget.style.transform = 'translateY(-2px)'
									}
								}}
								onMouseLeave={(e) => {
									if (!openingProject) {
										e.currentTarget.style.backgroundColor = '#f9f9f9'
										e.currentTarget.style.transform = 'translateY(0)'
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
												color: '#666',
											}}
										>
											Opening...
										</span>
									)}
								</h3>
								<p
									style={{
										margin: '0 0 8px 0',
										color: '#666',
										fontSize: '14px',
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
									<p style={{ margin: 0, color: '#888', fontSize: '12px' }}>
										Created: {new Date(project.createdAt).toLocaleDateString()}
										{project.lastOpenedAt && (
											<span style={{ marginLeft: 15 }}>
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
										style={{
											padding: '4px 8px',
											fontSize: '12px',
											backgroundColor: '#dc3545',
											color: 'white',
											border: 'none',
											borderRadius: 4,
											cursor: 'pointer',
											transition: 'background-color 0.2s',
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
			<div style={{ borderTop: '1px solid #eee', paddingTop: 30 }}>
				{!showCreateForm ? (
					<button
						onClick={() => setShowCreateForm(true)}
						style={{
							padding: '12px 24px',
							fontSize: '16px',
							backgroundColor: '#007bff',
							color: 'white',
							border: 'none',
							borderRadius: 6,
							cursor: 'pointer',
						}}
					>
						Create New Project
					</button>
				) : (
					<div
						style={{
							border: '1px solid #ddd',
							borderRadius: 8,
							padding: 20,
							backgroundColor: '#f9f9f9',
						}}
					>
						<h3>Create New Project</h3>
						<div style={{ marginBottom: 15 }}>
							<label
								style={{
									display: 'block',
									marginBottom: 5,
									fontWeight: 'bold',
								}}
							>
								Project Name:
							</label>
							<input
								type='text'
								value={newProjectName}
								onChange={(e) => setNewProjectName(e.target.value)}
								placeholder='Enter project name...'
								style={{
									width: '100%',
									padding: '8px 12px',
									border: '1px solid #ccc',
									borderRadius: 4,
									fontSize: '14px',
								}}
							/>
						</div>
						<div style={{ marginBottom: 20 }}>
							<label
								style={{
									display: 'block',
									marginBottom: 5,
									fontWeight: 'bold',
								}}
							>
								Project Location:
							</label>
							<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
								<input
									type='text'
									value={selectedPath}
									readOnly
									placeholder='Select a folder...'
									style={{
										flex: 1,
										padding: '8px 12px',
										border: '1px solid #ccc',
										borderRadius: 4,
										fontSize: '14px',
										backgroundColor: '#f5f5f5',
									}}
								/>
								<button
									onClick={handleSelectFolder}
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
	)
}

export default App
