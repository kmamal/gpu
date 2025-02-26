//
// Based on [this article](https://alain.xyz/blog/raw-webgpu) written by [Alain Galvan](https://github.com/alaingalvan)
//

import sdl from '@kmamal/sdl'
import gpu from '@kmamal/gpu'

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

const window = sdl.video.createWindow({ webgpu: true })
const { pixelWidth: width, pixelHeight: height } = window

const instance = gpu.create([ 'verbose=1' ])
const adapter = await instance.requestAdapter()
const device = await adapter.requestDevice()
const renderer = gpu.renderGPUDeviceToWindow({ device, window })

const positions = new Float32Array([
	...[ 1.0, -1.0, 0.0 ],
	...[ -1.0, -1.0, 0.0 ],
	...[ 0.0, 1.0, 0.0 ],
])

const colors = new Float32Array([
	...[ 1.0, 0.0, 0.0 ],
	...[ 0.0, 1.0, 0.0 ],
	...[ 0.0, 0.0, 1.0 ],
])

const indices = new Uint16Array([ 0, 1, 2 ])

const createBuffer = (arr, usage) => {
	const buffer = device.createBuffer({
		size: (arr.byteLength + 3) & ~3,
		usage,
		mappedAtCreation: true,
	})

	const writeArray = arr instanceof Uint16Array
		? new Uint16Array(buffer.getMappedRange())
		: new Float32Array(buffer.getMappedRange())
	writeArray.set(arr)
	buffer.unmap()
	return buffer
}

const positionBuffer = createBuffer(positions, gpu.GPUBufferUsage.VERTEX)
const colorBuffer = createBuffer(colors, gpu.GPUBufferUsage.VERTEX)
const indexBuffer = createBuffer(indices, gpu.GPUBufferUsage.INDEX)

const vertexShaderFile = path.join(__dirname, 'vertex.wgsl')
const vertexShaderCode = await fs.promises.readFile(vertexShaderFile, 'utf8')

const fragmentShaderFile = path.join(__dirname, 'fragment.wgsl')
const fragmentShaderCode = await fs.promises.readFile(fragmentShaderFile, 'utf8')

const pipeline = device.createRenderPipeline({
	layout: 'auto',
	vertex: {
		module: device.createShaderModule({ code: vertexShaderCode }),
		entryPoint: 'main',
		buffers: [
			{
				attributes: [
					{
						shaderLocation: 0,
						offset: 0,
						format: 'float32x3',
					},
				],
				arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
				stepMode: 'vertex',
			},
			{
				attributes: [
					{
						shaderLocation: 1,
						offset: 0,
						format: 'float32x3',
					},
				],
				arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
				stepMode: 'vertex',
			},
		],
	},
	fragment: {
		module: device.createShaderModule({ code: fragmentShaderCode }),
		entryPoint: 'main',
		targets: [ { format: renderer.getPreferredFormat() } ],
	},
	primitive: {
		topology: 'triangle-list',
	},
})

const render = () => {
	if (window.destroyed) { return }

	const commandEncoder = device.createCommandEncoder()

	const renderPass = commandEncoder.beginRenderPass({
		colorAttachments: [
			{
				view: renderer.getCurrentTextureView(),
				clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
				loadOp: 'clear',
				storeOp: 'store',
			},
		],
	})
	renderPass.setPipeline(pipeline)
	renderPass.setViewport(0, 0, width, height, 0, 1)
	renderPass.setScissorRect(0, 0, width, height)
	renderPass.setVertexBuffer(0, positionBuffer)
	renderPass.setVertexBuffer(1, colorBuffer)
	renderPass.setIndexBuffer(indexBuffer, 'uint16')
	renderPass.drawIndexed(3)
	renderPass.end()

	device.queue.submit([ commandEncoder.finish() ])

	renderer.swap()

	setTimeout(render, 0)
}

render()

window.on('close', () => {
	device.destroy()
	gpu.destroy(instance)
})
