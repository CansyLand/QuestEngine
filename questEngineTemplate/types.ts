// src/questEngine/types.ts - Quest Engine specific types for Decentraland

import { Entity } from '@dcl/sdk/ecs'

export interface QuestCommand {
  type: string
  params: Record<string, any>
}

export interface QuestPersistence {
  saveGame(gameState: any): void
  loadGame(): any
}

export interface EntityMapping {
  jsonId: string
  decentralandName: string
  entity?: Entity
}

export interface QuestEngineConfig {
  persistence: QuestPersistence
  entityMappings: EntityMapping[]
  debugMode?: boolean
}

// Decentraland-specific command types
export enum QuestCommandType {
  // Entity state management
  SetEntityVisibility = 'setEntityVisibility',
  SetEntityCollider = 'setEntityCollider',
  AddGltfComponent = 'addGltfComponent',
  RemoveGltfComponent = 'removeGltfComponent',

  // Audio
  PlaySound = 'playSound',
  PlayBackgroundMusic = 'playBackgroundMusic',

  // Dialogue & UI
  ShowDialogue = 'showDialogue',
  ShowNotification = 'showNotification',

  // Quest management
  QuestActivated = 'questActivated',
  QuestCompleted = 'questCompleted',

  // Location management
  ChangeLocation = 'changeLocation',

  // Inventory (for UI feedback)
  UpdateInventory = 'updateInventory',

  // Debug/Logging
  Log = 'log'
}

// Entity state representation for Decentraland
export interface DecentralandEntityState {
  visible: boolean
  interactive: boolean
  hasGltf: boolean
  colliderLayer: number // ColliderLayer enum value
}
