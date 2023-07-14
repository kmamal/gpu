import Fs from 'fs'
import { execSync } from 'child_process'
import C from './util/common.js'

console.log("clone", C.depotTools.url)
await Fs.promises.rm(C.dir.depotTools, { recursive: true }).catch(() => {})
execSync([
	`mkdir ${C.dir.depotTools}`,
	`cd ${C.dir.depotTools}`,
	'git init',
	`git remote add origin ${C.depotTools.url}`,
	`git fetch --depth 1 origin ${C.depotTools.commit}`,
	'git checkout FETCH_HEAD',
].join(' && '), {
	stdio: 'inherit',
	cwd: C.dir.root,
})

if (C.platform === 'win32') {
	execSync('gclient', {
		stdio: 'inherit',
		env: {
			...process.env,
			...C.depotTools.env,
		},
	})

	await Fs.promises.rm(`${C.dir.depotTools}/ninja`)
}
