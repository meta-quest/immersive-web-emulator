/*
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import XRSpace from 'webxr-polyfill/src/api/XRSpace';

export const PRIVATE = Symbol('@@webxr-polyfill/XRInputSource');

export default class XRInputSource {
	/**
	 * @param {GamepadXRInputSource} impl
	 */
	constructor(impl) {
		this[PRIVATE] = {
			impl,
			gripSpace: new XRSpace('grip', this),
			targetRaySpace: new XRSpace('target-ray', this),
		};
	}

	/**
	 * @return {XRHandedness}
	 */
	get handedness() {
		return this[PRIVATE].impl.handedness;
	}

	/**
	 * @return {XRTargetRayMode}
	 */
	get targetRayMode() {
		return this[PRIVATE].impl.targetRayMode;
	}

	/**
	 * @return {XRSpace}
	 */
	get gripSpace() {
		const mode = this[PRIVATE].impl.targetRayMode;
		if (mode === 'gaze' || mode === 'screen') {
			// grip space must be null for non-trackable input sources
			return null;
		}
		return this[PRIVATE].gripSpace;
	}

	/**
	 * @return {XRSpace}
	 */
	get targetRaySpace() {
		return this[PRIVATE].targetRaySpace;
	}

	/**
	 * @return {Array<String>}
	 */
	get profiles() {
		return this[PRIVATE].impl.profiles;
	}

	/**
	 * @return {Gamepad}
	 */
	get gamepad() {
		return this[PRIVATE].impl.gamepad;
	}

	/**
	 * @return {XRHand}
	 */
	get hand() {
		return this[PRIVATE].impl.hand;
	}
}
