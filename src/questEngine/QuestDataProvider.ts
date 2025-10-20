// src/questEngine/QuestPersistence.ts - Load game configuration from embedded data for Decentraland

import { QuestPersistence as IQuestPersistence } from './types'
import {
  EMBEDDED_LOCATIONS,
  EMBEDDED_QUESTS,
  EMBEDDED_NPCS,
  EMBEDDED_ITEMS,
  EMBEDDED_PORTALS,
  EMBEDDED_DIALOGUES
} from './data'

export class QuestDataProvider implements IQuestPersistence {
  private debugMode: boolean = false
  private gameData: any = null
  private initialized: boolean = false

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode
  }

  /**
   * Initialize the persistence layer - must be called before using other methods
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    await this.loadGameData()
    this.initialized = true
  }

  /**
   * Load game configuration from embedded constants
   * This is more reliable than file loading in Decentraland scenes
   */
  private async loadGameData(): Promise<void> {
    try {
      // Use embedded data constants instead of loading from files
      // This avoids fetch issues in Decentraland runtime

      // Combine embedded data into a single game configuration
      this.gameData = {
        locations: EMBEDDED_LOCATIONS,
        quests: EMBEDDED_QUESTS,
        npcs: EMBEDDED_NPCS,
        items: EMBEDDED_ITEMS,
        portals: EMBEDDED_PORTALS,
        dialogues: EMBEDDED_DIALOGUES,
        // Runtime state - starts fresh each session
        currentLocationId: null, // Will be set by first location in start()
        activeQuests: [],
        inventory: [],
        seedsPlaced: 0
      }

      // Expand location references to include actual entity objects
      this.expandLocationData()

      if (this.debugMode) {
        console.log('Game data loaded from embedded constants:', {
          locations: this.gameData.locations.length,
          quests: this.gameData.quests.length,
          npcs: this.gameData.npcs.length,
          items: this.gameData.items.length,
          portals: this.gameData.portals.length,
          dialogues: this.gameData.dialogues.length
        })
      }
    } catch (error) {
      console.error('Failed to load embedded game data:', error)

      // Fallback: create minimal game data for testing
      console.log('Using fallback minimal game data')
      this.createFallbackGameData()

      if (this.debugMode) {
        console.log('Fallback game data created')
      }
    }
  }

  /**
   * Expand location data to include actual entity objects instead of just IDs
   * This matches the structure expected by the QuestEngine
   */
  private expandLocationData(): void {
    for (const location of this.gameData.locations) {
      // Expand items
      location.items = location.items
        .map((itemId: string) => {
          const item = this.gameData.items.find((i: any) => i.id === itemId)
          if (!item) {
            console.log(`Item ${itemId} not found in global items list`)
            return null
          }
          return item
        })
        .filter(Boolean)

      // Expand npcs
      location.npcs = location.npcs
        .map((npcId: string) => {
          const npc = this.gameData.npcs.find((n: any) => n.id === npcId)
          if (!npc) {
            console.log(`NPC ${npcId} not found in global npcs list`)
            return null
          }
          return npc
        })
        .filter(Boolean)

      // Expand portals
      location.portals = location.portals
        .map((portalId: string) => {
          const portal = this.gameData.portals.find((p: any) => p.id === portalId)
          if (!portal) {
            console.log(`Portal ${portalId} not found in global portals list`)
            return null
          }
          return portal
        })
        .filter(Boolean)
    }
  }

  /**
   * Create minimal fallback game data for testing when JSON files can't be loaded
   */
  private createFallbackGameData(): void {
    this.gameData = {
      locations: [
        {
          id: 'main_stage',
          name: 'Main Stage',
          backgroundMusic: '',
          image: '',
          items: [],
          npcs: [],
          portals: []
        }
      ],
      quests: [],
      npcs: [],
      items: [],
      portals: [],
      dialogues: [],
      // Runtime state
      currentLocationId: null,
      activeQuests: [],
      inventory: [],
      seedsPlaced: 0
    }
  }

  /**
   * Load game state - returns the game configuration with fresh runtime state
   * In Decentraland, we cannot persist state between sessions
   */
  loadGame(): any {
    if (!this.initialized) {
      throw new Error('QuestPersistence not initialized. Call initialize() first.')
    }

    if (!this.gameData) {
      throw new Error('Game data not loaded. Check JSON files in src/questEngine/data/')
    }

    // Return a fresh copy of the game data with reset runtime state
    const gameState = {
      ...this.gameData,
      // Always reset runtime state for fresh session
      currentLocationId: null,
      activeQuests: [],
      inventory: [],
      seedsPlaced: 0
    }

    if (this.debugMode) {
      console.log('Game state initialized from JSON data')
    }

    return gameState
  }

  /**
   * Save game state - NOT SUPPORTED in Decentraland
   * This method exists for interface compatibility but does nothing
   */
  saveGame(gameState: any): void {
    if (this.debugMode) {
      console.log('QuestPersistence.saveGame() is not supported in Decentraland. Game state cannot be saved.')
    }
    // Decentraland scenes are stateless - no persistence between sessions
  }

  /**
   * Clear saved game - NOT SUPPORTED in Decentraland
   * This method exists for interface compatibility but does nothing
   */
  clearSavedGame(): void {
    if (this.debugMode) {
      console.log('QuestPersistence.clearSavedGame() is not supported in Decentraland.')
    }
  }

  /**
   * Check for saved game - NOT SUPPORTED in Decentraland
   * Always returns false since we cannot save state
   */
  hasSavedGame(): boolean {
    return false // Decentraland scenes start fresh each time
  }

  /**
   * Get the raw game data for debugging or testing
   */
  getGameData(): any {
    return this.gameData
  }

  /**
   * Reload game data from JSON files (useful for development)
   */
  reloadGameData(): void {
    this.loadGameData()
    if (this.debugMode) {
      console.log('Game data reloaded from JSON files')
    }
  }
}
