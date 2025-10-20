// Shared utilities for frontend components

export interface ApiResponse {
  success: boolean
  error?: string
  commands?: any[]
  data?: any
}

// API fetch wrapper
export async function apiRequest(endpoint: string, options?: RequestInit): Promise<ApiResponse> {
  try {
    // Add cache busting for GET requests
    const url = options?.method === 'GET' || !options?.method ? `/api${endpoint}?t=${Date.now()}` : `/api${endpoint}`

    console.log('Making API request:', url, options)
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    })

    console.log('API response status:', response.status)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('API response data:', data)
    return data
  } catch (error) {
    console.error('API request failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Load game data
export async function loadGameData() {
  return apiRequest('/load')
}

// Save game data
export async function saveGameData(data: any) {
  return apiRequest('/save', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// Generate unique ID from name using backend
export async function generateIdFromApi(
  name: string,
  entityType: 'item' | 'npc' | 'location' | 'portal' | 'quest' | 'dialogue' | 'quest-step',
  currentEntityId?: string,
  prefix?: string
) {
  return apiRequest('/generate-id', {
    method: 'POST',
    body: JSON.stringify({ name, entityType, currentEntityId, prefix })
  })
}

// Start game session
export async function startGame() {
  return apiRequest('/start', {
    method: 'POST'
  })
}

// Reset game session
export async function resetGame() {
  return apiRequest('/reset', {
    method: 'POST'
  })
}

// Send interaction
export async function sendInteraction(type: string, params: any) {
  return apiRequest('/interact', {
    method: 'POST',
    body: JSON.stringify({ type, params })
  })
}

// Generate unique ID from name/title
export function generateIdFromName(name: string, entityType: 'item' | 'npc' | 'location' | 'portal' | 'quest'): string {
  if (!name || name.trim() === '') {
    return generateId()
  }

  // Convert to lowercase and replace spaces/special chars with underscores
  let id = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s-]+/g, '_') // Replace spaces and hyphens with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores

  // Ensure minimum length
  if (id.length === 0) {
    id = 'unnamed'
  }

  return id
}

// Check if ID exists and generate unique version
export function generateUniqueId(
  name: string,
  entityType: 'item' | 'npc' | 'location' | 'portal' | 'quest',
  existingIds: string[]
): string {
  let baseId = generateIdFromName(name, entityType)
  let finalId = baseId
  let counter = 1

  // Keep incrementing counter until we find a unique ID
  while (existingIds.includes(finalId)) {
    finalId = `${baseId}_${counter}`
    counter++
  }

  return finalId
}

// Legacy random ID generator for notifications and other non-entity IDs
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Execute commands on frontend
export function executeCommands(commands: any[]): void {
  commands.forEach((command) => {
    switch (command.type) {
      case 'playSound':
        playSound(command.params.url)
        break
      case 'spawnEntity':
        spawnEntity(command.params.id)
        break
      case 'clearEntity':
        clearEntity(command.params.id)
        break
      case 'updateLocation':
        updateLocation(command.params)
        break
      case 'changeBackground':
        changeBackground(command.params.image, command.params.music)
        break
      case 'updateInventory':
        updateInventory(command.params.inventory)
        break
      case 'questActivated':
        onQuestActivated(command.params.questId)
        break
      case 'questCompleted':
        onQuestCompleted(command.params.questId)
        break
      default:
        console.warn(`Unknown command type: ${command.type}`)
    }
  })
}

// Command execution functions (to be implemented by specific components)
function playSound(url: string): void {
  const audio = new Audio(url)
  audio.play().catch(console.error)
}

function spawnEntity(id: string): void {
  // Implementation depends on frontend component
  console.log(`Spawn entity: ${id}`)
}

function clearEntity(id: string): void {
  // Implementation depends on frontend component
  console.log(`Clear entity: ${id}`)
}

function changeBackground(image: string, music: string): void {
  // Implementation depends on frontend component
  console.log(`Change background: ${image}, music: ${music}`)
}

function updateInventory(inventory: Record<string, number>): void {
  // Implementation depends on frontend component
  console.log('Update inventory:', inventory)
}

function onQuestActivated(questId: string): void {
  console.log(`Quest activated: ${questId}`)
}

function onQuestCompleted(questId: string): void {
  console.log(`Quest completed: ${questId}`)
}

function updateLocation(locationData: any): void {
  // Implementation depends on frontend component
  console.log('Update location:', locationData)
}
