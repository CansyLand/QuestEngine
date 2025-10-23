import React from 'react'

interface BuilderHeaderProps {
	loading: boolean
	onReload: () => void
	onBack?: () => void
	projectName?: string
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({
	loading,
	onReload,
	onBack,
	projectName,
}) => {
	return (
		<header className='builder-header'>
			<h1>
				QuestEngine
				{projectName && <span className='project-name'> - {projectName}</span>}
			</h1>
			<div className='builder-actions'>
				{onBack && <button onClick={onBack}>← Back to Projects</button>}
				<button onClick={onReload} disabled={loading}>
					Reload
				</button>
				<button
					onClick={() => {
						;(window as any).electronAPI.openPlayerWindow().catch(console.error)
					}}
				>
					Test Quest Flow
				</button>
			</div>
		</header>
	)
}
