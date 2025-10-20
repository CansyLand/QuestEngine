"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestEditorIntegration = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
class ElectronPersistenceManager {
    constructor(dataDir) {
        this.dataDir = dataDir;
    }
    async ensureDataDir() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
        }
        catch (error) {
            // Directory already exists or other error, ignore
        }
    }
    getFilePath(filename) {
        return path.join(this.dataDir, filename);
    }
    async loadQuests() {
        try {
            const filePath = this.getFilePath('quests.json');
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Error loading quests:', error);
            return [];
        }
    }
    async saveQuests(quests) {
        await this.ensureDataDir();
        const filePath = this.getFilePath('quests.json');
        const tempPath = filePath + '.tmp';
        await fs.writeFile(tempPath, JSON.stringify(quests, null, 2));
        await fs.rename(tempPath, filePath);
    }
    async loadLocations(items, npcs, portals) {
        try {
            const filePath = this.getFilePath('locations.json');
            const data = await fs.readFile(filePath, 'utf-8');
            const savedLocations = JSON.parse(data);
            return savedLocations.map((location) => ({
                ...location,
                items: location.items
                    .map((itemId) => items.find((i) => i.id === itemId))
                    .filter(Boolean),
                npcs: location.npcs
                    .map((npcId) => npcs.find((n) => n.id === npcId))
                    .filter(Boolean),
                portals: location.portals
                    .map((portalId) => portals.find((p) => p.id === portalId))
                    .filter(Boolean),
            }));
        }
        catch (error) {
            console.error('Error loading locations:', error);
            return [];
        }
    }
    async saveLocations(locations) {
        await this.ensureDataDir();
        const filePath = this.getFilePath('locations.json');
        const savedLocations = locations.map((location) => ({
            id: location.id,
            name: location.name,
            backgroundMusic: location.backgroundMusic,
            image: location.image,
            items: location.items.map((item) => item.id),
            npcs: location.npcs.map((npc) => npc.id),
            portals: location.portals.map((portal) => portal.id),
        }));
        const tempPath = filePath + '.tmp';
        await fs.writeFile(tempPath, JSON.stringify(savedLocations, null, 2));
        await fs.rename(tempPath, filePath);
    }
    async loadNPCs() {
        try {
            const filePath = this.getFilePath('npcs.json');
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Error loading NPCs:', error);
            return [];
        }
    }
    async saveNPCs(npcs) {
        await this.ensureDataDir();
        const filePath = this.getFilePath('npcs.json');
        const tempPath = filePath + '.tmp';
        await fs.writeFile(tempPath, JSON.stringify(npcs, null, 2));
        await fs.rename(tempPath, filePath);
    }
    async loadItems() {
        try {
            const filePath = this.getFilePath('items.json');
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Error loading items:', error);
            return [];
        }
    }
    async saveItems(items) {
        await this.ensureDataDir();
        const filePath = this.getFilePath('items.json');
        const tempPath = filePath + '.tmp';
        await fs.writeFile(tempPath, JSON.stringify(items, null, 2));
        await fs.rename(tempPath, filePath);
    }
    async loadPortals() {
        try {
            const filePath = this.getFilePath('portals.json');
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Error loading portals:', error);
            return [];
        }
    }
    async savePortals(portals) {
        await this.ensureDataDir();
        const filePath = this.getFilePath('portals.json');
        const tempPath = filePath + '.tmp';
        await fs.writeFile(tempPath, JSON.stringify(portals, null, 2));
        await fs.rename(tempPath, filePath);
    }
    async loadDialogues() {
        try {
            const filePath = this.getFilePath('dialogues.json');
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Error loading dialogues:', error);
            return [];
        }
    }
    async saveDialogues(dialogues) {
        await this.ensureDataDir();
        const filePath = this.getFilePath('dialogues.json');
        const tempPath = filePath + '.tmp';
        await fs.writeFile(tempPath, JSON.stringify(dialogues, null, 2));
        await fs.rename(tempPath, filePath);
    }
    async loadEntityLinks() {
        try {
            const filePath = this.getFilePath('entityLinks.json');
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Error loading entity links:', error);
            return {};
        }
    }
    async saveEntityLinks(entityLinks) {
        await this.ensureDataDir();
        const filePath = this.getFilePath('entityLinks.json');
        const tempPath = filePath + '.tmp';
        await fs.writeFile(tempPath, JSON.stringify(entityLinks, null, 2));
        await fs.rename(tempPath, filePath);
    }
    async loadGame() {
        const quests = await this.loadQuests();
        const npcs = await this.loadNPCs();
        const items = await this.loadItems();
        const portals = await this.loadPortals();
        const dialogues = await this.loadDialogues();
        const locations = await this.loadLocations(items, npcs, portals);
        // Create default game state
        const myceliumCaves = locations.find((l) => l.id === 'mycelium_caves');
        return {
            locations,
            quests,
            npcs,
            items,
            portals,
            dialogues,
            currentLocationId: myceliumCaves
                ? myceliumCaves.id
                : locations.length > 0
                    ? locations[0].id
                    : '',
            activeQuests: [],
            inventory: [],
        };
    }
    async saveGame(game) {
        await this.saveLocations(game.locations);
        await this.saveQuests(game.quests);
        await this.saveNPCs(game.npcs);
        await this.saveItems(game.items);
        await this.savePortals(game.portals);
        await this.saveDialogues(game.dialogues);
    }
    async compileDataToTypescript() {
        // Stub implementation - could generate TypeScript types from JSON data
        console.log('Data compilation not implemented in ElectronPersistenceManager');
    }
}
class QuestEditorIntegration {
    constructor() {
        this.engine = null;
        this.projectPath = null;
        this.sceneMonitoringInterval = null;
        this.app = (0, express_1.default)();
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
        // Initialize backend components
        this.persistence = new ElectronPersistenceManager('');
        // Engine will be initialized when project path is set
        // API routes will be mounted after engine initialization
    }
    /**
     * Set the active project path and update data directory
     */
    async setProjectPath(projectPath) {
        this.projectPath = projectPath;
        await this.updateDataDirectory(projectPath);
        await this.initializeEngine();
        this.setupSceneMonitoring(projectPath);
    }
    /**
     * Initialize the game engine after setting the project path
     */
    async initializeEngine() {
        // For now, create a simple mock engine that delegates to persistence
        // In a full implementation, we'd modify GameEngine to be async-compatible
        this.engine = {
            getGame: async () => await this.persistence.loadGame(),
            saveGame: async (game) => await this.persistence.saveGame(game),
            // Add other methods as needed for the API
        };
        // Create a simple API router that works with our persistence
        this.setupApiRoutes();
    }
    /**
     * Setup API routes for questEditor
     */
    setupApiRoutes() {
        const router = express_1.default.Router();
        // Game data endpoint
        router.get('/game', async (req, res) => {
            try {
                const game = await this.persistence.loadGame();
                res.json(game);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to load game data' });
            }
        });
        // Quests endpoints
        router.get('/quests', async (req, res) => {
            try {
                const quests = await this.persistence.loadQuests();
                res.json(quests);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to load quests' });
            }
        });
        router.post('/quests', async (req, res) => {
            try {
                await this.persistence.saveQuests(req.body);
                res.json({ success: true });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to save quests' });
            }
        });
        // Add more endpoints as needed...
        this.app.use('/api', router);
    }
    /**
     * Update the persistence manager's data directory
     */
    async updateDataDirectory(projectPath) {
        const dataDir = path.join(projectPath, 'src/questEngine/data');
        // Create new persistence instance with the project-specific data directory
        this.persistence = new ElectronPersistenceManager(dataDir);
    }
    /**
     * Initialize default data for a new project
     */
    async initializeDefaultData(dataDir) {
        // Use process.cwd() to get the main project directory, then navigate to src/questEditor/data
        const defaultDataDir = path.join(process.cwd(), 'src/questEditor/data');
        console.log('__dirname:', __dirname);
        console.log('process.cwd():', process.cwd());
        console.log('defaultDataDir:', defaultDataDir);
        console.log('target dataDir:', dataDir);
        // Check if any data files exist
        try {
            const files = await fs.readdir(dataDir);
            if (files.length > 0) {
                // Data already exists, don't overwrite
                console.log('Data already exists in project, skipping initialization');
                return;
            }
        }
        catch (error) {
            console.log('Data directory does not exist, will create:', error);
        }
        // Ensure target directory exists
        await fs.mkdir(dataDir, { recursive: true });
        console.log('Created data directory:', dataDir);
        // Copy default data files
        const dataFiles = [
            'quests.json',
            'locations.json',
            'npcs.json',
            'portals.json',
            'dialogues.json',
            'entityLinks.json',
            'items.json',
        ];
        for (const file of dataFiles) {
            try {
                const sourcePath = path.join(defaultDataDir, file);
                const targetPath = path.join(dataDir, file);
                console.log(`Attempting to copy ${file} from ${sourcePath} to ${targetPath}`);
                // Check if source file exists and copy it
                try {
                    await fs.access(sourcePath);
                    await fs.copyFile(sourcePath, targetPath);
                    console.log(`✅ Successfully copied ${file} to project`);
                }
                catch (copyError) {
                    // If source file doesn't exist, create an empty JSON file
                    console.warn(`Source file ${file} not found, creating empty JSON file`);
                    const emptyData = this.getEmptyDataForFile(file);
                    await fs.writeFile(targetPath, JSON.stringify(emptyData, null, 2));
                    console.log(`✅ Created empty ${file} in project`);
                }
            }
            catch (error) {
                console.error(`❌ Failed to create ${file}:`, error);
            }
        }
        console.log('Data initialization complete');
    }
    /**
     * Get empty data structure for a specific file type
     */
    getEmptyDataForFile(filename) {
        switch (filename) {
            case 'quests.json':
                return [];
            case 'npcs.json':
                return [];
            case 'items.json':
                return [];
            case 'locations.json':
                return [];
            case 'portals.json':
                return [];
            case 'dialogues.json':
                return [];
            case 'entityLinks.json':
                return {};
            default:
                return {};
        }
    }
    /**
     * Setup DCL scene monitoring for the project
     */
    setupSceneMonitoring(projectPath) {
        // Clear existing monitoring
        if (this.sceneMonitoringInterval) {
            clearInterval(this.sceneMonitoringInterval);
        }
        const compositePath = path.join(projectPath, 'assets/scene/main.composite');
        const linksPath = path.join(projectPath, 'src/questEngine/data/entityLinks.json');
        let lastHash = null;
        let heartbeatCount = 0;
        const monitorChanges = async () => {
            try {
                // Check if composite file exists
                await fs.access(compositePath);
                const compositeData = JSON.parse(await fs.readFile(compositePath, 'utf8'));
                const currentHash = this.computeHash(compositeData);
                if (currentHash !== lastHash) {
                    lastHash = currentHash;
                    const newLinks = this.extractEntityData(compositeData);
                    await this.updateEntityLinks(newLinks, linksPath);
                    console.log('DCL scene entities updated in project:', projectPath);
                }
                // Show heartbeat every 10 checks (30 seconds)
                heartbeatCount++;
                if (heartbeatCount % 10 === 0) {
                    console.log('DCL monitoring active for project:', projectPath);
                }
            }
            catch (error) {
                // File might not exist or be invalid JSON - silently ignore
                if (heartbeatCount % 10 === 0) {
                    console.log('DCL monitoring waiting for main.composite file in project:', projectPath);
                }
                heartbeatCount++;
            }
        };
        // Run initial check
        monitorChanges();
        // Monitor every 3 seconds
        this.sceneMonitoringInterval = setInterval(monitorChanges, 3000);
        console.log('DCL scene monitoring started for project:', projectPath);
        console.log('Monitoring file:', compositePath);
        console.log('Will update:', linksPath);
    }
    /**
     * Compute hash for change detection
     */
    computeHash(data) {
        const transformData = data.components?.find((c) => c.name === 'core::Transform')?.data ||
            {};
        const nameData = data.components?.find((c) => c.name === 'core-schema::Name')?.data ||
            {};
        const entities = Object.keys(transformData);
        let hashData = entities.length.toString();
        const sortedEntities = entities.sort();
        sortedEntities.forEach((entityId) => {
            const transform = transformData[entityId]?.json;
            const name = nameData[entityId]?.json?.value;
            if (transform) {
                hashData += `${entityId}:${transform.position?.x || 0},${transform.position?.y || 0},${transform.position?.z || 0}`;
            }
            if (name) {
                hashData += `:${name}`;
            }
        });
        return hashData;
    }
    /**
     * Extract entity data from composite
     */
    extractEntityData(compositeData) {
        const links = {};
        const transformData = compositeData.components?.find((c) => c.name === 'core::Transform')
            ?.data || {};
        const nameData = compositeData.components?.find((c) => c.name === 'core-schema::Name')
            ?.data || {};
        for (const entityId of Object.keys(transformData)) {
            if (nameData[entityId]) {
                const transform = transformData[entityId].json;
                const name = nameData[entityId].json.value;
                links[entityId] = {
                    position: transform.position || { x: 0, y: 0, z: 0 },
                    parent: transform.parent || 0,
                    name: name || 'Unknown',
                    questEntityId: null,
                };
            }
        }
        return links;
    }
    /**
     * Update entity links file
     */
    async updateEntityLinks(newLinks, linksPath) {
        let existingLinks = {};
        try {
            const data = await fs.readFile(linksPath, 'utf8');
            existingLinks = JSON.parse(data);
        }
        catch {
            // File doesn't exist, use empty object
        }
        const updatedLinks = {};
        // Process existing entities
        for (const entityId in existingLinks) {
            const existingEntity = existingLinks[entityId];
            if (newLinks[entityId]) {
                // Entity still exists, update with new data (including name changes)
                updatedLinks[entityId] = {
                    ...newLinks[entityId],
                    questEntityId: existingEntity.questEntityId, // Preserve existing quest entity links
                };
            }
            else {
                // Entity was removed from main.composite - delete it entirely
                console.log(`Removing entity ${entityId} (${existingEntity.name}) from entityLinks.json`);
            }
        }
        // Add any new entities from main.composite
        for (const entityId in newLinks) {
            if (!existingLinks[entityId]) {
                updatedLinks[entityId] = newLinks[entityId];
                console.log(`Adding new entity ${entityId} (${newLinks[entityId].name}) to entityLinks.json`);
            }
        }
        // Ensure directory exists
        await fs.mkdir(path.dirname(linksPath), { recursive: true });
        // Write back to file
        await fs.writeFile(linksPath, JSON.stringify(updatedLinks, null, 2));
        console.log('entityLinks.json updated.');
    }
    /**
     * Start the questEditor backend server
     */
    async start(port = 3001) {
        return new Promise((resolve) => {
            this.server = this.app.listen(port, () => {
                console.log(`QuestEditor backend running on port ${port}`);
                resolve();
            });
        });
    }
    /**
     * Stop the questEditor backend server
     */
    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
        }
        if (this.sceneMonitoringInterval) {
            clearInterval(this.sceneMonitoringInterval);
            this.sceneMonitoringInterval = null;
        }
    }
    /**
     * Get the Express app instance for additional configuration
     */
    getApp() {
        return this.app;
    }
    /**
     * Get API methods that can be exposed via IPC
     */
    getApiMethods() {
        return {
            // These methods can be called via IPC to interact with the questEditor backend
            getGameData: async () => this.engine ? await this.engine.getGame() : null,
            saveGameData: async (data) => this.engine ? await this.engine.saveGame(data) : null,
            getQuests: () => this.persistence.loadQuests(),
            saveQuests: (quests) => this.persistence.saveQuests(quests),
            persistence: this.persistence,
            // Add more methods as needed
        };
    }
}
exports.QuestEditorIntegration = QuestEditorIntegration;
