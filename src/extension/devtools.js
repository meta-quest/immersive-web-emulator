/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// eslint-disable-next-line no-undef
chrome.runtime.connect(null, { name: 'devtools' });
// eslint-disable-next-line no-undef
chrome.devtools.panels.create(
	'WebXR',
	'/icons/icon128.png',
	'/src/devtool/index.html',
);
