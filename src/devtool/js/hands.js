/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EmulatorSettings, emulatorStates } from './emulatorStates';
import { changeHandPose, updatePinchValue } from './messenger';

import { HAND_NAME } from './constants';
import { pressAndReleaseAnalogButton } from './controllers';

export const registerGestureControls = (deviceId) => {
	const handName = HAND_NAME[deviceId];
	const poseSelect = document.getElementById(handName + '-gesture');
	poseSelect.addEventListener('change', function (_event) {
		EmulatorSettings.instance.handPoses[handName] = poseSelect.value;
		EmulatorSettings.instance.write();
		changeHandPose(deviceId);
	});
	const pinchValue = document.getElementById(handName + '-pinch-value');
	pinchValue.value = emulatorStates.pinchValues[handName];
	pinchValue.oninput = () => {
		emulatorStates.pinchValues[handName] = pinchValue.value / 100;
		updatePinchValue(deviceId);
	};
	const pinchButton = document.getElementById(handName + '-pinch');
	pinchButton.onclick = () => {
		pressAndReleaseAnalogButton(pinchButton, pinchValue);
	};
};
