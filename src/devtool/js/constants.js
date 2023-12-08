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
	INPUT_RIGHT: '2',
	INPUT_LEFT: '3',
};

export const OBJECT_NAME = {};
OBJECT_NAME[DEVICE.HEADSET] = 'headset';
OBJECT_NAME[DEVICE.INPUT_LEFT] = 'left-controller';
OBJECT_NAME[DEVICE.INPUT_RIGHT] = 'right-controller';

export const DEFAULT_TRANSFORMS = {};
DEFAULT_TRANSFORMS[DEVICE.HEADSET] = {
	position: [0, 1.7, 0],
	rotation: [0, 0, 0, 'XYZ'],
};
DEFAULT_TRANSFORMS[DEVICE.INPUT_RIGHT] = {
	position: [0.25, 1.5, -0.4],
	rotation: [0, 0, 0, 'XYZ'],
};
DEFAULT_TRANSFORMS[DEVICE.INPUT_LEFT] = {
	position: [-0.25, 1.5, -0.4],
	rotation: [0, 0, 0, 'XYZ'],
};

export const CONTROLLER_STRINGS = {};
CONTROLLER_STRINGS[DEVICE.INPUT_LEFT] = {
	name: 'left-controller',
	displayName: 'Left Controller',
	handedness: 'left',
	button1: 'ButtonX',
	button2: 'ButtonY',
};
CONTROLLER_STRINGS[DEVICE.INPUT_RIGHT] = {
	name: 'right-controller',
	displayName: 'Right Controller',
	handedness: 'right',
	button1: 'ButtonA',
	button2: 'ButtonB',
};

export const HAND_STRINGS = {};
HAND_STRINGS[DEVICE.INPUT_LEFT] = {
	name: 'left-hand',
	displayName: 'Left Hand',
	handedness: 'left',
};
HAND_STRINGS[DEVICE.INPUT_RIGHT] = {
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

export const SEMANTIC_LABELS = {
	Desk: 'desk',
	Couch: 'couch',
	Floor: 'floor',
	Ceiling: 'ceiling',
	Wall: 'wall',
	Door: 'door',
	Window: 'window',
	Table: 'table',
	Shelf: 'shelf',
	Bed: 'bed',
	Screen: 'screen',
	Lamp: 'lamp',
	Plant: 'plant',
	WallArt: 'wall art',
	Other: 'other',
};

export const TRIGGER_MODES = ['slow', 'normal', 'fast', 'turbo'];

export const TRIGGER_CONFIG = {
	slow: {
		interval: 20,
		holdTime: 100,
	},
	normal: {
		interval: 10,
		holdTime: 50,
	},
	fast: {
		interval: 5,
		holdTime: 10,
	},
	turbo: {
		interval: 1,
		holdTime: 1,
	},
};
