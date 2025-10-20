// src/questEngine/index.ts - Main exports for the Quest Engine

export { QuestEngine } from './QuestEngine'
export { SceneController } from './SceneController'
export { EntityManager } from './EntityManager'
export { QuestDataProvider } from './QuestDataProvider'
export { PointerEventManager } from './PointerEventManager'
export {
	QuestCommand,
	QuestCommandType,
	QuestPersistence as IQuestPersistence,
	QuestEngineConfig,
	EntityMapping,
	DecentralandEntityState,
} from './types'

// Re-export models from questEditor for convenience
export {
	Game,
	Location,
	Quest,
	QuestStep,
	NPC,
	Item,
	Portal,
	Action,
	ActionType,
	InteractiveMode,
	EntityState,
} from './models'

// Factory function to create a complete quest engine setup
import { QuestEngine } from './QuestEngine'
import { SceneController } from './SceneController'
import { EntityManager } from './EntityManager'
import { QuestDataProvider } from './QuestDataProvider'
import { PointerEventManager } from './PointerEventManager'
import { IAudioSystem } from './AudioSystem'
import { QuestEngineConfig, EntityMapping } from './types'
import { ENTITY_MAPPINGS, validateMappings } from './entityMappings'

export async function createQuestEngine(
	audioSystem: IAudioSystem,
	customMappings?: EntityMapping[],
	debugMode: boolean = false
): Promise<QuestEngine> {
	// Use provided mappings or default ones
	const entityMappings = customMappings || ENTITY_MAPPINGS

	// Validate mappings in debug mode
	if (debugMode) {
		const validation = validateMappings()
		if (!validation.valid) {
			console.log('Missing entity mappings:', validation.missing)
		}
	}

	// Create entity manager with mappings
	const entityManager = new EntityManager(entityMappings)
	entityManager.debugMode = debugMode

	// Create scene controller
	const sceneController = new SceneController(
		entityManager,
		audioSystem,
		debugMode
	)

	// Create persistence and initialize it
	const persistence = new QuestDataProvider(debugMode)
	await persistence.initialize()

	// Create quest engine
	const questEngine = new QuestEngine(persistence, sceneController, debugMode)

	return questEngine
}

// Entity mappings
export {
	ENTITY_MAPPINGS,
	getEntityMapping,
	getDecentralandName,
	getMappingsByType,
	validateMappings,
} from './entityMappings'
