<p align="center">
    <img height="60px" width="60px" src="https://meta-quest.github.io/immersive-web-emulation-runtime/iwer-text.svg" />
    <h1 align="center">Immersive Web Emulator 2.0</h1>
</p>

<p align="center">
    <a href="https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik"><img src="https://badgen.net/chrome-web-store/v/cgffilbpcibhmcfbgggfhfolhkfbhmik" alt="store version" /></a>
    <a href="https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik"><img src="https://badgen.net/chrome-web-store/rating/cgffilbpcibhmcfbgggfhfolhkfbhmik" alt="store rating" /></a>
    <a href="https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik"><img src="https://badgen.net/chrome-web-store/users/cgffilbpcibhmcfbgggfhfolhkfbhmik" alt="chrome users" /></a>
    <a href="https://raw.githubusercontent.com/meta-quest/immersive-web-emulation-runtime/main/LICENSE"><img src="https://badgen.net/github/license/meta-quest/immersive-web-emulation-runtime/" alt="license" /></a>
</p>

The Immersive Web Emulator (IWE) is a browser extension that injects a WebXR runtime into web pages, enabling full WebXR emulation on desktop, Chromium-based browsers.

Powered by the [Immersive Web Emulation Runtime](https://meta-quest.github.io/immersive-web-emulation-runtime/), IWE offers a comprehensive WebXR runtime that polyfills or overrides existing WebXR APIs. It includes the Synthetic Environment Module ([@iwer/sem](https://www.npmjs.com/package/@iwer/sem)) for mixed reality emulation capabilities and the DevUI ([@iwer/devui](https://www.npmjs.com/package/@iwer/devui)) for an intuitive developer interface overlay.

![Immersive Web Emulator](./screenshots/iwe.gif)

## Supported Features

IWE supports most mainstream WebXR features and APIs, offering compatibility on par with the WebXR support in the [Meta Quest Browser](https://www.meta.com/experiences/browser/1916519981771802/).

| Specifications                                                                                               | Support Status                                                                          |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [**WebXR Device API**](https://immersive-web.github.io/webxr/)                                               | ✅                                                                                      |
| [**WebXR Gamepads Module**](https://immersive-web.github.io/webxr-gamepads-module/)                          | ✅                                                                                      |
| [**WebXR Hand Input Module**](https://immersive-web.github.io/webxr-hand-input/)                             | ✅                                                                                      |
| [**WebXR Augmented Reality Module**](https://immersive-web.github.io/webxr-ar-module/)                       | ✅                                                                                      |
| [**WebXR Hit Test Module**](https://immersive-web.github.io/hit-test)                                        | ✅                                                                                      |
| [**WebXR Plane Detection Module**](https://immersive-web.github.io/real-world-geometry/plane-detection.html) | ✅                                                                                      |
| [**WebXR Mesh Detection Module**](https://immersive-web.github.io/real-world-meshing/)                       | ✅                                                                                      |
| [**WebXR Anchors Module**](https://immersive-web.github.io/anchors/)                                         | ✅                                                                                      |
| [**WebXR Layers API**](https://immersive-web.github.io/layers/)                                              | \* Works with [layers polyfill](https://github.com/immersive-web/webxr-layers-polyfill) |
| [**WebXR Lighting Estimation API**](https://immersive-web.github.io/lighting-estimation/)                    | ⛔                                                                                      |
| [**WebXR DOM Overlays Module**](https://immersive-web.github.io/dom-overlays)                                | ⛔                                                                                      |

## Installation

This extension is built on the [WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions) and implements [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/). It is compatible with Chrome, Microsoft Edge, and other browsers supporting the API. You can install the Immersive Web Emulator from the following browser extension stores:

- [Google Chrome Web Store](https://chrome.google.com/webstore/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik)
- [Microsoft Edge Add-ons Store](https://microsoftedge.microsoft.com/addons/detail/immersive-web-emulator/hhlkbhldhffpeibcfggfndbkfohndamj)

### Manual Installation

For other Chromium-based browsers, you can manually install the extension by following these steps:

1. Download the latest release [here](https://github.com/meta-quest/immersive-web-emulator/releases), unpack it, and note the unpacked directory.
2. Open the Extensions page in your browser, typically found in the browser menu, or navigate to `chrome://extensions` in the URL bar if using a Chromium-based browser.
3. Enable **Developer mode** on the Extensions page.
4. Click on the **Load unpacked** button and select the unpacked directory from step 1.

Note: The process may vary for different browsers.

### Non-Chromium Browsers

At this time, IWE is not supported on non-Chromium-based browsers. However, you can integrate IWER directly into your app by following [this guide](https://meta-quest.github.io/immersive-web-emulation-runtime/getting-started.html#adding-iwer-to-your-project) to achieve the **same experience on any modern browser** of your choosing.

Alternatively, use one of the frameworks with IWER already built-in:

- [React-Three/XR](https://pmndrs.github.io/xr/docs/getting-started/development-setup)

## License

IWER is licensed under the MIT License. For more details, see the [LICENSE](https://github.com/meta-quest/immersive-web-emulator/blob/main/LICENSE) file in this repository.

## Contributing

Your contributions are welcome! Please feel free to submit issues and pull requests. Before contributing, make sure to review our [Contributing Guidelines](https://github.com/meta-quest/immersive-web-emulator/blob/main/CONTRIBUTING.md) and [Code of Conduct](https://github.com/meta-quest/immersive-web-emulator/blob/main/CODE_OF_CONDUCT.md).
