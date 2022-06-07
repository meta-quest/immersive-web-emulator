const port = chrome.runtime.connect(null, { name: "panel" });
const tabId = chrome.devtools.inspectedWindow.tabId;
const states = {
  stereoOn: false,
  inImmersive: false,
  transformCheckpoint: {},
  deviceOverridden: null,
  customMappingMode: false,
  keyboardInputPassthrough: true,
};

const PRESS_AND_RELEASE_DURATION = 250;

const BUTTON_POLYFILL_INDEX_MAPPING = {
  joystick: 0,
  trigger: 1,
  grip: 2,
  button1: 3,
  button2: 4,
};

const deviceDefinition = {
  id: "Oculus Quest",
  name: "Oculus Quest",
  profile: "oculus-touch-v2",
  modes: ["inline", "immersive-vr"],
  headset: {
    hasPosition: true,
    hasRotation: true,
  },
  controllers: [
    {
      id: "Oculus Touch V3 (Left)",
      buttonNum: 7,
      primaryButtonIndex: 0,
      primarySqueezeButtonIndex: 1,
      hasPosition: true,
      hasRotation: true,
      hasSqueezeButton: true,
      handedness: "left",
    },
    {
      id: "Oculus Touch V3 (Right)",
      buttonNum: 7,
      primaryButtonIndex: 0,
      primarySqueezeButtonIndex: 1,
      hasPosition: true,
      hasRotation: true,
      hasSqueezeButton: true,
      handedness: "right",
    },
  ],
  polyfillInputMapping: {
    axes: [2, 3, 0, 1],
    buttons: [1, 2, null, 0, 3, 4, null],
  },
};

Element.prototype.setAttributes = function (attrs) {
  for (var idx in attrs) {
    if (
      (idx === "styles" || idx === "style") &&
      typeof attrs[idx] === "object"
    ) {
      for (var prop in attrs[idx]) {
        this.style[prop] = attrs[idx][prop];
      }
    } else if (idx === "html") {
      this.innerHTML = attrs[idx];
    } else {
      this.setAttribute(idx, attrs[idx]);
    }
  }
};

// receive message from contentScript via background

port.onMessage.addListener((message) => {
  switch (message.action) {
    case "webxr-startup":
      // notify the poses to sync
      // if main page is reloaded while panel is opened
      notifyPoses();
      break;
    case "device-pose":
      // @TODO: Make function?
      {
        const node = assetNodes[DEVICE.HEADSET];
        if (!node) {
          return;
        }
        node.position.fromArray(message.position);
        node.quaternion.fromArray(message.quaternion);
        updateHeadsetPropertyComponent();
        render();
      }
      break;
    case "device-input-pose":
      {
        // @TODO: Make function?
        const objectName = message.objectName;
        const key =
          objectName === "right-controller"
            ? DEVICE.RIGHT_CONTROLLER
            : DEVICE.LEFT_CONTROLLER;
        const node = assetNodes[key];
        if (!node) {
          return;
        }
        node.position.fromArray(message.position);
        node.quaternion.fromArray(message.quaternion);
        updateDeviceTransformData(key);
        render();
      }
      break;
    case "device-enter-immersive":
      states.inImmersive = true;
      console.log("entering immersive");
      notifyPoses();
      break;
    case "device-leave-immersive":
      states.inImmersive = false;
      console.log("leaving immersive");
      break;
  }
});

// send message to contentScript via background

const postMessage = (message) => {
  message.tabId = tabId;
  port.postMessage(message);
};

const notifyPoseChange = (node) => {
  postMessage({
    action: "webxr-pose",
    position: node.position.toArray([]), // @TODO: reuse array
    quaternion: node.quaternion.toArray([]), // @TODO: reuse array
  });
};

const notifyInputPoseChange = (key, node) => {
  if (key === DEVICE.HEADSET) {
    notifyPoseChange(node);
  } else {
    postMessage({
      action: "webxr-input-pose",
      objectName: OBJECT_NAME[key],
      position: node.position.toArray([]), // @TODO: reuse array
      quaternion: node.quaternion.toArray([]), // @TODO: reuse array
    });
  }
};

const notifyInputButtonPressed = (key, buttonKey, pressed) => {
  postMessage({
    action: "webxr-input-button",
    objectName: OBJECT_NAME[key],
    buttonIndex: buttonKey,
    pressed: pressed,
  });
};

const notifyInputButtonChanged = (key, buttonKey, pressed, touched, value) => {
  postMessage({
    action: "webxr-input-button",
    objectName: OBJECT_NAME[key],
    buttonIndex: buttonKey,
    pressed: pressed,
    touched: touched,
    value: value,
  });
};

const notifyInputAxisValue = (key, axisIndex, value) => {
  postMessage({
    action: "webxr-input-axis",
    objectName: OBJECT_NAME[key],
    axisIndex: axisIndex,
    value: value,
  });
};

const notifyDeviceChange = (deviceDefinition) => {
  postMessage({
    action: "webxr-device",
    deviceDefinition: deviceDefinition,
  });
};

const notifyStereoEffectChange = (enabled) => {
  postMessage({
    action: "webxr-stereo-effect",
    enabled: enabled,
  });
};

const notifyPoses = () => {
  for (const key in assetNodes) {
    if (assetNodes[key]) {
      if (key === DEVICE.HEADSET) {
        notifyPoseChange(assetNodes[key]);
      } else {
        notifyInputPoseChange(key, assetNodes[key]);
      }
    }
  }
};

const notifyExitImmersive = () => {
  postMessage({
    action: "webxr-exit-immersive",
  });
};
