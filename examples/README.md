# Examples

## [0. Compute Pipeline](https://github.com/kmamal/gpu/tree/master/examples/00-compute)

Multiplies two matrices together and prints the result.

## [1. Render Pipeline](https://github.com/kmamal/gpu/tree/master/examples/01-render)

Renders a triangle and shows it in a window.

## [2. Render directly to window](https://github.com/kmamal/gpu/tree/master/examples/02-window)

Like the previous example, but renders directly to a window surface.

## [3. Creating a texture from an image](https://github.com/kmamal/gpu/tree/master/examples/03-texture-loading)

Browsers create textures easily with `createImageBitmap()` and `device.queue.copyExternalImageToTexture()`.
The Dawn Node.js bindings do not implement `device.queue.copyExternalImageToTexture()`, because Node.js has no standard image objects.
Instead, we decode the image first and then create the texture with `device.queue.writeTexture()`.
This example shows one of many ways to get a buffer of pixels from a file on disk.
It uses the `pngjs` package to decode a `.png` file and show it on the screen.


// TODO: more
