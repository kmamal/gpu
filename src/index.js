const {
	_create,
	renderGPUDeviceToWindow,
	globals,
} = require('../dist/dawn.node')

const instances = new Set()

const fn = () => { instances.delete(null) }
let interval = null

const create = (...args) => {
	const instance = _create(...args)

	if (instances.size === 0) {
		interval = setInterval(fn, 60e3)
	}
	instances.add(instance)

	return instance
}

const destroy = (instance) => {
	instances.delete(instance)
	if (instances.size === 0) {
		clearInterval(interval)
		interval = null
	}
}

module.exports = {
	create,
	destroy,
	renderGPUDeviceToWindow,
	...globals,
}
