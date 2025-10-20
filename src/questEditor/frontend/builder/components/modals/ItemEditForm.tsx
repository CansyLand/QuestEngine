import React from 'react'
import { Item, InteractiveMode, EntityState } from '../../../../models'
import { ImagePicker } from '../ui/ImagePicker'

interface ItemEditFormProps {
  item: Item
  onUpdate: (updates: Partial<Item>) => void
}

export const ItemEditForm: React.FC<ItemEditFormProps> = ({ item, onUpdate }) => {
  return (
    <div className="edit-form">
      <div className="form-group">
        <label>Name:</label>
        <input type="text" value={item.name} onChange={(e) => onUpdate({ name: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Image:</label>
        <ImagePicker value={item.image} onChange={(value) => onUpdate({ image: value })} />
      </div>
      <div className="form-group">
        <label>Audio:</label>
        <input
          type="text"
          value={item.audio || ''}
          onChange={(e) => onUpdate({ audio: e.target.value })}
          placeholder="/assets/sfx/..."
        />
      </div>
      <div className="form-group">
        <label>Interactive:</label>
        <select value={item.interactive} onChange={(e) => onUpdate({ interactive: e.target.value as InteractiveMode })}>
          <option value={InteractiveMode.NotInteractive}>Not Interactive</option>
          <option value={InteractiveMode.Grabbable}>Grabbable</option>
          <option value={InteractiveMode.Interactive}>Interactive</option>
        </select>
      </div>
      <div className="form-group">
        <label>State:</label>
        <select value={item.state} onChange={(e) => onUpdate({ state: e.target.value as EntityState })}>
          <option value={EntityState.World}>World (visible in game)</option>
          <option value={EntityState.Inventory}>Inventory (in player inventory)</option>
          <option value={EntityState.Void}>Void (waiting to be activated)</option>
        </select>
      </div>
    </div>
  )
}
