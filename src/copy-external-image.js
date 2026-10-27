const { globals: { GPUTexture, GPUTextureUsage } } = require('../dist/dawn.node')

const { COPY_DST, RENDER_ATTACHMENT } = GPUTextureUsage

const FORMATS = {
	'r8unorm': { bytesPerTexel: 1, channels: [ 0 ], kind: 'u8' },
	'rg8unorm': { bytesPerTexel: 2, channels: [ 0, 1 ], kind: 'u8' },
	'rgba8unorm': { bytesPerTexel: 4, channels: [ 0, 1, 2, 3 ], kind: 'u8' },
	'rgba8unorm-srgb': { bytesPerTexel: 4, channels: [ 0, 1, 2, 3 ], kind: 'u8' },
	'bgra8unorm': { bytesPerTexel: 4, channels: [ 2, 1, 0, 3 ], kind: 'u8' },
	'bgra8unorm-srgb': { bytesPerTexel: 4, channels: [ 2, 1, 0, 3 ], kind: 'u8' },
	'r16float': { bytesPerTexel: 2, channels: [ 0 ], kind: 'f16' },
	'rg16float': { bytesPerTexel: 4, channels: [ 0, 1 ], kind: 'f16' },
	'rgba16float': { bytesPerTexel: 8, channels: [ 0, 1, 2, 3 ], kind: 'f16' },
	'r32float': { bytesPerTexel: 4, channels: [ 0 ], kind: 'f32' },
	'rg32float': { bytesPerTexel: 8, channels: [ 0, 1 ], kind: 'f32' },
	'rgba32float': { bytesPerTexel: 16, channels: [ 0, 1, 2, 3 ], kind: 'f32' },
	'rgb10a2unorm': { bytesPerTexel: 4, channels: [ 0, 1, 2, 3 ], kind: 'rgb10a2' },
}

const scratch = new DataView(new ArrayBuffer(8))

const toHalf = (value) => {
	scratch.setFloat64(0, value)
	const high = scratch.getUint32(0)
	const sticky = scratch.getUint32(4) !== 0
	const sign = (high >>> 16) & 0x8000
	const exponent = ((high >>> 20) & 0x7ff) - 1008
	let mantissa = high & 0xfffff
	if (exponent >= 31) { return sign | 0x7c00 }
	if (exponent <= 0) {
		if (exponent < -10) { return sign }
		mantissa |= 0x100000
		const shift = 11 - exponent
		let half = mantissa >>> shift
		const rest = mantissa & ((1 << shift) - 1)
		const midpoint = 1 << (shift - 1)
		if (rest > midpoint || (rest === midpoint && (sticky || (half & 1)))) { half++ }
		return sign | half
	}
	let half = (exponent << 10) | (mantissa >>> 10)
	const rest = mantissa & 0x3ff
	if (rest > 0x200 || (rest === 0x200 && (sticky || (half & 1)))) { half++ }
	return sign | half
}

const HALF_TABLE = new Uint16Array(256)
const FLOAT_TABLE = new Float64Array(256)
for (let i = 0; i < 256; i++) {
	FLOAT_TABLE[i] = i / 255
	HALF_TABLE[i] = toHalf(i / 255)
}

const isObject = (value) => value !== null && (typeof value === 'object' || typeof value === 'function')

const toCoordinate = (value, name) => {
	if (typeof value === 'bigint') { throw new TypeError(`${name} is a BigInt`) }
	const number = Number(value)
	if (!Number.isFinite(number)) { throw new TypeError(`${name} is not a finite number`) }
	const integer = Math.trunc(number)
	if (integer < 0 || integer > 0xffffffff) { throw new TypeError(`${name} is outside the range of an unsigned long`) }
	return integer
}

const parseSequence = (value, keys, name) => {
	if (!isObject(value)) {
		if (value === undefined) { return keys.map(() => 0) }
		throw new TypeError(`${name} must be a sequence or a dictionary`)
	}
	if (typeof value[Symbol.iterator] === 'function') {
		const items = Array.from(value)
		if (items.length > keys.length) {
			throw new TypeError(`${name} has an invalid number of elements`)
		}
		return keys.map((key, index) => index < items.length ? toCoordinate(items[index], `${name}[${index}]`) : 0)
	}
	return keys.map((key) => value[key] === undefined ? 0 : toCoordinate(value[key], `${name}.${key}`))
}

const parseOrigin2D = (value) => parseSequence(value, [ 'x', 'y' ], 'source.origin')

const parseOrigin3D = (value) => parseSequence(value, [ 'x', 'y', 'z' ], 'destination.origin')

