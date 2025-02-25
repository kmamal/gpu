import Fs from 'fs'
import { execSync } from 'child_process'
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
let backendFlags = []
if (C.platform === 'darwin') {
	let arch = process.env.CROSS_COMPILE_ARCH ?? C.arch
	if (arch === 'x64') { arch = 'x86_64' }

	crossCompileFlag = `-DCMAKE_OSX_ARCHITECTURES="${arch}"`

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
} else if (C.platform === 'linux') {
	backendFlags = [
		'-DDAWN_USE_X11=ON',
		'-DDAWN_USE_WAYLAND=OFF',
	]
}

execSync(`cmake ${[
	'-S',
	`"${C.dir.dawn}"`,
	'-B',
	`"${C.dir.build}"`,
	'-GNinja',
	'-DCMAKE_BUILD_TYPE=Release',
	'-DDAWN_BUILD_NODE_BINDINGS=ON',
	'-DDAWN_BUILD_SAMPLES=OFF',
	'-DTINT_BUILD_TESTS=OFF',
	'-DTINT_BUILD_CMD_TOOLS=OFF',
	'-DDAWN_USE_GLFW=OFF',
	'-DDAWN_SUPPORTS_GLFW_FOR_WINDOWING=OFF',
	'-DDAWN_ENABLE_PIC=ON',
	'-DDAWN_ENABLE_SPIRV_VALIDATION=ON',
	'-DDAWN_ALWAYS_ASSERT=ON',
	crossCompileFlag,
	...backendFlags,
].filter(Boolean).join(' ')}`, {
	stdio: 'inherit',
	env: {
		...process.env,
		...C.depotTools.env,
		CFLAGS,
		LDFLAGS,
	},
})
