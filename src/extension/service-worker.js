/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { generateUUID } from 'three/src/math/MathUtils';

const PORT_DESTINATION_MAPPING = {
	iwe_app: 'iwe_devtool',
	iwe_devtool: 'iwe_app',
};

const connectedTabs = {};

const relayMessage = (tabId, port, message) => {
	const destinationPorts =
		connectedTabs[tabId][PORT_DESTINATION_MAPPING[port.name]];
	destinationPorts.forEach((destinationPort) => {
		destinationPort.postMessage(message);
	});
};

// eslint-disable-next-line no-undef
chrome.runtime.onConnect.addListener((port) => {
	if (Object.keys(PORT_DESTINATION_MAPPING).includes(port.name)) {
		port.onMessage.addListener((message, sender) => {
			const tabId = message.tabId ?? sender.sender.tab.id;
			if (!connectedTabs[tabId]) {
				connectedTabs[tabId] = {};
				Object.keys(PORT_DESTINATION_MAPPING).forEach((portName) => {
					connectedTabs[tabId][portName] = new Set();
				});
			}

			if (!connectedTabs[tabId][port.name].has(port)) {
				connectedTabs[tabId][port.name].add(port);
				port.onDisconnect.addListener(() => {
					connectedTabs[tabId][port.name].delete(port);
				});
			}

			relayMessage(tabId, port, message);
		});
	}
});

// in MV3, only injecting here can properly inject the polyfill into the WebXR experience
// eslint-disable-next-line no-undef
chrome.scripting.registerContentScripts([
	{
		id: 'polyfill-injection' + generateUUID(),
		matches: ['http://*/*', 'https://*/*'],
		js: ['dist/webxr-polyfill.js'],
		runAt: 'document_start',
		world: 'MAIN',
	},
]);
