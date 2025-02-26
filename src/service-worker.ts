/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { parse } from 'tldts';

const extractDomain = (urlString: string) =>
	parse(urlString).domain ?? parse(urlString).hostname;

const getScriptId = (domain: string) => `iwe-injection-${domain}`;

chrome.action.onClicked.addListener(async (tab) => {
	if (!tab || !tab.id || !tab.url) return;

	const domain = extractDomain(tab.url);
	if (!domain) {
		console.warn('[IWE] Unable to extract domain from URL:', tab.url);
		return;
	}

	const scriptExists = await hasRegisteredScript(domain);
	if (scriptExists) {
		// Domain is already enabled -> Unregister the content script
		try {
			await unregisterDomainContentScript(domain);
			console.log(`[IWE] Unregistered content script for domain: ${domain}`);
		} catch (error) {
			console.error(`[IWE] Error unregistering script for ${domain}:`, error);
			return;
		}
	} else {
		// Domain is not enabled -> Register the content script
		try {
			await registerDomainContentScript(domain);
			console.log(`[IWE] Registered content script for domain: ${domain}`);
		} catch (error) {
			console.error(`[IWE] Error registering script for ${domain}:`, error);
			return;
		}
	}

	chrome.tabs.reload(tab.id, { bypassCache: true });
});

/**
 * Listener for tab activation (when user switches to a different tab).
 * Updates the icon based on whether the current domain is enabled.
 */
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
	try {
		const tab = await chrome.tabs.get(tabId);
		await handleTabUpdate(tabId, tab.url);
	} catch (error) {
		console.error(
			`[IWE] Error handling tab activation for tabId ${tabId}:`,
			error,
		);
	}
});

/**
 * Listener for tab updates (e.g., navigation).
 * Updates the icon based on whether the new URL's domain is enabled.
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	if (changeInfo.status) {
		await handleTabUpdate(tabId, tab.url);
	}
});

/**
 * Handles updating the extension icon based on the tab's current domain.
 */
async function handleTabUpdate(tabId: number, urlString: string | undefined) {
	if (!urlString) return;
	const domain = extractDomain(urlString);
	if (domain) {
		const scriptExists = await hasRegisteredScript(domain);
		updateIcon(tabId, scriptExists);
	}
}

/**
 * Registers a content script for a specific domain.
 */
async function registerDomainContentScript(domain: string) {
	const matches = [`http://*.${domain}/*`, `https://*.${domain}/*`];
	await chrome.scripting.registerContentScripts([
		{
			id: getScriptId(domain),
			matches: matches,
			js: ['build/iwe.min.js'],
			allFrames: true,
			runAt: 'document_start',
			world: 'MAIN',
			persistAcrossSessions: false,
		},
	]);
}

/**
 * Checks whether the content script is registered for a specific domain.
 */
async function hasRegisteredScript(domain: string) {
	const scriptId = `iwe-injection-${domain}`;

	try {
		const registeredScripts =
			await chrome.scripting.getRegisteredContentScripts();

		// Check if the script with the given ID is in the list of registered scripts
		return registeredScripts.some((script) => script.id === scriptId);
	} catch (error) {
		console.error('Error checking registered scripts:', error);
		return false;
	}
}

/**
 * Unregisters the content script for a specific domain.
 */
async function unregisterDomainContentScript(domain: string) {
	await chrome.scripting.unregisterContentScripts({
		ids: [getScriptId(domain)],
	});
}

/**
 * Updates the extension icon for a specific tab.
 */
function updateIcon(tabId: number, isActive: boolean) {
	const iconPath = isActive ? '../icons/active' : '../icons/default';
	chrome.action.setIcon({
		tabId,
		path: {
			16: `${iconPath}16.png`,
			48: `${iconPath}48.png`,
			128: `${iconPath}128.png`,
		},
	});
}
