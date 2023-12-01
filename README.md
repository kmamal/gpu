# @kmamal/gpu

[![Package](https://img.shields.io/npm/v/%2540kmamal%252Fgpu)](https://www.npmjs.com/package/@kmamal/gpu)
[![Dependencies](https://img.shields.io/librariesio/release/npm/@kmamal/gpu)](https://libraries.io/npm/@kmamal%2Fgpu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> WARNING: The [WebGPU specification](https://gpuweb.github.io/gpuweb/) is still a work-in-progress.

WebGPU for Node.js via [Google Dawn](https://dawn.googlesource.com/dawn/+/refs/heads/main/src/dawn/node/).
Allows you to use WebGPU without a browser.

It should work on Linux, Mac, and Windows. Prebuilt binaries are available for x64 architectures, and arm-based Macs.


## Instructions

Check the [examples](https://github.com/kmamal/gpu/tree/master/examples) for how to use this package.
You can use both [compute](https://github.com/kmamal/gpu/tree/master/examples/00-compute) and [render](https://github.com/kmamal/gpu/tree/master/examples/01-render) pipelines.
For render pipelines, you can either render the result to a buffer and save it as an image, or you can use [@kmamal/sdl](https://github.com/kmamal/node-sdl#readme) to render directly to a window as in [this example](https://github.com/kmamal/gpu/tree/master/examples/02-window).
