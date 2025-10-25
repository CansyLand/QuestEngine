## How the Entity ID Update Feature Works

The system consists of several interconnected components that work together:

### 1. **Automatic ID Generation When Name Changes**

When you edit an entity (like a location, NPC, item, etc.), the UI automatically generates a new ID based on the name:

- **Location**: `EditModal.tsx` uses `useEffect` to watch for `name` changes and calls `generateIdFromApi(name, 'location', currentId)`
- **Quest**: Similar logic for quest titles
- **Quest Steps**: Auto-generates IDs from step names

The `generateIdFromApi` function calls the backend `/generate-id` endpoint in `QuestEngineService.ts`, which uses the `generateId()` method to create slug-like IDs from names (e.g., "Mycelium Caves" → "mycelium_caves").

### 2. **Cascade Update Logic**

When an entity ID changes, the system updates **all references** to that entity throughout the entire game data. This is handled in `QuestBuilder.tsx` in the `saveEditedEntity` function:

```typescript
// If the entity ID changed, update all references to it
const entityIdChanged = updatedEntity.id !== originalEntity.id
if (entityIdChanged) {
	console.log(
		`Entity ID changed from ${originalEntity.id} to ${updatedEntity.id} for ${editModal.entityType}`
	)
	updatedGameData = updateEntityReferences(
		updatedGameData,
		editModal.entityType,
		originalEntity.id,
		updatedEntity.id
	)
}
```

### 3. **The `updateEntityReferences` Function**

This is the core function that handles cascading updates. It updates references in:

**Location References:**

- Items, NPCs, and portals arrays within locations
- Child location references (`locations` array)

**Action References:**

- `onInteract` actions on items, NPCs, and portals
- Quest step `onStart` and `onComplete` actions
- Portal `destinationLocationId` fields

**Quest System References:**

- Quest step objective parameters (`npcId`, `itemName`, `portalId`, etc.)
- Dialogue sequence `npcId` and `questStepId` references
- Active quest step IDs

**Examples of what gets updated:**

- If you change a location ID from `forest_clearing` to `enchanted_grove`, all portals pointing to `forest_clearing` will automatically update their `destinationLocationId`
- If you change an NPC ID, all dialogue sequences linked to that NPC will update
- If you change an item ID, all quest steps that reference it in objectives or actions will update

### 4. **Data Persistence**

After updating all references, the system:

1. Saves the updated game data via `PersistenceManager`
2. Compiles the JSON data into TypeScript constants using `DataCompiler`
3. The compiled `data.ts` file contains the embedded game data for the Decentraland runtime

### 5. **Entity Links (DCL Integration)**

The system also maintains `entityLinks.json` which maps Decentraland scene entities to quest entities. When quest entity IDs change, the links are preserved through the `updateEntityLinks` function in `data-utils.ts`.

This ensures that even if entity IDs change in the quest system, the links to the actual 3D scene entities remain intact.

The feature ensures data integrity by automatically propagating ID changes throughout the entire game structure, preventing broken references that could crash the game or cause quests to malfunction.
