/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
	CLIENT_ACTIONS,
	EMULATOR_ACTIONS,
	POLYFILL_ACTIONS,
} from '../devtool/js/actions';

import { DEVICE_DEFINITIONS } from '../devtool/js/devices';
import { EmulatorSettings } from '../devtool/js/emulatorStates';

let pingJob = null;

const connection = {
	port: null,
	connect: () => {
		connection.port = chrome.runtime.connect({ name: 'iwe_app' });
		connection.port.onMessage.addListener((message) => {
			switch (message.action) {
				case EMULATOR_ACTIONS.DEVICE_TYPE_CHANGE:
					triggerPolyfillAction(POLYFILL_ACTIONS.DEVICE_TYPE_CHANGE, {
						deviceDefinition: message.deviceDefinition,
					});
					break;

				case EMULATOR_ACTIONS.HEADSET_POSE_CHANGE:
					triggerPolyfillAction(POLYFILL_ACTIONS.HEADSET_POSE_CHANGE, {
						position: message.position,
						quaternion: message.quaternion,
					});
					break;

				case EMULATOR_ACTIONS.CONTROLLER_POSE_CHANGE:
					triggerPolyfillAction(POLYFILL_ACTIONS.CONTROLLER_POSE_CHANGE, {
						objectName: message.objectName,
						position: message.position,
						quaternion: message.quaternion,
					});
					break;

				case EMULATOR_ACTIONS.BUTTON_STATE_CHANGE:
					triggerPolyfillAction(POLYFILL_ACTIONS.BUTTON_STATE_CHANGE, {
						objectName: message.objectName,
						pressed: message.pressed,
						touched: message.touched,
						value: message.value,
						buttonIndex: message.buttonIndex,
					});
					break;

				case EMULATOR_ACTIONS.ANALOG_VALUE_CHANGE:
					triggerPolyfillAction(POLYFILL_ACTIONS.ANALOG_VALUE_CHANGE, {
						objectName: message.objectName,
						value: message.value,
						axisIndex: message.axisIndex,
					});
					break;

				case EMULATOR_ACTIONS.STEREO_TOGGLE:
					triggerPolyfillAction(POLYFILL_ACTIONS.STEREO_TOGGLE, {
						enabled: message.enabled,
					});
					break;

				case EMULATOR_ACTIONS.EXIT_IMMERSIVE:
					triggerPolyfillAction(POLYFILL_ACTIONS.EXIT_IMMERSIVE, {});
					break;

				case EMULATOR_ACTIONS.KEYBOARD_EVENT:
					window.dispatchEvent(
						new KeyboardEvent(message.eventType, message.eventOptions),
					);
					break;

				case EMULATOR_ACTIONS.ROOM_DIMENSION_CHANGE:
					triggerPolyfillAction(POLYFILL_ACTIONS.ROOM_DIMENSION_CHANGE, {
						dimension: message.dimension,
					});
					break;

				case EMULATOR_ACTIONS.INPUT_MODE_CHANGE:
					triggerPolyfillAction(POLYFILL_ACTIONS.INPUT_MODE_CHANGE, {
						inputMode: message.inputMode,
					});
					break;

				case EMULATOR_ACTIONS.HAND_POSE_CHANGE:
					triggerPolyfillAction(POLYFILL_ACTIONS.HAND_POSE_CHANGE, {
						handedness: message.handedness,
						pose: message.pose,
					});
					break;

				case EMULATOR_ACTIONS.PINCH_VALUE_CHANGE:
					triggerPolyfillAction(POLYFILL_ACTIONS.PINCH_VALUE_CHANGE, {
						handedness: message.handedness,
						value: message.value,
					});
					break;

				case EMULATOR_ACTIONS.USER_OBJECTS_CHANGE:
					EmulatorSettings.instance.load().then(() => {
						triggerPolyfillAction(POLYFILL_ACTIONS.USER_OBJECTS_CHANGE, {
							objects: EmulatorSettings.instance.userObjects,
						});
					});
					break;
			}
		});
		connection.port.onDisconnect.addListener(connection.connect);
	},
};

const triggerPolyfillAction = (action, payload) => {
	window.dispatchEvent(
		new CustomEvent(action, {
			detail:
				// eslint-disable-next-line no-undef
				typeof cloneInto !== 'undefined' ? cloneInto(payload, window) : payload,
		}),
	);
};

const sendActionToEmulator = (action) => {
	try {
		connection.port.postMessage({ action });
	} catch (_e) {
		connection.connect();
		connection.port.postMessage({ action });
	}
};

window.addEventListener(
	CLIENT_ACTIONS.ENTER_IMMERSIVE,
	() => {
		sendActionToEmulator(CLIENT_ACTIONS.ENTER_IMMERSIVE);
		if (!pingJob) {
			// client does not actively send messages to the service worker by itself
			// a disconnection from the service worker will not be noticed unless it
			// periodically send ping messages to keep the connection alive
			// we don't want to do this until we know that this is a XR site
			pingJob = setInterval(() => {
				sendActionToEmulator(CLIENT_ACTIONS.PING);
			}, 5000);
			EmulatorSettings.instance.load().then(() => {
				triggerPolyfillAction(POLYFILL_ACTIONS.USER_OBJECTS_CHANGE, {
					objects: EmulatorSettings.instance.userObjects,
				});
			});
		}
	},
	false,
);

window.addEventListener(
	CLIENT_ACTIONS.EXIT_IMMERSIVE,
	() => {
		sendActionToEmulator(CLIENT_ACTIONS.EXIT_IMMERSIVE);
	},
	false,
);

EmulatorSettings.instance.load().then(() => {
	triggerPolyfillAction(POLYFILL_ACTIONS.DEVICE_INIT, {
		deviceDefinition: DEVICE_DEFINITIONS[EmulatorSettings.instance.deviceKey],
		stereoEffect: EmulatorSettings.instance.stereoOn,
	});
	triggerPolyfillAction(POLYFILL_ACTIONS.ROOM_DIMENSION_CHANGE, {
		dimension: EmulatorSettings.instance.roomDimension,
	});
	triggerPolyfillAction(POLYFILL_ACTIONS.INPUT_MODE_CHANGE, {
		inputMode: EmulatorSettings.instance.inputMode,
	});
	['left', 'right'].forEach((handedness) => {
		triggerPolyfillAction(POLYFILL_ACTIONS.HAND_POSE_CHANGE, {
			handedness: handedness,
			pose: EmulatorSettings.instance.handPoses[handedness + '-hand'],
		});
	});
	// actively establish connection with the service worker as soon as the page
	// loads and the polyfill initializes
	sendActionToEmulator(CLIENT_ACTIONS.PING);
});
