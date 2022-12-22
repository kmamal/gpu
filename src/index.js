const Dawn = require('../dist/dawn.node')

Dawn.BufferUsage = {
	MAP_READ: 0x0001,
	MAP_WRITE: 0x0002,
	COPY_SRC: 0x0004,
	COPY_DST: 0x0008,
	INDEX: 0x0010,
	VERTEX: 0x0020,
	UNIFORM: 0x0040,
	STORAGE: 0x0080,
	INDIRECT: 0x0100,
	QUERY_RESOLVE: 0x0200,
}

Dawn.TextureUsage = {
	COPY_SRC: 0x01,
	COPY_DST: 0x02,
	TEXTURE_BINDING: 0x04,
	SAMPLED: 0x04,
	STORAGE_BINDING: 0x08,
	STORAGE: 0x08,
	RENDER_ATTACHMENT: 0x10,
}

Dawn.ColorWrite = {
	RED: 0x1,
	GREEN: 0x2,
	BLUE: 0x4,
	ALPHA: 0x8,
	ALL: 0xf,
}

Dawn.ShaderStage = {
	VERTEX: 0x1,
	FRAGMENT: 0x2,
	COMPUTE: 0x4,
}

Dawn.MapMode = {
	READ: 0x1,
	WRITE: 0x2,
}

module.exports = Dawn
