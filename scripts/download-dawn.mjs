import Fs from 'fs'
import { execSync } from 'child_process'
import C from './util/common.js'

console.log("clone", C.dawn.url)
await Fs.promises.rm(C.dir.dawn, { recursive: true }).catch(() => {})
execSync([
	`mkdir ${C.dir.dawn}`,
	`cd ${C.dir.dawn}`,
	'git init',
	`git remote add origin ${C.dawn.url}`,
	`git fetch --depth 1 origin ${C.dawn.commit}`,
	'git checkout FETCH_HEAD',
].join(' && '), {
	stdio: 'inherit',
	cwd: C.dir.root,
})
