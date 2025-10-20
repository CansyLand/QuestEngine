// src/backend/models.ts

export enum InteractiveMode {
  Grabbable = 'grabbable',
  Interactive = 'interactive',
  NotInteractive = 'notInteractive'
}

export enum EntityState {
  World = 'world', // Exists in world (visible, interactive)
  Inventory = 'inventory', // In player inventory
  Void = 'void' // Not in world or inventory (can be activated)
}

export enum ActionType {
  PlaySound = 'playSound',
  AddToInventory = 'addToInventory', // Entity ID (World → Inventory)
  RemoveFromInventory = 'removeFromInventory', // Entity ID
  RemoveFromInventoryByName = 'removeFromInventoryByName', // Item name + count
  GrantToInventory = 'grantToInventory', // Entity ID (Void → Inventory)
  SpawnEntity = 'spawnEntity', // Entity: item/npc/portal ID (Void → World)
  ClearEntity = 'clearEntity', // Entity ID (World → Void)
  SetInteractive = 'setInteractive', // Entity ID + InteractiveMode
  SetInteractiveByName = 'setInteractiveByName', // Item name + InteractiveMode (affects all matching items)
  ActivateQuest = 'activateQuest', // Quest ID
  AdvanceStep = 'advanceStep', // In current quest
  ChangeLocation = 'changeLocation', // Location ID
  StartDialogue = 'startDialogue' // Dialogue sequence ID
}

export interface Action {
  type: ActionType
  params: Record<string, any> // e.g., { soundUrl: string } or { entityId: string }
}

export interface Dialog {
  id: string
  text: string
  isQuestion: boolean
  buttons?: Button[] // If isQuestion
  isEndOfDialog: boolean
  onNext?: Action[] // Triggers on proceeding (e.g., after button or next)
}

export interface Button {
  label: string
  goToDialog: number // Index in same sequence
  size: number // Size field for dialogue button (default: 300)
  onClick?: Action[] // Additional triggers
}

export interface DialogueSequence {
  id: string
  name: string
  npcId?: string // Reference to the NPC this dialogue belongs to (optional)
  questStepId?: string | null // Reference to the quest step this dialogue belongs to, null for default
  dialogs: Dialog[] // Sequential, buttons branch
}

export interface NPC {
  id: string
  name: string
  image: string // Display image URL (used for both grid and dialogue)
  state: EntityState
  onInteract?: Action[] // Optional triggers on talk start/end
}

export interface Item {
  id: string
  name: string
  image: string // Icon URL
  audio?: string // General audio
  audioOnInteraction?: string
  audioOnGrab?: string
  state: EntityState
  interactive: InteractiveMode
  onInteract: Action[] // e.g., [{ type: 'addToInventory', params: { entityId: 'item_id' } }, { type: 'playSound', params: { url: 'grab.mp3' } }]
}

export interface Portal extends Omit<Item, 'onInteract'> {
  destinationLocationId: string
  onInteract: Action[] // Must include ChangeLocation
}

export interface SavedLocation {
  id: string
  name: string // Display name
  backgroundMusic: string // URL
  image: string // URL
  items: string[] // Item IDs
  npcs: string[] // NPC IDs
  portals: string[] // Portal IDs
}

export interface Location {
  id: string
  name: string // Display name
  backgroundMusic: string // URL
  image: string // URL
  items: Item[] // Item objects (expanded from IDs at runtime)
  npcs: NPC[] // NPC objects (expanded from IDs at runtime)
  portals: Portal[] // Portal objects (expanded from IDs at runtime)
}

export interface QuestStep {
  id: string
  name: string
  objectiveType: 'talkTo' | 'collectEntities' | 'collectByName' | 'interact' | 'goToLocation' | 'custom' // For auto-advance logic
  objectiveParams: Record<string, any> // e.g., { npcId: string } or { entityIds: ['crystal_1', 'crystal_2'] } or { itemName: 'crystal', count: 5 }
  onStart: Action[] // e.g., set items grabbable, set NPC dialogue
  onComplete: Action[] // e.g., spawn mushrooms, activateQuest
  isCompleted?: boolean // Runtime state
}

export interface Quest {
  id: string
  chapter: string
  title: string
  description: string
  order: number // For sequencing in chapter
  steps: QuestStep[]
  activeStepId?: string // Runtime
  completed: boolean // Runtime
}

export interface Game {
  locations: Location[]
  quests: Quest[]
  npcs: NPC[] // Global NPC list
  items: Item[] // Global item list
  portals: Portal[] // Global portal list
  dialogues: DialogueSequence[] // Global dialogue sequences
  // Runtime state
  currentLocationId: string
  activeQuests: string[] // Quest IDs
  inventory: string[] // Array of entity IDs in inventory
  seedsPlaced?: number // Track number of seeds placed for Persephone quest
}

// Runtime state interface for commands
export interface Command {
  type: string
  params: Record<string, any>
}

export interface GridEntity {
  id: string
  name: string
  type: 'item' | 'npc' | 'portal'
  image: string
  x?: number
  y?: number
  state?: EntityState
  interactive?: InteractiveMode
}

// API response types
export interface ApiResponse {
  success: boolean
  error?: string
  commands?: Command[]
  data?: any
}
