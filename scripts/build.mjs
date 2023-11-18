import Fs from 'fs'
import C from './util/common.js'

await Promise.all([
	C.dir.depotTools,
	C.dir.dawn,
	C.dir.build,
	C.dir.dist,
	C.dir.publish,
].map(async (dir) => {
	await Fs.promises.rm(dir, { recursive: true }).catch(() => {})
}))

await import('./download-depot-tools.mjs')
await import('./download-dawn.mjs')
await import('./configure.mjs')
await import('./make.mjs')
