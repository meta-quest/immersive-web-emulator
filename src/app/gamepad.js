const haveEvents = "GamepadEvent" in window;
const gamepads = {};
const requestAnimationFrame =
  window.mozRequestAnimationFrame || window.requestAnimationFrame;

const JOYSTICK_THRESHOLD = 0.2;
const TRANSFORM_SPEED = 0.002;

const GAMEPAD_API_INDEX_MAPPING = {
  joystick: 11,
  trigger: 7,
  grip: 6,
  button1: 0,
  button2: 1,
};

const lastFrameButtonStates = {};

const saveButtonStates = (gamepad) => {
  for (let i = 0; i < gamepad.buttons.length; i++) {
    lastFrameButtonStates[i] = {
      pressed: gamepad.buttons[i].pressed,
      touched: gamepad.buttons[i].touched,
      value: gamepad.buttons[i].value,
    };
  }
};

const buttonJustPressed = (gamepad, buttonIndex) => {
  return (
    lastFrameButtonStates[buttonIndex].pressed &&
    !gamepad.buttons[buttonIndex].pressed
  );
};

const onGamepadConnected = (e) => {
  gamepads[e.gamepad.index] = e.gamepad;
  states.deviceOverridden = DEVICE.LEFT_CONTROLLER;
  deregisterControllerButtonEvents(DEVICE.LEFT_CONTROLLER);
  saveButtonStates(e.gamepad);
  console.log(lastFrameButtonStates);
  document.getElementById("keyboard-control-component").style.display = "none";
  document.getElementById("gamepad-control-component").style.display = "block";
  requestAnimationFrame(updateStatus);
};

const onGamepadDisconnected = (e) => {
  states.deviceOverridden = null;
  registerControllerButtonEvents(DEVICE.LEFT_CONTROLLER);
  delete gamepads[e.gamepad.index];
  document.getElementById("keyboard-control-component").style.display = "block";
  document.getElementById("gamepad-control-component").style.display = "none";
};

const scanConnectedGamepads = () => {
  var gamepadList = navigator.getGamepads ? navigator.getGamepads() : [];
  for (var i = 0; i < gamepadList.length; i++) {
    if (gamepadList[i] && gamepadList[i].index in gamepads) {
      gamepads[gamepadList[i].index] = gamepadList[i];
    }
  }
};

const switchOverridingDevice = (gamepad) => {
  if (buttonJustPressed(gamepad, 5) || buttonJustPressed(gamepad, 4)) {
    const delta = buttonJustPressed(gamepad, 5) ? 1 : -1;
    const deviceList = [
      DEVICE.HEADSET,
      DEVICE.LEFT_CONTROLLER,
      DEVICE.RIGHT_CONTROLLER,
    ];
    const currentIndex = deviceList.indexOf(states.deviceOverridden);
    let newIndex = currentIndex + delta;
    if (newIndex == 3) {
      newIndex = 0;
    } else if (newIndex == -1) {
      newIndex = 2;
    }
    states.deviceOverridden = deviceList[newIndex];
  }
};

const processPoseActions = (gamepad) => {
  if (buttonJustPressed(gamepad, 8)) {
    document.getElementById("pose-save").click();
  }
  if (buttonJustPressed(gamepad, 9)) {
    document.getElementById("pose-apply").click();
  }
  if (buttonJustPressed(gamepad, 17)) {
    document.getElementById("pose-revert").click();
  }
};

const mirrorControllerInput = (deviceId, gamepad) => {
  Object.entries(GAMEPAD_API_INDEX_MAPPING).forEach(
    ([controlKey, gamepadIndex]) => {
      notifyInputButtonChanged(
        deviceId,
        BUTTON_POLYFILL_INDEX_MAPPING[controlKey],
        gamepad.buttons[gamepadIndex].pressed,
        gamepad.buttons[gamepadIndex].touched,
        gamepad.buttons[gamepadIndex].value
      );
    }
  );
  notifyInputAxisValue(deviceId, 0, gamepad.axes[2]);
  notifyInputAxisValue(deviceId, 1, gamepad.axes[3]);
};

function rotateAroundWorldAxis(obj, axis, radians) {
  let rotWorldMatrix = new THREE.Matrix4();
  rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
  rotWorldMatrix.multiply(obj.matrix);
  obj.matrix = rotWorldMatrix;
  obj.setRotationFromMatrix(obj.matrix);
}

const processTransformControl = (deviceId, gamepad) => {
  const node = assetNodes[deviceId];
  const rotationMode = gamepad.buttons[2].pressed;
  if (!rotationMode) {
    if (gamepad.axes[0] < -JOYSTICK_THRESHOLD) {
      node.position.x -= TRANSFORM_SPEED;
    } else if (gamepad.axes[0] > JOYSTICK_THRESHOLD) {
      node.position.x += TRANSFORM_SPEED;
    }
    if (gamepad.axes[1] < -JOYSTICK_THRESHOLD) {
      node.position.z -= TRANSFORM_SPEED;
    } else if (gamepad.axes[1] > JOYSTICK_THRESHOLD) {
      node.position.z += TRANSFORM_SPEED;
    }
    if (gamepad.buttons[13].pressed) {
      node.position.y -= TRANSFORM_SPEED;
    } else if (gamepad.buttons[12].pressed) {
      node.position.y += TRANSFORM_SPEED;
    }
  } else {
    if (gamepad.axes[0] < -JOYSTICK_THRESHOLD) {
      node.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), Math.PI / 500);
    } else if (gamepad.axes[0] > JOYSTICK_THRESHOLD) {
      node.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 500);
    }
    if (gamepad.axes[1] < -JOYSTICK_THRESHOLD) {
      node.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), Math.PI / 500);
    } else if (gamepad.axes[1] > JOYSTICK_THRESHOLD) {
      node.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 500);
    }
    if (gamepad.buttons[13].pressed) {
      node.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), Math.PI / 500);
    } else if (gamepad.buttons[12].pressed) {
      node.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -Math.PI / 500);
    }
  }
};

