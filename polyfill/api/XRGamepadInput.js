import { mat4, quat, vec3 } from 'gl-matrix';

import GamepadMappings from 'webxr-polyfill/src/devices/GamepadMappings';
import OrientationArmModel from 'webxr-polyfill/src/lib/OrientationArmModel';
import XRInputSource from './XRInputSource';
import XRPose from 'webxr-polyfill/src/api/XRPose';
import XRRigidTransform from 'webxr-polyfill/src/api/XRRigidTransform';

export const PRIVATE = Symbol('@@webxr-polyfill/XRRemappedGamepad');

const PLACEHOLDER_BUTTON = { pressed: false, touched: false, value: 0.0 };
Object.freeze(PLACEHOLDER_BUTTON);

export class XRRemappedGamepad {
	constructor(gamepad, display, map) {
		if (!map) {
			map = {};
		}

		// Apply user-agent-specific overrides to the mapping when applicable.
		if (map.userAgentOverrides) {
			for (const agent in map.userAgentOverrides) {
				if (navigator.userAgent.includes(agent)) {
					const override = map.userAgentOverrides[agent];

					for (const key in override) {
						if (key in map) {
							// If the key already exists, merge the override values into the
							// existing dictionary.
							Object.assign(map[key], override[key]);
						} else {
							// If the base mapping doesn't have this key, insert the override
							// values wholesale.
							map[key] = override[key];
						}
					}
					break;
				}
			}
		}

		const axes = new Array(
			map.axes && map.axes.length ? map.axes.length : gamepad.axes.length,
		);
		const buttons = new Array(
			map.buttons && map.buttons.length
				? map.buttons.length
				: gamepad.buttons.length,
		);

		let gripTransform = null;
		if (map.gripTransform) {
			const orientation = map.gripTransform.orientation || [0, 0, 0, 1];
			gripTransform = mat4.create();
			mat4.fromRotationTranslation(
				gripTransform,
				quat.normalize(orientation, orientation),
				map.gripTransform.position || [0, 0, 0],
			);
		}

		let targetRayTransform = null;
		if (map.targetRayTransform) {
			const orientation = map.targetRayTransform.orientation || [0, 0, 0, 1];
			targetRayTransform = mat4.create();
			mat4.fromRotationTranslation(
				targetRayTransform,
				quat.normalize(orientation, orientation),
				map.targetRayTransform.position || [0, 0, 0],
			);
		}

		let profiles = map.profiles;
		if (map.displayProfiles) {
			if (display.displayName in map.displayProfiles) {
				profiles = map.displayProfiles[display.displayName];
			}
		}

		this[PRIVATE] = {
			gamepad,
			map,
			profiles: profiles || [gamepad.id],
			mapping: map.mapping || gamepad.mapping,
			axes,
			buttons,
			gripTransform,
			targetRayTransform,
		};

		this._update();
	}

	_update() {
		const gamepad = this[PRIVATE].gamepad;
		const map = this[PRIVATE].map;

		const axes = this[PRIVATE].axes;
		for (let i = 0; i < axes.length; ++i) {
			if (map.axes && i in map.axes) {
				if (map.axes[i] === null) {
					axes[i] = 0;
				} else {
					axes[i] = gamepad.axes[map.axes[i]];
				}
			} else {
				axes[i] = gamepad.axes[i];
			}
		}

		if (map.axes && map.axes.invert) {
			for (const axis of map.axes.invert) {
				if (axis < axes.length) {
					axes[axis] *= -1;
				}
			}
		}

		const buttons = this[PRIVATE].buttons;
		for (let i = 0; i < buttons.length; ++i) {
			if (map.buttons && i in map.buttons) {
				if (map.buttons[i] === null) {
					buttons[i] = PLACEHOLDER_BUTTON;
				} else {
					buttons[i] = gamepad.buttons[map.buttons[i]];
				}
			} else {
				buttons[i] = gamepad.buttons[i];
			}
		}
	}

	get id() {
		return '';
	}

	get _profiles() {
		return this[PRIVATE].profiles;
	}

	get index() {
		return -1;
	}

	get connected() {
		return this[PRIVATE].gamepad.connected;
	}

	get timestamp() {
		return this[PRIVATE].gamepad.timestamp;
	}

	get mapping() {
		return this[PRIVATE].mapping;
	}

	get axes() {
		return this[PRIVATE].axes;
	}

	get buttons() {
		return this[PRIVATE].buttons;
	}

