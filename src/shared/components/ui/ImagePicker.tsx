import React, { useState, useEffect } from 'react'
import { BaseModal } from './BaseModal'
import { apiRequest } from '@/shared/utils/api'

interface ImagePickerProps {
	value: string
	onChange: (value: string) => void
	className?: string
}

interface ImageInfo {
	name: string
	url: string
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
	value,
	onChange,
	className = '',
}) => {
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [images, setImages] = useState<ImageInfo[]>([])
	const [loading, setLoading] = useState(true)

	// Load all images from DCL project thumbnails
	useEffect(() => {
		const loadImages = async () => {
			try {
				setLoading(true)
				let loadedImages: ImageInfo[] = []

				// First, try to load DCL project thumbnails
				try {
					console.log('ImagePicker: Making API request to /thumbnails')
					const result = await apiRequest('/thumbnails')
					console.log('ImagePicker: API result:', result)
					if (result.success && result.data && result.data.length > 0) {
						console.log(
							'ImagePicker: Found',
							result.data.length,
							'images from API'
						)
						loadedImages = result.data.map((img: any) => {
							console.log(
								'ImagePicker: Processing image:',
								img.name,
								'->',
								img.url
							)
							return {
								name: `${img.project}/${img.name}`,
								url: img.url,
							}
						})
						console.log('ImagePicker: Final loadedImages:', loadedImages)
					} else {
						console.log('ImagePicker: API returned success but no images found')
						console.log('ImagePicker: Result data:', result.data)
					}
				} catch (apiError) {
					console.error('ImagePicker: Failed to load DCL thumbnails:', apiError)
				}

				// No fallback images - if no thumbnails found, show empty grid

				setImages(loadedImages)
			} catch (error) {
				console.error('Failed to load images:', error)
				setImages([])
			} finally {
				setLoading(false)
			}
		}

		loadImages()
	}, [])

	// Add a method to refresh images (can be called externally)
	const refreshImages = async () => {
		const loadImages = async () => {
			try {
				setLoading(true)
				let loadedImages: ImageInfo[] = []

				// First, try to load DCL project thumbnails
				try {
					console.log('ImagePicker: Making API request to /thumbnails')
					const result = await apiRequest('/thumbnails')
					console.log('ImagePicker: API result:', result)
					if (result.success && result.data && result.data.length > 0) {
						console.log(
							'ImagePicker: Found',
							result.data.length,
							'images from API'
						)
						loadedImages = result.data.map((img: any) => {
							console.log(
								'ImagePicker: Processing image:',
								img.name,
								'->',
								img.url
							)
							return {
								name: `${img.project}/${img.name}`,
								url: img.url,
							}
						})
						console.log('ImagePicker: Final loadedImages:', loadedImages)
					} else {
						console.log('ImagePicker: API returned success but no images found')
						console.log('ImagePicker: Result data:', result.data)
					}
				} catch (apiError) {
					console.error('ImagePicker: Failed to load DCL thumbnails:', apiError)
				}

				// No fallback images - if no thumbnails found, show empty grid

				setImages(loadedImages)
			} catch (error) {
				console.error('Failed to load images:', error)
				setImages([])
			} finally {
				setLoading(false)
			}
		}

		await loadImages()
	}

	// Expose refresh method via ref
	const refreshImagesRef = React.useRef<{
		refreshImages: () => Promise<void>
	} | null>(null)

	React.useImperativeHandle(refreshImagesRef, () => ({
		refreshImages,
	}))

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
					className='image-picker-display'
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
						position: 'relative',
					}}
				>
					{value ? (
						<img
							src={getDisplayUrl(value)}
							alt='Selected'
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								borderRadius: '4px',
							}}
						/>
					) : (
						<span
							style={{ color: '#999', fontSize: '12px', textAlign: 'center' }}
						>
							Click to
							<br />
							select image
						</span>
					)}
				</div>
				{/* Hidden input for form handling */}
				<input
					type='text'
					value={value}
					onChange={(e) => onChange(e.target.value)}
					style={{ display: 'none' }}
					name='image'
				/>
			</div>

			<BaseModal
				isOpen={isModalOpen}
				title='Select Image'
				size='xlarge'
				onClose={() => setIsModalOpen(false)}
			>
				<div className='image-picker-modal'>
					{loading ? (
						<div className='loading'>Loading images...</div>
					) : (
						<div
							className='image-grid'
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(10, 1fr)',
								gap: '0px',
								maxHeight: '70vh',
								overflowY: 'auto',
								padding: '0px',
								gridAutoRows: '1fr',
							}}
						>
							{images.map((image) => (
								<div
									key={image.name}
									className='image-grid-item'
									onClick={() => handleImageSelect(image.url)}
									style={{
										border: '2px solid #444',
										borderRadius: '4px',
										padding: '0px',
										cursor: 'pointer',
										transition: 'border-color 0.2s',
										backgroundColor:
											value === image.url ? '#007acc' : 'transparent',
										aspectRatio: '1 / 1',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.borderColor = '#007acc'
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.borderColor =
											value === image.url ? '#007acc' : '#444'
									}}
								>
									<img
										src={image.url}
										alt={image.name}
										style={{
											width: '100%',
											height: '100%',
											objectFit: 'cover',
											borderRadius: '2px',
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
