import Fs from 'fs'
import Path from 'path'
import { execSync } from 'child_process'
import C from './util/common.js'

console.log("build in", C.dir.build)
execSync(`ninja -v -C ${C.dir.build} dawn.node`, {
	stdio: 'inherit',
	env: {
		...process.env,
		...C.depotTools.env,
	},
})

console.log("copy to", C.dir.dist)
await Fs.promises.rm(C.dir.dist, { recursive: true }).catch(() => {})
await Fs.promises.mkdir(C.dir.dist, { recursive: true })
await Fs.promises.cp(
	Path.join(C.dir.build, 'dawn.node'),
	Path.join(C.dir.dist, 'dawn.node'),
)

// Strip binaries on linux
if (C.platform === 'linux') {
	execSync(`strip -s ${Path.join(C.dir.dist, 'dawn.node')}`)
}
