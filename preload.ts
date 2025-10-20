import { contextBridge, ipcRenderer } from 'electron'

interface Project {
	id: string
	name: string
	path: string
	createdAt: string
	lastOpenedAt?: string
}

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
	getProjects: (): Promise<Project[]> => ipcRenderer.invoke('get-projects'),
	createProject: (name: string, path: string): Promise<Project> =>
		ipcRenderer.invoke('create-project', { name, path }),
	updateProjectLastOpened: (projectId: string): Promise<void> =>
		ipcRenderer.invoke('update-project-last-opened', projectId),
	deleteProject: (projectId: string): Promise<void> =>
		ipcRenderer.invoke('delete-project', projectId),
	// QuestEditor API methods
	setQuestEditorProject: (projectPath: string): Promise<void> =>
		ipcRenderer.invoke('set-quest-editor-project', projectPath),
	getQuestData: (dataType: string): Promise<any> =>
		ipcRenderer.invoke('get-quest-data', dataType),
	saveQuestData: (dataType: string, data: any): Promise<void> =>
		ipcRenderer.invoke('save-quest-data', dataType, data),
})
