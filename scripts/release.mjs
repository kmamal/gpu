import { execSync } from 'child_process'

await import('./clean.mjs')

execSync('npm install', {
	stdio: 'inherit',
	env: {
		...process.env,
		BUILD_DAWN_FROM_SOURCE: 1,
	},
})

await import('./upload-release.mjs')
