// Design system tokens
export const theme = {
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
	fonts: {
		primary: ["'Courier New'", 'monospace'],
		secondary: 'inherit',
	},
	spacing: {
		xs: '0.25rem',
		sm: '0.5rem',
		md: '0.75rem',
		lg: '1rem',
		xl: '1.5rem',
		xxl: '2rem',
	},
	transitions: {
		fast: '150ms',
		normal: '300ms',
		slow: '500ms',
	},
} as const

