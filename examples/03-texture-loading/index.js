import sdl from '@kmamal/sdl'
import gpu from '@kmamal/gpu'
import { PNG } from 'pngjs'

import fs from 'node:fs'
import path from 'node:path'

const window = sdl.video.createWindow({ webgpu: true })
const { pixelWidth: width, pixelHeight: height } = window

const instance = gpu.create([ "verbose=1" ])
const adapter = await instance.requestAdapter()
const device = await adapter.requestDevice()
const renderer = gpu.renderGPUDeviceToWindow({ device, window })


const shaderFile = path.join(import.meta.dirname, 'shaders.wgsl')
const shaderCode = await fs.promises.readFile(shaderFile, 'utf8')
const shaderModule = device.createShaderModule({ code: shaderCode })


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

const vertices = new Float32Array([
	/* eslint-disable @stylistic/array-element-newline */
	-1.0, -1.0,
	+1.0, -1.0,
	+1.0, +1.0,
	-1.0, +1.0,
	/* eslint-enable @stylistic/array-element-newline */
])
const vertexBuffer = createBuffer(vertices, gpu.GPUBufferUsage.VERTEX)

const indices = new Uint16Array([
	/* eslint-disable @stylistic/array-element-newline */
	0, 1, 2,
	2, 3, 0,
	/* eslint-enable @stylistic/array-element-newline */
])
const indexBuffer = createBuffer(indices, gpu.GPUBufferUsage.INDEX)


const pngFile = path.join(import.meta.dirname, 'assets/image.png')
const pngData = await fs.promises.readFile(pngFile)
const image = PNG.sync.read(pngData)

const texture = device.createTexture({
	size: { width: image.width, height: image.height },
	format: 'rgba8unorm',
	usage: gpu.GPUTextureUsage.TEXTURE_BINDING | gpu.GPUTextureUsage.COPY_DST,
})

device.queue.writeTexture(
	{ texture },
	image.data,
	{ bytesPerRow: 4 * image.width },
	{ width: image.width, height: image.height },
)

const sampler = device.createSampler({
	addressModeU: 'repeat',
	addressModeV: 'repeat',
	magFilter: 'linear',
	minFilter: 'linear',
})


const bindGroupLayout = device.createBindGroupLayout({
	entries: [
		{
			binding: 0,
			visibility: gpu.GPUShaderStage.FRAGMENT,
			texture: {},
		},
		{
			binding: 1,
			visibility: gpu.GPUShaderStage.FRAGMENT,
			sampler: {},
		},
	],
})

const pipeline = device.createRenderPipeline({
	layout: device.createPipelineLayout({
		bindGroupLayouts: [ bindGroupLayout ],
	}),
	vertex: {
		module: shaderModule,
		entryPoint: 'vert_main',
		buffers: [
			{
				attributes: [
					{
						shaderLocation: 0,
						offset: 0,
						format: 'float32x2',
					},
				],
				arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
				stepMode: 'vertex',
			},
		],
	},
	fragment: {
		module: shaderModule,
		entryPoint: 'frag_main',
		targets: [ { format: renderer.getPreferredFormat() } ],
	},
	primitive: {
		topology: 'triangle-list',
	},
})

const bindGroup = device.createBindGroup({
	layout: bindGroupLayout,
	entries: [
		{ binding: 0, resource: texture.createView() },
		{ binding: 1, resource: sampler },
	],
})


const render = () => {
	if (window.destroyed) { return }

	const colorTextureView = renderer.getCurrentTextureView()

	const commandEncoder = device.createCommandEncoder()

	const renderPass = commandEncoder.beginRenderPass({
		colorAttachments: [
			{
				view: colorTextureView,
				clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
				loadOp: 'clear',
				storeOp: 'store',
			},
		],
	})
	renderPass.setPipeline(pipeline)
	renderPass.setBindGroup(0, bindGroup)
	renderPass.setViewport(0, 0, width, height, 0, 1)
	renderPass.setScissorRect(0, 0, width, height)
	renderPass.setVertexBuffer(0, vertexBuffer)
	renderPass.setIndexBuffer(indexBuffer, 'uint16')
	renderPass.drawIndexed(indices.length)
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
