import React, { useState } from 'react'
import {
  BaseModal,
  ConfirmModal,
  EntityDisplay,
  ItemDisplay,
  NPCDisplay,
  PortalDisplay,
  LocationDisplay,
  ArrayField,
  UniversalSelector,
  EntityTooltip,
  ConfirmDialog,
  Notification,
  NotificationContainer,
  Loading,
  DCLEntityCard,
  type DCLEntity
} from '@/shared/components/ui'
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog'
import { useNotifications } from '@/shared/hooks/useNotifications'
import { Item, NPC, Portal, Location, Quest, DialogueSequence } from '@/core/models/types'

// Sample data for demonstrations
const sampleItems: Item[] = [
  {
    id: 'crystal_1',
    name: 'Magic Crystal',
    image: '/assets/images/crystal_1.png',
    state: 'world' as any,
    interactive: 'grabbable' as any,
    onInteract: []
  },
  {
    id: 'crystal_2',
    name: 'Ancient Crystal',
    image: '/assets/images/crystal_2.png',
    state: 'world' as any,
    interactive: 'touchable' as any,
    onInteract: []
  },
  {
    id: 'ring',
    name: 'Golden Ring',
    image: '/assets/images/ring.png',
    state: 'inventory' as any,
    interactive: 'notInteractive' as any,
    onInteract: []
  }
]

const sampleNPCs: NPC[] = [
  {
    id: 'npc_1',
    name: 'Wise Old Owl',
    image: '/assets/images/npc_1.png',
    state: 'world' as any
  },
  {
    id: 'npc_2',
    name: 'Mysterious Stranger',
    image: '/assets/images/npc_2.png',
    state: 'world' as any
  }
]

const samplePortals: Portal[] = [
  {
    id: 'portal_1',
    name: 'Ancient Portal',
    image: '/assets/images/portal_1.png',
    state: 'world' as any,
    interactive: 'touchable' as any,
    destinationLocationId: 'location_2',
    onInteract: []
  }
]

const sampleLocations: Location[] = [
  {
    id: 'location_1',
    name: 'Mystic Forest',
    backgroundMusic: '/assets/music/across-the-sky.mp3',
    image: '/assets/images/hobbit-land.jpg',
    items: sampleItems.slice(0, 1),
    npcs: sampleNPCs.slice(0, 1),
    portals: []
  },
  {
    id: 'location_2',
    name: 'Dark Cave',
    backgroundMusic: '/assets/music/midnight-dreary.mp3',
    image: '/assets/images/cave.png',
    items: sampleItems.slice(1, 2),
    npcs: [],
    portals: samplePortals
  }
]

// Sample quests for demonstration
const sampleQuests: Quest[] = [
  {
    id: 'sample_quest_1',
    chapter: 'Sample Chapter',
    title: 'Find the Magic Crystal',
    description: 'Locate and collect the magic crystal in the forest',
    order: 1,
    steps: [
      {
        id: 'talk_to_npc',
        name: 'Talk to the Wise Owl',
        objectiveType: 'talkTo',
        objectiveParams: { npcId: 'npc_1' },
        onStart: [],
        onComplete: []
      }
    ],
    activeStepId: 'talk_to_npc',
    completed: false
  }
]

// Sample dialogues for demonstration
const sampleDialogues: DialogueSequence[] = [
  {
    id: 'sample_dialogue_1',
    name: 'Owl Greeting',
    npcId: 'npc_1',
    questStepId: null,
    dialogs: [
      {
        id: 'greeting',
        text: 'Greetings, traveler! I sense you are on a quest.',
        isQuestion: false,
        isEndOfDialog: false
      },
      {
        id: 'question',
        text: 'What brings you to these ancient woods?',
        isQuestion: true,
        buttons: [
          {
            label: 'I seek the magic crystal',
            goToDialog: 1,
            size: 300
          }
        ],
        isEndOfDialog: false
      },
      {
        id: 'crystal_info',
        text: 'Ah, the magic crystal! It lies deep within the Dark Cave, but beware the challenges that await.',
        isQuestion: false,
        isEndOfDialog: true
      }
    ]
  }
]

