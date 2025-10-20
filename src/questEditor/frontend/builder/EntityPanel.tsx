import React from 'react'

interface EntityPanelProps<T> {
  title: string
  entities: T[]
  onAdd: () => void
  renderEntity: (entity: T) => React.ReactNode
  onEdit: (entity: T) => void
  onDelete: (entity: T) => void
}

export function EntityPanel<T extends { id: string }>({
  title,
  entities,
  onAdd,
  renderEntity,
  onEdit,
  onDelete
}: EntityPanelProps<T>) {
  return (
    <div className="entity-panel">
      <div className="entity-panel-header">
        <h2>{title}</h2>
        <button onClick={onAdd} className="add-button">
          + Add New
        </button>
      </div>

      <div className="entity-list">
        {entities.length === 0 ? (
          <div className="empty-state">No {title.toLowerCase()} yet. Click "Add New" to create one.</div>
        ) : (
          entities.map((entity) => (
            <div key={entity.id} className="entity-item">
              {renderEntity(entity)}
              <div className="entity-actions">
                <button onClick={() => onEdit(entity)} className="edit-button">
                  Edit
                </button>
                <button onClick={() => onDelete(entity)} className="delete-button">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
