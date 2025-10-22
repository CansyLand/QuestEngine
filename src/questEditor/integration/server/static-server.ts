import express from 'express'
import * as path from 'path'

export function setupStaticRoutes(
	app: express.Application,
	projectPath: string | null
): void {
	// Add static serving for project assets if project path is set
	if (projectPath) {
		const assetsPath = path.join(projectPath, 'assets')
		console.log('Setting up static serving for assets at:', assetsPath)
		console.log(
			'Assets directory exists:',
			require('fs').existsSync(assetsPath)
		)
		app.use('/assets', express.static(assetsPath))
	}
}
