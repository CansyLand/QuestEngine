import React, { useState } from 'react'

declare global {
	interface Window {
		electronAPI: {
			selectFolder: () => Promise<string | undefined>
			readFile: (folderPath: string, fileName: string) => Promise<string>
			writeFile: (
				folderPath: string,
				fileName: string,
				content: string
			) => Promise<void>
		}
	}
}

function App() {
	const [folderPath, setFolderPath] = useState<string>('')
	const [fileContent, setFileContent] = useState<string>('')
	const [status, setStatus] = useState<string>('')

	const handleSelectFolder = async () => {
		const path = await window.electronAPI.selectFolder()
		if (path) {
			setFolderPath(path)
			setStatus(`Selected folder: ${path}`)
		}
	}

	const handleWriteFile = async () => {
		if (!folderPath) return
		try {
			await window.electronAPI.writeFile(
				folderPath,
				'test.txt',
				'Hello from Electron!'
			)
			setStatus('File written successfully!')
		} catch (error) {
			setStatus(`Error: ${error}`)
		}
	}

	const handleReadFile = async () => {
		if (!folderPath) return
		try {
			const content = await window.electronAPI.readFile(folderPath, 'test.txt')
			setFileContent(content)
			setStatus('File read successfully!')
		} catch (error) {
			setStatus(`Error: ${error}`)
		}
	}

	return (
		<div style={{ padding: 20 }}>
			<h1>My Electron App</h1>
			<button onClick={handleSelectFolder}>Select Folder</button>
			<button onClick={handleWriteFile} disabled={!folderPath}>
				Write Test File
			</button>
			<button onClick={handleReadFile} disabled={!folderPath}>
				Read Test File
			</button>
			<p>{status}</p>
			{fileContent && <pre>{fileContent}</pre>}
		</div>
	)
}

export default App
