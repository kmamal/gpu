const Fs = require('fs')
const Path = require('path')

const dir = {}
dir.root = Path.resolve(__dirname, '../..')
dir.depotTools = Path.join(dir.root, 'depot_tools')
dir.dawn = Path.join(dir.root, 'dawn')
dir.build = Path.join(dir.root, 'build')
dir.dist = Path.join(dir.root, 'dist')
dir.publish = Path.join(dir.root, 'publish')

const pkgPath = Path.join(dir.root, 'package.json')
const pkg = JSON.parse(Fs.readFileSync(pkgPath).toString())
const version = pkg.version
const [ , owner, repo ] = pkg.repository.url.match(/([^/:]+)\/([^/]+).git$/u)

const { platform, arch } = process
const targetArch = process.env.CROSS_COMPILE_ARCH || arch
const assetName = `dawn-v${version}-${platform}-${targetArch}.tar.gz`

const { depotTools, dawn } = pkg
depotTools.env = platform === 'win32' ? {
	DEPOT_TOOLS_WIN_TOOLCHAIN: '0',
	PATH: `${dir.depotTools};${process.env.PATH}`,
} : {
	PATH: `${dir.depotTools}:${process.env.PATH}`,
}

module.exports = {
	dir,
	version,
	owner,
	repo,
	platform,
	arch,
	targetArch,
	assetName,
	depotTools,
	dawn,
}
