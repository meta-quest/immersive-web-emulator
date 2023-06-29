/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

import { DEVICE, HAND_NAME, OBJECT_NAME } from './js/constants';
import {
	loadDeviceAsset,
	onResize,
	setupDeviceNodeButtons,
	setupRoomDimensionSettings,
} from './js/Inspector';
import {
	registerControllerButtonEvents,
	setupJoystick,
} from './js/controllers';

import $ from 'jquery';
import { EmulatorSettings } from './js/emulatorStates';
import HeadsetBar from '../jsx/headset.jsx';
import { changeInputMode } from './js/messenger';
import { createRoot } from 'react-dom/client';
import { registerGestureControls } from './js/hands';
import { setupKeyboardControlButtons } from './js/keyboard';
import { setupPoseButtons } from './js/poses';

EmulatorSettings.instance.load().then(() => {
	$('#transform-component').load(
		'./ui-components/transform-component.html',
		() => {
			loadDeviceAsset(DEVICE.HEADSET);
			loadDeviceAsset(DEVICE.RIGHT_CONTROLLER);
			loadDeviceAsset(DEVICE.LEFT_CONTROLLER);
			setupRoomDimensionSettings();
			setupDeviceNodeButtons();
			onResize();
		},
	);

	const domNode = document.getElementById('headset-component');
	const root = createRoot(domNode);
	root.render(<HeadsetBar />);

	[DEVICE.LEFT_CONTROLLER, DEVICE.RIGHT_CONTROLLER].forEach((deviceId) => {
		const deviceName = OBJECT_NAME[deviceId];
		$('#' + deviceName + '-component').load(
			'./ui-components/' + deviceName + '-component.html',
			() => {
				setupJoystick(deviceId);
				registerControllerButtonEvents(deviceId);
				onResize();
			},
		);
		const handName = HAND_NAME[deviceId];
		$('#' + handName + '-component').load(
			'./ui-components/' + handName + '-component.html',
			() => {
				registerGestureControls(deviceId);
				onResize();
			},
		);
	});

	$('#pose-component').load('./ui-components/pose-component.html', () => {
		setupPoseButtons();
		changeInputMode();
		const controllerTabButton = document.getElementById(
			'controller-tab-button',
		);
		const handsTabButton = document.getElementById('hands-tab-button');
		const controllerPanel = document.getElementById('controllers-panel');
		const handsPanel = document.getElementById('hands-panel');

		const updateInputModeUI = () => {
			const inputMode = EmulatorSettings.instance.inputMode;
			controllerPanel.style.display =
				inputMode === 'controllers' ? 'flex' : 'none';
			handsPanel.style.display = inputMode === 'hands' ? 'flex' : 'none';
			controllerTabButton.classList.toggle(
				'button-pressed',
				inputMode === 'controllers',
			);
			handsTabButton.classList.toggle('button-pressed', inputMode === 'hands');
			onResize();
		};

		updateInputModeUI();

		controllerTabButton.onclick = () => {
			EmulatorSettings.instance.inputMode = 'controllers';
			EmulatorSettings.instance.write();
			changeInputMode();
			updateInputModeUI();
		};

		handsTabButton.onclick = () => {
			EmulatorSettings.instance.inputMode = 'hands';
			EmulatorSettings.instance.write();
			changeInputMode();
			updateInputModeUI();
		};

		setupKeyboardControlButtons();
		onResize();
	});
});
