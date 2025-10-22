import express from 'express'
import * as path from 'path'
import * as fs from 'fs/promises'

export function setupThumbnailRoutes(
	app: express.Application,
	projectPath: string | null
): void {
	// Serve thumbnail images from the current DCL project
	app.get('/api/thumbnails/:project/:filename', async (req, res) => {
		try {
			const { project, filename } = req.params

			if (!projectPath) {
				return res.status(404).json({ error: 'No project loaded' })
			}

			// Verify the project matches the current project
			if (project !== path.basename(projectPath)) {
				return res.status(403).json({ error: 'Access denied' })
			}

			// Try both locations: root thumbnails folder and scene/thumbnails folder
			let filePath = path.join(projectPath, 'thumbnails', filename)
			let foundFilePath = null

			// First check root thumbnails folder
			try {
				await fs.access(filePath)
				foundFilePath = filePath
			} catch {
				// If not found at root, check scene/thumbnails
				filePath = path.join(projectPath, 'scene', 'thumbnails', filename)
				try {
					await fs.access(filePath)
					foundFilePath = filePath
				} catch {
					// File not found in either location
				}
			}

			if (!foundFilePath) {
				return res.status(404).json({ error: 'File not found' })
			}

			filePath = foundFilePath

			// Security check: ensure the file is within a thumbnails directory
			const rootThumbnailsDir = path.join(projectPath, 'thumbnails')
			const sceneThumbnailsDir = path.join(projectPath, 'scene', 'thumbnails')
			if (
				!filePath.startsWith(rootThumbnailsDir) &&
				!filePath.startsWith(sceneThumbnailsDir)
			) {
				return res.status(403).json({ error: 'Access denied' })
			}

			// File exists (already verified above)

			// Set appropriate content type based on file extension
			const ext = path.extname(filename).toLowerCase()
			const contentTypes: { [key: string]: string } = {
				'.png': 'image/png',
				'.jpg': 'image/jpeg',
				'.jpeg': 'image/jpeg',
				'.gif': 'image/gif',
				'.webp': 'image/webp',
			}

			const contentType = contentTypes[ext] || 'application/octet-stream'
			res.setHeader('Content-Type', contentType)
			res.setHeader('Access-Control-Allow-Origin', '*')
			res.setHeader('Access-Control-Allow-Methods', 'GET')
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
			res.setHeader('Cache-Control', 'no-cache')

			// Stream the file
			const fileStream = require('fs').createReadStream(filePath)
			fileStream.pipe(res)
		} catch (error) {
			console.error('Error serving thumbnail:', error)
			res.status(500).json({ error: 'Internal server error' })
		}
	})
}
