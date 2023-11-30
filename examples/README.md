# Examples

## [0. Compute Pipeline](https://github.com/kmamal/gpu/tree/master/examples/00-compute)

Multiplies two matrices together and prints the result.

## [1. Render Pipeline](https://github.com/kmamal/gpu/tree/master/examples/01-render)

Renders a triagle and displays it in a window.

## [2. Render directly to window](https://github.com/kmamal/gpu/tree/master/examples/02-window)

As above, but renders directly to a window surface.

## [3. Creating a texture from an image](https://github.com/kmamal/gpu/tree/master/examples/03-texture-loading)

On the browser textures can be created very easily using `createImageBitmap()` and `device.queue.copyExternalImageToTexture()`.
In the dawn Node.js bindings the `device.queue.copyExternalImageToTexture()` function is unimplemented since there are no standardized image objects.
This forces us to use `device.queue.writeTexture()` to create a texture from data that we have previously decoded.
This example presents one of many possible ways to get a buffer of pixels from a file on disk.
Here we are using the `pngjs` package to decode a `.png` file and show it on the screen.


// TODO: more
