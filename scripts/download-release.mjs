import Fs from 'fs'
import Zlib from 'zlib'
import Stream from 'stream'
import Crypto from 'crypto'
import C from './util/common.js'
import { unpackTar } from 'modern-tar/fs'

console.log("get release info", C.version)
const releaseResponse = await fetch(
	`https://api.github.com/repos/${C.owner}/${C.repo}/releases/tags/v${C.version}`,
	{ headers: { "Accept": 'application/vnd.github+json', 'User-Agent': `@${C.owner}/${C.repo}@${C.version}` } },
)
if (!releaseResponse.ok) { throw new Error(`bad status code ${releaseResponse.status}`) }
const asset = (await releaseResponse.json()).assets.find((x) => x.name === C.assetName)
if (!asset || !asset.digest) { throw new Error(`missing integrity digest for asset ${C.assetName}`) }
const [ digestAlgo, expectedDigest ] = asset.digest.split(':')

const url = `https://github.com/${C.owner}/${C.repo}/releases/download/v${C.version}/${C.assetName}`

console.log("fetch", url)
const response = await fetch(url)
if (!response.ok) { throw new Error(`bad status code ${response.status}`) }
const buffer = Buffer.from(await response.arrayBuffer())

console.log("verify integrity", C.assetName)
const actualDigest = Crypto.createHash(digestAlgo).update(buffer).digest('hex')
if (actualDigest !== expectedDigest) { throw new Error(`integrity check failed for asset ${C.assetName}`) }

console.log("unpack to", C.dir.dist)
await Fs.promises.rm(C.dir.dist, { recursive: true }).catch(() => {})
await Fs.promises.mkdir(C.dir.dist, { recursive: true })
await Stream.promises.pipeline(
	Stream.Readable.from(buffer),
	Zlib.createGunzip(),
	unpackTar(C.dir.dist),
)
