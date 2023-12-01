const {
	create,
	renderGPUDeviceToWindow,
	globals,
	_refresh,
} = require('../dist/dawn.node')

setInterval(_refresh, 100).unref()

module.exports = {
	create,
	renderGPUDeviceToWindow,
	...globals,
}
