import express from 'express'
import * as path from 'path'
import * as fs from 'fs/promises'
import * as fsSync from 'fs'

export function setupApiRoutes(
	router: express.Router,
	persistence: any,
	projectPath: string | null
): void {
	// Game data endpoint (legacy)
	router.get('/game', async (req, res) => {
		try {
			const game = await persistence.loadGame()
			res.json(game)
		} catch (error) {
			res.status(500).json({ error: 'Failed to load game data' })
		}
	})

	// Load game data endpoint (used by Builder)
	router.get('/load', async (req, res) => {
		try {
			const game = await persistence.loadGame()
			res.json({ success: true, data: game })
		} catch (error) {
			console.error('Error loading game data:', error)
			res.json({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			})
		}
	})

	// Save game data endpoint (used by Builder)
	router.post('/save', async (req, res) => {
		try {
			const gameData = req.body
			await persistence.saveGame(gameData)
			res.json({ success: true })
		} catch (error) {
			console.error('Error saving game data:', error)
			res.json({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			})
		}
	})

	// Generate ID endpoint
	router.post('/generate-id', async (req, res) => {
		try {
			const { name, entityType, currentEntityId, prefix } = req.body
			// For now, generate a simple ID. In the future, this could use the backend's ID generation
			const id = `${entityType}_${Date.now()}_${Math.random()
				.toString(36)
				.substr(2, 9)}`
			res.json({ success: true, data: id })
		} catch (error) {
			res.json({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			})
		}
	})

	// Start game session endpoint
	router.post('/start', async (req, res) => {
		try {
			// Initialize game session if needed
			res.json({ success: true })
		} catch (error) {
			res.json({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			})
		}
	})

	// Reset game session endpoint
	router.post('/reset', async (req, res) => {
		try {
			// Reset game session logic
			res.json({ success: true })
		} catch (error) {
			res.json({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			})
		}
	})

	// Interact endpoint
	router.post('/interact', async (req, res) => {
		try {
			const { type, params } = req.body
			// Handle interaction logic
			res.json({ success: true })
		} catch (error) {
			res.json({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			})
		}
	})

	// Quests endpoints
	router.get('/quests', async (req, res) => {
		try {
			const quests = await persistence.loadQuests()
			res.json(quests)
		} catch (error) {
			res.status(500).json({ error: 'Failed to load quests' })
		}
	})

	router.post('/quests', async (req, res) => {
		try {
			await persistence.saveQuests(req.body)
			res.json({ success: true })
		} catch (error) {
			res.status(500).json({ error: 'Failed to save quests' })
		}
	})

	// EntityLinks endpoints
	router.get('/entityLinks', async (req, res) => {
		try {
			const entityLinks = await persistence.loadEntityLinks()
			res.json({ success: true, data: entityLinks })
		} catch (error) {
			console.error('Error loading entityLinks:', error)
			res.json({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			})
		}
	})

	router.patch('/entityLinks/:entityId', async (req, res) => {
		try {
			const { entityId } = req.params
			const updateData = req.body

			// Load current entityLinks
			const entityLinks = await persistence.loadEntityLinks()

			// Update the specific entity
			if (!entityLinks[entityId]) {
				entityLinks[entityId] = {}
			}
			Object.assign(entityLinks[entityId], updateData)

			// Save back
			await persistence.saveEntityLinks(entityLinks)

			res.json({ success: true })
		} catch (error) {
			console.error('Error updating entityLinks:', error)
			res.json({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			})
		}
	})

	// Get thumbnail images from the current DCL project
	router.get('/thumbnails', async (req, res) => {
		try {
			console.log('API: /thumbnails endpoint called')
			console.log('API: Getting thumbnails, projectPath:', projectPath)
			console.log('API: Project path type:', typeof projectPath)
			console.log('API: Project path truthy:', !!projectPath)
			const images: Array<{ name: string; url: string; project: string }> = []

			if (!projectPath) {
				console.log('API: No project path set - returning empty array')
				return res.json({
					success: true,
					data: images,
					message: 'No project loaded. Please select a project first.',
				})
			}

			console.log('API: Project path is set, proceeding with image scan')

			// Capture projectPath in a local variable to avoid 'this' binding issues
			const currentProjectPath = projectPath
			console.log('API: Captured project path:', currentProjectPath)

			// Helper function to recursively get all image files from a directory
			const getAllImageFiles = async (
				dirPath: string,
				baseUrl: string,
				projectName: string
			): Promise<Array<{ name: string; url: string; project: string }>> => {
				const result: Array<{ name: string; url: string; project: string }> = []

				try {
					console.log(`API: Attempting to read directory: ${dirPath}`)
					const items = await fs.readdir(dirPath)
					console.log(
						`API: Successfully read directory, found ${items.length} items:`,
						items
					)

					for (const item of items) {
						console.log(`API: Processing item: ${item}`)
						const fullPath = path.join(dirPath, item)
						const stat = await fs.stat(fullPath)

						if (stat.isDirectory()) {
							console.log(`API: ${item} is a directory, recursing...`)
							// Recursively scan subdirectories
							const subImages = await getAllImageFiles(
								fullPath,
								baseUrl,
								projectName
							)
							result.push(...subImages)
						} else if (stat.isFile()) {
							console.log(`API: ${item} is a file`)
							// Check if it's an image file
							const ext = path.extname(item).toLowerCase()
							console.log(`API: Extension: ${ext}`)
							if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
								const relativePath = path.relative(dirPath, fullPath)
								const url = `${baseUrl}/${relativePath.replace(/\\/g, '/')}`
								console.log(`API: Found image: ${relativePath} -> ${url}`)
								result.push({
									name: relativePath,
									url: url,
									project: projectName,
								})
							} else {
								console.log(`API: Skipping non-image file: ${item}`)
							}
						}
					}
				} catch (error) {
					// Gracefully ignore if directory doesn't exist or can't be read
					console.log(
						`API: Could not read directory ${dirPath}:`,
						error instanceof Error ? error.message : String(error)
					)
					console.log('API: Full error object:', error)
				}

				return result
			}

			// Look for images in multiple locations
			console.log('API: Checking for images in multiple locations...')

			// 1. Check thumbnails folder (existing logic)
			const thumbnailsPath = path.join(currentProjectPath, 'thumbnails')
			try {
				console.log('API: Checking thumbnails folder:', thumbnailsPath)
				const thumbnailImages = await getAllImageFiles(
					thumbnailsPath,
					`http://localhost:31234/api/thumbnails/${path.basename(
						currentProjectPath
					)}`,
					path.basename(currentProjectPath)
				)
				console.log(`API: Found ${thumbnailImages.length} images in thumbnails`)
				images.push(...thumbnailImages)
			} catch (error) {
				console.log('API: No thumbnails folder accessible')
			}

			// 2. Check assets/images folder (new requirement)
			const assetsImagesPath = path.join(currentProjectPath, 'assets', 'images')
			console.log('API: About to check assets/images folder:', assetsImagesPath)
			console.log(
				'API: Does assets/images path exist?',
				fsSync.existsSync(assetsImagesPath) ? 'YES' : 'NO'
			)
			try {
				console.log('API: Checking assets/images folder:', assetsImagesPath)
				const assetsImages = await getAllImageFiles(
					assetsImagesPath,
					`http://localhost:31234/assets/images`,
					'assets'
				)
				console.log(`API: Found ${assetsImages.length} images in assets/images`)
				images.push(...assetsImages)
			} catch (error) {
				console.log(
					'API: No assets/images folder accessible:',
					error instanceof Error ? error.message : String(error)
				)
				console.log('API: Full error details:', error)
			}

			console.log(`API: Total images found: ${images.length}`)

			const response = {
				success: true,
				data: images,
			}
			res.json(response)
		} catch (error) {
			console.error('Error getting thumbnails:', error)
			const response = {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}
			res.status(500).json(response)
		}
	})
}
