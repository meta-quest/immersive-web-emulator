/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import './styles/index.css';

import { EmulatorSettings, emulatorStates } from './js/emulatorStates.js';

import App from './jsx/app.jsx';
import EmulatedDevice from './js/emulatedDevice.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { syncDevicePose } from './js/messenger.js';

EmulatorSettings.instance.load().then(() => {
	const device = new EmulatedDevice();
	device.on('pose', syncDevicePose);
	emulatorStates.emulatedDevice = device;

	const domNode = document.getElementById('app');
	const root = createRoot(domNode);
	root.render(<App device={device} />);
});
