import React from 'react'

interface BaseEntity {
  id: string
  name: string
}

interface ArrayFieldProps<T extends BaseEntity> {
  items: T[]
  onAdd: () => void
  onRemove: (index: number) => void
  renderItem: (item: T, index: number, onRemove: (index: number) => void) => React.ReactNode
  addButtonText?: string
  emptyMessage?: string
  maxHeight?: string
  className?: string
}

export function ArrayField<T extends BaseEntity>({
  items,
  onAdd,
  onRemove,
  renderItem,
  addButtonText = 'Add Item',
  emptyMessage = 'No items yet. Click "Add" to create one.',
  maxHeight = '200px',
  className = ''
}: ArrayFieldProps<T>) {
  return (
    <div className={`array-field ${className}`.trim()}>
      <div className="array-list" style={{ maxHeight }}>
        {items.length === 0 ? (
          <div className="empty-state">{emptyMessage}</div>
        ) : (
          items.map((item, index) => (
            <div key={item.id} className="array-item">
              <div className="array-item-content">{renderItem(item, index, onRemove)}</div>
              <button type="button" className="array-item-remove" onClick={() => onRemove(index)} title="Remove item">
                ×
              </button>
            </div>
          ))
        )}
      </div>
      <button type="button" className="add-array-button" onClick={onAdd}>
        {addButtonText}
      </button>
    </div>
  )
}
