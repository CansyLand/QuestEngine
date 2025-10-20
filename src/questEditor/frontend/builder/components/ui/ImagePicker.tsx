import React, { useState, useEffect } from 'react'
import { BaseModal } from './BaseModal'

interface ImagePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

interface ImageInfo {
  name: string
  url: string
}

export const ImagePicker: React.FC<ImagePickerProps> = ({ value, onChange, className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [images, setImages] = useState<ImageInfo[]>([])
  const [loading, setLoading] = useState(true)

  // Load all images from assets/images folder
  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true)
        // Since we can't directly access the filesystem from the frontend,
        // we'll use a simple approach: try to load common image extensions
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
        const commonImageNames = [
          // From the project layout, I can see these image files exist
          'npc_1.png',
          'npc_2.png',
          'npc_3.png',
          'npc_4.png',
          'portal_1.png',
          'portal_2.png',
          'portal_3.png',
          'portal_4.png',
          'portal_5.png',
          'crystal_1.png',
          'crystal_2.png',
          'crystal_3.png',
          'crystal_4.png',
          'crystal_5.png',
          'crystal_6.png',
          'shroom_1.png',
          'shroom_2.png',
          'shroom_3.png',
          'pumpkin.png',
          'npc_shroom.png',
          'rune_stone.png',
          'boulder.png',
          'ring.png',
          'mordor.jpg',
          'hobbit-land.jpg',
          'Spell_Magic_PolymorphChicken.png',
          'Spell_Magic_PolymorphRabbit.png',
          'Spell_Misc_PetHeal.png',
          'Spell_Nature_HeavyPolymorph1.png',
          'Trade_Archaeology_Sand Castle.png',
          'INV_Misc_Food_Vendor_MoguPumpkin.png',
          'INV_Misc_Food_100_HardCheese.png',
          'INV_BabyTentacleFace_Pale.png',
          'Achievement_Zone_ZaralekCavern.png',
          'icon-set.png',
          'particle.png'
        ]

        const loadedImages: ImageInfo[] = []

        // Load common images first
        for (const imageName of commonImageNames) {
          const imageUrl = `/assets/images/${imageName}`
          loadedImages.push({
            name: imageName,
            url: imageUrl
          })
        }

        // Also try to load any other common patterns (you can expand this)
        const additionalPatterns = ['item_', 'background_', 'scene_', 'ui_', 'icon_']

        // For now, we'll use the predefined list since we can't dynamically scan the folder
        // In a real implementation, you might want to create an API endpoint that scans the folder
        setImages(loadedImages)
      } catch (error) {
        console.error('Failed to load images:', error)
      } finally {
        setLoading(false)
      }
    }

    loadImages()
  }, [])

  const handleImageSelect = (imageUrl: string) => {
    onChange(imageUrl)
    setIsModalOpen(false)
  }

  const handleImageClick = () => {
    setIsModalOpen(true)
  }

  const getDisplayUrl = (url: string) => {
    if (!url) return ''
    // If it's already a full URL, return as is
    if (url.startsWith('http') || url.startsWith('/')) {
      return url
    }
    // Otherwise, assume it's just a filename and prepend the path
    return `/assets/images/${url}`
  }

  return (
    <>
      <div className={`image-picker ${className}`}>
        <div
          className="image-picker-display"
          onClick={handleImageClick}
          style={{
            width: '80px',
            height: '80px',
            border: '2px dashed #666',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: value ? 'transparent' : '#333',
            position: 'relative'
          }}
        >
          {value ? (
            <img
              src={getDisplayUrl(value)}
              alt="Selected"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '4px'
              }}
            />
          ) : (
            <span style={{ color: '#999', fontSize: '12px', textAlign: 'center' }}>
              Click to
              <br />
              select image
            </span>
          )}
        </div>
        {/* Hidden input for form handling */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ display: 'none' }}
          name="image"
        />
      </div>

      <BaseModal isOpen={isModalOpen} title="Select Image" size="xlarge" onClose={() => setIsModalOpen(false)}>
        <div className="image-picker-modal">
          {loading ? (
            <div className="loading">Loading images...</div>
          ) : (
            <div
              className="image-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 1fr)',
                gap: '0px',
                maxHeight: '70vh',
                overflowY: 'auto',
                padding: '0px',
                gridAutoRows: '1fr'
              }}
            >
              {images.map((image) => (
                <div
                  key={image.name}
                  className="image-grid-item"
                  onClick={() => handleImageSelect(image.url)}
                  style={{
                    border: '2px solid #444',
                    borderRadius: '4px',
                    padding: '0px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    backgroundColor: value === image.url ? '#007acc' : 'transparent',
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#007acc'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = value === image.url ? '#007acc' : '#444'
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '2px'
                    }}
                    onError={(e) => {
                      // Hide broken images
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </BaseModal>
    </>
  )
}
