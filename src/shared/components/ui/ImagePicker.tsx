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
	dataUrl?: string // For displaying images read via IPC
}

// Reusable image display component that handles IPC loading
export const ImageDisplay: React.FC<{
	src: string
	alt: string
	className?: string
	style?: React.CSSProperties
	fallback?: React.ReactNode
}> = ({ src, alt, className = '', style = {}, fallback }) => {
	const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		const loadImage = async () => {
			if (!src) return

			// If it's already a data URL or external URL, use as-is
			if (
				src.startsWith('data:') ||
				src.startsWith('http') ||
				src.startsWith('file://')
			) {
				setImageDataUrl(src)
				return
			}

			setLoading(true)
			try {
				const electronAPI = (window as any).electronAPI
				if (electronAPI) {
					// Check if this is already a full file path
					const isFullPath =
						src.startsWith('/') &&
						(src.includes(':\\') || // Windows drive letter
							src.includes(':/') || // Unix absolute path with protocol
							src.split('/').length > 4) // Absolute paths have many segments

					if (isFullPath) {
						// This is already a full file path, use it directly
						const dataUrl = await electronAPI.readThumbnail(src)
						setImageDataUrl(dataUrl)
					} else if (src.startsWith('/')) {
						// This is a relative path that needs to be combined with project path
						const projectPath = await electronAPI.getQuestEditorProjectPath()
						if (projectPath) {
							const filePath = projectPath + src.substring(1)
							const dataUrl = await electronAPI.readThumbnail(filePath)
							setImageDataUrl(dataUrl)
						} else {
							setImageDataUrl(src) // Fallback
						}
					} else {
						setImageDataUrl(src) // Fallback for other types
					}
				} else {
					setImageDataUrl(src) // Fallback
				}
			} catch (error) {
				console.warn('Failed to load image:', src, error)
				setImageDataUrl(src) // Fallback to original src
			} finally {
				setLoading(false)
			}
		}

		loadImage()
	}, [src])

	if (loading) {
		return fallback || <div className='image-loading'>Loading...</div>
	}

	if (!imageDataUrl) {
		return fallback || <div className='no-image'>No Image</div>
	}

	return (
		<img
			src={imageDataUrl}
			alt={alt}
			className={className}
			style={style}
			onError={(e) => {
				// Hide broken images or show fallback
				if (fallback) {
					e.currentTarget.style.display = 'none'
				}
			}}
		/>
	)
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
	value,
	onChange,
	className = '',
}) => {
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [images, setImages] = useState<ImageInfo[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedImageDataUrl, setSelectedImageDataUrl] = useState<
		string | null
	>(null)

	// Load all images from DCL project thumbnails
	useEffect(() => {
		const loadImages = async () => {
			try {
				setLoading(true)
				let loadedImages: ImageInfo[] = []

				// Load DCL project thumbnails via IPC
				try {
					const electronAPI = (window as any).electronAPI
					if (!electronAPI) {
						throw new Error('Electron API not available')
					}

					console.log('ImagePicker: Making IPC request to get thumbnails')
					const result = await electronAPI.getThumbnails()
					console.log('ImagePicker: IPC result:', result)

					if (result.success && result.data && result.data.length > 0) {
						console.log(
							'ImagePicker: Found',
							result.data.length,
							'images from IPC'
						)

						// Load image data for each thumbnail
						const imagePromises = result.data.map(async (img: any) => {
							try {
								console.log('ImagePicker: Reading thumbnail:', img.name)
								const dataUrl = await electronAPI.readThumbnail(img.url)
								return {
									name: `${img.project}/${img.name}`,
									url: img.url, // Keep original path for selection
									dataUrl: dataUrl || undefined, // Data URL for display
								}
							} catch (readError) {
								console.warn('Failed to read thumbnail:', img.name, readError)
								return null
							}
						})

						const imageResults = await Promise.all(imagePromises)
						loadedImages = imageResults.filter(
							(img): img is ImageInfo => img !== null
						)

						console.log('ImagePicker: Final loadedImages:', loadedImages.length)
					} else {
						console.log('ImagePicker: IPC returned success but no images found')
					}
				} catch (apiError) {
					console.error('ImagePicker: Failed to load DCL thumbnails:', apiError)
				}

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

	// Load selected image data when value changes
	useEffect(() => {
		const loadSelectedImage = async () => {
			if (value && !selectedImageDataUrl) {
				try {
					const dataUrl = await loadImageForDisplay(value)
					if (dataUrl && dataUrl !== value) {
						setSelectedImageDataUrl(dataUrl)
					}
				} catch (error) {
					console.warn('Failed to load selected image:', error)
				}
			} else if (!value) {
				setSelectedImageDataUrl(null)
			}
		}

		loadSelectedImage()
	}, [value])

	// Add a method to refresh images (can be called externally)
	const refreshImages = async () => {
		const loadImages = async () => {
			try {
				setLoading(true)
				let loadedImages: ImageInfo[] = []

				// Load DCL project thumbnails via IPC
				try {
					const electronAPI = (window as any).electronAPI
					if (!electronAPI) {
						throw new Error('Electron API not available')
					}

					console.log('ImagePicker: Refreshing thumbnails via IPC')
					const result = await electronAPI.getThumbnails()
					console.log('ImagePicker: Refresh IPC result:', result)

					if (result.success && result.data && result.data.length > 0) {
						console.log(
							'ImagePicker: Found',
							result.data.length,
							'images from IPC'
						)

						// Load image data for each thumbnail
						const imagePromises = result.data.map(async (img: any) => {
							try {
								console.log('ImagePicker: Reading thumbnail:', img.name)
								const dataUrl = await electronAPI.readThumbnail(img.url)
								return {
									name: `${img.project}/${img.name}`,
									url: img.url, // Keep original path for selection
									dataUrl: dataUrl || undefined, // Data URL for display
								}
							} catch (readError) {
								console.warn('Failed to read thumbnail:', img.name, readError)
								return null
							}
						})

						const imageResults = await Promise.all(imagePromises)
						loadedImages = imageResults.filter(
							(img): img is ImageInfo => img !== null
						)

						console.log('ImagePicker: Final loadedImages:', loadedImages.length)
					} else {
						console.log('ImagePicker: IPC returned success but no images found')
					}
				} catch (apiError) {
					console.error('ImagePicker: Failed to load DCL thumbnails:', apiError)
				}

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
		// Store the full file path - ImageDisplay will handle IPC loading
		// This allows external images to be properly loaded via IPC
		onChange(imageUrl)
		setIsModalOpen(false)
	}

	const handleImageClick = () => {
		setIsModalOpen(true)
	}

	const getDisplayUrl = (image: ImageInfo) => {
		// Use dataUrl if available (for IPC-loaded images), otherwise fall back to url
		return image.dataUrl || image.url || ''
	}

	// Helper function to load image data for stored paths
	const loadImageForDisplay = async (
		imagePath: string
	): Promise<string | null> => {
		if (!imagePath) return null

		try {
			const electronAPI = (window as any).electronAPI
			if (!electronAPI) return imagePath // Fallback to original path

			// If it's already a data URL or external URL, return as-is
			if (imagePath.startsWith('data:') || imagePath.startsWith('http')) {
				return imagePath
			}

			// Check if this is a relative web path that needs conversion
			const isRelativeWebPath =
				imagePath.startsWith('/') &&
				!imagePath.includes(':\\') && // Not Windows drive letter
				!imagePath.includes(':/') && // Not Unix absolute path with protocol
				imagePath.split('/').length <= 4 // Relative paths have few segments

			let filePath = imagePath

			if (isRelativeWebPath) {
				// This is a relative web path like "/thumbnails/image.png", convert to full file path
				const projectPath = await electronAPI.getQuestEditorProjectPath()
				if (projectPath) {
					// Construct full file path: projectPath + relativePath
					filePath = projectPath + imagePath.substring(1)
				} else {
					// Fallback: just use the relative path
					filePath = imagePath.substring(1)
				}
			}
			// If it's already a full file path, use it directly

			// Try to read the image via IPC
			const dataUrl = await electronAPI.readThumbnail(filePath)
			return dataUrl
		} catch (error) {
			console.warn('Failed to load image for display:', imagePath, error)
			return imagePath // Fallback to original path
		}
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
						<ImageDisplay
							src={value}
							alt='Selected'
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								borderRadius: '4px',
							}}
							fallback={<div className='no-thumbnail'>?</div>}
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
										src={getDisplayUrl(image)}
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
