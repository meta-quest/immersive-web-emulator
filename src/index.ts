/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { XRDevice, metaQuest3 } from 'iwer';

import { DevUI } from '@iwer/devui';
import { SyntheticEnvironmentModule } from '@iwer/sem';
import sceneJson from '@iwer/sem/captures/living_room.json';

export const injectRuntime = () => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	window.CustomWebXRPolyfill = true;
	const xrDevice = new XRDevice(metaQuest3);
	xrDevice.installRuntime();
	xrDevice.installDevUI(DevUI);
	xrDevice.installSEM(SyntheticEnvironmentModule);
	xrDevice.sem?.loadEnvironment(sceneJson);
};