	// Non-standard extension
	get hapticActuators() {
		return this[PRIVATE].gamepad.hapticActuators;
	}
}

export default class GamepadXRInputSource {
	constructor(
		polyfill,
		display,
		primaryButtonIndex = 0,
		primarySqueezeButtonIndex = -1,
	) {
		this.polyfill = polyfill;
		this.display = display;
		this.nativeGamepad = null;
		this.gamepad = null;
		this.inputSource = new XRInputSource(this);
		this.lastPosition = vec3.create();
		this.emulatedPosition = false;
		this.basePoseMatrix = mat4.create();
		this.outputMatrix = mat4.create();
		this.primaryButtonIndex = primaryButtonIndex;
		this.primaryActionPressed = false;
		this.primarySqueezeButtonIndex = primarySqueezeButtonIndex;
		this.primarySqueezeActionPressed = false;
		this.handedness = '';
		this.targetRayMode = 'gaze';
		this.armModel = null;
		this.profilesOverride = null;
	}

	get profiles() {
		if (this.profilesOverride) {
			return this.profilesOverride;
		} else {
			return this.gamepad ? this.gamepad._profiles : [];
		}
	}

	updateFromGamepad(gamepad) {
		if (this.nativeGamepad !== gamepad) {
			this.nativeGamepad = gamepad;
			if (gamepad) {
				this.gamepad = new XRRemappedGamepad(
					gamepad,
					this.display,
					GamepadMappings[gamepad.id],
				);
			} else {
				this.gamepad = null;
			}
		}
		this.handedness = gamepad.hand === '' ? 'none' : gamepad.hand;

		if (this.gamepad) {
			this.gamepad._update();
		}

		if (gamepad.pose) {
			this.targetRayMode = 'tracked-pointer';
			this.emulatedPosition = !gamepad.pose.hasPosition;
		} else if (gamepad.hand === '') {
			this.targetRayMode = 'gaze';
			this.emulatedPosition = false;
		}
	}

	updateBasePoseMatrix() {
		if (this.nativeGamepad && this.nativeGamepad.pose) {
			const pose = this.nativeGamepad.pose;
			let position = pose.position;
			const orientation = pose.orientation;
			// On initialization, we might not have any values
			if (!position && !orientation) {
				return;
			}
			if (!position) {
				if (!pose.hasPosition) {
					if (!this.armModel) {
						this.armModel = new OrientationArmModel();
					}

					this.armModel.setHandedness(this.nativeGamepad.hand);
					this.armModel.update(orientation, this.polyfill.getBasePoseMatrix());
					position = this.armModel.getPosition();
				} else {
					position = this.lastPosition;
				}
			} else {
				// This is if we temporarily lose tracking, so the controller doesn't
				// snap back to the origin.
				this.lastPosition[0] = position[0];
				this.lastPosition[1] = position[1];
				this.lastPosition[2] = position[2];
			}
			mat4.fromRotationTranslation(this.basePoseMatrix, orientation, position);
		} else {
			mat4.copy(this.basePoseMatrix, this.polyfill.getBasePoseMatrix());
		}
		return this.basePoseMatrix;
	}

	/**
	 * @param {XRReferenceSpace} coordinateSystem
	 * @param {string} poseType
	 * @return {XRPose?}
	 */
	getXRPose(coordinateSystem, poseType) {
		this.updateBasePoseMatrix();

		switch (poseType) {
			case 'target-ray':
				coordinateSystem._transformBasePoseMatrix(
					this.outputMatrix,
					this.basePoseMatrix,
				);
				if (this.gamepad && this.gamepad[PRIVATE].targetRayTransform) {
					mat4.multiply(
						this.outputMatrix,
						this.outputMatrix,
						this.gamepad[PRIVATE].targetRayTransform,
					);
				}
				break;
			case 'grip':
				if (!this.nativeGamepad || !this.nativeGamepad.pose) {
					return null;
				}
				// TODO: Does the grip matrix need to be tweaked?
				coordinateSystem._transformBasePoseMatrix(
					this.outputMatrix,
					this.basePoseMatrix,
				);
				if (this.gamepad && this.gamepad[PRIVATE].gripTransform) {
					mat4.multiply(
						this.outputMatrix,
						this.outputMatrix,
						this.gamepad[PRIVATE].gripTransform,
					);
				}
				break;
			default:
				return null;
		}

		coordinateSystem._adjustForOriginOffset(this.outputMatrix);

		return new XRPose(
			new XRRigidTransform(this.outputMatrix),
			this.emulatedPosition,
		);
	}
}
