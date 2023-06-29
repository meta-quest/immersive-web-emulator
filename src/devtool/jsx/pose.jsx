/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EmulatorSettings, emulatorStates } from '../js/emulatorStates';

import { DEVICE } from '../js/constants';
import { changeInputMode } from '../js/messenger';
import initKeyboardControl from '../js/keyboard';
import { useRef } from 'react';

export default function PoseBar({ device }) {
	const saveDefaultPoseRef = useRef();
	const resetPoseRef = useRef();
	const actionMappingToggleRef = useRef();
	const handModeToggleRef = useRef();
	const controllerModeToggleRef = useRef();

	function onSaveDefaultPose() {
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
	}

	function onActionMappingToggle() {
		EmulatorSettings.instance.actionMappingOn =
			!EmulatorSettings.instance.actionMappingOn;
		actionMappingToggleRef.current.classList.toggle(
			'button-pressed',
			EmulatorSettings.instance.actionMappingOn,
		);
		EmulatorSettings.instance.write();
	}

	function updateInputPanels() {
		const controllerPanel = document.getElementById('controllers-panel');
		const handsPanel = document.getElementById('hands-panel');
		const inputMode = EmulatorSettings.instance.inputMode;
		controllerPanel.style.display =
			inputMode === 'controllers' ? 'flex' : 'none';
		handsPanel.style.display = inputMode === 'hands' ? 'flex' : 'none';
		device.render();
	}

	changeInputMode();
	updateInputPanels();
	initKeyboardControl();

	function onInputModeChange(inputMode) {
		EmulatorSettings.instance.inputMode = inputMode;
		EmulatorSettings.instance.write();
		changeInputMode();
		controllerModeToggleRef.current.classList.toggle(
			'button-pressed',
			inputMode === 'controllers',
		);
		handModeToggleRef.current.classList.toggle(
			'button-pressed',
			inputMode === 'hands',
		);
		updateInputPanels();
	}

	return (
		<div class="card pose-card">
			<div class="card-body">
				<div class="row">
					<div class="col-8 d-flex justify-content-start align-items-center">
						<img src="./assets/images/pose.png" class="control-icon" />
						<div class="control-button-group">
							<button
								ref={saveDefaultPoseRef}
								type="button"
								class="btn pose-action-button"
								onClick={onSaveDefaultPose}
							>
								Save as default pose
							</button>
							<button
								ref={resetPoseRef}
								type="button"
								class="btn pose-action-button"
								onClick={() => {
									device.resetPose();
								}}
							>
								<img src="./assets/images/reset.png" class="action-icon" />
							</button>
						</div>
					</div>

					<div class="col-4 d-flex justify-content-end align-items-center">
						<div class="control-button-group">
							<button
								ref={actionMappingToggleRef}
								type="button"
								class={
									EmulatorSettings.instance.actionMappingOn
										? 'btn pose-action-button button-pressed'
										: 'btn pose-action-button'
								}
								title="Keyboard Action Mapping"
								onClick={onActionMappingToggle}
							>
								<img src="./assets/images/keyboard.png" class="action-icon" />
							</button>
							<button
								ref={controllerModeToggleRef}
								type="button"
								class={
									EmulatorSettings.instance.inputMode === 'controllers'
										? 'btn pose-action-button button-pressed'
										: 'btn pose-action-button'
								}
								title="Controller Mode"
								onClick={() => {
									onInputModeChange('controllers');
								}}
							>
								<img src="./assets/images/gamepad.png" class="action-icon" />
							</button>
							<button
								ref={handModeToggleRef}
								type="button"
								class={
									EmulatorSettings.instance.inputMode === 'hands'
										? 'btn pose-action-button button-pressed'
										: 'btn pose-action-button'
								}
								title="Hands Mode"
								onClick={() => {
									onInputModeChange('hands');
								}}
							>
								<img
									src="./assets/images/hand-tracking.png"
									class="action-icon"
								/>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
