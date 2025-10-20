// Test the full flow: start backend, set project, test APIs
const { QuestEditorIntegration } = require('./electron/electron-integration.js')

async function testFullFlow() {
	console.log('Testing full QuestEditor flow...')

	const questEditor = new QuestEditorIntegration()

	try {
		// Start the server
		console.log('Starting server...')
		await questEditor.start(3002)
		console.log('Server started on port 3002')

		// Set project path (simulates opening a project)
		console.log('Setting project path...')
		const testProjectPath =
			'/Users/artur/Documents/Cansy Land CreatorHub/test-1'
		await questEditor.setProjectPath(testProjectPath)
		console.log('Project path set')

		// Wait a bit for setup to complete
		await new Promise((resolve) => setTimeout(resolve, 1000))

		// Test main load endpoint
		console.log('Testing /api/load...')
		const loadResponse = await fetch('http://localhost:3002/api/load')
		const loadData = await loadResponse.json()
		console.log('Load response success:', loadData.success)

		// Test entityLinks endpoint
		console.log('Testing /api/entityLinks...')
		const entityLinksResponse = await fetch(
			'http://localhost:3002/api/entityLinks'
		)
		const entityLinksData = await entityLinksResponse.json()
		console.log('EntityLinks response success:', entityLinksData.success)

		if (entityLinksData.success) {
			console.log('✅ EntityLinks API test PASSED')
			console.log(
				'EntityLinks count:',
				Object.keys(entityLinksData.data || {}).length
			)
		} else {
			console.log('❌ EntityLinks API test FAILED')
		}
	} catch (error) {
		console.error('❌ Test FAILED:', error)
	} finally {
		questEditor.stop()
		console.log('Server stopped')
		process.exit(0)
	}
}

testFullFlow()
