/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
	BUTTON_POLYFILL_INDEX_MAPPING,
	DEVICE,
	GAMEPAD_ID_TO_INPUT_ID_MAPPING,
} from './constants';
import { Quaternion, Vector3 } from 'three';
import {
	applyAllPoseChanges,
	applyControllerAnalogValue,
	applyControllerButtonChanged,
} from './messenger';
import { render, updateDeviceTransformData } from './Inspector';

import _ from 'lodash';
import { emulatorStates } from './emulatorStates';

const animateFrame = (currentFrameTransform, nextFrameTransform, alpha) => {
	[
		[DEVICE.HEADSET, 'head'],
		[DEVICE.LEFT_CONTROLLER, 'left'],
		[DEVICE.RIGHT_CONTROLLER, 'right'],
	].forEach(([deviceId, key]) => {
		if (!currentFrameTransform[key]) return;
		emulatorStates.assetNodes[deviceId].position.copy(
			new Vector3()
				.fromArray(currentFrameTransform[key].position)
				.lerp(new Vector3().fromArray(nextFrameTransform[key].position), alpha),
		);
		emulatorStates.assetNodes[deviceId].quaternion.copy(
			new Quaternion()
				.fromArray(currentFrameTransform[key].quaternion)
				.slerp(
					new Quaternion().fromArray(nextFrameTransform[key].quaternion),
					alpha,
				),
		);
		updateDeviceTransformData(deviceId);
	});

	render();
	applyAllPoseChanges();
};

const handleTransformFrames = (transformFrames) => {
	let currentFrameId = 0;
	const totalPlayTime =
		transformFrames[transformFrames.length - 1].timestamp -
		transformFrames[0].timestamp;
	const startTimestamp = performance.now();
	const progressBar = document.getElementById('play-progress');
	const onTransformFrame = () => {
		if (!emulatorStates.playbackInProgress) return;
		const currentTimestamp = (performance.now() - startTimestamp) / 1000;
		if (
			currentTimestamp >= transformFrames[transformFrames.length - 1].timestamp
		) {
			emulatorStates.playbackInProgress = false;
			return;
		}
		if (currentTimestamp >= transformFrames[currentFrameId].timestamp) {
			let nextFrameId = currentFrameId + 1;
			while (
				transformFrames[nextFrameId] &&
				transformFrames[nextFrameId].timestamp < currentTimestamp
			) {
				nextFrameId += 1;
			}
			currentFrameId = nextFrameId - 1;
			const currentFrame = transformFrames[currentFrameId];
			const nextFrame = transformFrames[nextFrameId];
			if (currentFrame && nextFrame) {
				const alpha =
					(currentTimestamp - currentFrame.timestamp) /
					(nextFrame.timestamp - currentFrame.timestamp);
				animateFrame(currentFrame, nextFrame, alpha);
			}
		}
		const progress = currentTimestamp / totalPlayTime;
		progressBar.value = progress * 1000;
		requestAnimationFrame(onTransformFrame);
	};
	requestAnimationFrame(onTransformFrame);
};

