import React from 'react'
import { Item } from '@/core/models/types'
import { EntityPanel } from './EntityPanel'

interface ItemPanelProps {
  items: Item[]
  onAdd: () => void
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
}

export const ItemPanel: React.FC<ItemPanelProps> = ({ items, onAdd, onEdit, onDelete }) => {
  // Filter out any portals that might have been mixed into the items array
  // Portals have a destinationLocationId property that items don't have
  const filteredItems = items.filter((item: any) => !item.destinationLocationId)

  return (
    <EntityPanel
      title="Items"
      entities={filteredItems}
      onAdd={onAdd}
      renderEntity={(item: Item) => {
        // Use the image link directly as provided
        const displayImage = item.image

        return (
          <div className="entity-card item-card">
            <div className="item-image">
              {displayImage ? (
                <img src={displayImage} alt={`${item.name} image`} className="item-image-preview" />
              ) : (
                <div className="no-image">No Image</div>
              )}
            </div>
            <div className="item-details">
              <h3>{item.name}</h3>
              <p>Interactive: {item.interactive}</p>
              <p>State: {item.state}</p>
            </div>
          </div>
        )
      }}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
