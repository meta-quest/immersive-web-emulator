/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EMULATOR_ACTIONS } from '../devtool/js/actions';
import { EmulatorSettings } from '../devtool/js/emulatorStates';

const PORT_DESTINATION_MAPPING = {
	iwe_app: 'iwe_devtool',
	iwe_devtool: 'iwe_app',
};

const connectedTabs = {};

const injectionId = 'iwe-polyfill-injection';

const updateInjection = (reloadTabId = null) => {
	EmulatorSettings.instance.load().then(() => {
		chrome.scripting.getRegisteredContentScripts(
			{ ids: [injectionId] },
			(scripts) => {
				if (scripts.length == 0) {
					chrome.scripting.registerContentScripts([
						{
							id: injectionId,
							matches: ['http://*/*', 'https://*/*'],
							js: ['dist/webxr-polyfill.js'],
							allFrames: true,
							runAt: 'document_start',
							world: 'MAIN',
							excludeMatches: Array.from(
								EmulatorSettings.instance.polyfillExcludes,
							),
						},
					]);
				} else {
					scripts.forEach((script) => {
						script.excludeMatches = Array.from(
							EmulatorSettings.instance.polyfillExcludes,
						);
					});
					chrome.scripting.updateContentScripts(scripts, () => {
						if (reloadTabId) {
							chrome.tabs.reload(reloadTabId);
						}
					});
				}
			},
		);
	});
};

const relayMessage = (tabId, port, message) => {
	const destinationPorts =
		connectedTabs[tabId][PORT_DESTINATION_MAPPING[port.name]];
	destinationPorts.forEach((destinationPort) => {
		destinationPort.postMessage(message);
	});
};

chrome.runtime.onConnect.addListener((port) => {
	if (Object.keys(PORT_DESTINATION_MAPPING).includes(port.name)) {
		port.onMessage.addListener((message, sender) => {
			const tabId = message.tabId ?? sender.sender.tab.id;
			if (message.action === EMULATOR_ACTIONS.EXCLUDE_POLYFILL) {
				updateInjection(tabId);
			}
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

updateInjection();
