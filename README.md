---
title: Immersive Web Emulator
description: Describes how to use the Immersive Web Emulator to run WebXR apps on a desktop browser without an XR device..
tags:
  - WEB_PLATFORM
  - WEBXR
---

Immersive Web Emulator is a browser extension that assists WebXR content creation. It enables developers to responsively run [WebXR](https://www.w3.org/TR/webxr/) apps on a desktop browser without the need of an XR device.

Inspired by the [official WebXR Emulator Extension by Mozilla Reality](https://github.com/MozillaReality/WebXR-emulator-extension/) and our previous efforts of extending it for better functionality, Immersive Web Emulator is designed and rebuilt from the ground up with an emphasis on full input emulation (including touch and analog input), better usability with a re-engineered UI, and more features, such as keyboard input mirroring and input session recording/playback, specifically for Meta Quest headsets.

![Immersive Web Emulator](./screenshots/screenshot.gif)

## Immersive Web Emulator Features

- [WebXR API polyfill](https://github.com/immersive-web/webxr-polyfill)
- 6DOF transform control for the headset and left and right controllers, powered by [Three.js](https://threejs.org/)
- Full input emulation support for Meta Quest Touch controllers
- External input mirroring support for both keyboard and gamepad
- Cross browsers support with [WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/)

## Installation

This extension is built on [WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions). It works on Chrome, Microsoft Edge, and other browsers that support the API.

The Immersive Web Emulator is still experimental. It will be published on the Chrome extension store once it is feature complete, but for now the extension source code must be downloaded/cloned to local and loaded to use it.

### Installing on Chrome

Chrome's official guide for loading an unpacked extension can be found [here](https://developer.chrome.com/docs/extensions/mv3/getstarted/#unpacked). Here is the list of steps:

1. Open the **Extension Management** page by navigating to "chrome://extensions" in the URL bar.
2. Enable developer mode by clicking the toggle next to **Developer Mode**.
3. Click the **Load unpacked button** and select the extension's directory, which is the WebXRQuestEmulator folder that you cloned/downloaded.

### Installing on Microsoft Edge

Microsoft Edge's official guide for loading an unpacked extension can be found [here](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading). Here is the list of steps:

1. Open the **Extensions** page by navigating to "edge://extensions".
2. Enable developer mode by clicking the toggle next to **Developer mode**.
3. Click the **Load unpacked** button and select the extension's directory, which is WebXRQuestEmulator directory that you cloned/downloaded.

## Immersive Web Emulator Usage

After successfully installing the emulator, do the following to use Immersive Web Emulator:

1. Go to a WebXR app page (for example, see the [WebXR Examples](#WebXR-Examples)). Notice that the app detects an XR device (emulated) and allows you to enter the immersive VR mode.
2. Open the **Immersive Web Emulator** tab by going to the Chrome settings button and selcting **More tools** > **Developer tools** and looking for it on the tab bar at the top of the screen. You might need to click **>>** if there are many tabs. From there, you can control the emulated devices. You can move the headset and controllers, and trigger the controller buttons. You can see their transforms reflected in the WebXR application. Note that the **Immersive Web Emulator** tab is only available on WebXR app pages.

### Device Nodes Transform Controls

By clicking a device node in the emulator's 3D viewport, you can select gizmo mode of the device. By dragging a gizmo, you can rotate or translate the device. Alternatively, you can use the following keyboard shortcut to cycle through gizmo modes of the different device nodes:

| Device Node      | Keyboard Binding |
| ---------------- | ---------------- |
| Headset          | Number Key 1     |
| Left Controller  | Number Key 2     |
| Right Controller | Number Key 3     |

![Transform](./screenshots/transform.gif)

### Meta Touch Controller Emulated Controls

| Button Action   | Description                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Touch           | Toggle '[GamepadButton](https://developer.mozilla.org/en-US/docs/Web/API/GamepadButton).touched'. |
| Press           | Set 'GamepadButton.pressed' to true and revert after 0.25 seconds.                                |
| Lock            | Toggle '[GamepadButton](https://developer.mozilla.org/en-US/docs/Web/API/GamepadButton).pressed'. |
| Joystick        | Set values on '[Gamepad.axes](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/axes)'.    |
| Joystick-Sticky | Toggle the auto-return feature of the emulated joystick.                                          |
| Joystick-Reset  | Recenter the emulated joystick.                                                                   |
| Slider          | Emulate analog input for trigger and grip.                                                        |

![Controls](./screenshots/controller.gif)

### Stereo Effect

You can enable/disable Stereo Effect which renders two views.

### Pose Controls

You can save an arbitrary combination of device nodes transform data as the default starting pose of the emulator.

### Keyboard Control & Events Pass-Through

There are keyboard mapping built in for some important controller emulated controls:

| Button Action        | Keyboard Binding |
| -------------------- | ---------------- |
| Left Joystick        | W/A/S/D          |
| Left Joystick Click  | C                |
| Button X             | X                |
| Button Y             | Z                |
| Left Trigger         | E                |
| Left Grip            | Q                |
| Right Joystick       | Arrow Keys       |
| Right Joystick Click | .                |
| Button A             | '                |
| Button B             | /                |
| Right Trigger        | Enter            |
| Right Grip           | Shift            |

Keyboard events other than those reserved for controller emulation are passed through to the main WebXR experience, you may wish to utilize this feature to build in some shortcuts for debugging purposes.

### Record Session & Emulator Playback

You can also use the session recording utility package to record input sessions from your WebXR experiences in headset, and replay the input session with the emulator

## Note

- Even if native WebXR API is available the extension overrides it with WebXR polyfill

## WebXR Examples

- [WebXR Samples](https://immersive-web.github.io/webxr-samples/)
- [Three.js WebXR VR examples](https://threejs.org/examples/?q=WebXR#webxr_vr_ballshooter)
- [Babylon.js WebXR examples](https://doc.babylonjs.com/how_to/webxr_demos_and_examples)
- [A-Frame](https://aframe.io/)

## Contributing

See the [CONTRIBUTING](CONTRIBUTING.md) file for how to help out.

## License

Immersive Web Emulator is MIT licensed, as found in the [LICENSE](LICENSE.md) file.
