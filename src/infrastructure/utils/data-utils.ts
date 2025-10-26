import * as path from 'path'
import * as fs from 'fs/promises'

/**
 * Initialize default data for a new project
 */
export async function initializeDefaultData(dataDir: string): Promise<void> {
	// Use process.cwd() to get the main project directory, then navigate to dataDemo
	const defaultDataDir = path.join(process.cwd(), 'dataDemo')
	console.log('__dirname:', __dirname)
	console.log('process.cwd():', process.cwd())
	console.log('defaultDataDir:', defaultDataDir)
	console.log('target dataDir:', dataDir)

	// Check if any data files exist
	try {
		const files = await fs.readdir(dataDir)
		if (files.length > 0) {
			// Data already exists, don't overwrite
			console.log('Data already exists in project, skipping initialization')
			return
		}
	} catch (error) {
		console.log('Data directory does not exist, will create:', error)
	}

	// Ensure target directory exists
	await fs.mkdir(dataDir, { recursive: true })
	console.log('Created data directory:', dataDir)

	// Copy default data files
	const dataFiles = [
		'quests.json',
		'locations.json',
		'npcs.json',
		'portals.json',
		'dialogues.json',
		'entityLinks.json',
		'items.json',
	]

	for (const file of dataFiles) {
		try {
			const sourcePath = path.join(defaultDataDir, file)
			const targetPath = path.join(dataDir, file)

			console.log(
				`Attempting to copy ${file} from ${sourcePath} to ${targetPath}`
			)

			// Check if source file exists and copy it
			try {
				await fs.access(sourcePath)
				await fs.copyFile(sourcePath, targetPath)
				console.log(`✅ Successfully copied ${file} to project`)
			} catch (copyError) {
				// If source file doesn't exist, create an empty JSON file
				console.warn(`Source file ${file} not found, creating empty JSON file`)
				const emptyData = getEmptyDataForFile(file)
				await fs.writeFile(targetPath, JSON.stringify(emptyData, null, 2))
				console.log(`✅ Created empty ${file} in project`)
			}
		} catch (error) {
			console.error(`❌ Failed to create ${file}:`, error)
		}
	}

	console.log('Data initialization complete')
}

/**
 * Get empty data structure for a specific file type
 */
export function getEmptyDataForFile(filename: string): any {
	switch (filename) {
		case 'quests.json':
			return []
		case 'npcs.json':
			return []
		case 'items.json':
			return []
		case 'locations.json':
			return []
		case 'portals.json':
			return []
		case 'dialogues.json':
			return []
		case 'entityLinks.json':
			return {}
		default:
			return {}
	}
}

/**
 * Compute hash for change detection in composite data
 */
export function computeHash(data: any): string {
	const transformData =
		data.components?.find((c: any) => c.name === 'core::Transform')?.data || {}
	const nameData =
		data.components?.find((c: any) => c.name === 'core-schema::Name')?.data ||
		{}

	const entities = Object.keys(transformData)
	let hashData = entities.length.toString()

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

/**
 * Extract entity data from composite
 */
export function extractEntityData(compositeData: any) {
	const links: Record<string, any> = {}
	const transformData =
		compositeData.components?.find((c: any) => c.name === 'core::Transform')
			?.data || {}
	const nameData =
		compositeData.components?.find((c: any) => c.name === 'core-schema::Name')
			?.data || {}

	for (const entityId of Object.keys(transformData)) {
		if (nameData[entityId]) {
			const transform = transformData[entityId].json
			const name = nameData[entityId].json.value
			links[entityId] = {
				position: transform.position || { x: 0, y: 0, z: 0 },
				parent: transform.parent || 0,
				name: name || 'Unknown',
				questEntityId: null,
			}
		}
	}
	return links
}

/**
 * Update entity links file
 */
export async function updateEntityLinks(
	newLinks: Record<string, any>,
	linksPath: string,
	persistence: any
): Promise<void> {
	let existingLinks: Record<string, any> = {}
	try {
		const data = await fs.readFile(linksPath, 'utf8')
		existingLinks = JSON.parse(data)
	} catch {
		// File doesn't exist, use empty object
	}

	const updatedLinks: Record<string, any> = {}

	// Process all entities from main.composite (newLinks)
	for (const entityId in newLinks) {
		const newEntity = newLinks[entityId]
		const existingEntity = existingLinks[entityId]

		if (existingEntity) {
			// Entity exists in both - preserve questEntityId, update other data
			updatedLinks[entityId] = {
				...newEntity,
				questEntityId: existingEntity.questEntityId, // Preserve existing quest entity links
			}
		} else {
			// New entity from main.composite
			updatedLinks[entityId] = newEntity
			console.log(
				`Adding new entity ${entityId} (${newEntity.name}) to entityLinks.json`
			)
		}
	}

	// Remove entities that no longer exist in main.composite
	for (const entityId in existingLinks) {
		if (!newLinks[entityId]) {
			console.log(
				`Removing entity ${entityId} (${existingLinks[entityId].name}) from entityLinks.json`
			)
		}
	}

	// Ensure directory exists
	await fs.mkdir(path.dirname(linksPath), { recursive: true })

	// Write back to file
	await fs.writeFile(linksPath, JSON.stringify(updatedLinks, null, 2))
	console.log('entityLinks.json updated.')

	// Compile data after entity links update
	await persistence.compileDataToTypescript()
}
