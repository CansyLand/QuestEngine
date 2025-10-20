import React, { useState } from 'react'
import { Quest, QuestStep, NPC } from '../../../../models'

interface QuestStepSelectorProps {
  availableQuests: Quest[]
  availableQuestSteps: QuestStep[]
  availableDialogues: any[]
  availableNpcs?: NPC[]
  selectedQuestStepIds: string[]
  onSelectQuestStep: (questStepId: string) => void
  onDeselectQuestStep: (questStepId: string) => void
  onDetachQuestStep?: (questStepId: string, dialogueId: string) => void
  onClose: () => void
  dialogueNpcId?: string
  dialogueId?: string
}

export const QuestStepSelector: React.FC<QuestStepSelectorProps> = ({
  availableQuests,
  availableQuestSteps,
  availableDialogues,
  availableNpcs = [],
  selectedQuestStepIds,
  onSelectQuestStep,
  onDeselectQuestStep,
  onDetachQuestStep,
  onClose,
  dialogueNpcId,
  dialogueId
}) => {
  const [selectedQuestId, setSelectedQuestId] = useState<string>('')

  const selectedQuest = availableQuests.find((q) => q.id === selectedQuestId)
  const questStepsForSelectedQuest = selectedQuest
    ? availableQuestSteps.filter((step) => selectedQuest.steps.some((s: QuestStep) => s.id === step.id))
    : []

  // Find the NPC associated with this dialogue
  const dialogueNpc = dialogueNpcId ? availableNpcs.find((n) => n.id === dialogueNpcId) : null

  // Get dialogues assigned to this quest step
  const getAssignedDialogueInfo = (stepId: string) => {
    return availableDialogues
      .filter((dialogue: any) => dialogue.questStepId === stepId)
      .map((dialogue: any) => {
        const npc = dialogue.npcId ? availableNpcs.find((n) => n.id === dialogue.npcId) : null

        return {
          id: dialogue.id,
          name: dialogue.name,
          npc: npc
        }
      })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content quest-step-selector" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Quest Steps</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {dialogueNpc && (
          <div className="dialogue-npc-info">
            <h3>Dialogue NPC</h3>
            <div className="npc-info">
              <div className="npc-portrait">
                {dialogueNpc.image ? (
                  <img src={dialogueNpc.image} alt={`${dialogueNpc.name} portrait`} className="portrait-image" />
                ) : (
                  <div className="no-portrait">No Image</div>
                )}
              </div>
              <div className="npc-details">
                <h4>{dialogueNpc.name}</h4>
                <p>ID: {dialogueNpc.id}</p>
              </div>
            </div>
          </div>
        )}

        <div className="selector-content">
          <div className="quests-column">
            <h3>Quests</h3>
            <div className="quest-list">
              {availableQuests.map((quest) => (
                <div
                  key={quest.id}
                  className={`quest-item ${selectedQuestId === quest.id ? 'selected' : ''}`}
                  onClick={() => setSelectedQuestId(quest.id)}
                >
                  <h4>{quest.title}</h4>
                  <p>{quest.chapter}</p>
                  <span className="step-count">{quest.steps.length} steps</span>
                </div>
              ))}
            </div>
          </div>

          <div className="steps-column">
            <h3>Quest Steps</h3>
            {selectedQuest ? (
              <div className="step-list">
                {questStepsForSelectedQuest.map((step) => {
                  const isSelected = selectedQuestStepIds.includes(step.id)
                  const assignedInfos = getAssignedDialogueInfo(step.id)

                  return (
                    <div
                      key={step.id}
                      className={`step-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (isSelected) {
                          onDeselectQuestStep(step.id)
                        } else {
                          onSelectQuestStep(step.id)
                        }
                      }}
                    >
                      <div className="step-info">
                        <h4>{step.name}</h4>
                        <p>ID: {step.id}</p>
                        <p>Type: {step.objectiveType}</p>
                        {assignedInfos.length > 0 && (
                          <div className="assignment-info">
                            <div className="assigned-info">
                              Assigned to:
                              <ul>
                                {assignedInfos.map((info, index) => (
                                  <li key={index} className="assigned-dialogue-item">
                                    {info.npc && info.npc.image && (
                                      <img
                                        src={info.npc.image}
                                        alt={`${info.npc.name} portrait`}
                                        className="assigned-npc-portrait"
                                      />
                                    )}
                                    {info.npc && !info.npc.image && (
                                      <div className="assigned-npc-portrait no-image">🖼️</div>
                                    )}
                                    {!info.npc && <div className="assigned-npc-portrait no-image">🖼️</div>}
                                    <span className="dialogue-name">{info.name}</span>
                                    {onDetachQuestStep && (
                                      <button
                                        className="detach-button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onDetachQuestStep(step.id, info.id)
                                        }}
                                        title="Detach from this dialogue sequence"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="step-status">{isSelected && <span className="selected-indicator">✓</span>}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="no-selection">Select a quest to see its steps</div>
            )}
          </div>
        </div>

        <div className="selected-steps-summary">
          <h3>Selected Quest Steps ({selectedQuestStepIds.length})</h3>
          {selectedQuestStepIds.length > 0 ? (
            <ul>
              {selectedQuestStepIds.map((stepId) => {
                const step = availableQuestSteps.find((s) => s.id === stepId)
                const quest = availableQuests.find((q) => q.steps.some((s: QuestStep) => s.id === stepId))
                return (
                  <li key={stepId}>
                    {quest?.title}: {step?.name}
                    <button className="remove-step-button" onClick={() => onDeselectQuestStep(stepId)}>
                      ×
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p>No quest steps selected</p>
          )}
        </div>
      </div>
    </div>
  )
}
