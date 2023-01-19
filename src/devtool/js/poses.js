/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EmulatorSettings, emulatorStates } from './emulatorStates';

import { DEVICE } from './constants';
import { resetDevicePose } from './Inspector';

export const setupPoseButtons = () => {
	const saveDefaultPose = document.getElementById('save-default-pose');
	const poseReset = document.getElementById('pose-reset');

	saveDefaultPose.onclick = () => {
		const deviceTransform = {};
		Object.values(DEVICE).forEach((device) => {
			deviceTransform[device] = {};
			deviceTransform[device].position =
				emulatorStates.assetNodes[device].position.toArray();
			deviceTransform[device].rotation =
				emulatorStates.assetNodes[device].rotation.toArray();
		});
		EmulatorSettings.instance.defaultPose = deviceTransform;
		EmulatorSettings.instance.write();
	};

	poseReset.onclick = () => {
		resetDevicePose();
	};
};
