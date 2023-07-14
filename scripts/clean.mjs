import Fs from 'fs'
import Path from 'path'
import C from './util/common.js'

const dirs = [
	Path.join(C.dir.root, 'node_modules'),
	C.dir.depotTools,
	C.dir.dawn,
	C.dir.build,
	C.dir.dist,
	C.dir.publish,
]

console.log("delete")
await Promise.all(dirs.map(async (dir) => {
	console.log("  ", dir)
	await Fs.promises.rm(dir, { recursive: true }).catch(() => {})
}))
