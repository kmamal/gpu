import gpu from '@kmamal/gpu'

const instance = gpu.create([])
const adapter = await instance.requestAdapter()
const device = await adapter.requestDevice()

const gpuWriteBuffer = device.createBuffer({
	mappedAtCreation: true,
	size: 4,
	usage: gpu.BufferUsage.MAP_WRITE | gpu.BufferUsage.COPY_SRC,
})
new Uint8Array(gpuWriteBuffer.getMappedRange()).set([ 0, 1, 2, 3 ])
gpuWriteBuffer.unmap()

const gpuReadBuffer = device.createBuffer({
	size: 4,
	usage: gpu.BufferUsage.COPY_DST | gpu.BufferUsage.MAP_READ,
})

const copyEncoder = device.createCommandEncoder()
copyEncoder.copyBufferToBuffer(gpuWriteBuffer, 0, gpuReadBuffer, 0, 4)
device.queue.submit([ copyEncoder.finish() ])

await gpuReadBuffer.mapAsync(gpu.MapMode.READ)
const copyArrayBuffer = gpuReadBuffer.getMappedRange()
console.log(new Uint8Array(copyArrayBuffer))
