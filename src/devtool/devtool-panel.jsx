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
	registerControllerButtonEvents,
	setupJoystick,
} from './js/controllers';

import $ from 'jquery';
import { EmulatorSettings } from './js/emulatorStates';
import HeadsetBar from './jsx/headset.jsx';
import Inspector from './js/emulatedDevice';
import PoseBar from './jsx/pose.jsx';
import { createRoot } from 'react-dom/client';
import { registerGestureControls } from './js/hands';
import { syncDevicePose } from './js/messenger';

EmulatorSettings.instance.load().then(() => {
	const inspector = new Inspector();
	inspector.on('pose', syncDevicePose);
	document.getElementById('scene-container').appendChild(inspector.canvas);

	const domNode = document.getElementById('headset-component');
	const root = createRoot(domNode);
	root.render(<HeadsetBar />);

	const poseNode = document.getElementById('pose-component');
	const poseRoot = createRoot(poseNode);
	poseRoot.render(<PoseBar inspector={inspector} />);

	[DEVICE.LEFT_CONTROLLER, DEVICE.RIGHT_CONTROLLER].forEach((deviceId) => {
		const deviceName = OBJECT_NAME[deviceId];
		$('#' + deviceName + '-component').load(
			'./ui-components/' + deviceName + '-component.html',
			() => {
				setupJoystick(deviceId);
				registerControllerButtonEvents(deviceId);
				inspector.render();
			},
		);
		const handName = HAND_NAME[deviceId];
		$('#' + handName + '-component').load(
			'./ui-components/' + handName + '-component.html',
			() => {
				registerGestureControls(deviceId);
				inspector.render();
			},
		);
	});
});
