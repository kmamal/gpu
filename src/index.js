const {
	create,
	renderGPUDeviceToWindow,
	globals,
	_refresh,
} = require('../dist/dawn.node')

setInterval(() => {
	const shouldAbort = _refresh()
	if (shouldAbort) { process.exit(1) }
}, 100).unref()

module.exports = {
	create,
	renderGPUDeviceToWindow,
	...globals,
}
