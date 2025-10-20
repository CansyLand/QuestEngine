// src/questEngine/EntityManager.ts - Manages entity states in Decentraland scene

import { Entity, GltfContainer, VisibilityComponent, ColliderLayer, engine, Transform } from '@dcl/sdk/ecs'
import { EntityMapping, DecentralandEntityState } from './types'
import { ENTITY_MAPPINGS } from './entityMappings'

export class EntityManager {
  private entityMap: Map<string, Entity> = new Map()
  private entityStates: Map<string, DecentralandEntityState> = new Map()
  private gltfSources: Map<string, string> = new Map()

  constructor(entityMappings: EntityMapping[]) {
    this.initializeEntityMappings(entityMappings)
  }

  private initializeEntityMappings(mappings: EntityMapping[]): void {
    for (const mapping of mappings) {
      // Find the entity in the Decentraland scene by name
      // Note: This assumes entities are already placed in the scene via Creator Hub
      const sceneEntity = this.findEntityByName(mapping.decentralandName)
      if (sceneEntity) {
        this.entityMap.set(mapping.jsonId, sceneEntity)

        // Capture and remove existing GLTF component to save polygon count
        const gltfComponent = GltfContainer.getOrNull(sceneEntity)
        if (gltfComponent) {
          // Store the GLTF source for later use
          this.gltfSources.set(mapping.jsonId, gltfComponent.src)
          // Remove the GLTF component to save polygons
          GltfContainer.deleteFrom(sceneEntity)
        }

        // Initialize state tracking - entities start hidden and without GLTF
        this.entityStates.set(mapping.jsonId, {
          visible: false, // Start hidden to save polygons
          interactive: false,
          hasGltf: false, // GLTF removed to save polygons
          colliderLayer: ColliderLayer.CL_NONE
        })

        console.log(
          `✅ Successfully mapped JSON entity '${mapping.jsonId}' to Decentraland entity '${mapping.decentralandName}'`
        )
        if (gltfComponent) {
          console.log(`   Stored GLTF source for ${mapping.jsonId}: ${gltfComponent.src}`)
        } else {
          console.log(`   No GLTF component found for ${mapping.jsonId}`)
        }
      } else {
        console.log(`❌ Could not find Decentraland entity with name: ${mapping.decentralandName}`)
      }
    }
  }

  private findEntityByName(entityName: string): Entity | undefined {
    try {
      // Use Decentraland's native getEntityByName function
      const entity = engine.getEntityOrNullByName(entityName)
      return entity || undefined
    } catch (error) {
      if (this.debugMode) {
        console.log(`Entity not found: ${entityName}`)
      }
      return undefined
    }
  }

  // Entity state management methods
  setEntityVisibility(entityId: string, visible: boolean): void {
    console.log(`🔍 EntityManager: setEntityVisibility called for ${entityId} with visible=${visible}`)
    const entity = this.entityMap.get(entityId)
    if (!entity) {
      console.log(`❌ Entity not found in entityMap: ${entityId}`)
      return
    }

    const visibilityComp = VisibilityComponent.getMutableOrNull(entity)
    if (visibilityComp) {
      visibilityComp.visible = visible
    } else {
      // Add visibility component if it doesn't exist
      VisibilityComponent.create(entity, { visible })
    }

    // Update state tracking
    const currentState = this.entityStates.get(entityId)
    if (currentState) {
      currentState.visible = visible
      this.entityStates.set(entityId, currentState)
    }

    console.log(`🔍 Set entity ${entityId} visibility to ${visible}`)
  }

  setEntityCollider(entityId: string, colliderLayer: number): void {
    const entity = this.entityMap.get(entityId)
    if (!entity) {
      console.log(`Entity not found: ${entityId}`)
      return
    }

    // Update the collider layer by modifying the transform component
    // Note: This assumes the collider is attached to the entity
    const transform = Transform.getMutableOrNull(entity)
    if (transform) {
      // This is a simplified approach - you might need to handle colliders differently
      // depending on your scene setup
    }

    // Update state tracking
    const currentState = this.entityStates.get(entityId)
    if (currentState) {
      currentState.colliderLayer = colliderLayer
      currentState.interactive = (colliderLayer & ColliderLayer.CL_POINTER) !== 0
      this.entityStates.set(entityId, currentState)
    }

    if (this.debugMode) {
      console.log(`Set entity ${entityId} collider layer to ${colliderLayer}`)
    }
  }

