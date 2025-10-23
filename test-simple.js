const path = require('path')
const fs = require('fs')

// Simulate the thumbnail construction logic
const projectPath = '/Users/artur/Documents/Cansy Land CreatorHub/test-1'

console.log('Simulating getThumbnails logic...')
console.log('projectPath:', projectPath)

const thumbnailLocations = [
	path.join(projectPath, 'thumbnails'),
	path.join(projectPath, 'scene', 'thumbnails'),
]

console.log('thumbnailLocations:', thumbnailLocations)

for (const thumbnailsPath of thumbnailLocations) {
	console.log('Checking thumbnails path:', thumbnailsPath)
	try {
		const items = fs.readdirSync(thumbnailsPath, { withFileTypes: true })
		console.log('Found', items.length, 'items in', thumbnailsPath)

		for (const item of items) {
			if (item.isFile()) {
				const ext = path.extname(item.name).toLowerCase()
				if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
					const fullUrl = path.join(thumbnailsPath, item.name)
					console.log('Constructed URL:', fullUrl)
					console.log('  thumbnailsPath:', thumbnailsPath)
					console.log('  item.name:', item.name)
					console.log('  path.join result:', fullUrl)
				}
			}
		}
	} catch (error) {
		console.log('Directory does not exist:', thumbnailsPath)
	}
}
