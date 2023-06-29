/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EmulatorSettings, emulatorStates } from '../js/emulatorStates';

import { DEVICE } from '../js/constants';
import React from 'react';
import { changeInputMode } from '../js/messenger';
import initKeyboardControl from '../js/keyboard';

export default function PoseBar({ device, setInputMode }) {
	const saveDefaultPoseRef = React.useRef();
	const resetPoseRef = React.useRef();
	const actionMappingToggleRef = React.useRef();
	const handModeToggleRef = React.useRef();
	const controllerModeToggleRef = React.useRef();

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
		setInputMode(inputMode);
	}

	React.useEffect(() => {
		changeInputMode();
		initKeyboardControl();
	}, []);

	return (
		<div className="card pose-card">
			<div className="card-body">
				<div className="row">
					<div className="col-8 d-flex justify-content-start align-items-center">
						<img src="./assets/images/pose.png" className="control-icon" />
						<div className="control-button-group">
							<button
								ref={saveDefaultPoseRef}
								type="button"
								className="btn pose-action-button"
								onClick={onSaveDefaultPose}
							>
								Save as default pose
							</button>
							<button
								ref={resetPoseRef}
								type="button"
								className="btn pose-action-button"
								onClick={() => {
									device.resetPose();
								}}
							>
								<img src="./assets/images/reset.png" className="action-icon" />
							</button>
						</div>
					</div>

					<div className="col-4 d-flex justify-content-end align-items-center">
						<div className="control-button-group">
							<button
								ref={actionMappingToggleRef}
								type="button"
								className={
									EmulatorSettings.instance.actionMappingOn
										? 'btn pose-action-button button-pressed'
										: 'btn pose-action-button'
								}
								title="Keyboard Action Mapping"
								onClick={onActionMappingToggle}
							>
								<img
									src="./assets/images/keyboard.png"
									className="action-icon"
								/>
							</button>
							<button
								ref={controllerModeToggleRef}
								type="button"
								className={
									EmulatorSettings.instance.inputMode === 'controllers'
										? 'btn pose-action-button button-pressed'
										: 'btn pose-action-button'
								}
								title="Controller Mode"
								onClick={() => {
									onInputModeChange('controllers');
								}}
							>
								<img
									src="./assets/images/gamepad.png"
									className="action-icon"
								/>
							</button>
							<button
								ref={handModeToggleRef}
								type="button"
								className={
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
									className="action-icon"
								/>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
