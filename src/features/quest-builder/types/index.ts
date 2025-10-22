import type { Location, Quest, NPC, Item, Portal, DialogueSequence } from '@/core/models/types'

export type EntityType = 'location' | 'quest' | 'npc' | 'item' | 'portal'
export type Entity = Location | Quest | NPC | Item | Portal

export interface EditModalState {
  isOpen: boolean
  entityType: EntityType | null
  entity: Entity | null
}

export interface ItemSelectorState {
  isOpen: boolean
  availableItems: Item[]
  hoveredItem: Item | null
  mousePosition: { x: number; y: number }
  selectedItems: Item[]
  isShiftPressed: boolean
}

export interface PortalSelectorState {
  isOpen: boolean
  availablePortals: Portal[]
  hoveredPortal: Portal | null
  mousePosition: { x: number; y: number }
  selectedPortals: Portal[]
  isShiftPressed: boolean
}

export interface NPCSelectorState {
  isOpen: boolean
  availableNpcs: NPC[]
  hoveredNpc: NPC | null
  mousePosition: { x: number; y: number }
  selectedNpcs: NPC[]
  isShiftPressed: boolean
}

export interface DialogueEditorState {
  isOpen: boolean
  sequenceIndex: number | null
  sequence: DialogueSequence | null
}
