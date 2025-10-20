import React, { useState, useEffect, useRef } from 'react'
import { startGame, sendInteraction, resetGame } from '../shared/utils'
import { Grid } from './Grid'
import { DialoguePanel } from './DialoguePanel'

interface PlayerProps {}

export const Player: React.FC<PlayerProps> = () => {
  const [gameStarted, setGameStarted] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<any>(null)
  const [currentEntities, setCurrentEntities] = useState<any[]>([])
  const [inventory, setInventory] = useState<string[]>([])
  const [activeDialogue, setActiveDialogue] = useState<{
    sequence: any
    currentDialogIndex: number
    npcId?: string
  } | null>(null)
  const [questLog, setQuestLog] = useState<string[]>([])
  const [backgroundMusic, setBackgroundMusic] = useState<string>('')
  const [backgroundImage, setBackgroundImage] = useState<string>('')
  const audioRef = useRef<HTMLAudioElement>(null)

  // Execute commands locally for this component
  const executeCommandsLocally = (commands: any[]) => {
    commands.forEach((command) => {
      switch (command.type) {
        case 'playSound':
          const audio = new Audio(command.params.url)
          audio.play().catch(console.error)
          break
        case 'spawnEntity':
          // Update grid to show entity
          console.log(`Spawn entity: ${command.params.id}`)
          // For now, we'll need a full location update to refresh entities
          // In a more sophisticated system, we'd merge the entity into current entities
          break
        case 'clearEntity':
        case 'clearItem':
          // Update grid to hide entity - entity will be marked as cleared in the backend
          // and filtered out by the Grid component, but we keep it in the array for stable positions
          console.log(`Clear entity: ${command.params.id}`)
          setCurrentEntities((prev) =>
            prev.map((entity: any) => (entity.id === command.params.id ? { ...entity, cleared: true } : entity))
          )
          break
        case 'updateLocation':
          setCurrentLocation({
            id: command.params.locationId,
            name: command.params.locationName
          })
          setCurrentEntities(command.params.entities || [])
          setBackgroundImage(command.params.backgroundImage)
          setBackgroundMusic(command.params.backgroundMusic)
          addToQuestLog(`Entered location: ${command.params.locationName}`)
          break
        case 'changeBackground':
          setBackgroundImage(command.params.image)
          setBackgroundMusic(command.params.music)
          break
        case 'updateInventory':
          setInventory(command.params.inventory)
          break
        case 'updateEntity':
          // Update entity properties (e.g., interactivity, state)
          setCurrentEntities((prev) =>
            prev.map((entity: any) => (entity.id === command.params.id ? { ...entity, ...command.params } : entity))
          )
          break
        case 'updateVesselTexture':
          // Update vessel appearance to show it's activated
          setCurrentEntities((prev) =>
            prev.map((entity: any) =>
              entity.id === command.params.vesselId
                ? {
                    ...entity,
                    activated: command.params.activated,
                    image: command.params.activated ? 'activated_vessel_image.png' : entity.image
                  }
                : entity
            )
          )
          break
        case 'questActivated':
          addToQuestLog(`Quest started: ${command.params.questTitle || command.params.questId}`)
          break
        case 'questCompleted':
          addToQuestLog(`Quest completed: ${command.params.questTitle || command.params.questId}`)
          break
        case 'showDialogue':
          // Fetch the dialogue sequence and show it
          handleShowDialogue(command.params.dialogueSequenceId, command.params.npcId)
          break
        case 'log':
          addToQuestLog(command.params.message)
          break
        default:
          console.warn(`Unknown command type: ${command.type}`)
      }
    })
  }

  useEffect(() => {
    startGameSession()
  }, [])

  useEffect(() => {
    if (backgroundMusic && audioRef.current) {
      audioRef.current.src = backgroundMusic
      audioRef.current.play().catch(console.error)
    }
  }, [backgroundMusic])

  const startGameSession = async () => {
    const response = await startGame()
    if (response.success && response.commands) {
      executeCommandsLocally(response.commands)
      setGameStarted(true)
      addToQuestLog('Game started!')
    } else {
      addToQuestLog(`Failed to start game: ${response.error}`)
    }
  }

  const handleEntityClick = async (entityType: string, entityId: string) => {
    console.log(`Sending interaction: click${entityType} for entity ${entityId}`)
    const response = await sendInteraction(`click${entityType}`, { id: entityId })
    console.log(`Received response:`, response)
    if (response.success && response.commands) {
      console.log(`Executing commands:`, response.commands)
      executeCommandsLocally(response.commands)
    } else {
      console.log(`No commands received or error:`, response.error)
    }
  }

  const handleShowDialogue = async (dialogueSequenceId: string, npcId?: string) => {
    // For now, we'll need to get the dialogue sequence from the game data
    // In a more sophisticated system, this would come from the backend
    const response = await fetch('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dialogueSequenceId })
    })

    if (response.ok) {
      const apiResponse = await response.json()
      if (apiResponse.success && apiResponse.data) {
        setActiveDialogue({
          sequence: apiResponse.data,
          currentDialogIndex: 0,
          npcId: npcId
        })
      }
    }
  }

  const addToQuestLog = (message: string) => {
    setQuestLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleResetGame = async () => {
    const response = await resetGame()
    if (response.success && response.commands) {
      // Clear all current state
      setCurrentLocation(null)
      setCurrentEntities([])
      setInventory([])
      setActiveDialogue(null)
      setQuestLog([])
      setBackgroundMusic('')
      setBackgroundImage('')
      // Execute reset commands
      executeCommandsLocally(response.commands)
      addToQuestLog('Game reset!')
    } else {
      addToQuestLog(`Failed to reset game: ${response.error}`)
    }
  }

  if (!gameStarted) {
    return (
      <div className="player-loading">
        <h2>Starting Game...</h2>
        <div className="quest-log">
          {questLog.map((entry, index) => (
            <div key={index} className="log-entry">
              {entry}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="player">
      <audio ref={audioRef} loop />

      {/* Background */}
      <div
        className="game-background"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none'
        }}
      />

      {/* Current Location Display - Above Inventory */}
      {currentLocation && (
        <div className="location-display-above-inventory">
          <h3>{currentLocation.name}</h3>
          {backgroundImage && <img src={backgroundImage} alt={currentLocation.name} className="location-image" />}
        </div>
      )}

      {/* Main game area */}
      <div className="game-area">
        <Grid onEntityClick={handleEntityClick} backgroundImage={backgroundImage} entities={currentEntities} />

        {/* Inventory */}
        <div className="inventory">
          <h3>Inventory</h3>
          {inventory.length === 0 ? (
            <p>Empty</p>
          ) : (
            inventory.map((entityId) => (
              <div key={entityId} className="inventory-item">
                {entityId}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reset Button */}
      <button className="reset-button" onClick={handleResetGame}>
        Reset Game
      </button>

      {/* Dialogue Panel */}
      {activeDialogue && (
        <DialoguePanel
          dialogueSequence={activeDialogue.sequence}
          currentDialogIndex={activeDialogue.currentDialogIndex}
          onClose={() => setActiveDialogue(null)}
          onDialogChange={(dialogId) => {
            // Find the new dialog index
            const newIndex = activeDialogue.sequence.dialogs.findIndex((d: any) => d.id === dialogId)
            if (newIndex !== -1) {
              setActiveDialogue({
                ...activeDialogue,
                currentDialogIndex: newIndex
              })
            } else {
              // Dialog not found, close the dialogue
              setActiveDialogue(null)
            }
          }}
        />
      )}

      {/* Quest Log */}
      <div className="quest-log-panel">
        <h3>Quest Log</h3>
        <div className="quest-log">
          {questLog.map((entry, index) => (
            <div key={index} className="log-entry">
              {entry}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
