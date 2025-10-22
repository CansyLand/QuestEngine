# Decentraland Creator Hub Game Engine Limitations

This document outlines the architectural constraints and design decisions for this game engine, specifically tailored for Decentraland Creator Hub projects.

## Core Architectural Constraints

### 1. Entity Management

- **All entities are created at startup**: The Creator Hub creates all scene entities upfront. No entities can be dynamically added or removed from the scene.
- **Entity persistence**: Entities exist for the entire game session and cannot be destroyed.
- **State machine approach**: Game state changes are managed through component modifications rather than entity lifecycle.

### 2. Entity Name References - Type Safety Requirement

#### EntityNames Enum Usage

**ALL entity references must use the EntityNames enum** for complete type safety and Creator Hub integration:

```typescript
// ❌ INCORRECT - String literals break type safety
payload: {
  entityName: 'crystal_1'
}

// ✅ CORRECT - Use EntityNames enum
payload: {
  entityName: EntityNames.Item_Crystal_1
}
```

**Why this is required:**

- **Type Safety**: TypeScript catches removed/renamed entities immediately
- **Creator Hub Sync**: EntityNames enum is auto-generated from Creator Hub
- **IDE Support**: Full autocomplete and error detection
- **Maintenance**: Changes in Creator Hub are immediately reflected in code

**Example Usage:**

```typescript
// Quest actions
actionsOnActivate: [
  {
    type: 'make_item_touchable',
    payload: { entityName: EntityNames.Item_Crystal_1 }
  }
]

// Item definitions
{
  id: 'bass_string',
  entityName: EntityNames.Item_Bass_String,
  // ...
}

// NPC definitions
{
  id: 'bassimus',
  entityName: EntityNames.NPC_Bassimus,
  // ...
}
```

### 3. Item Visibility and Interaction States

#### Item Removal (Collection/Disappearance)

When an item needs to "disappear" (e.g., collected items):

```typescript
// Required steps for item removal:
GltfContainer.invisibleMeshesCollisionMask = ColliderLayer.CL_NONE
GltfContainer.visibleMeshesCollisionMask = ColliderLayer.CL_NONE
VisibilityComponent.visible = false
// Update persistence map with new state
```

#### Interactive Items (Touchable)

For items that should be visible and interactive:

```typescript
GltfContainer.invisibleMeshesCollisionMask = ColliderLayer.CL_POINTER | ColliderLayer.CL_PHYSICS
GltfContainer.visibleMeshesCollisionMask = ColliderLayer.CL_NONE // Performance optimization
VisibilityComponent.visible = true
```

#### Visible but Non-Interactive Items

For items that should be visible but not clickable:

```typescript
GltfContainer.invisibleMeshesCollisionMask = ColliderLayer.CL_PHYSICS
GltfContainer.visibleMeshesCollisionMask = ColliderLayer.CL_NONE
VisibilityComponent.visible = true
```

**Note:** All collision masks now use proper `ColliderLayer` enum values for type safety, replacing raw numbers.

### 4. GLTF Container Management

#### GLTF Container Map

- **Purpose**: Persist GLTF states across scene transitions
- **Location**: `sceneManager.ts` maintains a Map<Entity, GltfState>
- **Persistence**: States are restored when locations are re-enabled
- **Performance**: `visibleMeshesCollisionMask` should always be `CL_NONE` except for exceptional cases

#### Scene Transitions

- **Location Removal**: GLTF containers are removed, collision masks set to `ColliderLayer.CL_NONE`
- **Location Addition**: GLTF containers are restored with saved states
- **Delay Requirements**: Portal clicks require delays (cannot be changed due to Creator Hub constraints)

### 4. Scene vs Location Architecture

#### Current Structure

- **Scenes**: High-level game areas (MainStage, MyceliumCave, Abyss, Bliss)
- **Locations**: Physical areas within scenes (Location Cave, Location Abyss, etc.)
- **Relationship**: Scenes contain multiple locations, locations contain entities

#### Architecture Evaluation: Keep Scene Concept

After analysis, the scene concept provides valuable organization and should be retained:

**Scenes Provide:**

- **Thematic Content Organization**: Scenes group related NPCs, items, and quests by narrative context
- **Background Music Management**: Each scene has dedicated background music
- **Enter/Exit Actions**: Scene-level setup/teardown of game state
- **Quest Organization**: Quests are thematically bound to scenes
- **Item Spawn Conditions**: Items can spawn based on scene-specific conditions

**Locations Handle:**

- **Spatial Organization**: Physical areas with entity groupings
- **GLTF Persistence**: Location-based GLTF state management across scene transitions

**Conclusion**: The scene/location separation provides good separation of concerns. Scenes handle narrative/thematic organization while locations handle spatial/entity management. This architecture should be maintained.

### 5. Quest System Granularity

#### Current Limitations

- Quests are binary: NOT_STARTED → IN_PROGRESS → COMPLETED/FAILED
- No intermediate quest states or steps
- Dialogue sequences not tied to quest progress

#### Required Improvements

- **Quest Steps**: Support multiple ordered steps within a quest
- **State Conditions**: Items/dialogues activated based on specific quest steps
- **Progress Tracking**: Fine-grained progress beyond simple completion

### 6. NPC Dialogue System

#### Current State

- Dialogue sequences defined per NPC
- Basic trigger conditions supported
- No integration with quest step progression

#### Required Improvements

- **Quest Integration**: Dialogue availability based on quest step completion
- **Conditional Sequences**: Different dialogues for different quest states
- **Progress Triggers**: Dialogue completion advances quest steps

### 7. Debug and Development Tools

#### Current Debug Functions

- `debugStartQuest()`: Jump to specific quest states
- `debugShowAvailableQuests()`: List available debug quests
- Global function exposure via `globalThis`

#### Cleanup Required

- Remove debug functions when granular quest system is implemented
- Replace with proper development tooling if needed

## Implementation Guidelines

### Item State Management Functions

```typescript
// Recommended function signatures:
removeItem(entity: Entity): void
makeItemTouchable(entity: Entity): void
makeItemVisibleButNotTouchable(entity: Entity): void
```

### Quest Step Structure

```typescript
interface QuestStep {
  id: string
  description: string
  order: number
  prerequisites?: string[] // Other step IDs
  actions: GameAction[] // Actions to execute when step becomes active
  completionCondition: () => boolean
}
```

### GLTF State Persistence

- Extend the GLTF map to include visibility and collision states
- Restore complete state when locations are re-enabled
- Update map whenever item states change

## Performance Considerations

1. **Collision Masks**: Keep `visibleMeshesCollisionMask = CL_NONE` for performance
2. **Component Management**: Avoid unnecessary component additions/removals
3. **State Persistence**: Minimize map updates to essential state changes
4. **Scene Transitions**: Use appropriate delays for GLTF operations

## Future Architecture Considerations

1. **Evaluate Scene Concept**: Assess if scenes provide value beyond location management
2. **Quest System Overhaul**: Implement step-based quest progression
3. **State Management**: Consider centralized state management for complex interactions
4. **Performance Monitoring**: Track component counts and GLTF operations

## AI System Integration Notes

This document serves as a reference for AI systems working with this codebase. The constraints listed here are fundamental to the Creator Hub environment and cannot be circumvented without significant architectural changes.
