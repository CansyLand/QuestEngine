# QuestEngine - QuestEditor

QuestEngine - Quest Editor for Decentraland Creator Hub

Runns parralele to the Decenraland Creator Hub and imports changes in scneen into the game Editor.

Game Creator can build quests and stories via ui in a drag and drop fashion

# Main types of a QuestEngine game definintion

- Location: A location defines entities that should be visible if player is in this location. Can include Items, NPCs, Portals
- Item: object in game like a key, crystal or tree
- Portal: portal unloads current locatio and loads another one
- Quest: Holds Quest Steps.
- Quest Step: Defines objective like collect 10 crytalls. Can spawn item on start and despawn items on completion
- Dialog Sequence: Holds a list of Dialogs
- Dialog: Is one text section that is visible on NPCs text fiel UI. Can be a question with buttons

# Seting up QuestEngine

## Via app:

- Download .dmg file for mac
- Install by dragging app onot your computer
- open app and select your folder wth the Decentraland scene you created with the Creator Hub

## Via code:

- git get this repo
- in terminal: npm run build
- then npm start, this opens the app and you can select the folder your decentraland scene is in.

# Creating Quest

# ToDo

- The app should install an npm package instead of copying files into src of dcl
  - Seperate NPC logig and use dcl-npc-toolkit
- Improve UI/UX
- Add a node-editor
- Create an agent that can crate and modify a game quest flow
- app should be updatable
