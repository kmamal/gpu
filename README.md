# @kmamal/gpu

[![Package](https://img.shields.io/npm/v/%2540kmamal%252Fgpu)](https://www.npmjs.com/package/@kmamal/gpu)
[![Dependencies](https://img.shields.io/librariesio/release/npm/@kmamal/gpu)](https://libraries.io/npm/@kmamal%2Fgpu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

WebGPU for Node.js via [Google Dawn](https://dawn.googlesource.com/dawn/+/refs/heads/main/src/dawn/node/).
Allows you to use WebGPU without a browser.

It should work on Linux, Mac, and Windows.
Prebuilt binaries are available for x64 architectures, and arm-based Macs.


## Instructions

Check the [examples](https://github.com/kmamal/gpu/tree/master/examples) for how to use this package.
You can use both [compute](https://github.com/kmamal/gpu/tree/master/examples/00-compute) and [render](https://github.com/kmamal/gpu/tree/master/examples/01-render) pipelines.
For render pipelines, you can either render the result to a buffer and save it as an image, or you can use [@kmamal/sdl](https://github.com/kmamal/node-sdl#readme) to render directly to a window as in [this example](https://github.com/kmamal/gpu/tree/master/examples/02-window).


# API Reference

## Contents

* [Globals](#globals)
* [gpu.create(flags)](#gpucreateflags)
* [gpu.destroy(instance)](#gpudestroyinstance)
* [gpu.renderGPUDeviceToWindow(options)](#gpurendergpudevicetowindowoptions)
* [class Renderer](#class-renderer)
  * [renderer.getCurrentTexture()](#renderergetcurrenttexture)
  * [renderer.getCurrentTextureView()](#renderergetcurrenttextureview)
  * [renderer.swap()](#rendererswap)
  * [renderer.resize()](#rendererresize)


### Globals

### gpu.create(flags)

* `flags: <string>[]` An array of flags to pass to dawn_node.

Creates a WebGPU instance object.
The returned object is equivalent to the browser's [`GPU`](https://developer.mozilla.org/en-US/docs/Web/API/GPU) object.

Any flags passed to the `create()` function must be in the form of `'key=value'`.
It is usually a good idea to pass at least the `'verbose=1'` flag to help with debugging.

### gpu.destroy(instance)

Instances created with [`gpu.create()`](#gpucreateflags) need to be cleaned up before the program exits.
Usually you will call `gpu.destroy(instance)` right after calling `device.destroy()`.

### gpu.renderGPUDeviceToWindow(options)

* `options: <object>`
  * `device: `[`<GPUDevice>`](http://developer.mozilla.org/en-US/docs/Web/API/GPUDevice) The device to render from.
  * `window: `[`<Window>`](https://github.com/kmamal/node-sdl?tab=readme-ov-file#class-window) The window to render to.
  * `presentMode: <string>` The swapchain mode. Default: `'fifo'`

Crates a Renderer object that is used to connect a device to a window so that the device output renders directly to the window.

Possible options for `presentMode` are `'fifo'`, `'fifoRelaxed'`, `'immediate'`, and `'mailbox'`.

### class Renderer

This class is not directly exposed by the API so you can't use it with the new operator.
Instead, objects returned by [`gpu.renderGPUDeviceToWindow()`](gpurendergpudevicetowindowoptions) are of this type.

### renderer.getCurrentTexture()

Return an object of type [`GPUTexture`](https://developer.mozilla.org/en-US/docs/Web/API/GPUTexture).
Things drawn to the texture will appear on the window when [`renderer.swap()`](#rendererswap) is called.

### renderer.getCurrentTextureView()

Return an object of type [`GPUTextureView`](https://developer.mozilla.org/en-US/docs/Web/API/GPUTextureView).
Things drawn to the texture view will appear on the window when [`renderer.swap()`](#rendererswap) is called.

### renderer.swap()

Call this function after your render pass to display the results on the window.

### renderer.resize()

Must be called after the window has been resized.
