# Game Engine and Builder

A comprehensive game engine and builder system built with Node.js, Express, and React/TypeScript. This system provides both a visual game builder interface and a player interface for creating and testing adventure-style games.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- The project dependencies should already be installed in the main project

### Running the System

**You need to run BOTH servers simultaneously:**

1. **Start the Backend API Server (Terminal 1):**

   ```bash
   npm run game-editor
   ```

   This starts the Express server on port 3000 for API endpoints.

2. **Start the Frontend Development Server (Terminal 2):**

   ```bash
   npm run dev-frontend
   npm run game-editor
   ```

   This starts the Vite development server on port 5173 for the UI.

3. **Access the Interfaces:**
   - **Game Builder:** `http://localhost:5173/builder/index.html`
   - **Game Player:** `http://localhost:5173/player/index.html`
   - **API Base:** `http://localhost:3000/api` (automatically proxied through frontend)

### Troubleshooting

- **Port conflicts:** If servers fail to start, kill existing processes:
  ```bash
  pkill -f "node gameEditor/dist/backend/server.js"
  pkill -f "vite"
  ```
- **Both servers must be running** for the full system to work
- **Use port 5173 for UI, port 3000 for API access only**

## 🏗️ Architecture

### Backend (Node.js/Express/TypeScript)

- **Engine (`backend/engine.ts`)**: Core game logic and state management
- **Persistence (`backend/persistence.ts`)**: JSON file-based data storage
- **API (`backend/api.ts`)**: REST endpoints for frontend communication
- **Server (`backend/server.ts`)**: Express server setup and routing

### Frontend (React/TypeScript)

- **Builder Interface**: Visual editor for creating game content
- **Player Interface**: Game testing environment
- **Shared Utilities**: Common functions and API wrappers

### Data Structure

All game data is stored as JSON files in the `data/` directory:

- `locations.json` - Game locations with backgrounds and entities
- `quests.json` - Quest definitions with steps and objectives
- `npcs.json` - NPC definitions with dialogue sequences
- `items.json` - Item definitions with interactions
- `portals.json` - Portal definitions for location transitions

## 🎮 Game Builder Interface

The builder provides a tabbed interface for creating and managing game content:

### Locations Tab

- Create game locations with background images and music
- Assign items, NPCs, and portals to locations
- Configure location-specific settings

### Quests Tab

- Define multi-step quests with objectives
- Set quest prerequisites and rewards
- Configure automatic progression logic

### NPCs Tab

- Create non-player characters with portraits
- Define dialogue sequences with branching conversations
- Set NPC interaction behaviors

### Items Tab

- Create collectible or interactive items
- Configure grab/touch interactions
- Set audio effects and visual properties

### Portals Tab

- Create location transition points
- Configure destination locations
- Set portal interaction behaviors

### Features

- **Load/Save:** Load existing game data or save current work
- **Entity Management:** Add, edit, and delete game entities
- **Real-time Updates:** Changes are reflected immediately in the interface

## 🎯 Game Player Interface

The player provides a testing environment for created games:

### Core Features

- **16x16 Grid World:** Visual representation of game locations
- **Entity Interactions:** Click items, NPCs, and portals to interact
- **Inventory System:** Track collected items
- **Quest Progress:** Real-time quest status and objectives
- **Audio Support:** Background music and sound effects

### Game Flow

1. **Start Game:** Initialize game state and load first location
2. **Explore:** Click on entities to interact with them
3. **Complete Objectives:** Follow quest steps to progress
4. **Location Changes:** Use portals to move between areas

### Quest Logging

- Real-time updates of quest activation/completion
- Inventory changes and item collection
- Interaction feedback and game events

## 📊 API Reference

### Endpoints

#### `GET /api/load`

Load current game data
**Response:** `{ success: boolean, data?: Game, error?: string }`

#### `POST /api/save`

Save game data
**Request:** Game data object
**Response:** `{ success: boolean, error?: string }`

#### `POST /api/start`

