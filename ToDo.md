- create new item from link window
- (createa new item automatically with new DCL Entiy?)
- make filter parent tabs in link tab
  - keep tab open after tab switch
- copy items
- diplcate items with counter (virtual items)
- make page not selectable except for id text or so
- sort items
- images in location item select
- items reatach themselves to different dcl entites
- if i change a name of anything it should change everywhere like even image names and in code

- save state so you can create draft states to test something

- if thre is no npc in location then i get this error in DCL:
  (they disappear when i attacha n npc to location)

decentraland://realm=http%3A%2F%2F127.0.0.1%3A8000&position=0%2C0&dclenv=org&local-scene=true&hub=true&skip-auth-screen=true&landscape-terrain-enabled=true
[2:46:56 AM] Starting compilation in watch mode...
src/questEngine/LocationAdapter.ts:113:50 - error TS2339: Property 'id' does not exist on type 'never'. 113 const isNPC = EMBEDDED_NPCS.some((npc) => npc.id === entityId) ~~ src/questEngine/LocationAdapter.ts:207:55 - error TS2339: Property 'id' does not exist on type 'never'. 207 const npcDefinition = EMBEDDED_NPCS.find((n) => n.id === npc.id) ~~ src/questEngine/LocationAdapter.ts:211:61 - error TS2339: Property 'name' does not exist on type 'never'. 211 `Found NPC definition for ${npc.id}: ${npcDefinition.name}` ~~~~ src/questEngine/LocationAdapter.ts:235:66 - error TS2339: Property 'image' does not exist on type 'never'. 235 portrait: npcPortraitOverrides.get(npc.id) || npcDefinition.image, // Use override if available ~~~~~
src/questEngine/LocastionAdapter.ts:236:31 - error TS2339: Property 'name' does not exist on type 'never'. 236 hoverText: npcDefinition.name || 'Talk', ~~~~ [2:46:57 AM] Found 5 errors. Watching for file changes.
[2:48:23 AM] File change detected. Starting incremental compilation...
File /Users/artur/Documents/Cansy Land CreatorHub/test-1/src/questEngine/data.ts changed, rebuilding...
[2:48:23 AM] Found 0 errors. Watching for file changes.
Bundle saved bin/index.js
File /Users/artur/Documents/Cansy Land CreatorHub/test-1/src/questEngine/data.ts changed, rebuilding...
[2:48:34 AM] File change detected. Starting incremental compilation...
Bundle saved bin/index.js
[2:48:35 AM] Found 0 errors. Watching for file changes.

- automatically update version in .json?
- Set Up automated Publishing

- The app should install an npm package instead of copying files into src of dcl
  - Seperate NPC logig and use dcl-npc-toolkit
- Improve UI/UX
- Add a node-editor
- Create an agent that can crate and modify a game quest flow
- app should be updatable
