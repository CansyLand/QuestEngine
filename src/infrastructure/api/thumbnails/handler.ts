import express from 'express'
import * as path from 'path'
import * as fs from 'fs/promises'

// This file was migrated from questEditor/integration/api/thumbnails-handler.ts

export function setupThumbnailRoutes(
	app: express.Application,
	projectPath: string | null
): void {
	// Test endpoint to check if thumbnails routes are working
	app.get('/api/thumbnails-test', (req, res) => {
		res.json({
			message: 'Thumbnails routes are set up',
			projectPath: projectPath,
			projectBasename: projectPath
				? require('path').basename(projectPath)
				: null,
		})
	})
	// Serve thumbnail images from the current DCL project
	app.get('/api/thumbnails/:project/:filename', async (req, res) => {
		try {
			const { project, filename } = req.params

			if (!projectPath) {
				return res.status(404).json({ error: 'No project loaded' })
			}

			const projectBasename = path.basename(projectPath)

			// Verify the project matches the current project
			if (project !== projectBasename) {
				return res.status(403).json({ error: 'Access denied' })
			}

			// Try three locations: root thumbnails folder, scene/thumbnails folder, and assets/images folder
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
					// If not found, check assets/images (supports subfolders)
					filePath = path.join(projectPath, 'assets', 'images', filename)
					try {
						await fs.access(filePath)
						foundFilePath = filePath
					} catch {
						// File not found in any location
					}
				}
			}

			if (!foundFilePath) {
				return res.status(404).json({ error: 'File not found' })
			}

			filePath = foundFilePath

			// Security check: ensure the file is within allowed directories
			const rootThumbnailsDir = path.join(projectPath, 'thumbnails')
			const sceneThumbnailsDir = path.join(projectPath, 'scene', 'thumbnails')
			const assetsImagesDir = path.join(projectPath, 'assets', 'images')

			if (
				!filePath.startsWith(rootThumbnailsDir) &&
				!filePath.startsWith(sceneThumbnailsDir) &&
				!filePath.startsWith(assetsImagesDir)
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
			fileStream.on('error', (error: any) => {
				console.error('File stream error:', error)
				res.status(500).json({ error: 'File streaming error' })
			})
			fileStream.pipe(res)
		} catch (error) {
			console.error('Error serving thumbnail:', error)
			res.status(500).json({ error: 'Internal server error' })
		}
	})
}
