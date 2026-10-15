# @kmamal/gpu

[![Package](https://img.shields.io/npm/v/%2540kmamal%252Fgpu)](https://www.npmjs.com/package/@kmamal/gpu)
[![Dependencies](https://img.shields.io/librariesio/release/npm/@kmamal/gpu)](https://libraries.io/npm/@kmamal%2Fgpu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

WebGPU to Node.js through [Google Dawn](https://dawn.googlesource.com/dawn/+/refs/heads/main/src/dawn/node/), so you can use WebGPU without a browser.

It should work on Linux (X11 and Wayland), Mac, and Windows.
Prebuilt binaries exist for x64 and arm architectures on all supported platforms.


## Instructions

The [examples](https://github.com/kmamal/gpu/tree/master/examples) show how to use this package.
The package supports both [compute](https://github.com/kmamal/gpu/tree/master/examples/00-compute) and [render](https://github.com/kmamal/gpu/tree/master/examples/01-render) pipelines.
A render pipeline can write its result to a buffer that you save as an image.
It can also draw straight to a window through [@kmamal/sdl](https://github.com/kmamal/node-sdl#readme), as [this example](https://github.com/kmamal/gpu/tree/master/examples/02-window) shows.


# API Reference

## Contents

* [Globals](#globals)
* [gpu.create(flags)](#gpucreateflags)
* [gpu.renderGPUDeviceToWindow(options)](#gpurendergpudevicetowindowoptions)
* [class Renderer](#class-renderer)
  * [renderer.getPreferredFormat()](#renderergetpreferredformat)
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

### gpu.renderGPUDeviceToWindow(options)

* `options: <object>`
  * `device: `[`<GPUDevice>`](http://developer.mozilla.org/en-US/docs/Web/API/GPUDevice) The device to render from.
  * `window: `[`<Window>`](https://github.com/kmamal/node-sdl?tab=readme-ov-file#class-window) The window to render to.
  * `presentMode: <string>` The swapchain mode. Default: `'fifo'`
  * `format: <string>` The texture format of the window surface. Default: the first format the surface supports.
  * `usage: <number>` A combination of [`GPUTextureUsage`](https://developer.mozilla.org/en-US/docs/Web/API/GPUTextureUsage) flags for the surface texture. Default: `GPUTextureUsage.RENDER_ATTACHMENT`

Creates a Renderer object that connects a device to a window, so the device renders directly to the window.

Possible options for `presentMode` are `'fifo'`, `'fifoRelaxed'`, `'immediate'`, and `'mailbox'`.

If the requested `format` is not supported by the window, this function throws an error that lists the supported formats.
Pass `format: 'bgra8unorm'` to match what a browser canvas provides, so shaders have to do their own sRGB encoding.
The default format may be an `-srgb` one, in which case the hardware encodes the shader output for you.
Use [`renderer.getPreferredFormat()`](#renderergetpreferredformat) to find out which format was chosen.

### class Renderer

The API does not expose this class, so you can't call it with the new operator.
Instead, [`gpu.renderGPUDeviceToWindow()`](#gpurendergpudevicetowindowoptions) returns objects of this type.

### renderer.getPreferredFormat()

Returns the [`GPUTextureFormat`](https://developer.mozilla.org/en-US/docs/Web/API/GPUTextureFormat) of the window surface.
Use it as the format of the color targets in your render pipelines.

### renderer.getCurrentTexture()

Returns a [`GPUTexture`](https://developer.mozilla.org/en-US/docs/Web/API/GPUTexture).
Whatever you draw to the texture appears in the window when you call [`renderer.swap()`](#rendererswap).

### renderer.getCurrentTextureView()

Returns a [`GPUTextureView`](https://developer.mozilla.org/en-US/docs/Web/API/GPUTextureView).
Whatever you draw to the texture view appears in the window when you call [`renderer.swap()`](#rendererswap).

### renderer.swap()

Call this function after your render pass to show the results in the window.

### renderer.resize()

Call this function after you resize the window.

After you call `device.destroy()`, the renderer releases its window surface, and calling [`renderer.swap()`](#rendererswap), [`renderer.resize()`](#rendererresize), or either of the `getCurrentTexture` functions throws an error.
