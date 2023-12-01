const {
	create,
	renderGPUDeviceToWindow,
	globals,
	_refresh,
} = require('../dist/dawn.node')

setInterval(() => {
	const error = _refresh()
	if (error) { throw new Error(error) }
}, 100).unref()

module.exports = {
	create,
	renderGPUDeviceToWindow,
	...globals,
}
