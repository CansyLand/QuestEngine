import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
	selectFolder: (): Promise<string | undefined> =>
		ipcRenderer.invoke('select-folder'),
	readFile: (folderPath: string, fileName: string): Promise<string> =>
		ipcRenderer.invoke('read-file', { folderPath, fileName }),
	writeFile: (
		folderPath: string,
		fileName: string,
		content: string
	): Promise<void> =>
		ipcRenderer.invoke('write-file', { folderPath, fileName, content }),
})
