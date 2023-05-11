/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

chrome.runtime.connect(null, { name: 'devtools' });
chrome.devtools.panels.create(
	'WebXR',
	'/icons/icon128.png',
	'dist/devtool-panel.html',
);
