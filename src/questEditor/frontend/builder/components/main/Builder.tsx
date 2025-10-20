import React from 'react'

export const Builder: React.FC = () => {
  console.log('Builder component function called')
  return (
    <div style={{
      color: 'white',
      backgroundColor: 'red',
      padding: '50px',
      fontSize: '48px',
      fontWeight: 'bold'
    }}>
      REACT IS WORKING! BUILDER COMPONENT RENDERED!
    </div>
  )
}
