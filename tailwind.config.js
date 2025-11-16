/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: '#00ffff',
					dark: '#0080ff',
				},
				secondary: {
					DEFAULT: '#ff00ff',
				},
				danger: {
					DEFAULT: '#ff0040',
				},
				warning: {
					DEFAULT: '#ffd700',
				},
				success: {
					DEFAULT: '#4caf50',
				},
				text: {
					primary: '#ffffff',
					secondary: '#e0e0e0',
					muted: '#b0b0b0',
					disabled: '#666666',
				},
				bg: {
					primary: 'rgba(15, 15, 25, 0.98)',
					secondary: 'rgba(25, 25, 45, 0.98)',
					overlay: 'rgba(0, 0, 0, 0.8)',
					card: 'rgba(255, 255, 255, 0.05)',
					hover: 'rgba(255, 255, 255, 0.1)',
				},
				border: {
					primary: 'rgba(0, 255, 255, 0.3)',
					secondary: 'rgba(255, 255, 255, 0.1)',
					focus: '#00ffff',
				},
			},
			fontFamily: {
				primary: ["'Courier New'", 'monospace'],
				secondary: 'inherit',
			},
			fontSize: {
				xs: '0.75rem',
				sm: '0.8rem',
				base: '0.9rem',
				lg: '1rem',
				xl: '1.1rem',
				xxl: '1.2rem',
			},
			spacing: {
				xs: '0.25rem',
				sm: '0.5rem',
				md: '0.75rem',
				lg: '1rem',
				xl: '1.5rem',
				xxl: '2rem',
			},
			borderRadius: {
				sm: '3px',
				md: '4px',
				lg: '6px',
				xl: '8px',
			},
			boxShadow: {
				sm: '0 0 5px rgba(0, 0, 0, 0.3)',
				md: '0 0 15px rgba(0, 255, 255, 0.3)',
				lg: '0 0 25px rgba(0, 255, 255, 0.6)',
				xl: '0 0 50px rgba(0, 255, 255, 0.3)',
			},
			transitionDuration: {
				fast: '150ms',
				normal: '300ms',
				slow: '500ms',
			},
			zIndex: {
				dropdown: '100',
				modal: '1000',
				tooltip: '1100',
			},
			maxWidth: {
				'modal-sm': '400px',
				'modal-md': '600px',
				'modal-lg': '800px',
				'modal-xl': '1200px',
			},
			backgroundImage: {
				'gradient-primary':
					'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
				'gradient-card':
					'linear-gradient(135deg, rgba(15, 15, 25, 0.9) 0%, rgba(25, 25, 45, 0.9) 100%)',
				'gradient-overlay':
					'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)',
			},
			clipPath: {
				'panel-clip':
					'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
				'modal-clip':
					'polygon(10px 0%, calc(100% - 10px) 0%, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0% calc(100% - 10px), 0% 10px)',
			},
		},
	},
	plugins: [],
}

