import React from 'react'
import { Item } from '@/core/models/types'
import { ItemSelectorState } from '@/features/quest-builder/types'

interface ItemSelectorProps {
	itemSelector: ItemSelectorState
	onClose: () => void
	onSelectItem: (item: Item) => void
	onMouseEnter: (item: Item, e: React.MouseEvent) => void
	onMouseLeave: () => void
}

export const ItemSelector: React.FC<ItemSelectorProps> = ({
	itemSelector,
	onClose,
	onSelectItem,
	onMouseEnter,
	onMouseLeave,
}) => {
	if (!itemSelector.isOpen) return null

	return (
		<div className='modal-overlay' onClick={onClose}>
			<div
				className='modal-content item-selector'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='modal-header'>
					<h2>Select Item to Add</h2>
					<button className='modal-close' onClick={onClose}>
						&times;
					</button>
				</div>
				<div className='modal-body'>
					<div className='selector-help'>
						<p>
							💡 Hold <kbd>Shift</kbd> to select multiple items. Release to add
							all selected items.
						</p>
						{itemSelector.selectedItems.length > 0 && (
							<p className='selection-count'>
								{itemSelector.selectedItems.length} item
								{itemSelector.selectedItems.length !== 1 ? 's' : ''} selected
							</p>
						)}
					</div>
					{itemSelector.availableItems.length === 0 ? (
						<div className='no-items'>
							<p>
								No items available or all items are already added to this
								location.
							</p>
						</div>
					) : (
						<div className='item-grid'>
							{itemSelector.availableItems.map((item) => (
								<div
									key={item.id}
									className={`item-slot ${
										itemSelector.selectedItems.some(
											(selected) => selected.id === item.id
										)
											? 'selected'
											: ''
									}`}
									onClick={(e) => {
										if (itemSelector.isShiftPressed) {
											// Multi-selection mode - handled in EditModal
											return
										} else {
											// Single selection mode
											onSelectItem(item)
										}
									}}
									onMouseEnter={(e) => onMouseEnter(item, e)}
									onMouseLeave={onMouseLeave}
								>
									<div className='item-image'>
										{item.image ? (
											<img src={item.image} alt={item.name} />
										) : (
											<div className='no-image'>?</div>
										)}
									</div>
									<div className='item-name'>{item.name}</div>
								</div>
							))}
						</div>
					)}
				</div>
				<div className='modal-footer'>
					<button className='cancel-button' onClick={onClose}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	)
}
