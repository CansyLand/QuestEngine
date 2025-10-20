import React from 'react'
import { NPC, EntityState } from '../../../../models'
import { ImagePicker } from '../ui/ImagePicker'

interface NPCEditFormProps {
  npc: NPC
  onUpdate: (updates: Partial<NPC>) => void
}

export const NPCEditForm: React.FC<NPCEditFormProps> = ({ npc, onUpdate }) => {
  return (
    <div className="edit-form">
      <div className="form-group">
        <label>Name:</label>
        <input type="text" value={npc.name} onChange={(e) => onUpdate({ name: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Image:</label>
        <ImagePicker
          value={npc.image || ''}
          onChange={(value) => {
            // Always save just the filename, add prefix on display
            onUpdate({ image: value })
          }}
        />
      </div>
      <div className="form-group">
        <label>State:</label>
        <select value={npc.state} onChange={(e) => onUpdate({ state: e.target.value as EntityState })}>
          <option value={EntityState.World}>World (visible in game)</option>
          <option value={EntityState.Inventory}>Inventory (in player inventory)</option>
          <option value={EntityState.Void}>Void (waiting to be activated)</option>
        </select>
      </div>
    </div>
  )
}
