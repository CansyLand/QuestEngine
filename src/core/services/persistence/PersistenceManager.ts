import * as fs from 'fs/promises'
import * as path from 'path'
import * as fsSync from 'fs'
import { compileDataToTypescriptShared } from '../data/DataCompiler'
import {
	Game,
	Location,
	SavedLocation,
	Quest,
	NPC,
	Item,
	Portal,
	DialogueSequence,
} from '../../models/types'

export class PersistenceManager {
	private dataDir: string

	constructor(dataDir: string) {
		this.dataDir = dataDir
	}

	private async ensureDataDir(): Promise<void> {
		try {
			await fs.mkdir(this.dataDir, { recursive: true })
		} catch (error) {
			// Directory already exists or other error, ignore
		}
	}

	private getFilePath(filename: string): string {
		return path.join(this.dataDir, filename)
	}

	async loadLocations(
		items: Item[],
		npcs: NPC[],
		portals: Portal[]
	): Promise<Location[]> {
		try {
			const filePath = this.getFilePath('locations.json')
			if (!fsSync.existsSync(filePath)) {
				return []
			}
			const data = await fs.readFile(filePath, 'utf-8')
			const savedLocations = JSON.parse(data) as SavedLocation[]

			// First pass: Convert references to full objects except locations
			const locationsWithoutLocationRefs = savedLocations.map((location) => ({
				...location,
				items: location.items
					.map((itemId: string) => {
						const item = items.find((i) => i.id === itemId)
						if (!item) {
							console.warn(`Item ${itemId} not found in global items`)
							return null
						}
						return item
					})
					.filter(Boolean) as Item[],
				npcs: location.npcs
					.map((npcId: string) => {
						const npc = npcs.find((n) => n.id === npcId)
						if (!npc) {
							console.warn(`NPC ${npcId} not found in global npcs`)
							return null
						}
						return npc
					})
					.filter(Boolean) as NPC[],
				portals: location.portals
					.map((portalId: string) => {
						const portal = portals.find((p) => p.id === portalId)
						if (!portal) {
							console.warn(`Portal ${portalId} not found in global portals`)
							return null
						}
						return portal
					})
					.filter(Boolean) as Portal[],
				locations: [] as Location[], // Temporary empty array
			}))

			// Second pass: Resolve location references
			return locationsWithoutLocationRefs.map((location) => ({
				...location,
				locations: (
					savedLocations.find((sl) => sl.id === location.id)?.locations || []
				)
					.map((locationId: string) => {
						const childLocation = locationsWithoutLocationRefs.find(
							(l) => l.id === locationId
						)
						if (!childLocation) {
							console.warn(
								`Location ${locationId} not found in loaded locations`
							)
							return null
						}
						return childLocation
					})
					.filter(Boolean) as Location[],
			}))
		} catch (error) {
			console.error('Error loading locations:', error)
			return []
		}
	}

	async saveLocations(locations: Location[]): Promise<void> {
		await this.ensureDataDir()
		const filePath = this.getFilePath('locations.json')

		// Convert full objects to references (IDs)
		const savedLocations: SavedLocation[] = locations.map((location) => ({
			id: location.id,
			name: location.name,
			backgroundMusic: location.backgroundMusic,
			image: location.image,
			items: location.items.map((item) => item.id),
			npcs: location.npcs.map((npc) => npc.id),
			portals: location.portals.map((portal) => portal.id),
			locations: location.locations.map((childLocation) => childLocation.id),
		}))

		// Write to temp file first for atomicity
		const tempPath = filePath + '.tmp'
		await fs.writeFile(tempPath, JSON.stringify(savedLocations, null, 2))
		await fs.rename(tempPath, filePath)
	}