// Sample DCL entities for demonstration
const sampleDCLEntities: DCLEntity[] = [
  {
    id: 'dcl_entity_1',
    name: 'Crystal Pedestal',
    position: { x: 10, y: 0, z: 5 },
    parent: 1,
    questEntityId: 'crystal_1',
    parentName: 'Scene Root'
  },
  {
    id: 'dcl_entity_2',
    name: 'NPC Spawn Point',
    position: { x: -5, y: 0, z: 10 },
    parent: 2,
    questEntityId: 'npc_1',
    parentName: 'NPC Container'
  },
  {
    id: 'dcl_entity_3',
    name: 'Portal Frame',
    position: { x: 0, y: 2, z: 0 },
    parent: 1,
    questEntityId: 'portal_1',
    parentName: 'Scene Root'
  },
  {
    id: 'dcl_entity_4',
    name: 'Empty Platform',
    position: { x: 15, y: 1, z: -8 },
    parent: 3,
    questEntityId: null,
    parentName: 'Platform Group'
  }
]

// Sample game data for DCL entity cards
const sampleGameData = {
  items: sampleItems,
  npcs: sampleNPCs,
  portals: samplePortals,
  locations: sampleLocations,
  quests: sampleQuests,
  dialogues: sampleDialogues,
  currentLocationId: 'location_1',
  activeQuests: ['sample_quest_1'],
  inventory: []
}

