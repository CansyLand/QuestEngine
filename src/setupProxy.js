const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
	// Proxy API requests to the QuestEditor backend on port 31234
	app.use(
		'/api',
		createProxyMiddleware({
			target: 'http://localhost:31234',
			changeOrigin: true,
		})
	)
}
