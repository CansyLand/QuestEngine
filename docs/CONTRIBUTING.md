# Contributing to QuestEngine

Thank you for your interest in contributing to QuestEngine, an Electron-based quest editor for Decentraland scenes! Our top priority is to make game creation in Decentraland as easy as possible, empowering creators with a simple, drag-and-drop interface to build quests, NPCs, items, and dialogues. This guide outlines how to set up the project, contribute code, and follow our standards to ensure high-quality contributions that align with this philosophy.

QuestEngine is a desktop app built with Electron, React, and TypeScript, using a feature-sliced architecture. It integrates with the Decentraland Creator Hub to create quests, NPCs, items, and dialogues via a drag-and-drop UI, with a runtime template (`dclQuestEngineTemplate/`) for Decentraland scenes.

## Getting Started

### Prerequisites

- **Node.js**: v20 or higher (`npm` included)
- **Git**: For cloning the repository
- **Decentraland Creator Hub**: For testing integration with Decentraland scenes
- **macOS** (optional): For building the macOS DMG (ARM64)

### Setting Up the Development Environment

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/CansyLand/QuestEngine.git
   cd QuestEngine
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Build the Project**:

   - Compile TypeScript and React code:

     ```bash
     npm run build
     ```

   - This outputs compiled JavaScript to `dist/`.

4. **Run the App**:

   ```bash
   npm start
   ```

   - Select a folder containing a Decentraland scene to test integration.

5. **Package for macOS** (optional):

   ```bash
   npm run package
   ```

   - Generates `dist/QuestEngine.dmg` for macOS ARM64.

### Project Structure

QuestEngine follows a feature-sliced architecture with clear separation of concerns:

- `src/core/`: Business logic (e.g., `GameEngine.ts`, `DataCompiler.ts`).
- `src/features/`: UI modules (`game-player/`, `project-manager/`, `quest-builder/`).
- `src/infrastructure/`: Integration with Decentraland (`QuestEditorIntegration.ts`).
- `src/shared/`: Reusable components, hooks, and utilities.
- `dclQuestEngineTemplate/`: Runtime template copied to Decentraland projects.
- `dataDemo/`: Sample JSON data (`quests.json`, `npcs.json`, etc.).
- `docs/`: Documentation (`README.md`, `CONTRIBUTING.md`, images).
- `dist/`: Compiled and packaged outputs (e.g., `QuestEngine.dmg`).

## How to Contribute

### Reporting Issues

- Check the Issues page for existing bugs or feature requests.
- Create a new issue with:
  - A clear title and description.
  - Steps to reproduce (for bugs).
  - Screenshots or GIFs (place in `docs/assets/`).
  - Your environment (e.g., Node.js version, OS).

### Submitting Pull Requests

1. **Fork the Repository**:
   - Fork `https://github.com/CansyLand/QuestEngine` and clone your fork.
2. **Create a Branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

   - Use descriptive branch names (e.g., `fix/bug-description`, `feature/node-editor`).

3. **Make Changes**:
   - Follow the Coding Standards.
   - Update `docs/assets/` for new screenshots/GIFs if needed.
   - Test changes with `npm start` and verify Decentraland integration.
4. **Test Your Changes**:
   - Run the app and test with a Decentraland scene.
   - Use the “Test Game Flow” button to preview quests.
   - Ensure JSON files in `path_to_DCL_project/src/questEngine/data/` update correctly.
5. **Commit Changes**:

   - Use clear commit messages (e.g., “Add node-editor to quest-builder feature”).
   - Include updates to `README.md` or `CONTRIBUTING.md` if relevant.

   ```bash
   git commit -m "Your descriptive commit message"
   ```

6. **Push and Create a Pull Request**:

   ```bash
   git push origin feature/your-feature-name
   ```

   - Open a PR on GitHub, referencing related issues (e.g., “Fixes #123”).
   - Describe the changes, purpose, and any testing done.

### Coding Standards

- **TypeScript**:
  - Use strict typing (`strict: true` in `tsconfig.json`).
  - Define types in `types/` folders (e.g., `src/features/quest-builder/types/`).
  - Use path aliases (e.g., `@core/*`, `@features/quest-builder/*`) defined in `tsconfig.json`.
- **React**:
  - Use functional components and hooks in `src/features/` and `src/shared/components/`.
  - Follow `react-app-rewired` config in `config-overrides.js` for Webpack.
- **Electron**:
  - Use `contextBridge` in `preload.ts` for secure IPC.
  - Place main process code in `main.ts` or`electron-integration.ts`.
- **Decentraland Integration**:
  - App updates Game Definition in `path_to_DCL_project/src/questEngine/data/`
  - App installs QuestEngine into Decentraland scene from `dclQuestEngineTemplate/`.
- **Code Style**:
  - Follow ESLint/Prettier rules (if configured) or match existing style.
  - Use camelCase for variables, PascalCase for types/components.
- **Documentation**:
  - Update `README.md` for new features or usage changes.
  - Place images/GIFs in `docs/assets/` with relative paths (e.g., `![Image](docs/assets/image.png)`).

### Working with Decentraland

- **Setup**: Test with a Decentraland scene folder (`path_to_DCL_project/`).
- **Runtime Template**: Update `dclQuestEngineTemplate/` for runtime changes, ensuring compatibility with `dcl-npc-toolkit` (planned).
- **Testing**: Use the “Test Game Flow” button to verify quest logic is working.

### Roadmap

See `README.md` for planned features, including:

- npm package integration with `dcl-npc-toolkit`.
- Node-based editor for quest flows.
- Auto-updates via `electron-updater`.

### Need Help?

- Join discussions on Issues.
- Ask questions in PR comments or create a new issue for guidance.

## License

QuestEngine is licensed under the MIT License.
