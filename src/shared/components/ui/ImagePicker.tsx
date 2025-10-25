import React, { useState, useEffect } from 'react'
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
					// Check if this is already a full file path (absolute path from getThumbnails)
					const isFullPath = src.startsWith('/') && src.split('/').length > 4

					if (isFullPath) {
						// This is already a full file path from getThumbnails, use it directly
						const dataUrl = await electronAPI.readThumbnail(src)
						setImageDataUrl(dataUrl)
					} else if (src.startsWith('/')) {
						// This is a relative path that needs to be combined with project path
						const projectPath = electronAPI
							? await electronAPI.getQuestEditorProjectPath()
							: null

						if (projectPath) {
							const filePath = projectPath + '/' + src.substring(1)
							try {
								const dataUrl = await electronAPI.readThumbnail(filePath)
								setImageDataUrl(dataUrl)
							} catch (error) {
								setImageDataUrl(null) // Force fallback
							}
						} else {
							setImageDataUrl(null) // Force fallback
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
	const [projectPath, setProjectPath] = useState<string | null>(null)

	useEffect(() => {
		const getProjectPath = async () => {
			const electronAPI = (window as any).electronAPI
			const path = electronAPI
				? await electronAPI.getQuestEditorProjectPath()
				: null
			setProjectPath(path)
		}
		getProjectPath()
	}, [])

	const fullValue = projectPath ? projectPath + value : value

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

					const result = await electronAPI.getThumbnails()

					if (result.success && result.data && result.data.length > 0) {
						// Load image data for each thumbnail
						const imagePromises = result.data.map(async (img: any) => {
							try {
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
					} else {
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
	// useEffect(() => {
	// 	const loadSelectedImage = async () => {
	// 		if (value && !selectedImageDataUrl) {
	// 			try {
	// 				const dataUrl = await loadImageForDisplay(value)
	// 				if (dataUrl && dataUrl !== value) {
	// 					setSelectedImageDataUrl(dataUrl)
	// 				}
	// 			} catch (error) {
	// 			}
	// 		} else if (!value) {
	// 			setSelectedImageDataUrl(null)
	// 		}
	// 	}

	// 	loadSelectedImage()
	// }, [value])

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

					const result = await electronAPI.getThumbnails()

					if (result.success && result.data && result.data.length > 0) {
						// Load image data for each thumbnail
						const imagePromises = result.data.map(async (img: any) => {
							try {
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
					} else {
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

	const handleImageSelect = async (imageUrl: string) => {
		try {
			// Convert full path to relative path for storage
			const electronAPI = (window as any).electronAPI
			const projectPath = electronAPI
				? await electronAPI.getQuestEditorProjectPath()
				: null
			let pathToStore = imageUrl

			if (projectPath && imageUrl.startsWith(projectPath)) {
				// Convert absolute path to relative path: /project/path/thumbnails/file.png -> /thumbnails/file.png
				pathToStore = imageUrl.substring(projectPath.length)
				// Ensure it starts with /
				if (!pathToStore.startsWith('/')) {
					pathToStore = '/' + pathToStore
				}
			}

			onChange(pathToStore)
		} catch (error) {
			console.warn('Failed to convert path, storing original:', error)
			onChange(imageUrl) // Fallback to original path
		}
		setIsModalOpen(false)
	}

	const handleImageClick = () => {
		setIsModalOpen(true)
	}

	const getDisplayUrl = (image: ImageInfo) => {
		// Use dataUrl if available (for IPC-loaded images), otherwise fall back to url
		return image.dataUrl || image.url || ''
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
							src={fullValue}
							alt='Selected'
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								borderRadius: '4px',
							}}
							fallback={
								<div
									style={{
										width: '100%',
										height: '100%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										backgroundColor: '#444',
										color: '#999',
										fontSize: '10px',
										textAlign: 'center',
									}}
								>
									Image
									<br />
									Selected
								</div>
							}
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

			{isModalOpen && (
				<div className='modal-overlay' onClick={() => setIsModalOpen(false)}>
					<div
						className='image-picker-modal-direct'
						onClick={(e) => e.stopPropagation()}
						style={{
							background:
								'linear-gradient(135deg, rgba(15, 15, 25, 0.98) 0%, rgba(25, 25, 45, 0.98) 100%)',
							border: '1px solid #00ffff',
							boxShadow:
								'0 0 50px rgba(0, 255, 255, 0.3), 0 20px 60px rgba(0, 0, 0, 0.5)',
							maxWidth: '1200px',
							width: '98%',
							maxHeight: '80vh',
							overflow: 'hidden',
							backdropFilter: 'blur(20px)',
							animation: 'slideIn 0.3s ease',
							clipPath:
								'polygon(10px 0%, calc(100% - 10px) 0%, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0% calc(100% - 10px), 0% 10px)',
							position: 'relative',
							margin: 'auto',
						}}
					>
						<div
							className='modal-header'
							style={{
								padding: '1.5rem',
								borderBottom: '1px solid #00ffff',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<h2
								style={{
									margin: 0,
									color: '#00ffff',
									textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
									fontWeight: 300,
									letterSpacing: '1px',
									fontSize: '1.2rem',
								}}
							>
								Select Image
							</h2>
							<button
								className='modal-close'
								onClick={() => setIsModalOpen(false)}
								style={{
									background: 'none',
									border: 'none',
									color: '#b0b0b0',
									fontSize: '1.5rem',
									cursor: 'pointer',
									padding: 0,
									width: '30px',
									height: '30px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									borderRadius: '50%',
									transition: 'all 0.3s ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.color = '#ffffff'
									;(e.currentTarget as HTMLElement).style.background =
										'rgba(255, 64, 129, 0.2)'
									;(e.currentTarget as HTMLElement).style.boxShadow =
										'0 0 10px rgba(255, 64, 129, 0.3)'
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.color = '#b0b0b0'
									;(e.currentTarget as HTMLElement).style.background = 'none'
									;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
								}}
							>
								&times;
							</button>
						</div>
						<div
							className='modal-body'
							style={{
								padding: '1.5rem',
								maxHeight: 'calc(80vh - 100px)',
								overflowY: 'auto',
							}}
						>
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
					</div>
				</div>
			)}
		</>
	)
}
