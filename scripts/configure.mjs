import Fs from 'node:fs'
import { execSync } from 'node:child_process'
import C from './util/common.js'

process.chdir(C.dir.dawn)
await Fs.promises.copyFile('scripts/standalone-with-node.gclient', '.gclient')

console.log("run gclient sync")
execSync('gclient sync --no-history -j8 -vvv', {
	stdio: 'inherit',
	env: {
		...process.env,
		...C.depotTools.env,
		DEPOT_TOOLS_UPDATE: '0',
	},
})

console.log("configure build in", C.dir.build)

await Fs.promises.rm(C.dir.build, { recursive: true }).catch(() => {})
await Fs.promises.mkdir(C.dir.build, { recursive: true })

let CFLAGS
let LDFLAGS
let crossCompileFlag
if (C.platform === 'darwin') {
	crossCompileFlag = process.env.CROSS_COMPILE_ARCH
		? `-DCMAKE_OSX_ARCHITECTURES="${process.env.CROSS_COMPILE_ARCH}"`
		: ''

	if (C.targetArch === 'arm64') {
		CFLAGS = '-mmacosx-version-min=11.0'
		LDFLAGS = '-mmacosx-version-min=11.0'
	} else {
		CFLAGS = [
			'-mmacosx-version-min=10.9',
			'-DMAC_OS_X_VERSION_MIN_REQUIRED=1070',
		].join(' ')
		LDFLAGS = '-mmacosx-version-min=10.9'
	}
}

execSync(`cmake ${[
	'-S',
	`"${C.dir.dawn}"`,
	'-B',
	`"${C.dir.build}"`,
	'-GNinja',
	'-DCMAKE_BUILD_TYPE=Release',
	'-DDAWN_BUILD_NODE_BINDINGS=1',
	'-DDAWN_ENABLE_PIC=1',
	crossCompileFlag,
].filter(Boolean).join(' ')}`, {
	stdio: 'inherit',
	env: {
		...process.env,
		...C.depotTools.env,
		CFLAGS,
		LDFLAGS,
	},
})