  addGltfComponent(entityId: string, gltfSrc?: string): void {
    console.log(`🔍 EntityManager: addGltfComponent called for ${entityId} with gltfSrc=${gltfSrc}`)
    const entity = this.entityMap.get(entityId)
    if (!entity) {
      console.log(`❌ Entity not found in entityMap: ${entityId}`)
      return
    }

    // Use provided src, or fall back to stored src
    const srcToUse = gltfSrc || this.gltfSources.get(entityId)
    if (!srcToUse) {
      console.log(`❌ Cannot add GLTF component - no src available for entity: ${entityId}`)
      return
    }

    // Check if GLTF component exists and has the correct src
    const existingGltf = GltfContainer.getOrNull(entity)
    if (existingGltf) {
      if (existingGltf.src === srcToUse) {
        console.log(`ℹ️ GLTF component already exists with correct src for entity ${entityId}`)
      } else {
        // Replace with correct GLTF
        console.log(`🔄 Replacing GLTF component for entity ${entityId} (was: ${existingGltf.src}, now: ${srcToUse})`)
        GltfContainer.createOrReplace(entity, { src: srcToUse })
      }
    } else {
      // Add new GLTF component
      GltfContainer.createOrReplace(entity, { src: srcToUse })
      console.log(`✅ Added GLTF component to entity ${entityId} with src: ${srcToUse}`)
    }

    // Update state tracking
    const currentState = this.entityStates.get(entityId)
    if (currentState) {
      currentState.hasGltf = true
      this.entityStates.set(entityId, currentState)
    }
  }

  removeGltfComponent(entityId: string): void {
    const entity = this.entityMap.get(entityId)
    if (!entity) {
      console.log(`Entity not found: ${entityId}`)
      return
    }

    // Remove GLTF component to hide the entity
    if (GltfContainer.getOrNull(entity)) {
      GltfContainer.deleteFrom(entity)
    }

    // Update state tracking
    const currentState = this.entityStates.get(entityId)
    if (currentState) {
      currentState.hasGltf = false
      this.entityStates.set(entityId, currentState)
    }

    if (this.debugMode) {
      console.log(`Removed GLTF component from entity ${entityId}`)
    }
  }

  // Set entity to "world" state (visible and interactive)
  setEntityWorldState(entityId: string): void {
    this.setEntityVisibility(entityId, true)
    this.setEntityCollider(entityId, ColliderLayer.CL_POINTER | ColliderLayer.CL_PHYSICS)
    this.addGltfComponent(entityId)
  }

  // Set entity to "void" state (invisible and non-interactive)
  setEntityVoidState(entityId: string): void {
    this.setEntityVisibility(entityId, false)
    this.setEntityCollider(entityId, ColliderLayer.CL_NONE)
    // Note: We don't remove GLTF here to maintain Creator Hub stability
  }

  // Get current entity state
  getEntityState(entityId: string): DecentralandEntityState | undefined {
    return this.entityStates.get(entityId)
  }

  // Get all entity IDs
  getAllEntityIds(): string[] {
    return Array.from(this.entityMap.keys())
  }

  // Get the entity map for direct entity access
  getEntityMap(): Map<string, Entity> {
    return this.entityMap
  }

  // Get entity by Decentraland name (e.g., "NPC_Bassimus")
  getEntityByDecentralandName(decentralandName: string): Entity | undefined {
    // First find the quest entity ID that maps to this Decentraland name
    const mapping = ENTITY_MAPPINGS.find((m) => m.decentralandName === decentralandName)
    if (mapping) {
      return this.entityMap.get(mapping.jsonId)
    }
    return undefined
  }

  getGltfSource(entityId: string): string | undefined {
    return this.gltfSources.get(entityId)
  }

  // Debug property (set externally)
  debugMode: boolean = false
}
