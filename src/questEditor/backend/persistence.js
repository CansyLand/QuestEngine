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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const url_1 = require("url");
const child_process_1 = require("child_process");
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
class PersistenceManager {
    ensureDataDir() {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    }
    getFilePath(filename) {
        return path.join(DATA_DIR, filename);
    }
    loadLocations(items, npcs, portals) {
        try {
            const filePath = this.getFilePath('locations.json');
            if (!fs.existsSync(filePath)) {
                return [];
            }
            const data = fs.readFileSync(filePath, 'utf-8');
            const savedLocations = JSON.parse(data);
            // Convert references to full objects
            return savedLocations.map((location) => ({
                ...location,
                items: location.items
                    .map((itemId) => {
                    const item = items.find((i) => i.id === itemId);
                    if (!item) {
                        console.warn(`Item ${itemId} not found in global items`);
                        return null;
                    }
                    return item;
                })
                    .filter(Boolean),
                npcs: location.npcs
                    .map((npcId) => {
                    const npc = npcs.find((n) => n.id === npcId);
                    if (!npc) {
                        console.warn(`NPC ${npcId} not found in global npcs`);
                        return null;
                    }
                    return npc;
                })
                    .filter(Boolean),
                portals: location.portals
                    .map((portalId) => {
                    const portal = portals.find((p) => p.id === portalId);
                    if (!portal) {
                        console.warn(`Portal ${portalId} not found in global portals`);
                        return null;
                    }
                    return portal;
                })
                    .filter(Boolean)
            }));
        }
        catch (error) {
            console.error('Error loading locations:', error);
            return [];
        }
    }
    saveLocations(locations) {
        this.ensureDataDir();
        const filePath = this.getFilePath('locations.json');
        // Convert full objects to references (IDs)
        const savedLocations = locations.map((location) => ({
            id: location.id,
            name: location.name,
            backgroundMusic: location.backgroundMusic,
            image: location.image,
            items: location.items.map((item) => item.id),
            npcs: location.npcs.map((npc) => npc.id),
            portals: location.portals.map((portal) => portal.id)
        }));
        // Write to temp file first for atomicity
        const tempPath = filePath + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(savedLocations, null, 2));
        fs.renameSync(tempPath, filePath);
    }
    loadQuests() {
        try {
            const filePath = this.getFilePath('quests.json');
            if (!fs.existsSync(filePath)) {
                return [];
            }
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Error loading quests:', error);
            return [];
        }
    }
    saveQuests(quests) {
        this.ensureDataDir();
        const filePath = this.getFilePath('quests.json');
        const tempPath = filePath + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(quests, null, 2));
        fs.renameSync(tempPath, filePath);
    }
    loadNPCs() {
        try {
            const filePath = this.getFilePath('npcs.json');
            if (!fs.existsSync(filePath)) {
                return [];
            }
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Error loading NPCs:', error);
            return [];
        }
    }
    saveNPCs(npcs) {
        this.ensureDataDir();
        const filePath = this.getFilePath('npcs.json');
        const tempPath = filePath + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(npcs, null, 2));
        fs.renameSync(tempPath, filePath);
    }
    loadItems() {
        try {
            const filePath = this.getFilePath('items.json');
            if (!fs.existsSync(filePath)) {
                return [];
            }
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Error loading items:', error);
            return [];
        }
    }
    saveItems(items) {
        this.ensureDataDir();
        const filePath = this.getFilePath('items.json');
        const tempPath = filePath + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(items, null, 2));
        fs.renameSync(tempPath, filePath);
    }
    loadPortals() {
        try {
            const filePath = this.getFilePath('portals.json');
            if (!fs.existsSync(filePath)) {
                return [];
            }
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Error loading portals:', error);
            return [];
        }
    }
    savePortals(portals) {
        this.ensureDataDir();
        const filePath = this.getFilePath('portals.json');
        const tempPath = filePath + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(portals, null, 2));
        fs.renameSync(tempPath, filePath);
    }
    loadDialogues() {
        try {
            const filePath = this.getFilePath('dialogues.json');
            if (!fs.existsSync(filePath)) {
                return [];
            }
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Error loading dialogues:', error);
            return [];
        }
    }
    saveDialogues(dialogues) {
        this.ensureDataDir();
        const filePath = this.getFilePath('dialogues.json');
        const tempPath = filePath + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(dialogues, null, 2));
        fs.renameSync(tempPath, filePath);
    }
    loadGame() {
        const quests = this.loadQuests();
        const npcs = this.loadNPCs();
        const items = this.loadItems();
        const portals = this.loadPortals();
        const dialogues = this.loadDialogues();
        const locations = this.loadLocations(items, npcs, portals);
        // Create default game state
        const myceliumCaves = locations.find((l) => l.id === 'mycelium_caves');
        return {
            locations,
            quests,
            npcs,
            items,
            portals,
            dialogues,
            currentLocationId: myceliumCaves ? myceliumCaves.id : locations.length > 0 ? locations[0].id : '',
            activeQuests: [],
            inventory: []
        };
    }
    async saveGame(game) {
        this.saveLocations(game.locations);
        this.saveQuests(game.quests);
        this.saveNPCs(game.npcs);
        this.saveItems(game.items);
        this.savePortals(game.portals);
        this.saveDialogues(game.dialogues);
        // After all JSONs are saved, compile them into data.ts
        await this.compileDataToTypescript();
    }
    compileDataToTypescript() {
        return new Promise((resolve, reject) => {
            try {
                console.log('🔄 Starting data compilation...');
                const scriptPath = path.resolve(__dirname, '../../backend/generate-data.js');
                const workingDir = path.join(__dirname, '../../../');
                const command = `cd "${workingDir}" && node "${scriptPath}"`;
                (0, child_process_1.exec)(command, (error, stdout, stderr) => {
                    console.log('Exec callback triggered');
                    console.log('Error:', error);
                    console.log('STDOUT:', stdout);
                    console.log('STDERR:', stderr);
                    if (error) {
                        console.error('❌ Exec error:', error);
                        reject(error);
                    }
                    else {
                        console.log('✅ Data compilation completed successfully');
                        resolve();
                    }
                });
            }
            catch (error) {
                console.error('❌ Error compiling data to TypeScript:', error);
                reject(error);
            }
        });
    }
}
exports.PersistenceManager = PersistenceManager;
