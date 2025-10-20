const fs = require('fs')
const path = require('path')

/**
 * Script to generate embedded data constants from JSON files
 *
 * This script converts JSON data files in questEditor/data/ to TypeScript constants
 * that are embedded in the quest engine. This ensures the game data is available at runtime
 * without needing to load external files.
 *
 * Usage:
 *   npm run generate-data
 *   or
 *   npx tsx questEditor/backend/generate-data.ts
 *
 * Input: questEditor/data/*.json
 * Output: src/questEngine/data.ts
 */

const dataDir = path.join(__dirname, '../data')
const outputFile = path.join(__dirname, '../../src/questEngine/data.ts')

// File mappings: JSON filename -> TypeScript constant name
const fileMappings = {
  'locations.json': 'EMBEDDED_LOCATIONS',
  'quests.json': 'EMBEDDED_QUESTS',
  'npcs.json': 'EMBEDDED_NPCS',
  'items.json': 'EMBEDDED_ITEMS',
  'portals.json': 'EMBEDDED_PORTALS',
  'dialogues.json': 'EMBEDDED_DIALOGUES',
  'entityLinks.json': 'EMBEDDED_ENTITY_LINKS'
}

/**
 * Convert a JavaScript object to a formatted string representation
 * Handles nested objects, arrays, strings, numbers, booleans
 */
function stringifyObject(obj, indent = 0) {
  const indentStr = '  '.repeat(indent)

  if (obj === null) return 'null'
  if (obj === undefined) return 'undefined'
  if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj)

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'

    const items = obj.map((item) => stringifyObject(item, indent + 1))
    return `[\n${indentStr}  ${items.join(',\n' + indentStr + '  ')}\n${indentStr}]`
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj)
    if (keys.length === 0) return '{}'

    const properties = keys.map((key) => {
      const value = stringifyObject(obj[key], indent + 1)
      return `${indentStr}  ${key}: ${value}`
    })

    return `{\n${properties.join(',\n')}\n${indentStr}}`
  }

  return String(obj)
}

/**
 * Generate the TypeScript file content
 */
function generateDataFile() {
  let output = `// src/questEngine/data.ts - Embedded game data for Decentraland scene
// This file contains all the game configuration data embedded as constants
// Auto-generated from questEditor/data/*.json files - DO NOT EDIT MANUALLY
// Run: npm run generate-data

`

  // Process each JSON file
  for (const [jsonFile, constantName] of Object.entries(fileMappings)) {
    const jsonPath = path.join(dataDir, jsonFile)

    try {
      // Read and parse JSON file
      const jsonContent = fs.readFileSync(jsonPath, 'utf8')
      const data = JSON.parse(jsonContent)

      // Generate the constant export
      output += `export const ${constantName} = ${stringifyObject(data)}\n\n`

      console.log(`✅ Processed ${jsonFile} -> ${constantName}`)
    } catch (error) {
      console.error(`❌ Error processing ${jsonFile}:`, error.message || String(error))
      process.exit(1)
    }
  }

  // Write the output file
  fs.writeFileSync(outputFile, output, 'utf8')
  console.log(`📄 Generated data.ts at: ${outputFile}`)
  console.log('🎉 Data generation complete!')
}

// Run the generation
generateDataFile()
