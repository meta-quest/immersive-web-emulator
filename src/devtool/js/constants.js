/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const PRESS_AND_RELEASE_DURATION = 250;

export const BUTTON_POLYFILL_INDEX_MAPPING = {
	joystick: 0,
	trigger: 1,
	grip: 2,
	button1: 3,
	button2: 4,
};

export const DEVICE = {
	HEADSET: '0',
	RIGHT_CONTROLLER: '2',
	LEFT_CONTROLLER: '3',
};

export const ASSET_PATH = {};
ASSET_PATH[DEVICE.HEADSET] = './assets/headset.glb';
ASSET_PATH[DEVICE.LEFT_CONTROLLER] = './assets/controller-left.glb';
ASSET_PATH[DEVICE.RIGHT_CONTROLLER] = './assets/controller-right.glb';

export const OBJECT_NAME = {};
OBJECT_NAME[DEVICE.HEADSET] = 'headset';
OBJECT_NAME[DEVICE.LEFT_CONTROLLER] = 'left-controller';
OBJECT_NAME[DEVICE.RIGHT_CONTROLLER] = 'right-controller';

export const DEFAULT_TRANSFORMS = {};
DEFAULT_TRANSFORMS[DEVICE.HEADSET] = {
	position: [0, 1.7, 0],
	rotation: [0, 0, 0, 'XYZ'],
};
DEFAULT_TRANSFORMS[DEVICE.RIGHT_CONTROLLER] = {
	position: [0.25, 1.5, -0.4],
	rotation: [0, 0, 0, 'XYZ'],
};
DEFAULT_TRANSFORMS[DEVICE.LEFT_CONTROLLER] = {
	position: [-0.25, 1.5, -0.4],
	rotation: [0, 0, 0, 'XYZ'],
};

export const CONTROLLER_STRINGS = {};
CONTROLLER_STRINGS[DEVICE.LEFT_CONTROLLER] = {
	name: 'left-controller',
	displayName: 'Left Controller',
	handedness: 'left',
	button1: 'ButtonX',
	button2: 'ButtonY',
};
CONTROLLER_STRINGS[DEVICE.RIGHT_CONTROLLER] = {
	name: 'right-controller',
	displayName: 'Right Controller',
	handedness: 'right',
	button1: 'ButtonA',
	button2: 'ButtonB',
};

export const HAND_STRINGS = {};
HAND_STRINGS[DEVICE.LEFT_CONTROLLER] = {
	name: 'left-hand',
	displayName: 'Left Hand',
	handedness: 'left',
};
HAND_STRINGS[DEVICE.RIGHT_CONTROLLER] = {
	name: 'right-hand',
	displayName: 'Right Hand',
	handedness: 'right',
};

export const KEYBOARD_CONTROL_MAPPING = {
	left: {
		joystickLeft: 'a',
		joystickRight: 'd',
		joystickForward: 'w',
		joystickBackward: 's',
		trigger: 'e',
		grip: 'q',
		button1: 'x',
		button2: 'z',
		joystick: 'c',
	},
	right: {
		joystickLeft: 'ArrowLeft',
		joystickRight: 'ArrowRight',
		joystickForward: 'ArrowUp',
		joystickBackward: 'ArrowDown',
		trigger: 'Enter',
		grip: 'Shift',
		button1: "'",
		button2: '/',
		joystick: '.',
	},
};

export const GAMEPAD_ID_TO_INPUT_ID_MAPPING = {
	3: 'joystick',
	5: 'button2',
	4: 'button1',
	0: 'trigger',
	1: 'grip',
};
