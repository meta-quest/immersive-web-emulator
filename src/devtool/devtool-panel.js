/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

import { DEVICE, OBJECT_NAME } from './js/constants';
import {
	changeEmulatedDeviceType,
	notifyExcludePolyfill,
	notifyExitImmersive,
	togglePolyfill,
	toggleStereoMode,
} from './js/messenger';
import {
	loadDeviceAsset,
	onResize,
	populatePoses,
	setupRoomDimensionSettings,
} from './js/Inspector';
import {
	registerControllerButtonEvents,
	setupJoystick,
} from './js/controllers';

import $ from 'jquery';
import { DEVICE_DEFINITIONS } from './js/devices';
import { EmulatorSettings } from './js/emulatorStates';
import { setupKeyboardControlButtons } from './js/keyboard';
import { setupPoseButtons } from './js/poses';
import { setupReplay } from './js/player';

const setupHeadsetComponentButtons = () => {
	document
		.getElementById('exit-webxr')
		.addEventListener('click', notifyExitImmersive, false);

	const polyfillToggle = document.getElementById('polyfill-toggle');
	const updatePolyfillButton = (tab) => {
		const url = new URL(tab.url);
		const urlMatchPattern = url.origin + '/*';
		polyfillToggle.classList.toggle(
			'button-pressed',
			!EmulatorSettings.instance.polyfillExcludes.has(urlMatchPattern),
		);
	};
	// check every time navigation happens on the tab
	chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
		if (
			tabId === chrome.devtools.inspectedWindow.tabId &&
			changeInfo.status === 'complete'
		) {
			updatePolyfillButton(tab);
		}
	});
	// check on start up
	chrome.tabs.get(chrome.devtools.inspectedWindow.tabId, (tab) => {
		updatePolyfillButton(tab);
	});
	polyfillToggle.addEventListener('click', togglePolyfill, false);

	const stereoToggle = document.getElementById('stereo-toggle');
	stereoToggle.classList.toggle(
		'button-pressed',
		EmulatorSettings.instance.stereoOn,
	);
	stereoToggle.addEventListener('click', function () {
		EmulatorSettings.instance.stereoOn = !EmulatorSettings.instance.stereoOn;
		toggleStereoMode(EmulatorSettings.instance.stereoOn);
		this.classList.toggle('button-pressed', EmulatorSettings.instance.stereoOn);
		EmulatorSettings.instance.write();
	});

	// document.getElementById('settings').onclick = function () {
	// 	alert('Emulator settings not yet available');
	// };

	const deviceSelect = document.getElementById('vr-device-select');

	$('#vr-device-select').val(EmulatorSettings.instance.deviceKey);

	function changeDevice(deviceId) {
		if (DEVICE_DEFINITIONS[deviceId]) {
			EmulatorSettings.instance.deviceKey = deviceId;
			changeEmulatedDeviceType(DEVICE_DEFINITIONS[deviceId]);
			EmulatorSettings.instance.write();
		}
	}

	deviceSelect.addEventListener('change', function (_event) {
		changeDevice(this.value);
	});
};

EmulatorSettings.instance.load().then(() => {
	$('#transform-component').load(
		'./ui-components/transform-component.html',
		() => {
			loadDeviceAsset(DEVICE.HEADSET);
			loadDeviceAsset(DEVICE.RIGHT_CONTROLLER);
			loadDeviceAsset(DEVICE.LEFT_CONTROLLER);
			setupRoomDimensionSettings();
		},
	);

	$('#headset-component').load(
		'./ui-components/headset-component.html',
		setupHeadsetComponentButtons,
	);

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
	});

	$('#session-player-component').load(
		'./ui-components/session-player-component.html',
		setupReplay,
	);

	$('#pose-component').load('./ui-components/pose-component.html', () => {
		setupPoseButtons();
		populatePoses();
		const controllerTabButton = document.getElementById(
			'controller-tab-button',
		);
		const playerTabButton = document.getElementById('player-tab-button');
		const controllerPanel = document.getElementById('controller-panel');
		const playerPanel = document.getElementById('player-panel');
		controllerTabButton.onclick = () => {
			controllerPanel.style.display = 'flex';
			playerPanel.style.display = 'none';
			controllerTabButton.classList.toggle('button-pressed', true);
			playerTabButton.classList.toggle('button-pressed', false);
			onResize();
		};
		playerTabButton.onclick = () => {
			// controllerPanel.style.display = 'none';
			// playerPanel.style.display = 'flex';
			// controllerTabButton.classList.toggle('button-pressed');
			// playerTabButton.classList.toggle('button-pressed');
			// onResize();
			alert('Session recording/playback feature coming soon');
		};
	});

	$('#keyboard-control-component').load(
		'./ui-components/keyboard-control-component.html',
		setupKeyboardControlButtons,
	);
});
