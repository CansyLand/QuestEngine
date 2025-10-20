import React, { useEffect } from 'react'
import { DialogueSequence, Dialog, Button } from '../../../../models'
import { DialogueEditorState } from '../../types/index.js'
import { generateIdFromApi } from '../../../shared/utils.js'

interface DialogueEditorProps {
  dialogueEditor: DialogueEditorState
  onClose: () => void
  onUpdateSequence: (updates: Partial<DialogueSequence>) => void
  onAddDialog: () => void
  onUpdateDialog: (index: number, updates: Partial<Dialog>) => void
  onRemoveDialog: (index: number) => void
  onAddButton: (dialogIndex: number) => void
  onUpdateButton: (dialogIndex: number, buttonIndex: number, updates: Partial<Button>) => void
  onRemoveButton: (dialogIndex: number, buttonIndex: number) => void
}

export const DialogueEditor: React.FC<DialogueEditorProps> = ({
  dialogueEditor,
  onClose,
  onUpdateSequence,
  onAddDialog,
  onUpdateDialog,
  onRemoveDialog,
  onAddButton,
  onUpdateButton,
  onRemoveButton
}) => {
  if (!dialogueEditor.isOpen || !dialogueEditor.sequence) return null

  const sequence = dialogueEditor.sequence

  // Auto-generate ID when name changes
  useEffect(() => {
    if (sequence.name) {
      const currentId = sequence.id

      // Generate ID immediately when name changes
      generateIdFromApi(sequence.name, 'dialogue', currentId, sequence.npcId)
        .then((response) => {
          if (response.success && response.data?.id && response.data.id !== currentId) {
            onUpdateSequence({ id: response.data.id })
          }
        })
        .catch((error) => {
          console.error('Failed to generate dialogue ID:', error)
        })
    }
  }, [sequence.name, sequence.npcId, onUpdateSequence])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content dialogue-editor modal-content-dialogue" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Dialogue Sequence</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Sequence Name:</label>
            <input type="text" value={sequence.name} onChange={(e) => onUpdateSequence({ name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Dialogs: {sequence.dialogs.length}</label>
            <div className="dialogs-list">
              {sequence.dialogs.map((dialog: Dialog, dialogIndex: number) => (
                <div key={dialog.id} className="dialog-item">
                  <div className="dialog-header">
                    <span>
                      Dialog {dialogIndex + 1} (ID: {dialog.id})
                    </span>
                    <button type="button" className="remove-button small" onClick={() => onRemoveDialog(dialogIndex)}>
                      Remove
                    </button>
                  </div>
                  <div className="dialog-fields">
                    <div className="field-group">
                      <label>Text:</label>
                      <textarea
                        value={dialog.text}
                        onChange={(e) => onUpdateDialog(dialogIndex, { text: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="field-row">
                      <div className="dialog-type-buttons">
                        <button
                          type="button"
                          className={`dialog-type-button ${dialog.isQuestion ? 'active' : ''}`}
                          onClick={() => onUpdateDialog(dialogIndex, { isQuestion: true, isEndOfDialog: false })}
                        >
                          Is Question
                        </button>
                        <button
                          type="button"
                          className={`dialog-type-button ${dialog.isEndOfDialog ? 'active' : ''}`}
                          onClick={() => onUpdateDialog(dialogIndex, { isQuestion: false, isEndOfDialog: true })}
                        >
                          End of Dialog
                        </button>
                        <button
                          type="button"
                          className={`dialog-type-button ${!dialog.isQuestion && !dialog.isEndOfDialog ? 'active' : ''}`}
                          onClick={() => onUpdateDialog(dialogIndex, { isQuestion: false, isEndOfDialog: false })}
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                    {dialog.isQuestion && (
                      <div className="field-group">
                        <label>Buttons:</label>
                        <div className="buttons-list">
                          {(dialog.buttons || []).map((button, buttonIndex) => (
                            <div key={buttonIndex} className="button-item">
                              <div className="button-fields">
                                <input
                                  type="text"
                                  placeholder="Button label"
                                  value={button.label}
                                  onChange={(e) => onUpdateButton(dialogIndex, buttonIndex, { label: e.target.value })}
                                />
                                <select
                                  value={button.goToDialog}
                                  onChange={(e) =>
                                    onUpdateButton(dialogIndex, buttonIndex, { goToDialog: parseInt(e.target.value) })
                                  }
                                >
                                  {dialogueEditor.sequence?.dialogs.map((d, i) => (
                                    <option key={i} value={i}>
                                      {i}: {d.id}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  placeholder="Size"
                                  value={button.size}
                                  onChange={(e) => onUpdateButton(dialogIndex, buttonIndex, { size: parseInt(e.target.value) || 300 })}
                                  min="100"
                                  max="1000"
                                  style={{ width: '80px' }}
                                />
                              </div>
                              <button
                                type="button"
                                className="remove-button small"
                                onClick={() => onRemoveButton(dialogIndex, buttonIndex)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button type="button" className="add-button small" onClick={() => onAddButton(dialogIndex)}>
                            Add Button
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" className="add-array-button" onClick={onAddDialog}>
                Add Dialog
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