const parseExtent3D = (value) => {
	if (isObject(value) && !(typeof value[Symbol.iterator] === 'function')) {
		if (value.width === undefined) { throw new TypeError('copySize.width is required') }
		return [
			toCoordinate(value.width, 'copySize.width'),
			value.height === undefined ? 1 : toCoordinate(value.height, 'copySize.height'),
			value.depthOrArrayLayers === undefined ? 1 : toCoordinate(value.depthOrArrayLayers, 'copySize.depthOrArrayLayers'),
		]
	}
	if (!isObject(value)) { throw new TypeError('copySize must be a sequence or a dictionary') }
	const items = Array.from(value)
	if (items.length < 1 || items.length > 3) {
		throw new TypeError('copySize has an invalid number of elements')
	}
	return [
		toCoordinate(items[0], 'copySize[0]'),
		items.length < 2 ? 1 : toCoordinate(items[1], 'copySize[1]'),
		items.length < 3 ? 1 : toCoordinate(items[2], 'copySize[2]'),
	]
}

const isPixelArray = (data) => data instanceof Uint8Array || data instanceof Uint8ClampedArray

const isDimension = (value) => Number.isInteger(value) && value >= 0

const resolveSource = (source) => {
	if (!isObject(source)) {
		throw new TypeError('source.source is not a supported image source')
	}

	if (isPixelArray(source.data) && isDimension(source.width) && isDimension(source.height)) {
		const { width, height, data } = source
		if (data.buffer.detached) {
			throw new DOMException('source.source data is detached', 'InvalidStateError')
		}
		if (data.length < width * height * 4) {
			throw new DOMException('source.source data is too small for its dimensions', 'OperationError')
		}
		return {
			width,
			height,
			read: (x, y) => ({ data, stride: width * 4, offset: (y * width + x) * 4 }),
		}
	}

	if (typeof source.getContext === 'function' && isDimension(source.width) && isDimension(source.height)) {
		const context = source.getContext('2d')
		if (!isObject(context) || typeof context.getImageData !== 'function') {
			throw new TypeError('source.source canvas does not provide a 2d context')
		}
		return {
			width: source.width,
			height: source.height,
			read: (x, y, w, h) => {
				const image = context.getImageData(x, y, w, h)
				if (!image || !isPixelArray(image.data) || image.data.length < w * h * 4) {
					throw new TypeError('source.source canvas returned invalid image data')
				}
				return { data: image.data, stride: w * 4, offset: 0 }
			},
		}
	}

	throw new TypeError('source.source is not a supported image source')
}

const queueDevices = new WeakMap()

const registerDevice = (device) => {
	queueDevices.set(device.queue, device)
	return device
}

const reportValidationError = (device, message) => {
	const label = `copyExternalImageToTexture: ${message}`
	device.createBuffer({ label, size: 4, usage: 0 }).destroy()
}

const validateDestination = (texture) => {
	if (!FORMATS[texture.format]) {
		return `destination.texture.format '${texture.format}' is not supported`
	}
	if ((texture.usage & COPY_DST) === 0 || (texture.usage & RENDER_ATTACHMENT) === 0) {
		return 'destination.texture.usage must include COPY_DST and RENDER_ATTACHMENT'
	}
	if (texture.dimension !== '2d') {
		return 'destination.texture.dimension must be 2d'
	}
	if (texture.sampleCount !== 1) {
		return 'destination.texture.sampleCount must be 1'
	}
	return null
}

const isRgba8 = (format) => format.kind === 'u8' && format.bytesPerTexel === 4 && format.channels[0] === 0

