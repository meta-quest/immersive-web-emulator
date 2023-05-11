/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CLIENT_ACTIONS, EMULATOR_ACTIONS } from './actions';
import { DEVICE, OBJECT_NAME } from './constants';
import { EmulatorSettings, emulatorStates } from './emulatorStates';

// eslint-disable-next-line no-undef
const tabId = chrome.devtools.inspectedWindow.tabId;

const connection = {
	port: null,
	connect: () => {
		// eslint-disable-next-line no-undef
		connection.port = chrome.runtime.connect(null, { name: 'iwe_devtool' });
		connection.port.onMessage.addListener((payload) => {
			switch (payload.action) {
				case CLIENT_ACTIONS.ENTER_IMMERSIVE:
					emulatorStates.inImmersive = true;
					applyAllPoseChanges();
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

const applyHeadsetPoseChange = (node) => {
	executeAction(EMULATOR_ACTIONS.HEADSET_POSE_CHANGE, {
		position: node.position.toArray(),
		quaternion: node.quaternion.toArray(),
	});
};

export const applyDevicePoseChange = (key, node) => {
	if (key === DEVICE.HEADSET) {
		applyHeadsetPoseChange(node);
	} else {
		executeAction(EMULATOR_ACTIONS.CONTROLLER_POSE_CHANGE, {
			objectName: OBJECT_NAME[key],
			position: node.position.toArray(),
			quaternion: node.quaternion.toArray(),
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

export const applyAllPoseChanges = () => {
	for (const key in emulatorStates.assetNodes) {
		if (emulatorStates.assetNodes[key]) {
			if (key === DEVICE.HEADSET) {
				applyHeadsetPoseChange(emulatorStates.assetNodes[key]);
			} else {
				applyDevicePoseChange(key, emulatorStates.assetNodes[key]);
			}
		}
	}
};

export const notifyExitImmersive = () => {
	executeAction(EMULATOR_ACTIONS.EXIT_IMMERSIVE);
};

export const changeRoomDimension = () => {
	executeAction(EMULATOR_ACTIONS.ROOM_DIMENSION_CHANGE, {
		dimension: EmulatorSettings.instance.roomDimension,
	});
};

export const notifyExcludePolyfill = () => {
	executeAction(EMULATOR_ACTIONS.EXCLUDE_POLYFILL);
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
