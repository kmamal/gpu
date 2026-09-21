const {
	_create,
	renderGPUDeviceToWindow,
	globals,
} = require('../dist/dawn.node')

let numInstances = 0
let interval = null

const instanceAdded = () => {
	if (numInstances++ === 0) {
		interval = setInterval(() => {}, 60e3)
	}
}

const instanceRemoved = () => {
	if (--numInstances === 0) {
		clearInterval(interval)
		interval = null
	}
}

const instances = new Set()

const create = (...args) => {
	const instance = _create(...args)
	instances.add(instance)
	instanceAdded()
	return instance
}

const destroy = (instance) => {
	if (!instances.delete(instance)) { return }
	instanceRemoved()
}

module.exports = {
	create,
	destroy,
	renderGPUDeviceToWindow,
	...globals,
}
