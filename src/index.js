const {
	_create,
	renderGPUDeviceToWindow,
	globals,
} = require('../dist/dawn.node')

// The addon does nothing to hold the event loop open, so while instances
// exist the process is kept alive with a ref'd (but otherwise useless)
// interval. Instances are tracked without strong references: an instance
// that gets garbage collected without an explicit destroy() releases its
// hold on the process via the FinalizationRegistry.

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

const instances = new WeakSet()
const registry = new FinalizationRegistry(instanceRemoved)

const create = (...args) => {
	const instance = _create(...args)
	instances.add(instance)
	registry.register(instance, null, instance)
	instanceAdded()
	return instance
}

const destroy = (instance) => {
	if (!instances.delete(instance)) { return }
	registry.unregister(instance)
	instanceRemoved()
}

module.exports = {
	create,
	destroy,
	renderGPUDeviceToWindow,
	...globals,
}
