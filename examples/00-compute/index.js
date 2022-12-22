import gpu from '@kmamal/gpu'
import Fs from 'node:fs'
import Path from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

const instance = gpu.create([])
const adapter = await instance.requestAdapter()
const device = await adapter.requestDevice()

const matrix1 = new Float32Array([
	2, // Rows
	4, // Columns
	...[ 1, 2, 3, 4 ],
	...[ 5, 6, 7, 8 ],
])

const gpuBufferMatrix1 = device.createBuffer({
	mappedAtCreation: true,
	size: matrix1.byteLength,
	usage: gpu.BufferUsage.STORAGE,
})
new Float32Array(gpuBufferMatrix1.getMappedRange()).set(matrix1)
gpuBufferMatrix1.unmap()

const matrix2 = new Float32Array([
	4, // Rows
	2, // Columns
	...[ 1, 2 ],
	...[ 3, 4 ],
	...[ 5, 6 ],
	...[ 7, 8 ],
])

const gpuBufferMatrix2 = device.createBuffer({
	mappedAtCreation: true,
	size: matrix2.byteLength,
	usage: gpu.BufferUsage.STORAGE,
})
new Float32Array(gpuBufferMatrix2.getMappedRange()).set(matrix2)
gpuBufferMatrix2.unmap()

const resultSize = Float32Array.BYTES_PER_ELEMENT * (2 + matrix1[0] * matrix2[1])
const resultBuffer = device.createBuffer({
	size: resultSize,
	usage: gpu.BufferUsage.STORAGE | gpu.BufferUsage.COPY_SRC,
})

const gpuReadBuffer = device.createBuffer({
	size: resultSize,
	usage: gpu.BufferUsage.COPY_DST | gpu.BufferUsage.MAP_READ,
})

const computeShaderFile = Path.join(__dirname, 'compute.wgsl')
const computeShaderCode = await Fs.promises.readFile(computeShaderFile, 'utf8')

const computePipeline = device.createComputePipeline({
	layout: 'auto',
	compute: {
		module: device.createShaderModule({ code: computeShaderCode }),
		entryPoint: "main",
	},
})

const bindGroup = device.createBindGroup({
	layout: computePipeline.getBindGroupLayout(0),
	entries: [
		{
			binding: 0,
			resource: { buffer: gpuBufferMatrix1 },
		},
		{
			binding: 1,
			resource: { buffer: gpuBufferMatrix2 },
		},
		{
			binding: 2,
			resource: { buffer: resultBuffer },
		},
	],
})

const commandEncoder = device.createCommandEncoder()
const passEncoder = commandEncoder.beginComputePass()
passEncoder.setPipeline(computePipeline)
passEncoder.setBindGroup(0, bindGroup)
passEncoder.dispatchWorkgroups(
	Math.ceil(matrix1[0] / 8),
	Math.ceil(matrix2[1] / 8),
)
passEncoder.end()
commandEncoder.copyBufferToBuffer(resultBuffer, 0, gpuReadBuffer, 0, resultSize)
device.queue.submit([ commandEncoder.finish() ])

await gpuReadBuffer.mapAsync(gpu.MapMode.READ)
console.log(new Float32Array(gpuReadBuffer.getMappedRange()))

device.destroy()
