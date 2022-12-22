
if (!process.env.BUILD_DAWN_FROM_SOURCE) {
	try {
		await import('./download-release.mjs')
		process.exit()
	} catch (error) {
		console.log("failed to download release")
	}
} else {
	console.log("skip download and build from source")
}

await import('./build.mjs')
