import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { spawn, exec } from 'child_process'
import { compileDataToTypescriptShared } from './generate-data.js'
import {
	Game,
	Location,
	SavedLocation,
	Quest,
	NPC,
	Item,
	Portal,
	DialogueSequence,
} from '../models'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '../../data')

export class PersistenceManager {
	private ensureDataDir(): void {
		if (!fs.existsSync(DATA_DIR)) {
			fs.mkdirSync(DATA_DIR, { recursive: true })
		}
	}

	private getFilePath(filename: string): string {
		return path.join(DATA_DIR, filename)
	}

	loadLocations(items: Item[], npcs: NPC[], portals: Portal[]): Location[] {
		try {
			const filePath = this.getFilePath('locations.json')
			if (!fs.existsSync(filePath)) {
				return []
			}
			const data = fs.readFileSync(filePath, 'utf-8')
			const savedLocations = JSON.parse(data) as SavedLocation[]

			// Convert references to full objects
			return savedLocations.map((location) => ({
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
			}))
		} catch (error) {
			console.error('Error loading locations:', error)
			return []
		}
	}

	saveLocations(locations: Location[]): void {
		this.ensureDataDir()
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
		}))

		// Write to temp file first for atomicity
		const tempPath = filePath + '.tmp'
		fs.writeFileSync(tempPath, JSON.stringify(savedLocations, null, 2))
		fs.renameSync(tempPath, filePath)
	}

	loadQuests(): Quest[] {
		try {
			const filePath = this.getFilePath('quests.json')
			if (!fs.existsSync(filePath)) {
				return []
			}
			const data = fs.readFileSync(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading quests:', error)
			return []
		}
	}

	saveQuests(quests: Quest[]): void {
		this.ensureDataDir()
		const filePath = this.getFilePath('quests.json')
		const tempPath = filePath + '.tmp'
		fs.writeFileSync(tempPath, JSON.stringify(quests, null, 2))
		fs.renameSync(tempPath, filePath)
	}

	loadNPCs(): NPC[] {
		try {
			const filePath = this.getFilePath('npcs.json')
			if (!fs.existsSync(filePath)) {
				return []
			}
			const data = fs.readFileSync(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading NPCs:', error)
			return []
		}
	}

	saveNPCs(npcs: NPC[]): void {
		this.ensureDataDir()
		const filePath = this.getFilePath('npcs.json')
		const tempPath = filePath + '.tmp'
		fs.writeFileSync(tempPath, JSON.stringify(npcs, null, 2))
		fs.renameSync(tempPath, filePath)
	}

	loadItems(): Item[] {
		try {
			const filePath = this.getFilePath('items.json')
			if (!fs.existsSync(filePath)) {
				return []
			}
			const data = fs.readFileSync(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading items:', error)
			return []
		}
	}

	saveItems(items: Item[]): void {
		this.ensureDataDir()
		const filePath = this.getFilePath('items.json')
		const tempPath = filePath + '.tmp'
		fs.writeFileSync(tempPath, JSON.stringify(items, null, 2))
		fs.renameSync(tempPath, filePath)
	}

	loadPortals(): Portal[] {
		try {
			const filePath = this.getFilePath('portals.json')
			if (!fs.existsSync(filePath)) {
				return []
			}
			const data = fs.readFileSync(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading portals:', error)
			return []
		}
	}

	savePortals(portals: Portal[]): void {
		this.ensureDataDir()
		const filePath = this.getFilePath('portals.json')
		const tempPath = filePath + '.tmp'
		fs.writeFileSync(tempPath, JSON.stringify(portals, null, 2))
		fs.renameSync(tempPath, filePath)
	}

	loadDialogues(): DialogueSequence[] {
		try {
			const filePath = this.getFilePath('dialogues.json')
			if (!fs.existsSync(filePath)) {
				return []
			}
			const data = fs.readFileSync(filePath, 'utf-8')
			return JSON.parse(data)
		} catch (error) {
			console.error('Error loading dialogues:', error)
			return []
		}
	}

	saveDialogues(dialogues: DialogueSequence[]): void {
		this.ensureDataDir()
		const filePath = this.getFilePath('dialogues.json')
		const tempPath = filePath + '.tmp'
		fs.writeFileSync(tempPath, JSON.stringify(dialogues, null, 2))
		fs.renameSync(tempPath, filePath)
	}

	loadGame(): Game {
		const quests = this.loadQuests()
		const npcs = this.loadNPCs()
		const items = this.loadItems()
		const portals = this.loadPortals()
		const dialogues = this.loadDialogues()
		const locations = this.loadLocations(items, npcs, portals)

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
		this.saveLocations(game.locations)
		this.saveQuests(game.quests)
		this.saveNPCs(game.npcs)
		this.saveItems(game.items)
		this.savePortals(game.portals)
		this.saveDialogues(game.dialogues)

		// After all JSONs are saved, compile them into data.ts
		await this.compileDataToTypescript()
	}

	public compileDataToTypescript(): Promise<void> {
		return compileDataToTypescriptShared(DATA_DIR)
	}
}