const handleGamepadFrames = (frames) => {
	const uncompressedFrame = {
		right: {
			buttons: [
				{ pressed: false, touched: false, value: 0 },
				{ pressed: false, touched: false, value: 0 },
				{ pressed: false, touched: false, value: 0 },
				{ pressed: false, touched: false, value: 0 },
				{ pressed: false, touched: false, value: 0 },
				{ pressed: false, touched: false, value: 0 },
				{ pressed: false, touched: false, value: 0 },
			],
			axes: [null, null, 0, 0],
		},
		left: {
			buttons: [
				{ pressed: false, touched: false, value: 0 },
				{ pressed: false, touched: false, value: 0 },
				{ pressed: false, touched: false, value: 0 },
				{ pressed: false, touched: false, value: 0 },
				{ pressed: false, touched: false, value: 0 },
				{ pressed: false, touched: false, value: 0 },
				{ pressed: false, touched: false, value: 0 },
			],
			axes: [null, null, 0, 0],
		},
	};
	let currentFrameId = 0;
	const startTimestamp = performance.now();
	const onGamepadFrame = () => {
		if (!emulatorStates.playbackInProgress) return;
		const currentTimestamp = (performance.now() - startTimestamp) / 1000;
		if (currentTimestamp >= frames[frames.length - 1].timestamp) {
			emulatorStates.playbackInProgress = false;
			return;
		}
		if (currentTimestamp >= frames[currentFrameId].timestamp) {
			let nextFrameId = currentFrameId + 1;
			while (
				frames[nextFrameId] &&
				frames[nextFrameId].timestamp < currentTimestamp
			) {
				nextFrameId += 1;
			}
			currentFrameId = nextFrameId - 1;
			const currentFrame = frames[currentFrameId];
			if (currentFrame) {
				[
					[DEVICE.LEFT_CONTROLLER, 'left'],
					[DEVICE.RIGHT_CONTROLLER, 'right'],
				].forEach(([deviceId, key]) => {
					currentFrame[key]?.buttons?.forEach((button, i) => {
						if (!_.isEmpty(button)) {
							uncompressedFrame[key].buttons[i] = button;
						}
					});

					if (currentFrame[key]?.axes) {
						uncompressedFrame[key].axes = currentFrame[key].axes;
					}

					uncompressedFrame[key].buttons.forEach((button, i) => {
						const inputId = GAMEPAD_ID_TO_INPUT_ID_MAPPING[i];
						if (inputId) {
							applyControllerButtonChanged(
								deviceId,
								BUTTON_POLYFILL_INDEX_MAPPING[inputId],
								button.pressed,
								button.touched,
								button.value,
							);
						}
					});
					applyControllerAnalogValue(
						deviceId,
						0,
						uncompressedFrame[key].axes[2],
					);
					applyControllerAnalogValue(
						deviceId,
						1,
						uncompressedFrame[key].axes[3],
					);
				});
			}
		}
		requestAnimationFrame(onGamepadFrame);
	};
	requestAnimationFrame(onGamepadFrame);
};

const validateSessionFile = (content) => {
	try {
		const sessionData = JSON.parse(content);
		if (!sessionData.transformFrames) return false;
		if (!sessionData.gamepadFrames) return false;
		for (let i = 0; i < sessionData.transformFrames.length; i++) {
			const transformFrame = sessionData.transformFrames[i];
			['head', 'left', 'right'].forEach((key) => {
				if (transformFrame[key]) {
					if (
						transformFrame[key].position.length != 3 ||
						transformFrame[key].quaternion.length != 4
					) {
						return false;
					}
					for (let j = 0; j < transformFrame[key].position.length; j++) {
						if (isNaN(transformFrame[key].position[j])) return false;
					}
					for (let j = 0; j < transformFrame[key].quaternion.length; j++) {
						if (isNaN(transformFrame[key].quaternion[j])) return false;
					}
				}
			});
		}
		for (let i = 0; i < sessionData.gamepadFrames.length; i++) {
			const gamepadFrame = sessionData.gamepadFrames[i];
			['left', 'right'].forEach((key) => {
				if (gamepadFrame[key]) {
					if (gamepadFrame[key].buttons) {
						for (let j = 0; j < gamepadFrame[key].buttons; j++) {
							if (
								typeof gamepadFrame[key].buttons[j].pressed != 'boolean' ||
								typeof gamepadFrame[key].buttons[j].touched != 'boolean' ||
								typeof gamepadFrame[key].buttons[j].value != 'number'
							) {
								return false;
							}
						}
					}
				}
			});
		}
		return true;
	} catch (error) {
		return false;
	}
};

export const setupReplay = () => {
	let sessionData = null;
	const playbackControl = document.getElementById('playback-control');
	playbackControl.style.display = 'none';
	const playButton = document.getElementById('play-btn');
	const resetButton = document.getElementById('reset-btn');
	const progressBar = document.getElementById('play-progress');

	playButton.onclick = () => {
		emulatorStates.playbackInProgress = true;
		if (sessionData.transformFrames)
			handleTransformFrames(sessionData.transformFrames);
		if (sessionData.gamepadFrames)
			handleGamepadFrames(sessionData.gamepadFrames);
		playButton.disabled = true;
	};

	resetButton.onclick = () => {
		emulatorStates.playbackInProgress = false;
		playButton.disabled = false;
		progressBar.value = 0;
	};

	const filePicker = document.getElementById('session-file');
	filePicker.onchange = (e) => {
		const file = e.target.files[0];

		const reader = new FileReader();
		reader.readAsText(file, 'UTF-8');

		reader.onload = (readerEvent) => {
			const content = readerEvent.target.result;
			if (validateSessionFile(content)) {
				playbackControl.style.display = 'block';
				progressBar.value = 0;
				sessionData = JSON.parse(content);
			} else {
				playbackControl.style.display = 'none';
				progressBar.value = 0;
				sessionData = null;
			}
		};
	};
};
