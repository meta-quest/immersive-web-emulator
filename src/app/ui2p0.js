const controllerState = {
  "left-controller": {
    joystick: {
      touched: false,
      pressed: false,
      valueX: 0,
      valueY: 0,
    },
    trigger: {
      touched: false,
      value: 0,
    },
    grip: {
      touched: false,
      value: 0,
    },
    button1: {
      touched: false,
      pressed: false,
    },
    button2: {
      touched: false,
      pressed: false,
    },
  },
  "right-controller": {
    joystick: {
      touched: false,
      pressed: false,
      valueX: 0,
      valueY: 0,
    },
    trigger: {
      touched: false,
      value: 0,
    },
    grip: {
      touched: false,
      value: 0,
    },
    button1: {
      touched: false,
      pressed: false,
    },
    button2: {
      touched: false,
      pressed: false,
    },
  },
};

function setupJoystick(deviceId) {
  const deviceName = OBJECT_NAME[deviceId];
  const joystickContainerDiv = document.getElementById(
    deviceName + "-joystick"
  );
  const joystick = new Joystick(100, true, 4);
  joystick.addToParent(joystickContainerDiv);
  return joystick;
}

const JOYSTICKS = {};

const toggleButtonTouch = (deviceId, inputId) => {
  const deviceName = OBJECT_NAME[deviceId];
  const buttonState = controllerState[deviceName][inputId];
  buttonState.touched = !buttonState.touched;
  if (buttonState.pressed) {
    buttonState.touched = true;
  }
  const touchButton = document.getElementById(
    deviceName + "-" + inputId + "-touch"
  );
  touchButton.classList.toggle("button-pressed", buttonState.touched);
  notifyInputButtonChanged(
    deviceId,
    BUTTON_POLYFILL_INDEX_MAPPING[inputId],
    buttonState.pressed,
    buttonState.touched,
    buttonState.value
  );
};

const toggleButtonPress = (deviceId, inputId) => {
  const deviceName = OBJECT_NAME[deviceId];
  const buttonState = controllerState[deviceName][inputId];
  buttonState.pressed = !buttonState.pressed;
  if (buttonState.pressed) {
    buttonState.touched = true;
  }
  const pressButton = document.getElementById(
    deviceName + "-" + inputId + "-press"
  );
  pressButton.disabled = buttonState.pressed;

  const holdButton = document.getElementById(
    deviceName + "-" + inputId + "-hold"
  );
  holdButton.classList.toggle("button-pressed", buttonState.pressed);
  notifyInputButtonPressed(
    deviceId,
    BUTTON_POLYFILL_INDEX_MAPPING[inputId],
    buttonState.pressed
  );
};

const pressAndReleaseButton = (deviceId, inputId) => {
  const deviceName = OBJECT_NAME[deviceId];
  const buttonState = controllerState[deviceName][inputId];
  const holdButton = document.getElementById(
    deviceName + "-" + inputId + "-hold"
  );

  if (buttonState.pressed) return;
  toggleButtonPress(deviceId, inputId);
  holdButton.disabled = true;
  setTimeout(() => {
    toggleButtonPress(deviceId, inputId);
    holdButton.disabled = false;
  }, PRESS_AND_RELEASE_DURATION);
};

const setupJoystickButtons = (deviceId) => {
  const deviceName = OBJECT_NAME[deviceId];
  const stickyButton = document.getElementById(deviceName + "-joystick-sticky");
  stickyButton.addEventListener("click", () => {
    JOYSTICKS[deviceName].setSticky(!JOYSTICKS[deviceName].sticky);
    stickyButton.classList.toggle(
      "button-pressed",
      JOYSTICKS[deviceName].sticky
    );
  });
  const resetButton = document.getElementById(deviceName + "-joystick-reset");
  resetButton.addEventListener("click", () => {
    JOYSTICKS[deviceName].reset();
  });
};

