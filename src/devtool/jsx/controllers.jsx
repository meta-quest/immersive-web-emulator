/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
	BUTTON_POLYFILL_INDEX_MAPPING,
	CONTROLLER_STRINGS,
	PRESS_AND_RELEASE_DURATION,
	TRIGGER_CONFIG,
} from '../js/constants';
import { EmulatorSettings, emulatorStates } from '../js/emulatorStates';
import {
	applyControllerAnalogValue,
	applyControllerButtonChanged,
	applyControllerButtonPressed,
} from '../js/messenger';

import { Joystick } from '../js/joystick';
import React from 'react';

function ControlButtonGroup({ isAnalog, deviceKey, buttonKey }) {
	const touchRef = React.useRef();
	const pressRef = React.useRef();
	const holdRef = React.useRef();
	const rangeRef = React.useRef();
	const deviceName = CONTROLLER_STRINGS[deviceKey].name;
	const buttonState = emulatorStates.controllers[deviceName][buttonKey];

	function onTouchToggle() {
		buttonState.touched = !buttonState.touched;
		buttonState.touched ||= buttonState.pressed;
		touchRef.current.classList.toggle('button-pressed', buttonState.touched);
		applyControllerButtonChanged(
			deviceKey,
			BUTTON_POLYFILL_INDEX_MAPPING[buttonKey],
			buttonState.pressed,
			buttonState.touched,
			buttonState.value,
		);
	}

	function onHoldToggle() {
		buttonState.pressed = !buttonState.pressed;
		buttonState.touched ||= buttonState.pressed;
		pressRef.current.disabled = buttonState.pressed;
		holdRef.current.classList.toggle('button-pressed', buttonState.pressed);
		applyControllerButtonPressed(
			deviceKey,
			BUTTON_POLYFILL_INDEX_MAPPING[buttonKey],
			buttonState.pressed,
		);
	}

	function onPressBinary() {
		if (buttonState.pressed) return;
		onHoldToggle();
		pressRef.current.disabled = true;
		holdRef.current.disabled = true;
		setTimeout(() => {
			onHoldToggle();
			pressRef.current.disabled = false;
			holdRef.current.disabled = false;
		}, PRESS_AND_RELEASE_DURATION);
	}

	function onRangeInput() {
		const inputValue = rangeRef.current.value / 100;
		applyControllerButtonChanged(
			deviceKey,
			BUTTON_POLYFILL_INDEX_MAPPING[buttonKey],
			inputValue != 0,
			buttonState.touched,
			inputValue,
		);
	}

	const onPressAnalog = createAnalogPressFunction(
		pressRef,
		rangeRef,
		onRangeInput,
	);

	React.useEffect(() => {
		const handedness = CONTROLLER_STRINGS[deviceKey].handedness;
		if (isAnalog) {
			rangeRef.current.value = 0;
			onRangeInput();
			if (!emulatorStates.sliders[handedness]) {
				emulatorStates.sliders[handedness] = {};
			}
			rangeRef.current.onInputFunc = onRangeInput;
			emulatorStates.sliders[handedness][buttonKey] = rangeRef.current;
		}
		if (!emulatorStates.buttons[handedness]) {
			emulatorStates.buttons[handedness] = {};
		}
		emulatorStates.buttons[handedness][buttonKey] = pressRef.current;
	});

	return (
		<div className="control-button-group">
			<button
				className="btn special-button"
				ref={touchRef}
				onClick={onTouchToggle}
			>
				<img src="./assets/images/press.png" />
			</button>
			<button
				className="btn special-button"
				ref={pressRef}
				onClick={isAnalog ? onPressAnalog : onPressBinary}
			>
				Press
			</button>
			{isAnalog ? (
				<input
					ref={rangeRef}
					type="range"
					className="form-range special-button"
					onInput={onRangeInput}
				/>
			) : (
				<button
					className="btn special-button"
					ref={holdRef}
					onClick={onHoldToggle}
				>
					<img src="./assets/images/lock.png" />
				</button>
			)}
		</div>
	);
}

