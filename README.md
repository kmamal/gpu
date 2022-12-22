# @kmamal/gpu

[![Package](https://img.shields.io/npm/v/%2540kmamal%252Fgpu)](https://www.npmjs.com/package/@kmamal/gpu)
[![Dependencies](https://img.shields.io/librariesio/release/npm/@kmamal/gpu)](https://libraries.io/npm/@kmamal%2Fgpu)
[![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/%2540kmamal%252Fgpu)](https://snyk.io/test/npm/@kmamal/gpu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> BEWARE: The [WebGPU specification](https://gpuweb.github.io/gpuweb/) is still a work-in-progress and could change at any time.

WebGPU for Node.js via [Google Dawn](https://dawn.googlesource.com/dawn/+/refs/heads/main/src/dawn/node/).
Allows you to use WebGPU without having to use a browser.

Check the [examples](https://github.com/kmamal/node-sdl/tree/master/examples) for how to use this package. You can use both [compute](https://github.com/kmamal/node-sdl/tree/master/examples/00-compute), and [render](https://github.com/kmamal/node-sdl/tree/master/examples/01-render) pipelines, just note that there's no surface to display the render result on, so you have to read it out into a buffer to use it.

It should work on Linux, Mac, and Windows. Prebuilt binaries are available for x64 architectures, and arm-based Macs.

### TODO

In the future you should be able to use this package together with [@kmamal/sdl](https://github.com/kmamal/node-sdl#readme) to get direct rendering to window surfaces.
The goal of this package is to be for WebGPU what [@kmamal/gl](https://github.com/kmamal/headless-gl#readme) is for WebGL.