const registerControllerButtonEvents = (deviceId) => {
  const deviceName = OBJECT_NAME[deviceId];
  Object.keys(BUTTON_POLYFILL_INDEX_MAPPING).forEach((key) => {
    const touchButton = document.getElementById(
      deviceName + "-" + key + "-touch"
    );
    const pressButton = document.getElementById(
      deviceName + "-" + key + "-press"
    );
    const holdButton = document.getElementById(
      deviceName + "-" + key + "-hold"
    );
    const rangeInput = document.getElementById(
      deviceName + "-" + key + "-value"
    );
    if (touchButton) {
      touchButton.onclick = () => {
        toggleButtonTouch(deviceId, key);
      };
    }
    if (pressButton) {
      pressButton.onclick = () => {
        pressAndReleaseButton(deviceId, key);
      };
    }
    if (holdButton) {
      holdButton.onclick = () => {
        toggleButtonPress(deviceId, key);
      };
    }
    if (rangeInput) {
      rangeInput.value = 0;
    }
  });
};

const deregisterControllerButtonEvents = (deviceId) => {
  const deviceName = OBJECT_NAME[deviceId];
  Object.keys(BUTTON_POLYFILL_INDEX_MAPPING).forEach((key) => {
    const touchButton = document.getElementById(
      deviceName + "-" + key + "-touch"
    );
    const pressButton = document.getElementById(
      deviceName + "-" + key + "-press"
    );
    const holdButton = document.getElementById(
      deviceName + "-" + key + "-hold"
    );
    const rangeInput = document.getElementById(
      deviceName + "-" + key + "-value"
    );
    if (touchButton) {
      touchButton.onclick = () => {};
    }
    if (pressButton) {
      pressButton.onclick = () => {};
    }
    if (holdButton) {
      holdButton.onclick = () => {};
    }
    if (rangeInput) {
      rangeInput.value = 0;
    }
  });
};

const setupHeadsetComponentButtons = () => {
  document
    .getElementById("exit-webxr")
    .addEventListener("click", notifyExitImmersive, false);

  const stereoToggle = document.getElementById("stereo-toggle");
  stereoToggle.addEventListener("click", function () {
    states.stereoOn = !states.stereoOn;
    notifyStereoEffectChange(states.stereoOn);
    this.classList.toggle("button-pressed", states.stereoOn);
  });

  function changeDevice(deviceId) {
    switch (deviceId) {
      case 1:
        deviceDefinition.profile = "oculus-touch-v2";
        break;
      case 2:
        deviceDefinition.profile = "oculus-touch-v3";
        break;
    }
    notifyDeviceChange(deviceDefinition);
  }

  document
    .getElementById("vr-device-select")
    .addEventListener("change", function (_event) {
      changeDevice(this.value);
    });

  document
    .getElementById("reset-poses")
    .addEventListener("click", resetDevicePose);
};

function updateAxes(deviceId) {
  if (states.customMappingMode || states.deviceOverridden === deviceId) return;

  const deviceName = OBJECT_NAME[deviceId];
  const joystick = JOYSTICKS[deviceName];
  // update joystick
  notifyInputAxisValue(deviceId, 0, joystick.getX());
  notifyInputAxisValue(deviceId, 1, joystick.getY());

  const resetButton = document.getElementById(deviceName + "-joystick-reset");
  resetButton.disabled = !(
    joystick.sticky &&
    joystick.getX() != 0 &&
    joystick.getY() != 0
  );

  // update analog inputs
  ["trigger", "grip"].forEach((inputId) => {
    const inputValue =
      document.getElementById(deviceName + "-" + inputId + "-value").value /
      100;
    const inputState = controllerState[deviceName][inputId];
    notifyInputButtonChanged(
      deviceId,
      BUTTON_POLYFILL_INDEX_MAPPING[inputId],
      inputValue != 0,
      inputState.touched,
      inputValue
    );
  });
}

$("#headset-component").load(
  "headset-component.html",
  setupHeadsetComponentButtons
);

const deviceUI = (deviceId, control, action = null) => {
  const deviceName = OBJECT_NAME[deviceId];
  if (action == null) {
    return document.getElementById(deviceName + "-" + control);
  } else {
    return document.getElementById(deviceName + "-" + control + "-" + action);
  }
};

[DEVICE.LEFT_CONTROLLER, DEVICE.RIGHT_CONTROLLER].forEach((deviceId) => {
  const deviceName = OBJECT_NAME[deviceId];
  $("#" + deviceName + "-component").load(
    deviceName + "-component.html",
    () => {
      JOYSTICKS[deviceName] = setupJoystick(deviceId);
      setupJoystickButtons(deviceId);

      setInterval(() => {
        updateAxes(deviceId);
      }, 50);

      registerControllerButtonEvents(deviceId);

      onResize();
    }
  );
});
