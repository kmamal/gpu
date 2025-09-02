import sdl from '@kmamal/sdl'
import gpu from '@kmamal/gpu'

import fs from 'node:fs'
import path from 'node:path'

const window = sdl.video.createWindow({ webgpu: true, resizable: true })

const instance = gpu.create([ 'verbose=1', 'enable-dawn-features=allow_unsafe_apis' ])
const adapter = await instance.requestAdapter()
const device = await adapter.requestDevice({
	requiredFeatures: [ 'texture-component-swizzle' ],
})
const renderer = gpu.renderGPUDeviceToWindow({ device, window })


const TARGET_WIDTH = 9
const TARGET_HEIGHT = 5

const targetTexture = device.createTexture({
	size: [ TARGET_WIDTH, TARGET_HEIGHT, 1 ],
	format: renderer.getPreferredFormat(),
	usage: gpu.GPUTextureUsage.RENDER_ATTACHMENT | gpu.GPUTextureUsage.TEXTURE_BINDING,
})
const targetTextureView = targetTexture.createView()

const nearestNeighborSampler = device.createSampler({
	magFilter: 'nearest',
	minFilter: 'nearest',
	addressModeU: 'clamp-to-edge',
	addressModeV: 'clamp-to-edge',
})

const viewportBuffer = device.createBuffer({
	size: 4 * Float32Array.BYTES_PER_ELEMENT,
	usage: gpu.GPUBufferUsage.UNIFORM | gpu.GPUBufferUsage.COPY_DST,
})

window.on('resize', () => {
	renderer.resize()

	const factorX = Math.floor(window.pixelWidth / TARGET_WIDTH)
	const factorY = Math.floor(window.pixelHeight / TARGET_HEIGHT)
	const factor = Math.min(factorX, factorY)

	const viewportWidth = factor * TARGET_WIDTH
	const viewportHeight = factor * TARGET_HEIGHT

	const viewportX = Math.floor((window.pixelWidth - viewportWidth) / 2)
	const viewportY = Math.floor((window.pixelHeight - viewportHeight) / 2)

	const viewportData = new Float32Array([
		viewportX,
		viewportY,
		viewportWidth,
		viewportHeight,
	])
	device.queue.writeBuffer(viewportBuffer, 0, viewportData)
})


const positions = new Float32Array([
	...[ +1.0, -1.0 ],
	...[ -1.0, -1.0 ],
	...[ +0.0, +1.0 ],
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

const shaderFile = path.join(import.meta.dirname, 'shaders.wgsl')
const shaderCode = await fs.promises.readFile(shaderFile, 'utf8')
const shaderModule = device.createShaderModule({ code: shaderCode })

const pipeline = device.createRenderPipeline({
	layout: 'auto',
	vertex: {
		module: shaderModule,
		entryPoint: 'vertex_main',
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
		module: shaderModule,
		entryPoint: 'fragment_main',
		targets: [ { format: targetTexture.format } ],
	},
	primitive: {
		topology: 'triangle-list',
	},
})


const quadPositions = new Float32Array([
	...[ -1.0, -1.0 ],
	...[ +1.0, -1.0 ],
	...[ +1.0, +1.0 ],
	...[ -1.0, +1.0 ],
])

const quadIndices = new Uint16Array([
	...[ 0, 1, 2 ],
	...[ 2, 3, 0 ],
])

const quadPositionBuffer = createBuffer(quadPositions, gpu.GPUBufferUsage.VERTEX)
const quadIndexBuffer = createBuffer(quadIndices, gpu.GPUBufferUsage.INDEX)

const upscaleShaderFile = path.join(import.meta.dirname, 'upscale-shaders.wgsl')
const upscaleShaderCode = await fs.promises.readFile(upscaleShaderFile, 'utf8')
const upscaleShaderModule = device.createShaderModule({ code: upscaleShaderCode })

const upscaleBindGroupLayout = device.createBindGroupLayout({
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
		{
			binding: 2,
			visibility: gpu.GPUShaderStage.FRAGMENT,
			buffer: { type: 'uniform' },
		},
	],
})

const upscalePipeline = device.createRenderPipeline({
	layout: device.createPipelineLayout({
		bindGroupLayouts: [ upscaleBindGroupLayout ],
	}),
	vertex: {
		module: upscaleShaderModule,
		entryPoint: 'vertex_main',
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
		module: upscaleShaderModule,
		entryPoint: 'fragment_main',
		targets: [ { format: renderer.getPreferredFormat() } ],
	},
	primitive: {
		topology: 'triangle-list',
	},
})

const upscaleBindGroup = device.createBindGroup({
	layout: upscaleBindGroupLayout,
	entries: [
		{ binding: 0, resource: targetTextureView },
		{ binding: 1, resource: nearestNeighborSampler },
		{ binding: 2, resource: viewportBuffer },
	],
})


const render = () => {
	if (window.destroyed) { return }

	const { pixelWidth: width, pixelHeight: height } = window

	const commandEncoder = device.createCommandEncoder()

	const renderPass = commandEncoder.beginRenderPass({
		colorAttachments: [
			{
				view: targetTextureView,
				clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
				loadOp: 'clear',
				storeOp: 'store',
			},
		],
	})
	renderPass.setPipeline(pipeline)
	renderPass.setViewport(0, 0, TARGET_WIDTH, TARGET_HEIGHT, 0, 1)
	renderPass.setScissorRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT)
	renderPass.setVertexBuffer(0, positionBuffer)
	renderPass.setVertexBuffer(1, colorBuffer)
	renderPass.setIndexBuffer(indexBuffer, 'uint16')
	renderPass.drawIndexed(indices.length)
	renderPass.end()

	const upscaleRenderPass = commandEncoder.beginRenderPass({
		colorAttachments: [
			{
				view: renderer.getCurrentTextureView(),
				clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
				loadOp: 'clear',
				storeOp: 'store',
			},
		],
	})
	upscaleRenderPass.setPipeline(upscalePipeline)
	upscaleRenderPass.setBindGroup(0, upscaleBindGroup)
	upscaleRenderPass.setViewport(0, 0, width, height, 0, 1)
	upscaleRenderPass.setScissorRect(0, 0, width, height)
	upscaleRenderPass.setVertexBuffer(0, quadPositionBuffer)
	upscaleRenderPass.setIndexBuffer(quadIndexBuffer, 'uint16')
	upscaleRenderPass.drawIndexed(quadIndices.length)
	upscaleRenderPass.end()

	device.queue.submit([ commandEncoder.finish() ])

	renderer.swap()

	setTimeout(render, 0)
}

render()

window.on('close', () => {
	device.destroy()
	gpu.destroy(instance)
})
