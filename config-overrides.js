const path = require('path')

module.exports = function override(config, env) {
	// Add path aliases for webpack
	config.resolve.alias = {
		...config.resolve.alias,
		'@': path.resolve(__dirname, 'src'),
	}

	// Ensure PostCSS is configured for Tailwind
	if (!config.module) {
		config.module = {}
	}
	if (!config.module.rules) {
		config.module.rules = []
	}

	return config
}