export const UIShowcase: React.FC = () => {
  // Modal states
  const [basicModalOpen, setBasicModalOpen] = useState(false)
  const [dangerModalOpen, setDangerModalOpen] = useState(false)
  const [warningModalOpen, setWarningModalOpen] = useState(false)
  const [largeModalOpen, setLargeModalOpen] = useState(false)

  // Selector states
  const [itemSelectorOpen, setItemSelectorOpen] = useState(false)
  const [npcSelectorOpen, setNpcSelectorOpen] = useState(false)
  const [multiSelectorOpen, setMultiSelectorOpen] = useState(false)

  // Tooltip state
  const [tooltipEntity, setTooltipEntity] = useState<any>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  // Array field state
  const [arrayItems, setArrayItems] = useState<Item[]>(sampleItems.slice(0, 2))

  // Notification system
  const { notifications, showNotification, removeNotification } = useNotifications()

  // Confirm dialog
  const confirmDialog = useConfirmDialog()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        backgroundAttachment: 'fixed',
        color: '#e0e0e0',
        fontFamily: 'Courier New, monospace'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem',
          position: 'relative',
          zIndex: 1
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            marginBottom: '40px',
            color: '#00ffff',
            textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
            fontWeight: '300',
            letterSpacing: '1px',
            fontSize: '1.5rem'
          }}
        >
          UI Component Showcase
        </h1>

        {/* Loading Component */}
        <section
          style={{
            marginBottom: '40px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px'
          }}
        >
          <h2 style={{ color: '#00ffff', marginBottom: '15px', fontSize: '1.2rem' }}>Loading Component</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Loading />
            <p>A simple loading indicator.</p>
          </div>
        </section>

        {/* Notification System */}
        <section
          style={{
            marginBottom: '40px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px'
          }}
        >
          <h2 style={{ color: '#00ffff', marginBottom: '15px', fontSize: '1.2rem' }}>Notification System</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              className="modal-button save"
              onClick={() => showNotification('Success! Operation completed.', 'success')}
            >
              Show Success Notification
            </button>
            <button
              className="modal-button cancel"
              onClick={() => showNotification('Error! Something went wrong.', 'error')}
            >
              Show Error Notification
            </button>
          </div>
          <NotificationContainer notifications={notifications} onRemove={removeNotification} />
        </section>

        {/* Modal Components */}
        <section
          style={{
            marginBottom: '40px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px'
          }}
        >
          <h2 style={{ color: '#00ffff', marginBottom: '15px', fontSize: '1.2rem' }}>Modal Components</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <button className="modal-button default" onClick={() => setBasicModalOpen(true)}>
              Basic Modal (Medium)
            </button>
            <button className="modal-button danger" onClick={() => setDangerModalOpen(true)}>
              Danger Modal
            </button>
            <button className="modal-button warning" onClick={() => setWarningModalOpen(true)}>
              Warning Modal
            </button>
            <button className="modal-button save" onClick={() => setLargeModalOpen(true)}>
              Large Modal
            </button>
          </div>

          <BaseModal isOpen={basicModalOpen} title="Basic Modal Example" onClose={() => setBasicModalOpen(false)}>
            <p>This is a basic modal with medium size (default).</p>
            <p>It can contain any content and has a close button in the header.</p>
            <div style={{ marginTop: '20px' }}>
              <button className="modal-button save" onClick={() => setBasicModalOpen(false)}>
                Close Modal
              </button>
            </div>
          </BaseModal>

          <BaseModal
            isOpen={dangerModalOpen}
            title="Danger Modal"
            variant="danger"
            onClose={() => setDangerModalOpen(false)}
          >
            <p>This modal uses the danger variant styling.</p>
            <p>Perfect for destructive actions or important warnings.</p>
          </BaseModal>

          <BaseModal
            isOpen={warningModalOpen}
            title="Warning Modal"
            variant="warning"
            onClose={() => setWarningModalOpen(false)}
          >
            <p>This modal uses the warning variant styling.</p>
            <p>Great for cautioning users about potential issues.</p>
          </BaseModal>

          <BaseModal
            isOpen={largeModalOpen}
            title="Large Modal with Scrollable Content"
            size="large"
            onClose={() => setLargeModalOpen(false)}
          >
            <p>This is a large modal that can contain more content.</p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua.
            </p>
            <p>
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
              consequat.
            </p>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
            <p>
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
              laborum.
            </p>
            <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.</p>
            <p>
              Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt
              explicabo.
            </p>
          </BaseModal>
        </section>

        {/* Entity Display Components */}
        <section
          style={{
            marginBottom: '40px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px'
          }}
        >
          <h2 style={{ color: '#00ffff', marginBottom: '15px', fontSize: '1.2rem' }}>Entity Display Components</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <h3 style={{ color: '#ffffff', marginBottom: '10px', fontSize: '1rem' }}>List Variant</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <ItemDisplay entity={sampleItems[0]} variant="list" />
                <NPCDisplay entity={sampleNPCs[0]} variant="list" />
                <PortalDisplay entity={samplePortals[0]} variant="list" />
                <LocationDisplay entity={sampleLocations[0]} variant="list" />
              </div>
            </div>

            <div>
              <h3 style={{ color: '#ffffff', marginBottom: '10px', fontSize: '1rem' }}>Card Variant</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <ItemDisplay entity={sampleItems[0]} variant="card" />
                <NPCDisplay entity={sampleNPCs[0]} variant="card" />
                <PortalDisplay entity={samplePortals[0]} variant="card" />
                <LocationDisplay entity={sampleLocations[0]} variant="card" />
              </div>
            </div>

            <div>
              <h3 style={{ color: '#ffffff', marginBottom: '10px', fontSize: '1rem' }}>Compact Variant</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <ItemDisplay entity={sampleItems[0]} variant="compact" />
                <NPCDisplay entity={sampleNPCs[0]} variant="compact" />
                <PortalDisplay entity={samplePortals[0]} variant="compact" />
                <LocationDisplay entity={sampleLocations[0]} variant="compact" />
              </div>
            </div>
          </div>
        </section>

        {/* DCL Entity Card Components */}
        <section
          style={{
            marginBottom: '40px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px'
          }}
        >
          <h2 style={{ color: '#00ffff', marginBottom: '15px', fontSize: '1.2rem' }}>DCL Entity Card Components</h2>
          <p style={{ color: '#b0b0b0', marginBottom: '20px', fontSize: '0.9rem' }}>
            Cards representing Decentraland (DCL) entities that can be linked to quest entities. Shows entity
            information and linked quest items.
          </p>

          <div className="dcl-cards">
            {sampleDCLEntities.map((entity) => (
              <DCLEntityCard key={entity.id} entity={entity} gameData={sampleGameData} />
            ))}
          </div>
        </section>

        {/* Array Field Component */}
        <section
          style={{
            marginBottom: '40px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px'
          }}
        >
          <h2 style={{ color: '#00ffff', marginBottom: '15px', fontSize: '1.2rem' }}>Array Field Component</h2>

          <ArrayField
            items={arrayItems}
            onAdd={() => {
              const newItem: Item = {
                id: `item_${Date.now()}`,
                name: `New Item ${arrayItems.length + 1}`,
                image: '/assets/images/crystal_1.png',
                state: 'world' as any,
                interactive: 'grabbable' as any,
                onInteract: []
              }
              setArrayItems([...arrayItems, newItem])
            }}
            onRemove={(index) => {
              setArrayItems(arrayItems.filter((_, i) => i !== index))
            }}
            renderItem={(item, index, onRemove) => <ItemDisplay entity={item} variant="compact" />}
            addButtonText="Add Sample Item"
            maxHeight="200px"
          />
        </section>

        {/* Selector Components */}
        <section
          style={{
            marginBottom: '40px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px'
          }}
        >
          <h2 style={{ color: '#00ffff', marginBottom: '15px', fontSize: '1.2rem' }}>Selector Components</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <button className="modal-button default" onClick={() => setItemSelectorOpen(true)}>
              Item Selector
            </button>
            <button className="modal-button save" onClick={() => setNpcSelectorOpen(true)}>
              NPC Selector
            </button>
            <button className="modal-button warning" onClick={() => setMultiSelectorOpen(true)}>
              Multi-Select Items
            </button>
          </div>

          <UniversalSelector
            isOpen={itemSelectorOpen}
            title="Select an Item"
            items={sampleItems}
            onSelect={(item) => {
              showNotification(`Selected item: ${item.name}`, 'success')
              setItemSelectorOpen(false)
            }}
            onClose={() => setItemSelectorOpen(false)}
            searchFilter={(item, query) => item.name.toLowerCase().includes(query.toLowerCase())}
          />

          <UniversalSelector
            isOpen={npcSelectorOpen}
            title="Select an NPC"
            items={sampleNPCs}
            onSelect={(npc) => {
              showNotification(`Selected NPC: ${npc.name}`, 'success')
              setNpcSelectorOpen(false)
            }}
            onClose={() => setNpcSelectorOpen(false)}
          />

          <UniversalSelector
            isOpen={multiSelectorOpen}
            title="Select Multiple Items"
            items={sampleItems}
            multiSelect={true}
            allowShiftSelect={true}
            onSelect={(item) => {
              showNotification(`Selected item: ${item.name}`, 'success')
            }}
            onMultiSelect={(items) => {
              showNotification(`Selected ${items.length} items: ${items.map((i) => i.name).join(', ')}`, 'success')
              setMultiSelectorOpen(false)
            }}
            onClose={() => setMultiSelectorOpen(false)}
          />
        </section>

        {/* Tooltip System */}
        <section
          style={{
            marginBottom: '40px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px'
          }}
        >
          <h2 style={{ color: '#00ffff', marginBottom: '15px', fontSize: '1.2rem' }}>Tooltip System</h2>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
            <div
              style={{
                padding: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                setTooltipEntity(sampleItems[0])
                setTooltipPosition({ x: e.clientX, y: e.clientY })
              }}
              onMouseMove={(e) => {
                setTooltipPosition({ x: e.clientX, y: e.clientY })
              }}
              onMouseLeave={() => {
                setTooltipEntity(null)
                setTooltipPosition(null)
              }}
            >
              Hover over me for tooltip (Item)
            </div>

            <div
              style={{
                padding: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                setTooltipEntity(sampleNPCs[0])
                setTooltipPosition({ x: e.clientX, y: e.clientY })
              }}
              onMouseMove={(e) => {
                setTooltipPosition({ x: e.clientX, y: e.clientY })
              }}
              onMouseLeave={() => {
                setTooltipEntity(null)
                setTooltipPosition(null)
              }}
            >
              Hover over me for tooltip (NPC)
            </div>
          </div>

          <EntityTooltip
            entity={tooltipEntity}
            position={tooltipPosition}
            visible={tooltipEntity !== null && tooltipPosition !== null}
          >
            <div></div>
          </EntityTooltip>
        </section>

        {/* Confirm Dialog */}
        <section
          style={{
            marginBottom: '40px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px'
          }}
        >
          <h2 style={{ color: '#00ffff', marginBottom: '15px', fontSize: '1.2rem' }}>Confirm Dialog</h2>

          <button
            className="modal-button danger"
            onClick={() =>
              confirmDialog.openConfirmDialog(
                'Delete Item',
                'Are you sure you want to delete this item? This action cannot be undone.',
                () => {
                  showNotification('Item deleted successfully!', 'success')
                  confirmDialog.closeConfirmDialog()
                },
                () => confirmDialog.closeConfirmDialog()
              )
            }
          >
            Show Confirm Dialog
          </button>

          <ConfirmDialog confirmDialog={confirmDialog.confirmDialog} />
        </section>

        {/* Confirm Modal */}
        <section
          style={{
            marginBottom: '40px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px'
          }}
        >
          <h2 style={{ color: '#00ffff', marginBottom: '15px', fontSize: '1.2rem' }}>Confirm Modal</h2>

          <ConfirmModal
            isOpen={false}
            title="Confirm Action"
            message="Are you sure you want to proceed? This action cannot be undone."
            onConfirm={() => showNotification('Action confirmed!', 'success')}
            onCancel={() => showNotification('Action cancelled', 'error')}
          />
        </section>

        {/* Footer */}
        <footer
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'rgba(255, 255, 255, 0.7)',
            borderTop: '1px solid rgba(0, 255, 255, 0.3)',
            marginTop: '40px'
          }}
        >
          <p>UI Showcase - All components demonstrated above</p>
          <p>
            Access this page directly via URL: <span style={{ color: '#00ffff' }}>/ui-showcase</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
