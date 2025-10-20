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
const electron_1 = require("electron");
const path = __importStar(require("path"));
const electron_updater_1 = require("electron-updater");
const fs = __importStar(require("fs/promises")); // For file I/O
const electron_integration_1 = require("./electron/electron-integration");
let mainWindow = null;
let questEditor = null;
// Simple file-based storage for projects
const getProjectsFilePath = () => {
    return path.join(electron_1.app.getPath('userData'), 'projects.json');
};
const loadProjects = async () => {
    try {
        const filePath = getProjectsFilePath();
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    }
    catch {
        return [];
    }
};
const saveProjects = async (projects) => {
    const filePath = getProjectsFilePath();
    await fs.writeFile(filePath, JSON.stringify(projects, null, 2), 'utf8');
};
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false, // Security: Disable direct Node in renderer
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'), // Compiled from preload.ts
        },
    });
    const isDev = process.env.NODE_ENV === 'development';
    mainWindow.loadURL(isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, 'build/index.html')}`);
    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// Auto-update setup
electron_updater_1.autoUpdater.autoDownload = true;
electron_updater_1.autoUpdater.autoInstallOnAppQuit = true;
electron_1.app.whenReady().then(async () => {
    createWindow();
    // Initialize QuestEditor backend
    questEditor = new electron_integration_1.QuestEditorIntegration();
    const backendPort = await questEditor.start(); // Start on fixed port 31234
    console.log(`QuestEngine backend running on port ${backendPort}`);
    electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
});
electron_updater_1.autoUpdater.on('update-available', () => {
    electron_1.dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new version is available. Downloading now...',
    });
});
electron_updater_1.autoUpdater.on('update-downloaded', () => {
    electron_1.dialog
        .showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded. Restart to apply?',
        buttons: ['Restart', 'Later'],
    })
        .then(({ response }) => {
        if (response === 0) {
            electron_updater_1.autoUpdater.quitAndInstall();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Clean up questEditor before quitting
        if (questEditor) {
            questEditor.stop();
            questEditor = null;
        }
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// IPC handlers for secure file operations
electron_1.ipcMain.handle('select-folder', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select Folder for Read/Write',
    });
    return result.canceled ? undefined : result.filePaths[0];
});
electron_1.ipcMain.handle('read-file', async (_event, { folderPath, fileName }) => {
    const fullPath = path.join(folderPath, fileName);
    return fs.readFile(fullPath, 'utf8');
});
electron_1.ipcMain.handle('write-file', async (_event, { folderPath, fileName, content, }) => {
    const fullPath = path.join(folderPath, fileName);
    await fs.writeFile(fullPath, content, 'utf8');
});
// Project management IPC handlers
electron_1.ipcMain.handle('get-projects', async () => {
    return await loadProjects();
});
electron_1.ipcMain.handle('create-project', async (_event, { name, path: projectPath }) => {
    const projects = await loadProjects();
    const newProject = {
        id: Date.now().toString(),
        name,
        path: projectPath,
        createdAt: new Date().toISOString(),
    };
    projects.push(newProject);
    await saveProjects(projects);
    // Create questEngine folder and data files in the project's src directory
    try {
        const questEnginePath = path.join(projectPath, 'src', 'questEngine');
        const dataPath = path.join(questEnginePath, 'data');
        await fs.mkdir(dataPath, { recursive: true });
        console.log(`Created questEngine folder: ${questEnginePath}`);
        // Create empty JSON files
        const jsonFiles = [
            'quests.json',
            'locations.json',
            'npcs.json',
            'portals.json',
            'dialogues.json',
            'entityLinks.json',
            'items.json',
        ];
        for (const file of jsonFiles) {
            const filePath = path.join(dataPath, file);
            let emptyData = '[]'; // Default empty array for most files
            if (file === 'entityLinks.json') {
                emptyData = '{}'; // Object for entity links
            }
            await fs.writeFile(filePath, emptyData, 'utf8');
            console.log(`Created ${file} in ${dataPath}`);
        }
        console.log('All data files created successfully');
    }
    catch (error) {
        console.error('Failed to create questEngine folder and files:', error);
    }
    return newProject;
});
electron_1.ipcMain.handle('update-project-last-opened', async (_event, projectId) => {
    const projects = await loadProjects();
    const projectIndex = projects.findIndex((p) => p.id === projectId);
    if (projectIndex !== -1) {
        projects[projectIndex].lastOpenedAt = new Date().toISOString();
        await saveProjects(projects);
    }
});
electron_1.ipcMain.handle('delete-project', async (_event, projectId) => {
    const projects = await loadProjects();
    const filteredProjects = projects.filter((p) => p.id !== projectId);
    await saveProjects(filteredProjects);
});
// QuestEditor IPC handlers
electron_1.ipcMain.handle('set-quest-editor-project', async (_event, projectPath) => {
    if (questEditor) {
        await questEditor.setProjectPath(projectPath);
    }
});
electron_1.ipcMain.handle('get-quest-data', async (_event, dataType) => {
    if (!questEditor)
        return null;
    // Access persistence directly from the questEditor instance
    const persistence = questEditor.persistence;
    if (!persistence)
        return null;
    switch (dataType) {
        case 'quests':
            return await persistence.loadQuests();
        case 'npcs':
            return await persistence.loadNPCs();
        case 'items':
            return await persistence.loadItems();
        case 'locations':
            const items = await persistence.loadItems();
            const npcs = await persistence.loadNPCs();
            const portals = await persistence.loadPortals();
            return await persistence.loadLocations(items, npcs, portals);
        case 'portals':
            return await persistence.loadPortals();
        case 'dialogues':
            return await persistence.loadDialogues();
        case 'entityLinks':
            return await persistence.loadEntityLinks();
        case 'game':
            return await persistence.loadGame();
        default:
            return null;
    }
});
electron_1.ipcMain.handle('save-quest-data', async (_event, dataType, data) => {
    if (!questEditor)
        return;
    // Access persistence directly from the questEditor instance
    const persistence = questEditor.persistence;
    if (!persistence)
        return;
    switch (dataType) {
        case 'quests':
            return await persistence.saveQuests(data);
        case 'npcs':
            return await persistence.saveNPCs(data);
        case 'items':
            return await persistence.saveItems(data);
        case 'locations':
            return await persistence.saveLocations(data);
        case 'portals':
            return await persistence.savePortals(data);
        case 'dialogues':
            return await persistence.saveDialogues(data);
        case 'entityLinks':
            return await persistence.saveEntityLinks(data);
        case 'game':
            return await persistence.saveGame(data);
    }
});