function updateStatus() {
  scanConnectedGamepads();
  for (j in gamepads) {
    const gamepad = gamepads[j];
    if (buttonJustPressed(gamepad, 16)) {
      states.customMappingMode = !states.customMappingMode;
    }

    if (states.customMappingMode) {
      customMapping(gamepad);
    } else {
      switchOverridingDevice(gamepad);
      if (states.deviceOverridden != DEVICE.HEADSET) {
        mirrorControllerInput(states.deviceOverridden, gamepad);
      }
      processTransformControl(states.deviceOverridden, gamepad);
      processPoseActions(gamepad);
    }

    saveButtonStates(gamepad);
  }
  requestAnimationFrame(updateStatus);
}

if (haveEvents) {
  window.addEventListener("gamepadconnected", onGamepadConnected);
  window.addEventListener("gamepaddisconnected", onGamepadDisconnected);
} else {
  setInterval(scanConnectedGamepads, 500);
}

const sendKeyPressToActiveTab = (key, keyCode) => {
  chrome.tabs.query({ active: true }, function (tabs) {
    const { id: tabId } = tabs[0].url;

    let code = `
      window.dispatchEvent(new KeyboardEvent('keydown', {'key': '<key>', 'code': '<keycode>'}));
      window.dispatchEvent(new KeyboardEvent('keypress', {'key': '<key>', 'code': '<keycode>'}));
      window.dispatchEvent(new KeyboardEvent('keyup', {'key': '<key>', 'code': '<keycode>'}));
      `
      .replace(/<key>/g, key)
      .replace(/<keycode>/g, keyCode);
    chrome.tabs.executeScript(tabId, { code }, function (result) {
      console.log("keyboard event sent:", key);
    });
  });
};

const customMapping = (gamepad) => {
  notifyInputAxisValue(DEVICE.LEFT_CONTROLLER, 0, gamepad.axes[0]);
  notifyInputAxisValue(DEVICE.LEFT_CONTROLLER, 1, gamepad.axes[1]);
  notifyInputAxisValue(DEVICE.RIGHT_CONTROLLER, 0, gamepad.axes[2]);
  notifyInputAxisValue(DEVICE.RIGHT_CONTROLLER, 1, gamepad.axes[3]);
  mirrorControllerInput(DEVICE.RIGHT_CONTROLLER, gamepad);
  [
    [DEVICE.LEFT_CONTROLLER, "joystick", 10],
    [DEVICE.LEFT_CONTROLLER, "trigger", 6],
    [DEVICE.LEFT_CONTROLLER, "grip", 4],
    [DEVICE.LEFT_CONTROLLER, "button1", 2],
    [DEVICE.LEFT_CONTROLLER, "button2", 3],
    [DEVICE.RIGHT_CONTROLLER, "joystick", 11],
    [DEVICE.RIGHT_CONTROLLER, "trigger", 7],
    [DEVICE.RIGHT_CONTROLLER, "grip", 5],
    [DEVICE.RIGHT_CONTROLLER, "button1", 0],
    [DEVICE.RIGHT_CONTROLLER, "button2", 1],
  ].forEach(([deviceId, controlKey, gamepadIndex]) => {
    notifyInputButtonChanged(
      deviceId,
      BUTTON_POLYFILL_INDEX_MAPPING[controlKey],
      gamepad.buttons[gamepadIndex].pressed,
      gamepad.buttons[gamepadIndex].touched,
      gamepad.buttons[gamepadIndex].value
    );
  });
  if (buttonJustPressed(gamepad, 12)) {
    sendKeyPressToActiveTab("j", "KeyJ");
  }
  if (buttonJustPressed(gamepad, 13)) {
    sendKeyPressToActiveTab("k", "KeyK");
  }
  if (buttonJustPressed(gamepad, 14)) {
    sendKeyPressToActiveTab("l", "KeyL");
  }
  if (buttonJustPressed(gamepad, 15)) {
    sendKeyPressToActiveTab(";", "Semicolon");
  }
  if (buttonJustPressed(gamepad, 17)) {
    sendKeyPressToActiveTab("h", "KeyH");
  }
  if (buttonJustPressed(gamepad, 8)) {
    loadPose("Pose 1");
    updateButtonStates();
  }
  if (buttonJustPressed(gamepad, 9)) {
    loadPose("Pose 2");
    updateButtonStates();
  }
};

$("#gamepad-control-component").load("gamepad-control-component.html");
