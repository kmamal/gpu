import gpu from '@kmamal/gpu'

const instance = gpu.create([])
const adapter = await instance.requestAdapter()
const device = await adapter.requestDevice()
