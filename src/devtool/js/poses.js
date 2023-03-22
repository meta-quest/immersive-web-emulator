/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EmulatorSettings, emulatorStates } from './emulatorStates';
import { createNewDevicePose, resetDevicePose } from './Inspector';

import { DEVICE } from './constants';

export const setupPoseButtons = () => {
	const savePose = document.getElementById('save-pose');
	const poseReset = document.getElementById('pose-reset');
	const poseSelector = document.getElementById('pose-selector');

	savePose.onclick = () => {
		const deviceTransform = {};
		Object.values(DEVICE).forEach((device) => {
			deviceTransform[device] = {};
			deviceTransform[device].position =
				emulatorStates.assetNodes[device].position.toArray();
			deviceTransform[device].rotation =
				emulatorStates.assetNodes[device].rotation.toArray();
		});
		EmulatorSettings.instance.poses[
			EmulatorSettings.instance.selectedPoseIndex
		] = deviceTransform;
		EmulatorSettings.instance.write();
	};

	poseReset.onclick = () => {
		resetDevicePose();
	};

	poseSelector.onchange = (e) => {
		if (e.target.value === 'new') {
			const newOption = document.createElement('option');
			const newOptionIndex = EmulatorSettings.instance.poses.length;
			const newOptionIndexString = String(
				EmulatorSettings.instance.poses.length,
			);
			newOption.value = newOptionIndexString;
			newOption.innerText = newOptionIndexString;
			poseSelector.appendChild(newOption);
			poseSelector.insertBefore(newOption, e.target.selectedOptions[0]);
			e.target.value = newOptionIndexString;

			createNewDevicePose(newOptionIndex);
		} else {
			EmulatorSettings.instance.selectedPoseIndex = parseInt(e.target.value);
			EmulatorSettings.instance.write();
			resetDevicePose();
		}
		poseSelector.blur();
	};
};
