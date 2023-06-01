/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EmulatorSettings, emulatorStates } from './emulatorStates';

import { HAND_NAME } from './constants';
import { changeHandPose } from './messenger';

export const registerGestureControls = (deviceId) => {
	const handName = HAND_NAME[deviceId];
	const gestureSelect = document.getElementById(handName + '-gesture');
	gestureSelect.addEventListener('change', function (_event) {
		EmulatorSettings.instance.handPoses[handName] = gestureSelect.value;
		EmulatorSettings.instance.write();
		changeHandPose(deviceId);
	});
};