export default function ControllerPanel({ deviceKey }) {
	const strings = CONTROLLER_STRINGS[deviceKey];
	const joystickContainerRef = React.useRef();
	const joystickResetRef = React.useRef();
	const joystickStickyRef = React.useRef();

	const joystick = new Joystick(100, true, 4);
	emulatorStates.joysticks[strings.name] = joystick;
	joystick.on('joystickmove', () => {
		// update joystick
		applyControllerAnalogValue(deviceKey, 0, joystick.getX());
		applyControllerAnalogValue(deviceKey, 1, joystick.getY());

		joystickResetRef.current.disabled = !(
			joystick.sticky &&
			joystick.getX() != 0 &&
			joystick.getY() != 0
		);
	});

	function onStickyToggle() {
		joystick.setSticky(!joystick.sticky);
		joystickStickyRef.current.classList.toggle(
			'button-pressed',
			joystick.sticky,
		);
	}

	React.useEffect(() => {
		joystick.addToParent(joystickContainerRef.current);
	}, []);

	return (
		<div className="col">
			<div className="component-container">
				<div className="card controller-card">
					<div className="card-header">
						<img
							src={`./assets/images/${strings.name}.png`}
							className="control-icon"
						/>
						<span className="control-label">{strings.displayName}</span>
					</div>
					<div className="card-body">
						<div className="row">
							<div className="col-4 d-flex align-items-center">
								<div
									ref={joystickContainerRef}
									className="joystick-panel"
								></div>
							</div>
							<div className="col-8 d-flex justify-content-end">
								<ControlButtonGroup
									isAnalog={false}
									deviceKey={deviceKey}
									buttonKey="joystick"
								/>
							</div>
						</div>
						<div className="row">
							<div className="col-12 d-flex justify-content-end">
								<div className="control-button-group">
									<button
										ref={joystickStickyRef}
										type="button"
										className="btn special-button"
										onClick={onStickyToggle}
									>
										<img
											src="./assets/images/sticky.png"
											className="action-icon"
										/>
										Sticky
									</button>
									<button
										ref={joystickResetRef}
										type="button"
										className="btn special-button"
										onClick={joystick.reset.bind(joystick)}
									>
										<img
											src="./assets/images/reset.png"
											className="action-icon"
										/>
									</button>
								</div>
							</div>
						</div>
						{['trigger', 'grip'].map((controlName) => (
							<div key={controlName} className="row">
								<div className="col-3 d-flex align-items-center">
									<img
										src={
											'./assets/images/' +
											controlName +
											'-' +
											strings.handedness +
											'.png'
										}
										className="control-icon"
									/>
									<span className="control-label">{controlName}</span>
								</div>
								<div className="col-9 d-flex justify-content-end">
									<ControlButtonGroup
										isAnalog={true}
										deviceKey={deviceKey}
										buttonKey={controlName}
									/>
								</div>
							</div>
						))}
						{['button2', 'button1'].map((controlName) => (
							<div key={controlName} className="row">
								<div className="col-4 d-flex align-items-center">
									<img
										src={`./assets/images/${controlName}-${strings.handedness}.png`}
										className="control-icon"
									/>
									<span className="control-label">{strings[controlName]}</span>
								</div>
								<div className="col-8 d-flex justify-content-end">
									<ControlButtonGroup
										isAnalog={false}
										deviceKey={deviceKey}
										buttonKey={controlName}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

export function createAnalogPressFunction(pressRef, rangeRef, onRangeInput) {
	return function () {
		const step = 10;
		const { interval, holdTime } =
			TRIGGER_CONFIG[EmulatorSettings.instance.triggerMode];
		pressRef.current.disabled = true;
		let rangeValue = 0;
		const pressIntervalId = setInterval(() => {
			if (rangeRef.current.value >= 100) {
				rangeRef.current.value = 100;
				clearInterval(pressIntervalId);
				setTimeout(() => {
					const depressIntervalId = setInterval(() => {
						if (rangeRef.current.value <= 0) {
							rangeRef.current.value = 0;
							clearInterval(depressIntervalId);
							pressRef.current.disabled = false;
						} else {
							rangeRef.current.value -= step;
						}
						onRangeInput();
					}, interval);
				}, holdTime);
			} else {
				rangeValue += step;
				rangeRef.current.value = rangeValue;
			}
			onRangeInput();
		}, interval);
	};
}
