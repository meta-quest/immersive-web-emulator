/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DEVICE, KEYBOARD_CONTROL_MAPPING, OBJECT_NAME } from './constants';
import { EmulatorSettings, emulatorStates } from './emulatorStates';

import { relayKeyboardEvent } from './messenger';

const emulatedJoysticks = {};
const JOYSTICKS = emulatorStates.joysticks;

const resetEmulatedJoysticks = () => {
	emulatedJoysticks.left = {
		left: false,
		right: false,
		forward: false,
		backward: false,
	};
	emulatedJoysticks.right = {
		left: false,
		right: false,
		forward: false,
		backward: false,
	};
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
		case 'joystickLeft':
			emulatedJoysticks[handKey].left = true;
			break;
		case 'joystickRight':
			emulatedJoysticks[handKey].right = true;
			break;
		case 'joystickForward':
			emulatedJoysticks[handKey].forward = true;
			break;
		case 'joystickBackward':
			emulatedJoysticks[handKey].backward = true;
			break;
		case 'trigger':
		case 'grip':
			emulatorStates.sliders[handKey][action].value = 100;
			emulatorStates.buttons[handKey][action].disabled = true;
			emulatorStates.sliders[handKey][action].onInputFunc();
			break;
		default:
			emulatorStates.buttons[handKey][action].click();
	}
};

const onReservedKeyUp = (handKey, action) => {
	switch (action) {
		case 'joystickLeft':
			emulatedJoysticks[handKey].left = false;
			break;
		case 'joystickRight':
			emulatedJoysticks[handKey].right = false;
			break;
		case 'joystickForward':
			emulatedJoysticks[handKey].forward = false;
			break;
		case 'joystickBackward':
			emulatedJoysticks[handKey].backward = false;
			break;
		case 'trigger':
		case 'grip':
			emulatorStates.sliders[handKey][action].value = 0;
			emulatorStates.buttons[handKey][action].disabled = false;
			emulatorStates.sliders[handKey][action].onInputFunc();
			break;
		default:
			emulatorStates.buttons[handKey][action].click();
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

	relayKeyboardEvent(event.type, options);
};

const moveJoysticks = () => {
	Object.entries(emulatedJoysticks).forEach(([handKey, directions]) => {
		const deviceId = handKey == 'left' ? DEVICE.INPUT_LEFT : DEVICE.INPUT_RIGHT;
		const deviceName = OBJECT_NAME[deviceId];
		if (
			directions.left ||
			directions.right ||
			directions.forward ||
			directions.backward
		) {
			const axisX = directions.left ? -1 : 0 + directions.right ? 1 : 0;
			const axisY = directions.forward ? -1 : 0 + directions.backward ? 1 : 0;
			const normalizeScale = Math.sqrt(axisX * axisX + axisY * axisY);

			if (JOYSTICKS[deviceName]) {
				JOYSTICKS[deviceName].overrideMove(
					axisX / normalizeScale,
					axisY / normalizeScale,
				);
			}
		} else {
			if (JOYSTICKS[deviceName]) {
				JOYSTICKS[deviceName].overrideMove(0, 0);
			}
		}
	});
};

export default function initKeyboardControl() {
	resetEmulatedJoysticks();
	window.addEventListener('blur', resetEmulatedJoysticks);

	document.addEventListener(
		'keydown',
		(event) => {
			const result = getReservedKeyAction(event.key);
			if (EmulatorSettings.instance.actionMappingOn && result) {
				const [handKey, action] = result;
				onReservedKeyDown(handKey, action);
				moveJoysticks();
			} else {
				passThroughKeyboardEvent(event);
			}
		},
		false,
	);

	document.addEventListener(
		'keyup',
		(event) => {
			const result = getReservedKeyAction(event.key);
			if (result) {
				const [handKey, action] = result;
				onReservedKeyUp(handKey, action);
				moveJoysticks();
			} else if (EmulatorSettings.instance.actionMappingOn) {
				passThroughKeyboardEvent(event);
			}
		},
		false,
	);

	document.addEventListener(
		'keypress',
		(event) => {
			const result = getReservedKeyAction(event.key);
			if (!result && EmulatorSettings.instance.actionMappingOn) {
				passThroughKeyboardEvent(event);
			}
		},
		false,
	);
}
