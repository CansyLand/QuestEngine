import React from 'react'
import { Quest, QuestStep } from '@/core/models/types'
import '@/shared/styles/quest-progress-panel.css'

interface QuestProgressPanelProps {
	activeQuests: Quest[]
	completedQuests: Quest[]
}

export const QuestProgressPanel: React.FC<QuestProgressPanelProps> = ({
	activeQuests,
	completedQuests,
}) => {
	const renderQuestSteps = (quest: Quest, isCompleted: boolean) => {
		return (
			<div className={`quest-steps ${isCompleted ? 'completed' : ''}`}>
				{quest.steps.map((step: QuestStep) => (
					<div
						key={step.id}
						className={`quest-step ${
							step.isCompleted
								? 'completed'
								: quest.activeStepId === step.id
								? 'current'
								: 'pending'
						}`}
					>
						{step.isCompleted ? (
							<span className='step-checkmark'>✓</span>
						) : quest.activeStepId === step.id ? (
							<span className='step-arrow'>→</span>
						) : (
							<span className='step-bullet'>•</span>
						)}
						<span className='step-name'>{step.name}</span>
					</div>
				))}
			</div>
		)
	}

	const renderQuest = (quest: Quest, isCompleted: boolean) => {
		return (
			<div
				key={quest.id}
				className={`quest-item ${isCompleted ? 'completed' : ''}`}
			>
				<div className='quest-chapter'>{quest.chapter}</div>
				<div className='quest-title'>{quest.title}</div>
				{renderQuestSteps(quest, isCompleted)}
			</div>
		)
	}

	return (
		<div className='quest-progress-panel'>
			<h3>Quest Progress</h3>

			{/* Active Quests */}
			{activeQuests.length > 0 && (
				<div className='active-quests'>
					{activeQuests.map((quest) => renderQuest(quest, false))}
				</div>
			)}

			{/* Completed Quests */}
			{completedQuests.length > 0 && (
				<div className='completed-quests'>
					<div className='completed-header'>
						═══════════════ COMPLETED ═══════════════
					</div>
					{completedQuests.map((quest) => renderQuest(quest, true))}
				</div>
			)}

			{/* No quests message */}
			{activeQuests.length === 0 && completedQuests.length === 0 && (
				<div className='no-quests'>No quests yet...</div>
			)}
		</div>
	)
}
