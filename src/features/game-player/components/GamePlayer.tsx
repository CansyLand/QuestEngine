import React, { useState, useEffect, useRef } from 'react'
import { startGame, sendInteraction, getDialogue } from '@/shared/utils/api'
import { Grid } from './Grid'
import { DialoguePanel } from './DialoguePanel'
import { ImageDisplay } from '@/shared/components/ui/ImagePicker'
import '@/shared/styles/base.css'
import '@/shared/styles/Player.css'

interface PlayerProps {}

export const GamePlayer: React.FC<PlayerProps> = () => {
	console.log('[GamePlayer] Component function called')

	const [gameStarted, setGameStarted] = useState(false)
	const [currentLocation, setCurrentLocation] = useState<any>(null)
	const [currentEntities, setCurrentEntities] = useState<any[]>([])
	const [childLocations, setChildLocations] = useState<any[]>([])
	const [currentChildLocationIndex, setCurrentChildLocationIndex] =
		useState<number>(0)
	const [inventory, setInventory] = useState<string[]>([])
	const [activeDialogue, setActiveDialogue] = useState<{
		sequence: any
		currentDialogIndex: number
		npcId?: string
	} | null>(null)
	const [questLog, setQuestLog] = useState<string[]>([])
	const [backgroundMusic, setBackgroundMusic] = useState<string>('')
	const [backgroundImage, setBackgroundImage] = useState<string>('')
	const [projectPath, setProjectPath] = useState<string | null>(null)
	const audioRef = useRef<HTMLAudioElement>(null)

	useEffect(() => {
		console.log('[GamePlayer] Component mounted, initializing project path')

		const getProjectPath = async () => {
			console.log('[GamePlayer] getProjectPath called')

			// Check if window is available
			if (typeof window === 'undefined') {
				console.error('[GamePlayer] Window object is not available')
				setProjectPath(null)
				return
			}

			// First, try to get project path from URL parameters (for player window)
			const urlParams = new URLSearchParams(window.location.search)
			const projectPathParam = urlParams.get('projectPath')

			if (projectPathParam) {
				console.log(
					'[GamePlayer] Project path from URL parameter:',
					projectPathParam
				)
				setProjectPath(projectPathParam)
				return
			}

			// Fallback: try to get from electronAPI (for backward compatibility)
			console.log(
				'[GamePlayer] No project path in URL, checking for electronAPI'
			)
			const electronAPI = (window as any).electronAPI

			if (!electronAPI) {
				console.error('[GamePlayer] electronAPI not found on window object')
				console.log(
					'[GamePlayer] Available properties on window:',
					Object.keys(window)
				)
				setProjectPath(null)
				return
			}

			console.log(
				'[GamePlayer] electronAPI found, calling getQuestEditorProjectPath'
			)
			try {
				const path = await electronAPI.getQuestEditorProjectPath()
				console.log('[GamePlayer] Project path retrieved:', path)
				setProjectPath(path)
			} catch (error) {
				console.error('[GamePlayer] Failed to get project path:', error)
				setProjectPath(null)
			}
		}
		getProjectPath()
	}, [])

	const getImageUrl = (imagePath: string) => {
		return imagePath && projectPath ? projectPath + imagePath : imagePath
	}

	const getProjectName = () => {
		if (!projectPath) return 'Unknown Project'
		// Extract project name from path (last segment before any file extension)
		const segments = projectPath.split('/')
		const lastSegment = segments[segments.length - 1]
		// Remove any file extension if present
		return lastSegment.replace(/\.[^/.]+$/, '')
	}

	// Execute commands locally for this component
	const executeCommandsLocally = (commands: any[]) => {
		commands.forEach((command) => {
			switch (command.type) {
				case 'playSound':
					const audio = new Audio(command.params.url)
					audio.play().catch(console.error)
					break
				case 'spawnEntity':
					// Update grid to show entity
					console.log(`Spawn entity: ${command.params.id}`)
					// For now, we'll need a full location update to refresh entities
					// In a more sophisticated system, we'd merge the entity into current entities
					break
				case 'clearEntity':
				case 'clearItem':
					// Update grid to hide entity - entity will be marked as cleared in the backend
					// and filtered out by the Grid component, but we keep it in the array for stable positions
					console.log(`Clear entity: ${command.params.id}`)
					setCurrentEntities((prev) =>
						prev.map((entity: any) =>
							entity.id === command.params.id
								? { ...entity, cleared: true }
								: entity
						)
					)
					break
				case 'updateLocation':
					setCurrentLocation({
						id: command.params.locationId,
						name: command.params.locationName,
					})

					// Check if this location has child locations
					if (
						command.params.childLocations &&
						command.params.childLocations.length > 0
					) {
						setChildLocations(command.params.childLocations)
						setCurrentChildLocationIndex(0)

						// Show the first child location
						const firstChild = command.params.childLocations[0]
						setCurrentEntities(firstChild.entities || [])
						setBackgroundImage(
							firstChild.backgroundImage || command.params.backgroundImage
						)
						setBackgroundMusic(
							firstChild.backgroundMusic || command.params.backgroundMusic
						)
						addToQuestLog(`Entered location: ${firstChild.name}`)
					} else {
						// Regular location without children
						setChildLocations([])
						setCurrentChildLocationIndex(0)
						setCurrentEntities(command.params.entities || [])
						setBackgroundImage(command.params.backgroundImage)
						setBackgroundMusic(command.params.backgroundMusic)
						addToQuestLog(`Entered location: ${command.params.locationName}`)
					}
					break
				case 'changeBackground':
					setBackgroundImage(command.params.image)
					setBackgroundMusic(command.params.music)
					break
				case 'updateInventory':
					setInventory(command.params.inventory)
					break
				case 'updateEntity':
					// Update entity properties (e.g., interactivity, state)
					setCurrentEntities((prev) =>
						prev.map((entity: any) =>
							entity.id === command.params.id
								? { ...entity, ...command.params }
								: entity
						)
					)
					break
				case 'updateVesselTexture':
					// Update vessel appearance to show it's activated
					setCurrentEntities((prev) =>
						prev.map((entity: any) =>
							entity.id === command.params.vesselId
								? {
										...entity,
										activated: command.params.activated,
										image: command.params.activated
											? 'activated_vessel_image.png'
											: entity.image,
								  }
								: entity
						)
					)
					break
				case 'questActivated':
					addToQuestLog(
						`Quest started: ${
							command.params.questTitle || command.params.questId
						}`
					)
					break
				case 'questCompleted':
					addToQuestLog(
						`Quest completed: ${
							command.params.questTitle || command.params.questId
						}`
					)
					break
				case 'showDialogue':
					// Fetch the dialogue sequence and show it
					handleShowDialogue(
						command.params.dialogueSequenceId,
						command.params.npcId
					)
					break
				case 'log':
					addToQuestLog(command.params.message)
					break
				default:
					console.warn(`Unknown command type: ${command.type}`)
			}
		})
	}

	// Initialize player with most recently opened project
	useEffect(() => {
		console.log('[GamePlayer] Initializing player effect triggered')

		const initializePlayer = async () => {
			console.log('[GamePlayer] initializePlayer function called')

			try {
				console.log(
					'[GamePlayer] Checking for window object in initializePlayer'
				)
				// Check if window is available
				if (typeof window === 'undefined') {
					console.error(
						'[GamePlayer] Window object is not available in initializePlayer'
					)
					addToQuestLog(
						'Failed to initialize player: Window object not available'
					)
					return
				}

				console.log('[GamePlayer] Window available, checking for electronAPI')
				// Get the most recently opened project
				let electronAPI = (window as any).electronAPI

				// If electronAPI is not available immediately, wait a bit and try again
				if (!electronAPI) {
					console.log(
						'[GamePlayer] electronAPI not immediately available, waiting 100ms...'
					)
					await new Promise((resolve) => setTimeout(resolve, 100))
					electronAPI = (window as any).electronAPI

					if (!electronAPI) {
						console.error(
							'[GamePlayer] electronAPI still not found after delay'
						)
						console.log(
							'[GamePlayer] Available properties on window in initializePlayer:',
							Object.keys(window)
						)
						console.log('[GamePlayer] Window object details:', window)
						console.log(
							'[GamePlayer] Checking if preload script loaded:',
							typeof (window as any).electronAPI !== 'undefined'
						)
						addToQuestLog(
							'Failed to initialize player: Electron API not available'
						)
						return
					}
					console.log('[GamePlayer] electronAPI became available after delay')
				}

				console.log('[GamePlayer] electronAPI found, calling getProjects')
				const projects = await electronAPI.getProjects()
				console.log(
					'[GamePlayer] Projects retrieved:',
					projects?.length || 0,
					'projects'
				)

				const mostRecentProject = projects
					.filter((p: any) => p.lastOpenedAt)
					.sort(
						(a: any, b: any) =>
							new Date(b.lastOpenedAt).getTime() -
							new Date(a.lastOpenedAt).getTime()
					)[0]

				console.log('[GamePlayer] Most recent project:', mostRecentProject)

				if (!mostRecentProject) {
					console.log('[GamePlayer] No recent project found')
					addToQuestLog(
						'No projects found. Please create and open a project first.'
					)
					return
				}

				console.log(
					'[GamePlayer] Setting quest editor project path:',
					mostRecentProject.path
				)
				// Set the project path in the main process
				await electronAPI.setQuestEditorProject(mostRecentProject.path)

				console.log('[GamePlayer] Starting game session')
				// Start the game
				startGameSession()
			} catch (error) {
				console.error('[GamePlayer] Failed to initialize player:', error)
				addToQuestLog(
					`Failed to initialize player: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`
				)
			}
		}

		initializePlayer()
	}, [])

	useEffect(() => {
		if (backgroundMusic && audioRef.current) {
			audioRef.current.src = backgroundMusic
			audioRef.current.play().catch(console.error)
		}
	}, [backgroundMusic])

	const startGameSession = async () => {
		try {
			const response = await startGame()
			if (response.success && response.commands) {
				executeCommandsLocally(response.commands)
				setGameStarted(true)
				addToQuestLog('Game started!')
			} else {
				addToQuestLog(`Failed to start game: ${response.error}`)
			}
		} catch (error) {
			addToQuestLog(
				`Failed to start game: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			)
		}
	}

	const handleEntityClick = async (entityType: string, entityId: string) => {
		console.log(
			`Sending interaction: click${entityType} for entity ${entityId}`
		)
		const response = await sendInteraction(`click${entityType}`, {
			id: entityId,
		})
		console.log(`Received response:`, response)
		if (response.success && response.commands) {
			console.log(`Executing commands:`, response.commands)
			executeCommandsLocally(response.commands)
		} else {
			console.log(`No commands received or error:`, response.error)
		}
	}

	const handleShowDialogue = async (
		dialogueSequenceId: string,
		npcId?: string
	) => {
		try {
			const apiResponse = await getDialogue(dialogueSequenceId)

			if (apiResponse.success && apiResponse.data) {
				setActiveDialogue({
					sequence: apiResponse.data,
					currentDialogIndex: 0,
					npcId: npcId,
				})
			}
		} catch (error) {
			console.error('Failed to get dialogue:', error)
		}
	}

	const handleNavigateChildLocation = (direction: 'prev' | 'next') => {
		const newIndex =
			direction === 'next'
				? Math.min(currentChildLocationIndex + 1, childLocations.length - 1)
				: Math.max(currentChildLocationIndex - 1, 0)

		if (newIndex !== currentChildLocationIndex) {
			setCurrentChildLocationIndex(newIndex)
			const childLocation = childLocations[newIndex]
			setCurrentEntities(childLocation.entities || [])
			setBackgroundImage(childLocation.backgroundImage || '')
			setBackgroundMusic(childLocation.backgroundMusic || '')
			addToQuestLog(`Entered location: ${childLocation.name}`)
		}
	}

	const addToQuestLog = (message: string) => {
		setQuestLog((prev) => [
			...prev,
			`${new Date().toLocaleTimeString()}: ${message}`,
		])
	}

	if (!gameStarted) {
		return (
			<div className='player-loading'>
				<h2>Starting Game...</h2>
				<div className='quest-log'>
					{questLog.map((entry, index) => (
						<div key={index} className='log-entry'>
							{entry}
						</div>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className='player'>
			<audio ref={audioRef} loop />

			{/* Background */}
			<div
				className='game-background'
				style={{
					backgroundImage: backgroundImage
						? `url(${getImageUrl(backgroundImage)})`
						: 'none',
				}}
			/>

			{/* Current Location Display - Above Inventory */}
			{currentLocation && (
				<div className='location-display-above-inventory'>
					<h3>{currentLocation.name}</h3>
					{backgroundImage && (
						<ImageDisplay
							src={getImageUrl(backgroundImage)}
							alt={currentLocation.name}
							className='location-image'
							fallback={<div className='no-image'>?</div>}
						/>
					)}
				</div>
			)}

			{/* Main game area */}
			<div className='game-area'>
				<Grid
					onEntityClick={handleEntityClick}
					backgroundImage={backgroundImage}
					entities={currentEntities}
					childLocations={childLocations}
					currentChildLocationIndex={currentChildLocationIndex}
					onNavigateChildLocation={handleNavigateChildLocation}
				/>

				{/* Inventory */}
				<div className='inventory'>
					<h3>Inventory</h3>
					{inventory.length === 0 ? (
						<p>Empty</p>
					) : (
						inventory.map((entityId) => (
							<div key={entityId} className='inventory-item'>
								{entityId}
							</div>
						))
					)}
				</div>
			</div>

			{/* Project Name */}
			<div className='project-name-display'>
				<h3>{getProjectName()}</h3>
			</div>

			{/* Dialogue Panel */}
			{activeDialogue && (
				<DialoguePanel
					dialogueSequence={activeDialogue.sequence}
					currentDialogIndex={activeDialogue.currentDialogIndex}
					onClose={() => setActiveDialogue(null)}
					onDialogChange={(dialogId) => {
						// Find the new dialog index
						const newIndex = activeDialogue.sequence.dialogs.findIndex(
							(d: any) => d.id === dialogId
						)
						if (newIndex !== -1) {
							setActiveDialogue({
								...activeDialogue,
								currentDialogIndex: newIndex,
							})
						} else {
							// Dialog not found, close the dialogue
							setActiveDialogue(null)
						}
					}}
				/>
			)}

			{/* Quest Log */}
			<div className='quest-log-panel'>
				<h3>Quest Log</h3>
				<div className='quest-log'>
					{questLog.map((entry, index) => (
						<div key={index} className='log-entry'>
							{entry}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
