// src/questEngine/entityMappings.ts - Automated mapping from EMBEDDED_ENTITY_LINKS data

import { EntityMapping } from './types'
import { EMBEDDED_ENTITY_LINKS } from './data'

/**
 * Generates entity mappings from the automated EMBEDDED_ENTITY_LINKS data
 * This creates a mapping between Decentraland entity names and quest entity IDs
 */
function generateEntityMappings(): EntityMapping[] {
  const mappings: EntityMapping[] = []

  Object.values(EMBEDDED_ENTITY_LINKS).forEach((entityLink) => {
    // Skip entities that don't have a quest entity ID
    if (!entityLink.questEntityId || !entityLink.name) {
      return
    }

    mappings.push({
      jsonId: entityLink.questEntityId,
      decentralandName: entityLink.name
    })
  })

  return mappings
}

/**
 * Maps JSON entity IDs from gameEditor data to Decentraland entity names
 * This mapping is crucial for the quest engine to find and control entities in the scene
 * Now automatically generated from EMBEDDED_ENTITY_LINKS data
 */
export const ENTITY_MAPPINGS: EntityMapping[] = generateEntityMappings()

/**
 * Helper function to get entity mapping by JSON ID (quest entity ID)
 */
export function getEntityMapping(jsonId: string): EntityMapping | undefined {
  return ENTITY_MAPPINGS.find((mapping) => mapping.jsonId === jsonId)
}

/**
 * Helper function to get entity mapping by Decentraland entity name
 */
export function getEntityMappingByDecentralandName(decentralandName: string): EntityMapping | undefined {
  return ENTITY_MAPPINGS.find((mapping) => mapping.decentralandName === decentralandName)
}

/**
 * Helper function to get Decentraland entity name by JSON ID (quest entity ID)
 */
export function getDecentralandName(jsonId: string): string | undefined {
  const mapping = getEntityMapping(jsonId)
  return mapping?.decentralandName
}

/**
 * Helper function to get quest entity ID by Decentraland entity name
 */
export function getQuestEntityId(decentralandName: string): string | undefined {
  const mapping = getEntityMappingByDecentralandName(decentralandName)
  return mapping?.jsonId
}

/**
 * Helper function to get all mappings for a specific entity type
 */
export function getMappingsByType(type: 'item' | 'npc' | 'portal'): EntityMapping[] {
  const prefix = type === 'item' ? 'Item_' : type === 'npc' ? 'NPC_' : 'Portal_'
  return ENTITY_MAPPINGS.filter((mapping) => mapping.decentralandName.startsWith(prefix))
}

/**
 * Get all unique Decentraland entity names that are mapped
 */
export function getAllMappedDecentralandNames(): string[] {
  return [...new Set(ENTITY_MAPPINGS.map((mapping) => mapping.decentralandName))]
}

/**
 * Get all unique quest entity IDs that are mapped
 */
export function getAllMappedQuestEntityIds(): string[] {
  return [...new Set(ENTITY_MAPPINGS.map((mapping) => mapping.jsonId))]
}

/**
 * Validate that all required entity mappings exist
 * This can be used during initialization to ensure the mapping is complete
 */
export function validateMappings(): { valid: boolean; missing: string[]; available: string[] } {
  const missing: string[] = []
  const available: string[] = []

  // Check for common entities that should exist
  const requiredEntities = [
    'crystal',
    'crystal_2',
    'crystal_3',
    'special_mushroom',
    'special_mushroom_1',
    'bass_string',
    'persephone',
    'portal_to_cave'
  ]

  for (const entityId of requiredEntities) {
    if (getEntityMapping(entityId)) {
      available.push(entityId)
    } else {
      missing.push(entityId)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    available
  }
}
