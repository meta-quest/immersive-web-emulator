/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DEFAULT_TRANSFORMS, TRIGGER_MODES } from '../js/constants';
import {
	changeEmulatedDeviceType,
	notifyExitImmersive,
	reloadInspectedTab,
	togglePolyfill,
	toggleStereoMode,
} from '../js/messenger';

import { DEVICE_DEFINITIONS } from '../js/devices';
import { EmulatorSettings } from '../js/emulatorStates';
import React from 'react';

export default function HeadsetBar({ device }) {
	const headsetSelectRef = React.useRef();
	const polyfillToggleRef = React.useRef();
	const stereoToggleRef = React.useRef();
	const [polyfillOn, setPolyfillOn] = React.useState(true);
	const [showDropDown, setShowDropDown] = React.useState(false);
	const [triggerMode, setTriggerMode] = React.useState(
		EmulatorSettings.instance.triggerMode,
	);

	function onChangeDevice() {
		const deviceId = headsetSelectRef.current.value;
		if (DEVICE_DEFINITIONS[deviceId]) {
			EmulatorSettings.instance.deviceKey = deviceId;
			changeEmulatedDeviceType(DEVICE_DEFINITIONS[deviceId]);
			EmulatorSettings.instance.write();
		}
	}

	function onToggleStereo() {
		EmulatorSettings.instance.stereoOn = !EmulatorSettings.instance.stereoOn;
		toggleStereoMode(EmulatorSettings.instance.stereoOn);
		stereoToggleRef.current.classList.toggle(
			'button-pressed',
			EmulatorSettings.instance.stereoOn,
		);
		EmulatorSettings.instance.write();
	}

	const updatePolyfillState = (tab) => {
		const url = new URL(tab.url);
		const urlMatchPattern = url.origin + '/*';
		setPolyfillOn(
			!EmulatorSettings.instance.polyfillExcludes.has(urlMatchPattern),
		);
	};

	React.useEffect(() => {
		// check every time navigation happens on the tab
		chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
			if (
				tabId === chrome.devtools.inspectedWindow.tabId &&
				changeInfo.status === 'complete'
			) {
				updatePolyfillState(tab);
			}
		});

		// check on start up
		chrome.tabs.get(chrome.devtools.inspectedWindow.tabId, (tab) => {
			updatePolyfillState(tab);
		});
	});

	return (
		<div className="card headset-card">
			<div
				style={{
					backgroundColor: 'rgba(0,0,0,0.5)',
					zIndex: 10,
					position: 'fixed',
					height: (polyfillOn ? 0 : 100) + 'vh',
					width: '100vw',
					left: 0,
					top: 0,
				}}
			></div>
			<div className="card-body">
				<div className="row">
					<div className="col-4 d-flex justify-content-start align-items-center">
						<img src="./assets/images/headset.png" className="control-icon" />
						<select
							id="vr-device-select"
							className="form-select headset-select"
							ref={headsetSelectRef}
							defaultValue={EmulatorSettings.instance.deviceKey}
							onChange={onChangeDevice}
						>
							{Object.values(DEVICE_DEFINITIONS).map(({ shortName, name }) => (
								<option key={name} value={name}>
									{shortName}
								</option>
							))}
						</select>
					</div>
					<div className="col-8 d-flex justify-content-end align-items-center">
						<div className="control-button-group">
							<button
								className={
									'btn headset-action-button' +
									(polyfillOn ? ' button-pressed' : '')
								}
								ref={polyfillToggleRef}
								onClick={togglePolyfill}
								style={{ zIndex: 11, position: 'relative' }}
							>
								<img
									src="./assets/images/polyfill-on.png"
									className="action-icon"
								/>
								Polyfill
							</button>
							<button
								className={
									EmulatorSettings.instance.stereoOn
										? 'btn headset-action-button button-pressed'
										: 'btn headset-action-button'
								}
								ref={stereoToggleRef}
								onClick={onToggleStereo}
							>
								<img src="./assets/images/stereo.png" className="action-icon" />
								Stereo
							</button>
							<button
								className="btn headset-action-button"
								onClick={notifyExitImmersive}
							>
								<img src="./assets/images/exit.png" className="action-icon" />
							</button>
							<button
								className={
									'btn headset-action-button' +
									(showDropDown ? ' button-pressed' : '')
								}
								onClick={() => {
									setShowDropDown(!showDropDown);
								}}
							>
								<img
									src="./assets/images/settings.png"
									className="action-icon"
								/>
							</button>
						</div>
						{showDropDown && (
							<div className="drop-down-container">
								<button
									className="btn special-button"
									onClick={() => {
										const currentModeIndex = TRIGGER_MODES.indexOf(
											EmulatorSettings.instance.triggerMode,
										);
										const nextModeIndex =
											(currentModeIndex + 1) % TRIGGER_MODES.length;
										EmulatorSettings.instance.triggerMode =
											TRIGGER_MODES[nextModeIndex];
										EmulatorSettings.instance.write().then(() => {
											setTriggerMode(EmulatorSettings.instance.triggerMode);
										});
									}}
								>
									Trigger: {triggerMode}
								</button>
								<button
									className="btn special-button"
									onClick={() => {
										EmulatorSettings.instance.defaultPose = DEFAULT_TRANSFORMS;
										EmulatorSettings.instance.write().then(() => {
											device.resetPose();
										});
									}}
								>
									Clear default pose
								</button>
								<button
									className="btn special-button"
									onClick={() => {
										EmulatorSettings.instance.clear().then(() => {
											location.reload();
											reloadInspectedTab();
										});
									}}
								>
									Clear all settings
								</button>
								<button
									className="btn special-button"
									onClick={() => {
										chrome.tabs.create({
											url: 'https://chrome.google.com/webstore/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik',
										});
									}}
								>
									version - {chrome.runtime.getManifest().version}
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
