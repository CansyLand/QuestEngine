import React from 'react'
import { Quest } from '../../../../models'
import { EntityPanel } from './EntityPanel'

interface QuestPanelProps {
  quests: Quest[]
  onAdd: () => void
  onEdit: (quest: Quest) => void
  onDelete: (quest: Quest) => void
}

export const QuestPanel: React.FC<QuestPanelProps> = ({ quests, onAdd, onEdit, onDelete }) => {
  return (
    <EntityPanel
      title="Quests"
      entities={quests}
      onAdd={onAdd}
      renderEntity={(quest: Quest) => (
        <div className="entity-card">
          <h3>{quest.title}</h3>
          <p>Chapter: {quest.chapter}</p>
          <p>Order: {quest.order}</p>
          <p>Steps: {quest.steps.length}</p>
          <p>{quest.description}</p>
        </div>
      )}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
