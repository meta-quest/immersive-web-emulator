/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

import { DEVICE, HAND_NAME } from './js/constants';

import $ from 'jquery';
import ControllerPanel from './jsx/controllers.jsx';
import EmulatedDevice from './js/emulatedDevice';
import { EmulatorSettings } from './js/emulatorStates';
import HeadsetBar from './jsx/headset.jsx';
import Inspector from './jsx/inspector.jsx';
import PoseBar from './jsx/pose.jsx';
import { createRoot } from 'react-dom/client';
import { registerGestureControls } from './js/hands';
import { syncDevicePose } from './js/messenger';

EmulatorSettings.instance.load().then(() => {
	const device = new EmulatedDevice();
	device.on('pose', syncDevicePose);

	const domNode = document.getElementById('headset-component');
	const root = createRoot(domNode);
	root.render(<HeadsetBar />);

	const inspectorNode = document.getElementById('render-component');
	const inspectorRoot = createRoot(inspectorNode);
	inspectorRoot.render(<Inspector device={device} />);

	const poseNode = document.getElementById('pose-component');
	const poseRoot = createRoot(poseNode);
	poseRoot.render(<PoseBar device={device} />);

	const controllersNode = document.getElementById('controllers-panel');
	const controllersRoot = createRoot(controllersNode);
	controllersRoot.render(
		<>
			{[DEVICE.LEFT_CONTROLLER, DEVICE.RIGHT_CONTROLLER].map((deviceKey) => (
				<ControllerPanel deviceKey={deviceKey} />
			))}
		</>,
	);

	[DEVICE.LEFT_CONTROLLER, DEVICE.RIGHT_CONTROLLER].forEach((deviceId) => {
		const handName = HAND_NAME[deviceId];
		$('#' + handName + '-component').load(
			'./ui-components/' + handName + '-component.html',
			() => {
				registerGestureControls(deviceId);
				device.render();
			},
		);
	});
});
