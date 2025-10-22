import * as path from 'path'
import * as fs from 'fs/promises'
import { compileDataToTypescriptShared } from '../../core/generate-data'
import {
	Game,
	Location,
	SavedLocation,
	Quest,
	NPC,
	Item,
	Portal,
	DialogueSequence,
} from '../../../questEditor/models'

export class ElectronPersistenceManager {
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

	async loadQuests(): Promise<Quest[]> {
		try {
			const filePath = this.getFilePath('quests.json')
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

	async loadLocations(
		items: Item[],
		npcs: NPC[],
		portals: Portal[]
	): Promise<Location[]> {
		try {
			const filePath = this.getFilePath('locations.json')
			const data = await fs.readFile(filePath, 'utf-8')
			const savedLocations = JSON.parse(data) as SavedLocation[]

			return savedLocations.map((location) => ({
				...location,
				items: location.items
					.map((itemId: string) => items.find((i) => i.id === itemId))
					.filter(Boolean) as Item[],
				npcs: location.npcs
					.map((npcId: string) => npcs.find((n) => n.id === npcId))
					.filter(Boolean) as NPC[],
				portals: location.portals
					.map((portalId: string) => portals.find((p) => p.id === portalId))
					.filter(Boolean) as Portal[],
			}))
		} catch (error) {
			console.error('Error loading locations:', error)
			return []
		}
	}

	async saveLocations(locations: Location[]): Promise<void> {
		await this.ensureDataDir()
		const filePath = this.getFilePath('locations.json')
		const savedLocations: SavedLocation[] = locations.map((location) => ({
			id: location.id,
			name: location.name,
			backgroundMusic: location.backgroundMusic,
			image: location.image,
			items: location.items.map((item) => item.id),
			npcs: location.npcs.map((npc) => npc.id),
			portals: location.portals.map((portal) => portal.id),
		}))

		const tempPath = filePath + '.tmp'
		await fs.writeFile(tempPath, JSON.stringify(savedLocations, null, 2))
		await fs.rename(tempPath, filePath)
	}

	async loadNPCs(): Promise<NPC[]> {
		try {
			const filePath = this.getFilePath('npcs.json')
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

	async loadEntityLinks(): Promise<Record<string, any>> {
		try {
			const filePath = this.getFilePath('entityLinks.json')
			const data = await fs.readFile(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading entity links:', error)
			return {}
		}
	}

	async saveEntityLinks(entityLinks: Record<string, any>): Promise<void> {
		await this.ensureDataDir()
		const filePath = this.getFilePath('entityLinks.json')
		const tempPath = filePath + '.tmp'
		await fs.writeFile(tempPath, JSON.stringify(entityLinks, null, 2))
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
		console.log('📁 ElectronPersistenceManager.saveGame called')
		await this.saveLocations(game.locations)
		await this.saveQuests(game.quests)
		await this.saveNPCs(game.npcs)
		await this.saveItems(game.items)
		await this.savePortals(game.portals)
		await this.saveDialogues(game.dialogues)

		// Compile data after all saves are complete
		console.log('🔄 About to call compileDataToTypescript')
		await this.compileDataToTypescript()
		console.log('✅ saveGame completed')
	}

	async compileDataToTypescript(): Promise<void> {
		return compileDataToTypescriptShared(this.dataDir)
	}
}
