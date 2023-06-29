import {
	BUTTON_POLYFILL_INDEX_MAPPING,
	CONTROLLER_STRINGS,
	PRESS_AND_RELEASE_DURATION,
} from '../js/constants';
import {
	applyControllerAnalogValue,
	applyControllerButtonChanged,
	applyControllerButtonPressed,
} from '../js/messenger';
import { useEffect, useRef } from 'react';

import { Joystick } from '../js/joystick';
import { emulatorStates } from '../js/emulatorStates';

function ControlButtonGroup({ isAnalog, deviceKey, buttonKey }) {
	const touchRef = useRef();
	const pressRef = useRef();
	const holdRef = useRef();
	const rangeRef = useRef();
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

	function onPressAnalog() {
		const step = 10;
		const interval = 10;
		const holdTime = 50;
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

	if (isAnalog) {
		useEffect(() => {
			rangeRef.current.value = 0;
		});
	}

	return (
		<div class="control-button-group">
			<button class="btn special-button" ref={touchRef} onClick={onTouchToggle}>
				<img src="./assets/images/press.png" />
			</button>
			<button
				class="btn special-button"
				ref={pressRef}
				onClick={isAnalog ? onPressAnalog : onPressBinary}
			>
				Press
			</button>
			{isAnalog ? (
				<input
					ref={rangeRef}
					type="range"
					class="form-range special-button"
					onInput={onRangeInput}
				/>
			) : (
				<button class="btn special-button" ref={holdRef} onClick={onHoldToggle}>
					<img src="./assets/images/lock.png" />
				</button>
			)}
		</div>
	);
}

export default function ControllerPanel({ deviceKey }) {
	const strings = CONTROLLER_STRINGS[deviceKey];
	const joystickContainerRef = useRef();
	const joystickResetRef = useRef();
	const joystickStickyRef = useRef();

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

	useEffect(() => {
		joystick.addToParent(joystickContainerRef.current);
	}, []);
	return (
		<div class="col">
			<div class="component-container">
				<div class="card controller-card">
					<div class="card-header">
						<img
							src={`./assets/images/${strings.name}.png`}
							class="control-icon"
						/>
						<span class="control-label">{strings.displayName}</span>
					</div>
					<div class="card-body">
						<div class="row">
							<div class="col-4 d-flex align-items-center">
								<div ref={joystickContainerRef} class="joystick-panel"></div>
							</div>
							<div class="col-8 d-flex justify-content-end">
								<ControlButtonGroup
									isAnalog={false}
									deviceKey={deviceKey}
									buttonKey="joystick"
								/>
							</div>
						</div>
						<div class="row">
							<div class="col-12 d-flex justify-content-end">
								<div class="control-button-group">
									<button
										ref={joystickStickyRef}
										type="button"
										class="btn special-button"
										onClick={onStickyToggle}
									>
										<img src="./assets/images/sticky.png" class="action-icon" />
										Sticky
									</button>
									<button
										ref={joystickResetRef}
										type="button"
										class="btn special-button"
										onClick={joystick.reset.bind(joystick)}
									>
										<img src="./assets/images/reset.png" class="action-icon" />
									</button>
								</div>
							</div>
						</div>
						{['trigger', 'grip'].map((controlName) => (
							<div class="row">
								<div class="col-3 d-flex align-items-center">
									<img
										src={
											'./assets/images/' +
											controlName +
											'-' +
											strings.handedness +
											'.png'
										}
										class="control-icon"
									/>
									<span class="control-label">{controlName}</span>
								</div>
								<div class="col-9 d-flex justify-content-end">
									<ControlButtonGroup
										isAnalog={true}
										deviceKey={deviceKey}
										buttonKey={controlName}
									/>
								</div>
							</div>
						))}
						{['button2', 'button1'].map((controlName) => (
							<div class="row">
								<div class="col-4 d-flex align-items-center">
									<img
										src={`./assets/images/${controlName}-${strings.handedness}.png`}
										class="control-icon"
									/>
									<span class="control-label">{strings[controlName]}</span>
								</div>
								<div class="col-8 d-flex justify-content-end">
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
