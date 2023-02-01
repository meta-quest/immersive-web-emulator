/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
	BUTTON_POLYFILL_INDEX_MAPPING,
	OBJECT_NAME,
	PRESS_AND_RELEASE_DURATION,
} from './constants';
import {
	applyControllerAnalogValue,
	applyControllerButtonChanged,
	applyControllerButtonPressed,
} from './messenger';

import { Joystick } from './joystick';
import { emulatorStates } from './emulatorStates';

export const JOYSTICKS = {};

const toggleButtonTouch = (deviceId, inputId) => {
	const deviceName = OBJECT_NAME[deviceId];
	const buttonState = emulatorStates.controllers[deviceName][inputId];
	buttonState.touched = !buttonState.touched;
	if (buttonState.pressed) {
		buttonState.touched = true;
	}
	const touchButton = document.getElementById(
		deviceName + '-' + inputId + '-touch',
	);
	touchButton.classList.toggle('button-pressed', buttonState.touched);
	applyControllerButtonChanged(
		deviceId,
		BUTTON_POLYFILL_INDEX_MAPPING[inputId],
		buttonState.pressed,
		buttonState.touched,
		buttonState.value,
	);
};

const toggleButtonPress = (deviceId, inputId) => {
	const deviceName = OBJECT_NAME[deviceId];
	const buttonState = emulatorStates.controllers[deviceName][inputId];
	buttonState.pressed = !buttonState.pressed;
	if (buttonState.pressed) {
		buttonState.touched = true;
	}
	const pressButton = document.getElementById(
		deviceName + '-' + inputId + '-press',
	);
	pressButton.disabled = buttonState.pressed;

	const holdButton = document.getElementById(
		deviceName + '-' + inputId + '-hold',
	);
	holdButton.classList.toggle('button-pressed', buttonState.pressed);
	applyControllerButtonPressed(
		deviceId,
		BUTTON_POLYFILL_INDEX_MAPPING[inputId],
		buttonState.pressed,
	);
};

const pressAndReleaseButton = (deviceId, inputId) => {
	const deviceName = OBJECT_NAME[deviceId];
	const buttonState = emulatorStates.controllers[deviceName][inputId];
	const holdButton = document.getElementById(
		deviceName + '-' + inputId + '-hold',
	);

	if (buttonState.pressed) return;
	toggleButtonPress(deviceId, inputId);
	holdButton.disabled = true;
	setTimeout(() => {
		toggleButtonPress(deviceId, inputId);
		holdButton.disabled = false;
	}, PRESS_AND_RELEASE_DURATION);
};

const pressAndReleaseAnalogButton = (pressButton, rangeInput) => {
	const step = 10;
	const interval = 10;
	const holdTime = 50;
	pressButton.disabled = true;
	let rangeValue = 0;
	const pressIntervalId = setInterval(() => {
		if (rangeInput.value >= 100) {
			rangeInput.value = 100;
			clearInterval(pressIntervalId);
			setTimeout(() => {
				const depressIntervalId = setInterval(() => {
					if (rangeInput.value <= 0) {
						rangeInput.value = 0;
						clearInterval(depressIntervalId);
						pressButton.disabled = false;
					} else {
						rangeInput.value -= step;
					}
					rangeInput.oninput();
				}, interval);
			}, holdTime);
		} else {
			rangeValue += step;
			rangeInput.value = rangeValue;
		}
		rangeInput.oninput();
	}, interval);
};

const setupJoystickButtons = (deviceId) => {
	const deviceName = OBJECT_NAME[deviceId];
	const stickyButton = document.getElementById(deviceName + '-joystick-sticky');
	stickyButton.addEventListener('click', () => {
		JOYSTICKS[deviceName].setSticky(!JOYSTICKS[deviceName].sticky);
		stickyButton.classList.toggle(
			'button-pressed',
			JOYSTICKS[deviceName].sticky,
		);
	});
	const resetButton = document.getElementById(deviceName + '-joystick-reset');
	resetButton.addEventListener('click', () => {
		JOYSTICKS[deviceName].reset();
	});
};

export const setupJoystick = (deviceId) => {
	const deviceName = OBJECT_NAME[deviceId];
	const joystickContainerDiv = document.getElementById(
		deviceName + '-joystick',
	);
	const joystick = new Joystick(100, true, 4);
	joystick.addToParent(joystickContainerDiv);
	joystickContainerDiv.addEventListener('joystickmove', () => {
		// update joystick
		applyControllerAnalogValue(deviceId, 0, joystick.getX());
		applyControllerAnalogValue(deviceId, 1, joystick.getY());

		const resetButton = document.getElementById(deviceName + '-joystick-reset');
		resetButton.disabled = !(
			joystick.sticky &&
			joystick.getX() != 0 &&
			joystick.getY() != 0
		);
	});
	JOYSTICKS[deviceName] = joystick;
	setupJoystickButtons(deviceId);
};

export const registerControllerButtonEvents = (deviceId) => {
	const deviceName = OBJECT_NAME[deviceId];
	Object.keys(BUTTON_POLYFILL_INDEX_MAPPING).forEach((key) => {
		const touchButton = document.getElementById(
			deviceName + '-' + key + '-touch',
		);
		const pressButton = document.getElementById(
			deviceName + '-' + key + '-press',
		);
		const holdButton = document.getElementById(
			deviceName + '-' + key + '-hold',
		);
		const rangeInput = document.getElementById(
			deviceName + '-' + key + '-value',
		);
		if (touchButton) {
			touchButton.onclick = () => {
				toggleButtonTouch(deviceId, key);
			};
		}
		if (pressButton) {
			pressButton.onclick = () => {
				if (rangeInput) {
					pressAndReleaseAnalogButton(pressButton, rangeInput);
				} else {
					pressAndReleaseButton(deviceId, key);
				}
			};
		}
		if (holdButton) {
			holdButton.onclick = () => {
				toggleButtonPress(deviceId, key);
			};
		}
		if (rangeInput) {
			rangeInput.value = 0;
			rangeInput.oninput = () => {
				const inputValue = rangeInput.value / 100;
				const inputState = emulatorStates.controllers[deviceName][key];
				applyControllerButtonChanged(
					deviceId,
					BUTTON_POLYFILL_INDEX_MAPPING[key],
					inputValue != 0,
					inputState.touched,
					inputValue,
				);
			};
		}
	});
};

export const deregisterControllerButtonEvents = (deviceId) => {
	const deviceName = OBJECT_NAME[deviceId];
	Object.keys(BUTTON_POLYFILL_INDEX_MAPPING).forEach((key) => {
		const touchButton = document.getElementById(
			deviceName + '-' + key + '-touch',
		);
		const pressButton = document.getElementById(
			deviceName + '-' + key + '-press',
		);
		const holdButton = document.getElementById(
			deviceName + '-' + key + '-hold',
		);
		const rangeInput = document.getElementById(
			deviceName + '-' + key + '-value',
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