const encode = (format, pixels, width, height, flipY, premultiply) => {
	const { bytesPerTexel, channels, kind } = format
	const { data, stride, offset } = pixels
	const numChannels = channels.length
	const bytesPerRow = width * bytesPerTexel
	const buffer = new ArrayBuffer(bytesPerRow * height)
	const u8 = new Uint8Array(buffer)
	const u16 = kind === 'f16' ? new Uint16Array(buffer) : null
	const f32 = kind === 'f32' ? new Float32Array(buffer) : null
	const u32 = kind === 'rgb10a2' ? new Uint32Array(buffer) : null

	const copyRows = !premultiply && isRgba8(format)

	for (let row = 0; row < height; row++) {
		const srcRow = flipY ? height - 1 - row : row
		let src = offset + srcRow * stride

		if (copyRows) {
			u8.set(data.subarray(src, src + width * 4), row * bytesPerRow)
			continue
		}

		let dst = row * width * numChannels

		for (let col = 0; col < width; col++, src += 4) {
			const alpha = data[src + 3]
			if (kind === 'u8') {
				for (let i = 0; i < numChannels; i++) {
					const channel = channels[i]
					const value = data[src + channel]
					u8[dst++] = premultiply && channel !== 3 ? Math.round(value * alpha / 255) : value
				}
			}
			else if (kind === 'f16') {
				for (let i = 0; i < numChannels; i++) {
					const channel = channels[i]
					const value = data[src + channel]
					u16[dst++] = premultiply && channel !== 3 && alpha !== 255
						? toHalf(FLOAT_TABLE[value] * FLOAT_TABLE[alpha])
						: HALF_TABLE[value]
				}
			}
			else if (kind === 'f32') {
				for (let i = 0; i < numChannels; i++) {
					const channel = channels[i]
					const value = data[src + channel]
					f32[dst++] = premultiply && channel !== 3
						? FLOAT_TABLE[value] * FLOAT_TABLE[alpha]
						: FLOAT_TABLE[value]
				}
			}
			else {
				const scale = premultiply ? FLOAT_TABLE[alpha] : 1
				const r = Math.round(FLOAT_TABLE[data[src]] * scale * 1023)
				const g = Math.round(FLOAT_TABLE[data[src + 1]] * scale * 1023)
				const b = Math.round(FLOAT_TABLE[data[src + 2]] * scale * 1023)
				const a = Math.round(FLOAT_TABLE[alpha] * 3)
				u32[dst / 4] = (r | (g << 10) | (b << 20) | (a << 30)) >>> 0
				dst += 4
			}
		}
	}

	return { data: u8, bytesPerRow }
}

const copyExternalImageToTexture = function (source, destination, copySize) {
	const device = queueDevices.get(this)
	if (!device) { throw new TypeError('Illegal invocation') }
	if (arguments.length < 3) {
		throw new TypeError(`3 arguments required, but only ${arguments.length} present`)
	}
	if (!isObject(source)) { throw new TypeError('source must be a dictionary') }
	if (!isObject(destination)) { throw new TypeError('destination must be a dictionary') }
	if (source.source === undefined) { throw new TypeError('source.source is required') }
	if (destination.texture === undefined) { throw new TypeError('destination.texture is required') }

	const [ srcX, srcY ] = parseOrigin2D(source.origin)
	const flipY = Boolean(source.flipY)

	const { texture } = destination
	if (!(texture instanceof GPUTexture)) {
		throw new TypeError('destination.texture is not a GPUTexture')
	}
	const mipLevel = destination.mipLevel === undefined ? 0 : toCoordinate(destination.mipLevel, 'destination.mipLevel')
	const [ dstX, dstY, dstZ ] = parseOrigin3D(destination.origin)
	const aspect = destination.aspect === undefined ? 'all' : String(destination.aspect)
	if (![ 'all', 'stencil-only', 'depth-only' ].includes(aspect)) {
		throw new TypeError(`'${aspect}' is not a valid GPUTextureAspect`)
	}
	const colorSpace = destination.colorSpace === undefined ? 'srgb' : String(destination.colorSpace)
	if (![ 'srgb', 'display-p3' ].includes(colorSpace)) {
		throw new TypeError(`'${colorSpace}' is not a valid PredefinedColorSpace`)
	}
	if (colorSpace !== 'srgb') {
		throw new DOMException(`destination.colorSpace '${colorSpace}' is not supported`, 'NotSupportedError')
	}
	const premultipliedAlpha = Boolean(destination.premultipliedAlpha)

	const [ width, height, depth ] = parseExtent3D(copySize)

	const resolved = resolveSource(source.source)
	if (srcX + width > resolved.width || srcY + height > resolved.height) {
		throw new DOMException('source.origin + copySize is out of the bounds of the source image', 'OperationError')
	}

	if (depth > 1) {
		throw new DOMException('copySize.depthOrArrayLayers must be at most 1', 'OperationError')
	}

	const error = validateDestination(texture)
	if (error) {
		reportValidationError(device, error)
		return
	}

	const format = FORMATS[texture.format]
	const write = (data, offset, bytesPerRow) => this.writeTexture(
		{ texture, mipLevel, origin: { x: dstX, y: dstY, z: dstZ }, aspect },
		data,
		{ offset, bytesPerRow, rowsPerImage: height },
		{ width, height, depthOrArrayLayers: depth },
	)

	if (width === 0 || height === 0 || depth === 0) {
		write(new Uint8Array(0), 0, width * format.bytesPerTexel)
		return
	}

	const pixels = resolved.read(srcX, srcY, width, height)
	if (!flipY && !premultipliedAlpha && isRgba8(format)) {
		write(pixels.data, pixels.offset, pixels.stride)
		return
	}

	const { data, bytesPerRow } = encode(format, pixels, width, height, flipY, premultipliedAlpha)
	write(data, 0, bytesPerRow)
}

module.exports = {
	copyExternalImageToTexture,
	registerDevice,
}
