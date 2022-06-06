document.addEventListener(
  "keydown",
  (event) => {
    const result = getReservedKeyAction(event.key);
    if (result) {
      const [handKey, action] = result;
      onReservedKeyDown(handKey, action);
      moveJoysticks();
    } else {
      passThroughKeyboardEvent(event);
    }
  },
  false
);

document.addEventListener(
  "keyup",
  (event) => {
    const result = getReservedKeyAction(event.key);
    if (result) {
      const [handKey, action] = result;
      onReservedKeyUp(handKey, action);
      moveJoysticks();
    } else {
      passThroughKeyboardEvent(event);
    }
  },
  false
);

document.addEventListener(
  "keypress",
  (event) => {
    passThroughKeyboardEvent(event);
  },
  false
);

const KEYBOARD_CONTROL_MAPPING = {
  left: {
    joystickLeft: "a",
    joystickRight: "d",
    joystickForward: "w",
    joystickBackward: "s",
    trigger: "e",
    grip: "q",
    button1: "z",
    button2: "x",
    joystick: "c",
  },
  right: {
    joystickLeft: "ArrowLeft",
    joystickRight: "ArrowRight",
    joystickForward: "ArrowUp",
    joystickBackward: "ArrowDown",
    trigger: "Enter",
    grip: "Shift",
    button1: "'",
    button2: "/",
    joystick: ".",
  },
};

const emulatedJoysticks = {
  left: {
    left: false,
    right: false,
    forward: false,
    backward: false,
  },
  right: {
    left: false,
    right: false,
    forward: false,
    backward: false,
  },
};

const getReservedKeyAction = (key) => {
  let result = null;
  Object.entries(KEYBOARD_CONTROL_MAPPING).forEach(([handKey, mapping]) => {
    Object.entries(mapping).forEach(([action, mappedKey]) => {
      if (mappedKey == key) {
        result = [handKey, action];
      }
    });
  });
  return result;
};

const onReservedKeyDown = (handKey, action) => {
  switch (action) {
    case "joystickLeft":
      emulatedJoysticks[handKey].left = true;
      break;
    case "joystickRight":
      emulatedJoysticks[handKey].right = true;
      break;
    case "joystickForward":
      emulatedJoysticks[handKey].forward = true;
      break;
    case "joystickBackward":
      emulatedJoysticks[handKey].backward = true;
      break;
    case "trigger":
    case "grip":
      const rangeInput = document.getElementById(
        handKey + "-controller-" + action + "-value"
      );
      rangeInput.value = 100;
      break;
    default:
      const pressButton = document.getElementById(
        handKey + "-controller-" + action + "-press"
      );
      pressButton.click();
  }
};

const onReservedKeyUp = (handKey, action) => {
  switch (action) {
    case "joystickLeft":
      emulatedJoysticks[handKey].left = false;
      break;
    case "joystickRight":
      emulatedJoysticks[handKey].right = false;
      break;
    case "joystickForward":
      emulatedJoysticks[handKey].forward = false;
      break;
    case "joystickBackward":
      emulatedJoysticks[handKey].backward = false;
      break;
    case "trigger":
    case "grip":
      const rangeInput = document.getElementById(
        handKey + "-controller-" + action + "-value"
      );
      rangeInput.value = 0;
      break;
  }
};

/**
 *
 * @param {KeyboardEvent} event
 */
const passThroughKeyboardEvent = (event) => {
  const options = {
    key: event.key,
    code: event.code,
    location: event.location,
    repeat: event.repeat,
    isComposing: event.isComposing,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
  };
  const code =
    'window.dispatchEvent(new KeyboardEvent("' +
    event.type +
    '",' +
    JSON.stringify(options) +
    "));";
  chrome.tabs.query({ active: true }, function (tabs) {
    const { id: tabId } = tabs[0].url;
    chrome.tabs.executeScript(tabId, { code }, function (result) {
      // console.log(
      //   "keyboard event relayed:",
      //   event.key,
      //   event.type,
      //   "execution status:",
      //   result
      // );
    });
  });
};

const moveJoysticks = () => {
  if (!states.deviceOverridden) {
    Object.entries(emulatedJoysticks).forEach(([handKey, directions]) => {
      const deviceId =
        handKey == "left" ? DEVICE.LEFT_CONTROLLER : DEVICE.RIGHT_CONTROLLER;
      const deviceName = OBJECT_NAME[deviceId];
      if (
        directions.left ||
        directions.right ||
        directions.forward ||
        directions.backward
      ) {
        let axisX = directions.left ? -1 : 0 + directions.right ? 1 : 0;
        let axisY = directions.forward ? -1 : 0 + directions.backward ? 1 : 0;
        const normalizeScale = Math.sqrt(axisX * axisX + axisY * axisY);

        if (JOYSTICKS[deviceName]) {
          JOYSTICKS[deviceName].overrideMove(
            axisX / normalizeScale,
            axisY / normalizeScale
          );
        }
      } else {
        if (JOYSTICKS[deviceName]) {
          JOYSTICKS[deviceName].overrideMove(0, 0);
        }
      }
    });
  }
};
