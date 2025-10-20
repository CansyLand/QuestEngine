import React from 'react'
import { Portal } from '../../../../models'
import { EntityPanel } from './EntityPanel'

interface PortalPanelProps {
  portals: Portal[]
  onAdd: () => void
  onEdit: (portal: Portal) => void
  onDelete: (portal: Portal) => void
}

export const PortalPanel: React.FC<PortalPanelProps> = ({ portals, onAdd, onEdit, onDelete }) => {
  // Filter to ensure only portals (items with destinationLocationId) are displayed
  // This prevents items from being mixed into the portals tab
  const filteredPortals = portals.filter((portal: any) => portal.destinationLocationId)

  return (
    <EntityPanel
      title="Portals"
      entities={filteredPortals}
      onAdd={onAdd}
      renderEntity={(portal: Portal) => {
        const displayImage = portal.image

        return (
          <div className="entity-card portal-card">
            <div className="portal-image">
              {displayImage ? (
                <img src={displayImage} alt={`${portal.name} image`} className="portal-image-preview" />
              ) : (
                <div className="no-image">No Image</div>
              )}
            </div>
            <div className="portal-details">
              <h3>{portal.name}</h3>
              <p>Destination: {portal.destinationLocationId}</p>
              <p>State: {portal.state}</p>
            </div>
          </div>
        )
      }}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
