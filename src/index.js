const {
	create,
	renderGPUDeviceToWindow,
	globals,
} = require('../dist/dawn.node')
const { copyExternalImageToTexture, registerDevice } = require('./copy-external-image')

const { requestDevice: nativeRequestDevice } = globals.GPUAdapter.prototype

Object.defineProperty(globals.GPUAdapter.prototype, 'requestDevice', {
	value: async function requestDevice (...args) {
		return registerDevice(await nativeRequestDevice.apply(this, args))
	},
	writable: true,
	configurable: true,
	enumerable: true,
})

Object.defineProperty(globals.GPUQueue.prototype, 'copyExternalImageToTexture', {
	value: copyExternalImageToTexture,
	writable: true,
	configurable: true,
	enumerable: true,
})

module.exports = {
	create,
	renderGPUDeviceToWindow,
	...globals,
}