Start a new game session
**Response:** `{ success: boolean, commands?: Command[], error?: string }`

#### `POST /api/interact`

Process player interactions
**Request:** `{ type: string, params: any }`
**Response:** `{ success: boolean, commands?: Command[], error?: string }`

### Interaction Types

- `clickItem` - Player clicked an item
- `clickNPC` - Player clicked an NPC
- `clickPortal` - Player clicked a portal

### Commands

Commands returned from interactions:

- `playSound` - Play audio file
- `spawnEntity` - Add entity to location
- `clearEntity` - Remove entity from location
- `changeBackground` - Update location visuals
- `updateInventory` - Modify player inventory
- `questActivated` - Quest started
- `questCompleted` - Quest finished

## 📁 File Structure

```
gameEditor/
├── backend/
│   ├── engine.ts          # Core game logic
│   ├── persistence.ts     # JSON data management
│   ├── api.ts            # API route handlers
│   └── server.ts         # Express server
├── frontend/
│   ├── builder/
│   │   ├── Builder.tsx   # Main builder component
│   │   ├── EntityPanel.tsx # Reusable entity list
│   │   ├── Builder.css   # Builder styles
│   │   └── index.html    # Builder HTML entry
│   ├── player/
│   │   ├── Player.tsx    # Main player component
│   │   ├── Grid.tsx      # 16x16 game grid
│   │   ├── DialoguePanel.tsx # NPC dialogue UI
│   │   ├── Player.css    # Player styles
│   │   └── index.html    # Player HTML entry
│   └── shared/
│       └── utils.ts      # Shared utilities
├── data/                 # JSON data files
├── models.ts            # TypeScript interfaces
├── tsconfig.json        # TypeScript config
└── README.md           # This file
```

## 🎯 Game Features

### Quest System

- **Multi-step Quests:** Complex quest chains with prerequisites
- **Objective Types:** Collect items, talk to NPCs, visit locations
- **Automatic Progression:** Smart quest advancement based on player actions
- **Quest States:** Active, completed, failed tracking

### Entity System

- **Items:** Collectible objects with interaction effects
- **NPCs:** Characters with dialogue trees and behaviors
- **Portals:** Location transition points
- **Interactive Modes:** Grabbable, touchable, or non-interactive

### Audio & Visual

- **Background Music:** Location-specific audio tracks
- **Sound Effects:** Interaction and event audio
- **Visual Assets:** Images for items, NPCs, portals, and backgrounds
- **Asset URLs:** Flexible asset referencing system

### State Management

- **Runtime State:** Active quests, inventory, location tracking
- **Entity States:** Spawned/cleared status for dynamic content
- **Persistent Data:** JSON-based save/load system

## 🔧 Development Notes

### Code Style

- **TypeScript:** Full type safety throughout
- **Semicolons:** No semicolons (Prettier config)
- **Imports:** Clean, organized imports
- **Modular:** Small, focused files

### Data Flow

1. **Builder** → API calls → **Persistence** (save data)
2. **Player** → API calls → **Engine** → Commands → **Player** (execute actions)

### Extensibility

- **Action System:** Easy to add new interaction types
- **Entity Types:** Simple to extend with new entity categories
- **Quest Objectives:** Flexible objective system for custom logic

### Current Limitations

- **Mock Entities:** Player currently uses hardcoded entities for demo
- **No Edit Modals:** Builder shows entities but edit functionality is placeholder
- **Single Location Display:** Player shows one location at a time
- **Basic Audio:** Simple HTML5 audio implementation

## 🚀 Future Enhancements

- **Visual Entity Editor:** Modal dialogs for editing entities
- **Drag & Drop Grid:** Visual placement of entities in builder
- **Advanced Quest Editor:** GUI for building quest logic
- **Asset Management:** Upload and manage game assets
- **Multiplayer Support:** Real-time collaborative editing
- **Export/Import:** Share game projects between instances

## 📝 License

This game engine and builder system is part of a larger project. See the main project README for licensing information.

---

**Happy Game Building!** 🎮✨
