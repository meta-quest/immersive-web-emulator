import { PRIVATE, XRRemappedGamepad } from './XRGamepadInput';
import { mat4, vec3 } from 'gl-matrix';

import GamepadMappings from 'webxr-polyfill/src/devices/GamepadMappings';
import { XRHand } from './XRHand';
import XRInputSource from './XRInputSource';
import XRPose from 'webxr-polyfill/src/api/XRPose';
import XRRigidTransform from 'webxr-polyfill/src/api/XRRigidTransform';

export default class HandXRInputSource {
	constructor(polyfill) {
		this.polyfill = polyfill;
		this.nativeGamepad = null;
		this.gamepad = null;
		this.inputSource = new XRInputSource(this);
		this.lastPosition = vec3.create();
		this.emulatedPosition = false;
		this.basePoseMatrix = mat4.create();
		this.outputMatrix = mat4.create();
		this.primaryActionPressed = false;
		this.handedness = '';
		this.targetRayMode = 'gaze';
		this.armModel = null;

		this.hand = new XRHand(this.inputSource);
	}

	get profiles() {
		return [
			'oculus-hand',
			'generic-hand',
			'generic-hand-select',
			'generic-trigger',
		];
	}

	updateFromGamepad(gamepad, pinchValue) {
		if (this.nativeGamepad !== gamepad) {
			this.nativeGamepad = gamepad;
			if (gamepad) {
				this.gamepad = new XRRemappedGamepad(
					gamepad,
					{},
					GamepadMappings[gamepad.id],
				);
			} else {
				this.gamepad = null;
			}
		}
		this.handedness = gamepad.hand === '' ? 'none' : gamepad.hand;

		if (this.gamepad) {
			this.gamepad._update();
			this.gamepad[PRIVATE].buttons = [
				{
					pressed: pinchValue == 1,
					touched: pinchValue > 0,
					value: pinchValue,
				},
			];
			this.gamepad[PRIVATE].axes = [];
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
			const position = pose.position;
			const orientation = pose.orientation;
			// On initialization, we might not have any values
			if (!position && !orientation) {
				return;
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
