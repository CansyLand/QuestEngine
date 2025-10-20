import React from 'react'

interface BuilderHeaderProps {
  loading: boolean
  onReload: () => void
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({ loading, onReload }) => {
  return (
    <header className="builder-header">
      <h1>Game Builder</h1>
      <div className="builder-actions">
        <button onClick={onReload} disabled={loading}>
          Reload
        </button>
        <button onClick={() => window.open('http://localhost:5173/player/', '_blank')}>Test Quest Flow</button>
      </div>
    </header>
  )
}
