"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
const electron_updater_1 = require("electron-updater");
const fs = require("fs/promises"); // For file I/O
let mainWindow = null;
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
electron_1.app.whenReady().then(() => {
    createWindow();
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
