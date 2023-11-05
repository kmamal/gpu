const {
	create,
	renderGPUDeviceToWindow,
	globals,
} = require('../dist/dawn.node')

module.exports = {
	create,
	renderGPUDeviceToWindow,
	...globals,
}
