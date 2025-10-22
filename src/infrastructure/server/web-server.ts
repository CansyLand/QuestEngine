import express from 'express'
import * as path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import fs from 'fs'

import { GameEngine } from '@/core/engine/GameEngine'
import { PersistenceManager } from '@/core/services/persistence/PersistenceManager'
import { createApiRouter } from '@/core/services/api/ApiService'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3000

// Enable CORS for all routes
app.use(cors())

// Initialize backend components
const persistence = new PersistenceManager(path.join(__dirname, '../../data'))
const engine = new GameEngine(persistence)
await engine.initializeGame()

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../../public')))

// Serve node_modules for ES module resolution (development only)
app.use(
	'/node_modules',
	express.static(path.join(__dirname, '../../../node_modules'))
)

// API routes
app.use('/api', createApiRouter(engine, persistence, null))

// Serve builder at /builder
app.get('/builder', (req, res) => {
	res.sendFile(path.join(__dirname, '../../dist/frontend/index.html'))
})

// Serve player at /player
app.get('/player', (req, res) => {
	res.sendFile(path.join(__dirname, '../../dist/frontend/index.html'))
})

// Serve static files from built frontend directories (after specific routes)
app.use('/builder', express.static(path.join(__dirname, '../../dist/frontend')))
app.use('/player', express.static(path.join(__dirname, '../../dist/frontend')))
app.use('/shared', express.static(path.join(__dirname, '../../dist/frontend')))

// Default route redirects to builder
app.get('/', (req, res) => {
	res.redirect('/builder')
})

app.listen(PORT, () => {
	console.log(`Game Editor server running at http://localhost:${PORT}`)
	console.log(`Builder: http://localhost:${PORT}/builder`)
	console.log(`Player: http://localhost:${PORT}/player`)
})

// DCL Entity Monitoring Setup
// Paths (relative to questEditor/web/)
const compositePath = path.join(
	__dirname,
	'../../../assets/scene/main.composite'
)
const linksPath = path.join(__dirname, '../../data/entityLinks.json')

// In-memory cache for change detection (simple hash based on entity count)
let lastHash: string | null = null

// Function to compute a basic hash of main.composite (for change detection)
function computeHash(data: any): string {
	// More comprehensive hash that includes entity data changes
	const transformData =
		data.components?.find((c: any) => c.name === 'core::Transform')?.data || {}
	const nameData =
		data.components?.find((c: any) => c.name === 'core-schema::Name')?.data ||
		{}

	// Include entity count and all entity names/positions for comprehensive change detection
	const entities = Object.keys(transformData)
	let hashData = entities.length.toString()

	// Sort entities to ensure consistent hashing
	const sortedEntities = entities.sort()

	sortedEntities.forEach((entityId) => {
		const transform = transformData[entityId]?.json
		const name = nameData[entityId]?.json?.value

		if (transform) {
			hashData += `${entityId}:${transform.position?.x || 0},${
				transform.position?.y || 0
			},${transform.position?.z || 0}`
		}
		if (name) {
			hashData += `:${name}`
		}
	})

	return hashData
}

// Function to extract relevant entity data from main.composite
function extractEntityData(compositeData: any) {
	const links: Record<string, any> = {}
	const transformData =
		compositeData.components?.find((c: any) => c.name === 'core::Transform')
			?.data || {}
	const nameData =
		compositeData.components?.find((c: any) => c.name === 'core-schema::Name')
			?.data || {}

	// Iterate through transform entities (assuming they align with name entities)
	for (const entityId of Object.keys(transformData)) {
		if (nameData[entityId]) {
			// Only process if both components exist
			const transform = transformData[entityId].json
			const name = nameData[entityId].json.value
			links[entityId] = {
				position: transform.position || { x: 0, y: 0, z: 0 }, // Fallback if missing
				parent: transform.parent || 0,
				name: name || 'Unknown',
				questEntityId: null, // Placeholder for manual linking (e.g., to "bass_string" or "crystallia")
			}
		}
	}
	return links
}

// Function to update entityLinks.json
async function updateLinks(newLinks: Record<string, any>) {
	// Load existing links
	let existingLinks: Record<string, any> = {}
	try {
		if (fs.existsSync(linksPath)) {
			const data = await fs.promises.readFile(linksPath, 'utf8')
			existingLinks = JSON.parse(data)
		}
	} catch (error) {
		console.error('Error reading existing links:', error)
	}

	// Create updated links
	const updatedLinks: Record<string, any> = {}

	// Process existing entities
	for (const entityId in existingLinks) {
		const existingEntity = existingLinks[entityId]

		if (newLinks[entityId]) {
			// Entity still exists, update with new data (including name changes)
			updatedLinks[entityId] = {
				...newLinks[entityId],
				questEntityId: existingEntity.questEntityId, // Preserve existing quest entity links
			}
		} else {
			// Entity was removed from main.composite - delete it entirely
			// (we don't need to keep removed entities in entityLinks.json)
			console.log(
				`Removing entity ${entityId} (${existingEntity.name}) from entityLinks.json`
			)
		}
	}

	// Add any new entities from main.composite
	for (const entityId in newLinks) {
		if (!existingLinks[entityId]) {
			updatedLinks[entityId] = newLinks[entityId]
			console.log(
				`Adding new entity ${entityId} (${newLinks[entityId].name}) to entityLinks.json`
			)
		}
	}

	// Write back to file
	try {
		await fs.promises.writeFile(
			linksPath,
			JSON.stringify(updatedLinks, null, 2)
		)
		console.log('entityLinks.json updated.')
	} catch (error) {
		console.error('Error writing links file:', error)
	}
}

// Main monitoring function
async function monitorChanges() {
	if (!fs.existsSync(compositePath)) {
		console.error(`File not found: ${compositePath}`)
		return
	}

	try {
		const compositeData = JSON.parse(
			await fs.promises.readFile(compositePath, 'utf8')
		)
		const currentHash = computeHash(compositeData)

		if (currentHash !== lastHash) {
			lastHash = currentHash // Update cache
			const newLinks = extractEntityData(compositeData)
			await updateLinks(newLinks)
		}
		// No else: File unchanged, do nothing
	} catch (error) {
		console.error('Error monitoring main.composite:', error)
	}
}

// Start monitoring every 3 seconds
setInterval(monitorChanges, 3000)
console.log('DCL change monitoring started. Checking every 3 seconds.')