	async loadQuests(): Promise<Quest[]> {
		try {
			const filePath = this.getFilePath('quests.json')
			if (!fsSync.existsSync(filePath)) {
				return []
			}
			const data = await fs.readFile(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading quests:', error)
			return []
		}
	}

	async saveQuests(quests: Quest[]): Promise<void> {
		await this.ensureDataDir()
		const filePath = this.getFilePath('quests.json')
		const tempPath = filePath + '.tmp'
		await fs.writeFile(tempPath, JSON.stringify(quests, null, 2))
		await fs.rename(tempPath, filePath)
	}

	async loadNPCs(): Promise<NPC[]> {
		try {
			const filePath = this.getFilePath('npcs.json')
			if (!fsSync.existsSync(filePath)) {
				return []
			}
			const data = await fs.readFile(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading NPCs:', error)
			return []
		}
	}

	async saveNPCs(npcs: NPC[]): Promise<void> {
		await this.ensureDataDir()
		const filePath = this.getFilePath('npcs.json')
		const tempPath = filePath + '.tmp'
		await fs.writeFile(tempPath, JSON.stringify(npcs, null, 2))
		await fs.rename(tempPath, filePath)
	}

	async loadItems(): Promise<Item[]> {
		try {
			const filePath = this.getFilePath('items.json')
			if (!fsSync.existsSync(filePath)) {
				return []
			}
			const data = await fs.readFile(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading items:', error)
			return []
		}
	}

	async saveItems(items: Item[]): Promise<void> {
		await this.ensureDataDir()
		const filePath = this.getFilePath('items.json')
		const tempPath = filePath + '.tmp'
		await fs.writeFile(tempPath, JSON.stringify(items, null, 2))
		await fs.rename(tempPath, filePath)
	}

	async loadPortals(): Promise<Portal[]> {
		try {
			const filePath = this.getFilePath('portals.json')
			if (!fsSync.existsSync(filePath)) {
				return []
			}
			const data = await fs.readFile(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading portals:', error)
			return []
		}
	}

	async savePortals(portals: Portal[]): Promise<void> {
		await this.ensureDataDir()
		const filePath = this.getFilePath('portals.json')
		const tempPath = filePath + '.tmp'
		await fs.writeFile(tempPath, JSON.stringify(portals, null, 2))
		await fs.rename(tempPath, filePath)
	}

	async loadDialogues(): Promise<DialogueSequence[]> {
		try {
			const filePath = this.getFilePath('dialogues.json')
			if (!fsSync.existsSync(filePath)) {
				return []
			}
			const data = await fs.readFile(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading dialogues:', error)
			return []
		}
	}

	async saveDialogues(dialogues: DialogueSequence[]): Promise<void> {
		await this.ensureDataDir()
		const filePath = this.getFilePath('dialogues.json')
		const tempPath = filePath + '.tmp'
		await fs.writeFile(tempPath, JSON.stringify(dialogues, null, 2))
		await fs.rename(tempPath, filePath)
	}

	async loadGame(): Promise<Game> {
		const quests = await this.loadQuests()
		const npcs = await this.loadNPCs()
		const items = await this.loadItems()
		const portals = await this.loadPortals()
		const dialogues = await this.loadDialogues()
		const locations = await this.loadLocations(items, npcs, portals)

		// Create default game state
		const myceliumCaves = locations.find((l) => l.id === 'mycelium_caves')
		return {
			locations,
			quests,
			npcs,
			items,
			portals,
			dialogues,
			currentLocationId: myceliumCaves
				? myceliumCaves.id
				: locations.length > 0
				? locations[0].id
				: '',
			activeQuests: [],
			inventory: [],
		}
	}

	async saveGame(game: Game): Promise<void> {
		await this.saveLocations(game.locations)
		await this.saveQuests(game.quests)
		await this.saveNPCs(game.npcs)
		await this.saveItems(game.items)
		await this.savePortals(game.portals)
		await this.saveDialogues(game.dialogues)

		// After all JSONs are saved, compile them into data.ts
		await this.compileDataToTypescript()
	}

	async compileDataToTypescript(): Promise<void> {
		return compileDataToTypescriptShared(this.dataDir)
	}
}
