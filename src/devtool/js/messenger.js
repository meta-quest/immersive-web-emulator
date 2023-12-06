/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CLIENT_ACTIONS, EMULATOR_ACTIONS } from './actions';
import { DEVICE, HAND_STRINGS, OBJECT_NAME } from './constants';
import { EmulatorSettings, emulatorStates } from './emulatorStates';

const tabId = chrome.devtools.inspectedWindow.tabId;

const connection = {
	port: null,
	connect: () => {
		connection.port = chrome.runtime.connect(null, { name: 'iwe_devtool' });
		connection.port.onMessage.addListener((payload) => {
			switch (payload.action) {
				case CLIENT_ACTIONS.ENTER_IMMERSIVE:
					emulatorStates.inImmersive = true;
					emulatorStates.emulatedDevice?.forceEmitPose();
					break;
				case CLIENT_ACTIONS.EXIT_IMMERSIVE:
					emulatorStates.inImmersive = false;
					break;
			}
		});
		connection.port.onDisconnect.addListener(connection.connect);
	},
};

const executeAction = (action, payload = {}) => {
	payload.tabId = tabId;
	payload.action = action;
	try {
		connection.port.postMessage(payload);
	} catch (_e) {
		connection.connect();
		connection.port.postMessage(payload);
	}
};

export const syncDevicePose = (event) => {
	const { deviceKey, position, quaternion } = event;
	if (deviceKey === DEVICE.HEADSET) {
		executeAction(EMULATOR_ACTIONS.HEADSET_POSE_CHANGE, {
			position,
			quaternion,
		});
	} else {
		executeAction(EMULATOR_ACTIONS.CONTROLLER_POSE_CHANGE, {
			objectName: OBJECT_NAME[deviceKey],
			position,
			quaternion,
		});
	}
};

export const applyControllerButtonPressed = (key, buttonIndex, pressed) => {
	executeAction(EMULATOR_ACTIONS.BUTTON_STATE_CHANGE, {
		objectName: OBJECT_NAME[key],
		buttonIndex,
		pressed,
	});
};

export const applyControllerButtonChanged = (
	key,
	buttonIndex,
	pressed,
	touched,
	value,
) => {
	executeAction(EMULATOR_ACTIONS.BUTTON_STATE_CHANGE, {
		objectName: OBJECT_NAME[key],
		buttonIndex,
		pressed,
		touched,
		value,
	});
};

export const applyControllerAnalogValue = (key, axisIndex, value) => {
	executeAction(EMULATOR_ACTIONS.ANALOG_VALUE_CHANGE, {
		objectName: OBJECT_NAME[key],
		axisIndex,
		value,
	});
};

export const changeEmulatedDeviceType = (deviceDefinition) => {
	executeAction(EMULATOR_ACTIONS.DEVICE_TYPE_CHANGE, { deviceDefinition });
};

export const toggleStereoMode = (enabled) => {
	executeAction(EMULATOR_ACTIONS.STEREO_TOGGLE, { enabled });
};

export const relayKeyboardEvent = (eventType, eventOptions) => {
	executeAction(EMULATOR_ACTIONS.KEYBOARD_EVENT, {
		eventType,
		eventOptions,
	});
};

export const notifyExitImmersive = () => {
	executeAction(EMULATOR_ACTIONS.EXIT_IMMERSIVE);
};

export const changeRoomDimension = () => {
	executeAction(EMULATOR_ACTIONS.ROOM_DIMENSION_CHANGE, {
		dimension: EmulatorSettings.instance.roomDimension,
	});
};

export const changeInputMode = () => {
	executeAction(EMULATOR_ACTIONS.INPUT_MODE_CHANGE, {
		inputMode: EmulatorSettings.instance.inputMode,
	});
};

export const changeHandPose = (deviceId) => {
	const handName = HAND_STRINGS[deviceId].name;
	executeAction(EMULATOR_ACTIONS.HAND_POSE_CHANGE, {
		handedness: deviceId === DEVICE.INPUT_LEFT ? 'left' : 'right',
		pose: EmulatorSettings.instance.handPoses[handName],
	});
};

export const updatePinchValue = (deviceId) => {
	const handName = HAND_STRINGS[deviceId].name;
	executeAction(EMULATOR_ACTIONS.PINCH_VALUE_CHANGE, {
		handedness: deviceId === DEVICE.INPUT_LEFT ? 'left' : 'right',
		value: emulatorStates.pinchValues[handName],
	});
};

export const togglePolyfill = () => {
	chrome.tabs.get(tabId, (tab) => {
		const url = new URL(tab.url);
		const urlMatchPattern = url.origin + '/*';
		if (EmulatorSettings.instance.polyfillExcludes.has(urlMatchPattern)) {
			EmulatorSettings.instance.polyfillExcludes.delete(urlMatchPattern);
		} else {
			EmulatorSettings.instance.polyfillExcludes.add(urlMatchPattern);
		}
		EmulatorSettings.instance.write().then(() => {
			executeAction(EMULATOR_ACTIONS.EXCLUDE_POLYFILL);
		});
	});
};

export const reloadInspectedTab = () => {
	executeAction(EMULATOR_ACTIONS.EXCLUDE_POLYFILL);
};

export const updateUserObjects = () => {
	executeAction(EMULATOR_ACTIONS.USER_OBJECTS_CHANGE);
};
