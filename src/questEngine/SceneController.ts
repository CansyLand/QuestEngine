// src/questEngine/SceneController.ts - Executes QuestEngine commands in Decentraland scene

import { QuestCommand, QuestCommandType } from './types'
import { EntityManager } from './EntityManager'
import { IAudioSystem } from './AudioSystem'
import { npcDialogComponent } from './npcToolkit/dialog'
import { ColliderLayer } from '@dcl/sdk/ecs'

export class SceneController {
  private entityManager: EntityManager
  private audioSystem: IAudioSystem
  private debugMode: boolean = false

  // UI/notification systems (to be implemented)
  private notificationSystem?: any
  private dialogueSystem?: any

  constructor(entityManager: EntityManager, audioSystem: IAudioSystem, debugMode: boolean = false) {
    this.entityManager = entityManager
    this.audioSystem = audioSystem
    this.debugMode = debugMode
  }

  // Main command execution method
  executeCommands(commands: QuestCommand[]): void {
    console.log(`🎯 SceneController: executeCommands called with ${commands.length} commands`)
    if (this.debugMode) {
      console.log(`Executing ${commands.length} commands:`, commands)
    }

    commands.forEach((command, index) => {
      console.log(`🎯 SceneController: Executing command ${index + 1}/${commands.length}: ${command.type}`)
      try {
        this.executeCommand(command)
        console.log(`✅ SceneController: Successfully executed command ${command.type}`)
      } catch (error) {
        console.error(`❌ SceneController: Failed to execute command ${command.type}:`, error, command)
      }
    })
    console.log(`🎯 SceneController: executeCommands finished`)
  }

  private executeCommand(command: QuestCommand): void {
    switch (command.type) {
      // Entity state management
      case QuestCommandType.SetEntityVisibility:
        this.setEntityVisibility(command.params.entityId, command.params.visible)
        break

      case QuestCommandType.SetEntityCollider:
        this.setEntityCollider(command.params.entityId, command.params.colliderLayer)
        break

      case QuestCommandType.AddGltfComponent:
        this.addGltfComponent(command.params.entityId, command.params.gltfSrc)
        break

      case QuestCommandType.RemoveGltfComponent:
        this.removeGltfComponent(command.params.entityId)
        break

      // Audio commands
      case QuestCommandType.PlaySound:
        this.playSound(command.params.url)
        break

      case QuestCommandType.PlayBackgroundMusic:
        this.playBackgroundMusic(command.params.url)
        break

      // Dialogue & UI
      case QuestCommandType.ShowDialogue:
        this.showDialogue(command.params.dialogueSequenceId, command.params.npcId)
        break

      case QuestCommandType.ShowNotification:
        this.showNotification(command.params.message, command.params.type)
        break

      // Quest management
      case QuestCommandType.QuestActivated:
        this.onQuestActivated(command.params.questId, command.params.questTitle)
        break

      case QuestCommandType.QuestCompleted:
        this.onQuestCompleted(command.params.questId, command.params.questTitle)
        break

      // Location management
      case QuestCommandType.ChangeLocation:
        this.changeLocation(command.params.locationId)
        break

      // Inventory (for UI feedback)
      case QuestCommandType.UpdateInventory:
        this.updateInventory(command.params.inventory)
        break

      // Debug/Logging
      case QuestCommandType.Log:
        this.logMessage(command.params.message)
        break

      default:
        console.log(`Unknown command type: ${command.type}`)
    }
  }

  // Entity management methods
  private setEntityVisibility(entityId: string, visible: boolean): void {
    this.entityManager.setEntityVisibility(entityId, visible)
  }

  private setEntityCollider(entityId: string, colliderLayer: number): void {
    this.entityManager.setEntityCollider(entityId, colliderLayer)
  }

  private addGltfComponent(entityId: string, gltfSrc?: string): void {
    this.entityManager.addGltfComponent(entityId, gltfSrc)
  }

  private removeGltfComponent(entityId: string): void {
    this.entityManager.removeGltfComponent(entityId)
  }

  // Audio methods
  private playSound(url: string): void {
    // Use existing AudioSystem for sound effects
    this.audioSystem.playSoundEffect(url)
  }

  private playBackgroundMusic(url: string): void {
    this.audioSystem.playBackgroundMusic(url)
  }

  // Dialogue methods
  private showDialogue(dialogueSequenceId: string, npcId?: string): void {
    if (this.dialogueSystem) {
      this.dialogueSystem.showDialogue(dialogueSequenceId, npcId)
    } else {
      // Fallback to existing NPC dialogue system
      console.log(`Showing dialogue: ${dialogueSequenceId} for NPC: ${npcId || 'unknown'}`)
      // TODO: Integrate with existing npcDialogComponent
    }
  }

  // Notification methods
  private showNotification(message: string, type: string = 'info'): void {
    if (this.notificationSystem) {
      this.notificationSystem.show(message, type)
    } else {
      // Fallback to console logging
      console.log(`[${type.toUpperCase()}] ${message}`)
    }
  }

  // Quest management methods
  private onQuestActivated(questId: string, questTitle: string): void {
    this.showNotification(`Quest started: ${questTitle}`, 'quest')
  }

  private onQuestCompleted(questId: string, questTitle: string): void {
    this.showNotification(`Quest completed: ${questTitle}`, 'success')
  }

  // Location management
  private changeLocation(locationId: string): void {
    if (this.debugMode) {
      console.log(`Changing to location: ${locationId}`)
    }

    // This would trigger location transitions
    // For now, we'll rely on the QuestEngine to send individual entity commands
    // In the future, you might want to batch location changes here
  }

  // Inventory management (for UI feedback)
  private updateInventory(inventory: string[]): void {
    // This is for UI feedback - the actual inventory logic is handled by QuestEngine
    if (this.debugMode) {
      console.log('Inventory updated:', inventory)
    }

    // TODO: Update any inventory UI components if they exist
  }

  // Utility methods
  private logMessage(message: string): void {
    console.log(`[QuestEngine] ${message}`)
  }

  // Set up external systems
  setNotificationSystem(notificationSystem: any): void {
    this.notificationSystem = notificationSystem
  }

  setDialogueSystem(dialogueSystem: any): void {
    this.dialogueSystem = dialogueSystem
  }

  // Get entity manager for direct access if needed
  getEntityManager(): EntityManager {
    return this.entityManager
  }
}
