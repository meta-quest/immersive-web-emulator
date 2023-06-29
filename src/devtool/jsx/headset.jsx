/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
	changeEmulatedDeviceType,
	notifyExitImmersive,
	togglePolyfill,
	toggleStereoMode,
} from '../js/messenger';

import { DEVICE_DEFINITIONS } from '../js/devices';
import { EmulatorSettings } from '../js/emulatorStates';
import { useRef } from 'react';

export default function HeadsetBar() {
	const headsetSelectRef = useRef();
	const polyfillToggleRef = useRef();
	const stereoToggleRef = useRef();

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

	const updatePolyfillButton = (tab) => {
		const url = new URL(tab.url);
		const urlMatchPattern = url.origin + '/*';
		polyfillToggleRef.current.classList.toggle(
			'button-pressed',
			!EmulatorSettings.instance.polyfillExcludes.has(urlMatchPattern),
		);
	};

	// check every time navigation happens on the tab
	chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
		if (
			tabId === chrome.devtools.inspectedWindow.tabId &&
			changeInfo.status === 'complete'
		) {
			updatePolyfillButton(tab);
		}
	});

	// check on start up
	chrome.tabs.get(chrome.devtools.inspectedWindow.tabId, (tab) => {
		updatePolyfillButton(tab);
	});

	return (
		<div class="card headset-card">
			<div class="card-body">
				<div class="row">
					<div class="col-4 d-flex justify-content-start align-items-center">
						<img src="./assets/images/headset.png" class="control-icon" />
						<select
							id="vr-device-select"
							class="form-select headset-select"
							ref={headsetSelectRef}
							defaultValue={EmulatorSettings.instance.deviceKey}
							onChange={onChangeDevice}
						>
							{Object.values(DEVICE_DEFINITIONS).map(({ shortName, name }) => (
								<option value={name}>{shortName}</option>
							))}
						</select>
					</div>
					<div class="col-8 d-flex justify-content-end align-items-center">
						<div>
							<button
								id="polyfill-toggle"
								type="button"
								class="btn headset-action-button button-leftmost"
								ref={polyfillToggleRef}
								onClick={togglePolyfill}
							>
								<img
									src="./assets/images/polyfill-on.png"
									class="action-icon"
								/>
								Polyfill
							</button>
							<button
								id="stereo-toggle"
								type="button"
								class={
									EmulatorSettings.instance.stereoOn
										? 'btn headset-action-button button-middle button-pressed'
										: 'btn headset-action-button button-middle'
								}
								ref={stereoToggleRef}
								onClick={onToggleStereo}
							>
								<img src="./assets/images/stereo.png" class="action-icon" />
								Stereo
							</button>
							<button
								id="exit-webxr"
								type="button"
								class="btn headset-action-button button-rightmost"
								onClick={notifyExitImmersive}
							>
								<img src="./assets/images/exit.png" class="action-icon" />
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
