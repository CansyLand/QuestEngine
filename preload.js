"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => electron_1.ipcRenderer.invoke('select-folder'),
    readFile: (folderPath, fileName) => electron_1.ipcRenderer.invoke('read-file', { folderPath, fileName }),
    writeFile: (folderPath, fileName, content) => electron_1.ipcRenderer.invoke('write-file', { folderPath, fileName, content }),
    getProjects: () => electron_1.ipcRenderer.invoke('get-projects'),
    createProject: (name, path) => electron_1.ipcRenderer.invoke('create-project', { name, path }),
    updateProjectLastOpened: (projectId) => electron_1.ipcRenderer.invoke('update-project-last-opened', projectId),
});
