# @kmamal/gpu

[![Package](https://img.shields.io/npm/v/%2540kmamal%252Fgpu)](https://www.npmjs.com/package/@kmamal/gpu)
[![Dependencies](https://img.shields.io/librariesio/release/npm/@kmamal/gpu)](https://libraries.io/npm/@kmamal%2Fgpu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

WebGPU for Node.js via [Google Dawn](https://dawn.googlesource.com/dawn/+/refs/heads/main/src/dawn/node/), so you can use WebGPU without a browser.
It can draw directly to windows via [`@kmamal/sdl`](https://github.com/kmamal/node-sdl#readme).

It should work on Linux (X11 and Wayland), Mac, and Windows.
Prebuilt binaries exist for x64 and arm architectures on all supported platforms.


## Instructions

The [examples](https://github.com/kmamal/gpu/tree/master/examples) show how to use this package.
The package supports both [compute](https://github.com/kmamal/gpu/tree/master/examples/00-compute) and [render](https://github.com/kmamal/gpu/tree/master/examples/01-render) pipelines.
A render pipeline can write its result to a buffer that you save as an image.
It can also draw straight to a window through [@kmamal/sdl](https://github.com/kmamal/node-sdl#readme), as [this example](https://github.com/kmamal/gpu/tree/master/examples/02-window) shows.


# API Reference

## Contents

- [Globals](#globals)
- [gpu.create(flags)](#gpucreateflags)
- [gpu.renderGPUDeviceToWindow(options)](#gpurendergpudevicetowindowoptions)
- [class Renderer](#class-renderer)
  - [renderer.getPreferredFormat()](#renderergetpreferredformat)
  - [renderer.getCurrentTexture()](#renderergetcurrenttexture)
  - [renderer.getCurrentTextureView()](#renderergetcurrenttextureview)
  - [renderer.swap()](#rendererswap)
  - [renderer.resize()](#rendererresize)
- [`queue.copyExternalImageToTexture(source, destination, copySize)`](#queuecopyexternalimagetotexturesource-destination-copysize)


### Globals

### gpu.create(flags)

- `flags: <string>[]` An array of flags to pass to dawn_node.
- Returns: `<WebGPU>` a WebGPU instance object.

The returned object is equivalent to the browser's [`GPU`](https://developer.mozilla.org/en-US/docs/Web/API/GPU) object.

Any flags passed to the `create()` function must be in the form of `'key=value'`.
It is usually a good idea to pass at least the `'verbose=1'` flag to help with debugging.

### gpu.renderGPUDeviceToWindow(options)

- `options: <object>`
  - `device: `[`<GPUDevice>`](http://developer.mozilla.org/en-US/docs/Web/API/GPUDevice) The device to render from.
  - `window: `[`<Window>`](https://github.com/kmamal/node-sdl?tab=readme-ov-file#class-window) The window to render to.
  - `presentMode: <string>` The swapchain mode. Default: `'fifo'`
  - `format: <string>` The texture format of the window surface. Default: the first format the surface supports.
  - `usage: <number>` A combination of [`GPUTextureUsage`](https://developer.mozilla.org/en-US/docs/Web/API/GPUTextureUsage) flags for the surface texture. Default: `GPUTextureUsage.RENDER_ATTACHMENT`
- Returns: [`<Renderer>`](#class-renderer) a Renderer instance.

Creates a Renderer object that connects a device to a window, so the device renders directly to the window.

Possible options for `presentMode` are `'fifo'`, `'fifoRelaxed'`, `'immediate'`, and `'mailbox'`.

If the requested `format` is not supported by the window, this function throws an error that lists the supported formats.
Use [`renderer.getPreferredFormat()`](#renderergetpreferredformat) to find out which format was chosen.
If the format ends with `-srgb`, then you don't have to do any sRGB encoding; the hardware handles it for you.
In the browser the default format is `'bgra8unorm'`, so the shaders have to do their own sRGB encoding.

### class Renderer

The API does not expose the `Renderer` class, so you can't (and shouldn't) use it with the `new` operator.
Instead, [`gpu.renderGPUDeviceToWindow()`](#gpurendergpudevicetowindowoptions) returns objects of type `Renderer`.

### renderer.getPreferredFormat()

- Returns: [`<GPUTextureFormat>`](https://developer.mozilla.org/en-US/docs/Web/API/GPUTextureFormat) the format of the window surface.

Use it as the format of the color targets in your render pipelines.

### renderer.getCurrentTexture()

- Returns: [`<GPUTexture>`](https://developer.mozilla.org/en-US/docs/Web/API/GPUTexture) a texture of the window surface.

Whatever you draw to the texture appears in the window when you call [`renderer.swap()`](#rendererswap).

### renderer.getCurrentTextureView()

- Returns: [`<GPUTextureView>`](https://developer.mozilla.org/en-US/docs/Web/API/GPUTextureView) a texture view of the window surface.

Whatever you draw to the texture view appears in the window when you call [`renderer.swap()`](#rendererswap).

### renderer.swap()

Call this function after your render pass to show the results in the window.

### renderer.resize()

Call this function after you resize the window.

After you call `device.destroy()`, the renderer releases its window surface, and calling [`renderer.swap()`](#rendererswap), [`renderer.resize()`](#rendererresize), or either of the `getCurrentTexture` functions throws an error.


### queue.copyExternalImageToTexture(source, destination, copySize)

- `source: <object>` an object representing the source.
  - `source: <object>` a canvas-like object or an image-like object from which data is read.
  - `origin: <object|array>` an object or array specifying an offset from which the source is read. Default: `[0, 0]`.
  - `flipY: <boolean>` if set to true, the source is flipped vertically. Default: `false`.
- `destination: <object>` an object representing the destination.
  - `texture: <GPUTexture>` a texture to write the data to.
  - `aspect: <string>` specifies which aspect of the texture to write the image to. Default: `'all'`.
  - `colorSpace: <string>` specifies the colorspace encoding. Default: `'srgb'`.
  - `mipLevel: <number>` specifies the mip-map level of the texture to write the image to. Default: `0`.
  - `origin: <object|array>` an object or array specifying an offset from which the destination is written to. Default: `[0, 0, 0]`.
  - `premultipliedAlpha: <boolean>` if set to true, the destination's RGB channels will be premultiplied by the alpha channel. Default: `false`.
- `copySize: <object|array>` an object or array specifying the dimensions of the region to copy from/to.

The Dawn Node.js bindings do not implement [`GPUQueue.copyExternalImageToTexture()`](https://developer.mozilla.org/en-US/docs/Web/API/GPUQueue/copyExternalImageToTexture), because Node.js has no standard image objects.
This is a useful function to have so this library does implement it by making some assumptions about the source.
The source can be canvas-like or image-like:

- A canvas-like source must have `width` and `height` properties and also implement the `getContext('2d')` call and the `getImageData(x, y, w, h)` call.

- An image-like source must have `width`, `height`, and `data` properties.
  The `data` must be a `Uint8Array` or `Uint8ClampedArray` (a `Buffer` works too) of tightly packed RGBA pixels, 4 bytes per pixel, row by row.

The source `origin` can be either an array (`[x, y]`) or an object (`{x, y}`).
The destination `origin` can be either an array (`[x, y, z]`) or an object (`{x, y, z}`).

Possible values for `aspect` are `'depth-only'`, `'stencil-only'`, and `'all'`.

The `copySize` has three components: `width`, `height`, and `depthOrArrayLayers`.
It can be either an array (`[width, height, depthOrArrayLayers]`) or an object (`{width, height, depthOrArrayLayers}`).
The `width` value has to be included.
If the `height` or `depthOrArrayLayers` values are omitted, they default to `1`.

The destination texture must have been created with both `GPUTextureUsage.COPY_DST` and `GPUTextureUsage.RENDER_ATTACHMENT` in its `usage`.
Its `dimension` must be `'2d'`, its `sampleCount` must be `1`, and its `format` must be one of `'r8unorm'`, `'rg8unorm'`, `'rgba8unorm'`, `'rgba8unorm-srgb'`, `'bgra8unorm'`, `'bgra8unorm-srgb'`, `'r16float'`, `'rg16float'`, `'rgba16float'`, `'r32float'`, `'rg32float'`, `'rgba32float'`, or `'rgb10a2unorm'`.

**Limitations:**

- The only supported `colorSpace` is `'srgb'`.

- The function always treats the source pixels as **not** premultiplied.
  If the source already has premultiplied alpha and you pass `premultipliedAlpha: true`, the alpha gets applied _twice_.
