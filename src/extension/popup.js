/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

document.addEventListener('DOMContentLoaded', function () {
	const versionTag = document.getElementById('ext-version');
	// eslint-disable-next-line no-undef
	versionTag.innerHTML = 'version - ' + chrome.runtime.getManifest().version;

	document.getElementById('send-btn').onclick = () => {
		// eslint-disable-next-line no-undef
		chrome.tabs.query({ active: true }, (tabs) => {
			const tab = tabs[0];
			console.log('URL:', tab.url);
			// eslint-disable-next-line no-undef
			chrome.tabs.create({
				url:
					'https://www.oculus.com/open_url/?url=' + encodeURIComponent(tab.url),
			});
		});
	};

	document.getElementById('guide-btn').onclick = () => {
		// eslint-disable-next-line no-undef
		chrome.tabs.create({
			url: 'https://github.com/meta-quest/immersive-web-emulator#immersive-web-emulator-usage',
		});
	};

	document.getElementById('bug-btn').onclick = () => {
		// eslint-disable-next-line no-undef
		chrome.tabs.create({
			url: 'https://github.com/meta-quest/immersive-web-emulator/issues',
		});
	};
});
