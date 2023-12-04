const {
	create,
	renderGPUDeviceToWindow,
	globals,
	_processEvents,
} = require('../dist/dawn.node')

setInterval(_processEvents, 100).unref()

module.exports = {
	create,
	renderGPUDeviceToWindow,
	...globals,
}
