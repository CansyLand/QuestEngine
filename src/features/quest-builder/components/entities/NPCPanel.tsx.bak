import React from 'react'
import { NPC } from '../../../../models'
import { EntityPanel } from './EntityPanel'

interface NPCPanelProps {
  npcs: NPC[]
  onAdd: () => void
  onEdit: (npc: NPC) => void
  onDelete: (npc: NPC) => void
}

export const NPCPanel: React.FC<NPCPanelProps> = ({ npcs, onAdd, onEdit, onDelete }) => {
  return (
    <EntityPanel
      title="NPCs"
      entities={npcs}
      onAdd={onAdd}
      renderEntity={(npc: NPC) => {
        // Use the image link directly as provided
        const displayImage = npc.image

        return (
          <div className="entity-card npc-card">
            <div className="npc-portrait">
              {displayImage ? (
                <img src={displayImage} alt={`${npc.name} image`} className="portrait-image" />
              ) : (
                <div className="no-portrait">No Image</div>
              )}
            </div>
            <div className="npc-details">
              <h3>{npc.name}</h3>
              <p>State: {npc.state}</p>
            </div>
          </div>
        )
      }}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
