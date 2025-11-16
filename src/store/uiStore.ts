import { create } from 'zustand'
import { Location, Quest, NPC, Item, Portal, DialogueSequence } from '@/core/models/types'
import { NotificationItem } from '@/shared/ui'

interface ModalState {
	isOpen: boolean
	entityType: 'location' | 'quest' | 'npc' | 'item' | 'portal' | 'dialogue' | null
	entity: Location | Quest | NPC | Item | Portal | DialogueSequence | null
}

interface QuestAttachmentModalState {
	isOpen: boolean
	dialogue: DialogueSequence | null
	pendingChanges: {
		questId: string
		stepId: string
		dialogueSequenceId?: string
	}[]
}

interface ConfirmDialogState {
	isOpen: boolean
	title: string
	message: string
	onConfirm: () => void
	onCancel: () => void
}

interface UIState {
	// Active tab
	activeTab: string
	setActiveTab: (tab: string) => void

	// Edit modal
	editModal: ModalState
	openEditModal: (
		entityType: ModalState['entityType'],
		entity: ModalState['entity']
	) => void
	closeEditModal: () => void

	// Quest attachment modal
	questAttachmentModal: QuestAttachmentModalState
	openQuestAttachmentModal: (
		dialogue: DialogueSequence | null,
		pendingChanges?: QuestAttachmentModalState['pendingChanges']
	) => void
	closeQuestAttachmentModal: () => void

	// Confirm dialog
	confirmDialog: ConfirmDialogState
	openConfirmDialog: (
		title: string,
		message: string,
		onConfirm: () => void,
		onCancel?: () => void
	) => void
	closeConfirmDialog: () => void

	// Notifications
	notifications: NotificationItem[]
	addNotification: (notification: Omit<NotificationItem, 'id'>) => void
	removeNotification: (id: string) => void

	// Unlinked count
	unlinkedCount: number
	setUnlinkedCount: (count: number) => void
}

export const useUIStore = create<UIState>((set: any) => ({
	activeTab: 'locations',
	setActiveTab: (tab: string) => set({ activeTab: tab }),

	editModal: {
		isOpen: false,
		entityType: null,
		entity: null,
	},
	openEditModal: (entityType: ModalState['entityType'], entity: ModalState['entity']) =>
		set({
			editModal: {
				isOpen: true,
				entityType,
				entity,
			},
		}),
	closeEditModal: () =>
		set({
			editModal: {
				isOpen: false,
				entityType: null,
				entity: null,
			},
		}),

	questAttachmentModal: {
		isOpen: false,
		dialogue: null,
		pendingChanges: [],
	},
	openQuestAttachmentModal: (dialogue: DialogueSequence | null, pendingChanges: QuestAttachmentModalState['pendingChanges'] = []) =>
		set({
			questAttachmentModal: {
				isOpen: true,
				dialogue,
				pendingChanges,
			},
		}),
	closeQuestAttachmentModal: () =>
		set({
			questAttachmentModal: {
				isOpen: false,
				dialogue: null,
				pendingChanges: [],
			},
		}),

	confirmDialog: {
		isOpen: false,
		title: '',
		message: '',
		onConfirm: () => {},
		onCancel: () => {},
	},
	openConfirmDialog: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) =>
		set({
			confirmDialog: {
				isOpen: true,
				title,
				message,
				onConfirm,
				onCancel: onCancel || (() => {}),
			},
		}),
	closeConfirmDialog: () =>
		set({
			confirmDialog: {
				isOpen: false,
				title: '',
				message: '',
				onConfirm: () => {},
				onCancel: () => {},
			},
		}),

	notifications: [],
	addNotification: (notification: Omit<NotificationItem, 'id'>) => {
		const id = Math.random().toString(36).substring(7)
		const newNotification: NotificationItem = {
			...notification,
			id,
			duration: notification.duration || 5000,
		}
		set((state: any) => ({
			notifications: [...state.notifications, newNotification],
		}))

		// Auto-remove after duration
		if (newNotification.duration) {
			setTimeout(() => {
				set((state: any) => ({
					notifications: state.notifications.filter((n: NotificationItem) => n.id !== id),
				}))
			}, newNotification.duration)
		}
	},
	removeNotification: (id: string) =>
		set((state: any) => ({
			notifications: state.notifications.filter((n: NotificationItem) => n.id !== id),
		})),

	unlinkedCount: 0,
	setUnlinkedCount: (count: number) => set({ unlinkedCount: count }),
}))

