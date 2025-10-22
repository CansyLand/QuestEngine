/**
 * This class is responsible for monitoring the DCL scene that is created
 * in the Decentraland Creator Hub.
 * It will monitor the changes in the scene and update the entityLinks.json
 * file with the new data.
 *
 * This file was migrated from questEditor/integration/monitoring/scene-monitor.ts
 */

import * as path from 'path'
import * as fs from 'fs/promises'
import {
	computeHash,
	extractEntityData,
	updateEntityLinks,
} from '../utils/data-utils'

export class SceneMonitor {
	private sceneMonitoringInterval: NodeJS.Timeout | null = null

	/**
	 * Setup DCL scene monitoring for the project
	 */
	setupSceneMonitoring(projectPath: string, persistence: any): void {
		// Clear existing monitoring
		if (this.sceneMonitoringInterval) {
			clearInterval(this.sceneMonitoringInterval)
		}

		const compositePath = path.join(projectPath, 'assets/scene/main.composite')
		const linksPath = path.join(
			projectPath,
			'src/questEngine/data/entityLinks.json'
		)

		let lastHash: string | null = null

		let heartbeatCount = 0

		const monitorChanges = async () => {
			try {
				// Check if composite file exists
				await fs.access(compositePath)

				const compositeData = JSON.parse(
					await fs.readFile(compositePath, 'utf8')
				)
				const currentHash = computeHash(compositeData)

				if (currentHash !== lastHash) {
					lastHash = currentHash
					const newLinks = extractEntityData(compositeData)
					await updateEntityLinks(newLinks, linksPath, persistence)
					console.log('DCL scene entities updated in project:', projectPath)
				}

				// Show heartbeat every 10 checks (30 seconds)
				heartbeatCount++
				if (heartbeatCount % 10 === 0) {
					console.log('DCL monitoring active for project:', projectPath)
				}
			} catch (error) {
				// File might not exist or be invalid JSON - silently ignore
				if (heartbeatCount % 10 === 0) {
					console.log(
						'DCL monitoring waiting for main.composite file in project:',
						projectPath
					)
				}
				heartbeatCount++
			}
		}

		// Run initial check
		monitorChanges()

		// Monitor every 3 seconds
		this.sceneMonitoringInterval = setInterval(monitorChanges, 3000)
		console.log('DCL scene monitoring started for project:', projectPath)
		console.log('Monitoring file:', compositePath)
		console.log('Will update:', linksPath)
	}

	/**
	 * Stop scene monitoring
	 */
	stopSceneMonitoring(): void {
		if (this.sceneMonitoringInterval) {
			clearInterval(this.sceneMonitoringInterval)
			this.sceneMonitoringInterval = null
		}
	}
}
