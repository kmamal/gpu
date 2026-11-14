import T from '@kmamal/testing'
import gpu from '../src/index.js'

const { GPUTextureUsage, GPUBufferUsage, GPUMapMode } = gpu

let device = null
const getDevice = async () => {
	if (!device) {
		const instance = gpu.create([])
		const adapter = await instance.requestAdapter()
		device = await adapter.requestDevice()
	}
	return device
}

const rgbaFrame = (width, height) => {
	const data = new Uint8Array(width * height * 4)
	for (let i = 0; i < width * height; i++) { data.set([ i, 2 * i, 3 * i, 255 ], i * 4) }
	return { width, height, displayWidth: width, displayHeight: height, format: 'rgba', planes: [ data ], data, timestamp: 0, duration: 0.1, segment: 0 }
}

const fakeVideo = (frame) => ({ width: 0, height: 0, videoWidth: frame?.width ?? 0, videoHeight: frame?.height ?? 0, currentFrame: frame })

const readTexture = async (texture, width, height) => {
	const bytesPerRow = 256
	const buffer = device.createBuffer({ size: bytesPerRow * height, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ })
	const encoder = device.createCommandEncoder()
	encoder.copyTextureToBuffer({ texture }, { buffer, bytesPerRow }, { width, height })
	device.queue.submit([ encoder.finish() ])
	await buffer.mapAsync(GPUMapMode.READ)
	const mapped = new Uint8Array(buffer.getMappedRange())
	const out = new Uint8Array(width * height * 4)
	for (let row = 0; row < height; row++) {
		out.set(mapped.subarray(row * bytesPerRow, row * bytesPerRow + width * 4), row * width * 4)
	}
	buffer.unmap()
	buffer.destroy()
	return out
}

const createTexture = (width, height) => device.createTexture({
	size: [ width, height ],
	format: 'rgba8unorm',
	usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
})

T.test("copies a video element's current frame", async (t) => {
	await getDevice()
	const frame = rgbaFrame(3, 2)
	const texture = createTexture(3, 2)
	device.queue.copyExternalImageToTexture({ source: fakeVideo(frame) }, { texture }, [ 3, 2 ])
	t.equal(await readTexture(texture, 3, 2), frame.data)

	device.queue.copyExternalImageToTexture({ source: fakeVideo(frame), flipY: true }, { texture }, [ 3, 2 ])
	const flipped = await readTexture(texture, 3, 2)
	t.equal(flipped.subarray(0, 12), frame.data.subarray(12, 24))
	t.equal(flipped.subarray(12, 24), frame.data.subarray(0, 12))
	texture.destroy()
})

T.test("rejects video elements without an rgba frame", async (t) => {
	await getDevice()
	const texture = createTexture(2, 2)
	t.throwsWith(
		() => device.queue.copyExternalImageToTexture({ source: fakeVideo(null) }, { texture }, [ 2, 2 ]),
		(error) => { t.equal(error.name, 'InvalidStateError') },
	)
	const planar = { ...rgbaFrame(2, 2), format: 'yuv420p', data: undefined }
	t.throws(() => device.queue.copyExternalImageToTexture({ source: fakeVideo(planar) }, { texture }, [ 2, 2 ]))
	texture.destroy()
})

T.test("converts between straight and premultiplied alpha", async (t) => {
	await getDevice()
	const straight = new Uint8Array([ 200, 100, 50, 128, 10, 20, 30, 255, 40, 50, 60, 0 ])
	const premultiplied = new Uint8Array([ 100, 50, 25, 128, 10, 20, 30, 255, 0, 0, 0, 0 ])
	const texture = createTexture(3, 1)
	const copy = (data, isPremultiplied, premultipliedAlpha) => {
		const source = { width: 3, height: 1, data, premultiplied: isPremultiplied }
		device.queue.copyExternalImageToTexture({ source }, { texture, premultipliedAlpha }, [ 3, 1 ])
		return readTexture(texture, 3, 1)
	}

	t.equal(await copy(straight, false, false), straight)
	t.equal(await copy(straight, false, true), premultiplied)
	t.equal(await copy(premultiplied, true, true), premultiplied)
	t.equal(await copy(premultiplied, true, false), new Uint8Array([ 199, 100, 50, 128, 10, 20, 30, 255, 0, 0, 0, 0 ]))
	t.equal(await copy(straight, undefined, true), premultiplied)
	texture.destroy()
})

T.test("cleanup", () => {
	device?.destroy()
})
