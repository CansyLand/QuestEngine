import React from 'react'
import { Item, NPC, Portal, Location } from '../../../../models'
import { BaseModal } from './BaseModal'
import { EntityDisplay } from './EntityDisplay'

export type SelectableEntity = Item | NPC | Portal | Location

interface UniversalSelectorProps<T extends SelectableEntity> {
  isOpen: boolean
  title: string
  items: T[]
  selectedItems?: T[]
  onSelect: (item: T) => void
  onMultiSelect?: (items: T[]) => void
  onClose: () => void
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode
  searchFilter?: (item: T, query: string) => boolean
  multiSelect?: boolean
  allowShiftSelect?: boolean
  emptyMessage?: string
  className?: string
}

export function UniversalSelector<T extends SelectableEntity>({
  isOpen,
  title,
  items,
  selectedItems = [],
  onSelect,
  onMultiSelect,
  onClose,
  renderItem,
  searchFilter,
  multiSelect = false,
  allowShiftSelect = false,
  emptyMessage = 'No items available.',
  className = ''
}: UniversalSelectorProps<T>) {
  const [shiftPressed, setShiftPressed] = React.useState(false)
  const [tempSelectedItems, setTempSelectedItems] = React.useState<T[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && allowShiftSelect) {
        setShiftPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && allowShiftSelect) {
        setShiftPressed(false)
        if (tempSelectedItems.length > 0 && onMultiSelect) {
          onMultiSelect(tempSelectedItems)
          setTempSelectedItems([])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [allowShiftSelect, tempSelectedItems, onMultiSelect])

  const filteredItems = searchFilter ? items.filter((item) => searchFilter(item, searchQuery)) : items

  const handleItemClick = (item: T) => {
    if (multiSelect && allowShiftSelect && shiftPressed) {
      // Multi-selection mode
      const isAlreadySelected = tempSelectedItems.some((selected) => selected.id === item.id)
      if (isAlreadySelected) {
        setTempSelectedItems((prev) => prev.filter((selected) => selected.id !== item.id))
      } else {
        setTempSelectedItems((prev) => [...prev, item])
      }
    } else {
      // Single selection mode
      onSelect(item)
    }
  }

  const defaultRenderItem = (item: T, isSelected: boolean) => (
    <div className={`selector-item ${isSelected ? 'selected' : ''}`}>
      <EntityDisplay entity={item} variant="selector" className="selector-entity-display" />
    </div>
  )

  const footer = (
    <div className="selector-footer">
      {multiSelect && tempSelectedItems.length > 0 && (
        <div className="selection-info">
          {tempSelectedItems.length} item{tempSelectedItems.length !== 1 ? 's' : ''} selected
        </div>
      )}
      <div className="selector-buttons">
        <button className="modal-button cancel" onClick={onClose}>
          Cancel
        </button>
        {multiSelect && tempSelectedItems.length > 0 && (
          <button className="modal-button save" onClick={() => onMultiSelect && onMultiSelect(tempSelectedItems)}>
            Add Selected ({tempSelectedItems.length})
          </button>
        )}
      </div>
    </div>
  )

  return (
    <BaseModal isOpen={isOpen} title={title} size="large" onClose={onClose} footer={footer} className={className}>
      <div className="universal-selector">
        {allowShiftSelect && (
          <div className="selector-help">
            <p>
              💡 Hold <kbd>Shift</kbd> to select multiple items. Release to add all selected items.
            </p>
          </div>
        )}

        <div className="selector-search">
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="selector-content">
          {filteredItems.length === 0 ? (
            <div className="no-items">
              <p>{emptyMessage}</p>
            </div>
          ) : (
            <div className="selector-grid">
              {filteredItems.map((item) => {
                const isSelected =
                  selectedItems.some((selected) => selected.id === item.id) ||
                  tempSelectedItems.some((selected) => selected.id === item.id)

                return (
                  <div
                    key={item.id}
                    className={`selector-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleItemClick(item)}
                  >
                    {renderItem ? renderItem(item, isSelected) : defaultRenderItem(item, isSelected)}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  )
}
