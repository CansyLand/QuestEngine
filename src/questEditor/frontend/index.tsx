import React from 'react'
import { createRoot } from 'react-dom/client'
import { Builder } from './builder/Builder'
import { Player } from './player/Player'
import { UIShowcase } from './UIShowcase'

console.log('index.tsx executing')

const container = document.getElementById('root')
console.log('Container found:', !!container)

if (container) {
  const root = createRoot(container)

  // Simple routing based on URL path
  const path = window.location.pathname
  console.log('Path:', path)

  if (path.startsWith('/ui-showcase')) {
    console.log('Rendering UI Showcase')
    root.render(<UIShowcase />)
  } else if (path.startsWith('/player')) {
    console.log('Rendering Player')
    root.render(<Player />)
  } else {
    console.log('Rendering Builder (default route)')
    root.render(<Builder />)
  }
} else {
  console.error('Root element not found')
  document.body.innerHTML = '<div style="color: red; font-size: 48px;">ROOT ELEMENT NOT FOUND</div>'
}
