import { CLIENT_ACTIONS, POLYFILL_ACTIONS } from '../src/devtool/js/actions';
import { mat4, quat, vec3 } from 'gl-matrix';

import GamepadMappings from 'webxr-polyfill/src/devices/GamepadMappings';
import GamepadXRInputSource from './api/XRGamepadInput';
import HandXRInputSource from './api/XRHandInput';
import XRDevice from 'webxr-polyfill/src/devices/XRDevice';
import { PRIVATE as XRINPUTSOURCE_PRIVATE } from './api/XRInputSource';
import { PRIVATE as XRSESSION_PRIVATE } from 'webxr-polyfill/src/api/XRSession';
import XRScene from './XRScene';
import XRTransientInputHitTestSource from './api/XRTransientInputHitTestSource';

const DEFAULT_MODES = ['inline'];

// @TODO: This value should shared with panel.js?
const DEFAULT_HEADSET_POSITION = [0, 1.6, 0];

// 10000 is for AR Scene
const APP_CANVAS_Z_INDEX = '9999';
const AR_CANVAS_Z_INDEX = '9998';
const DOM_OVERLAY_Z_INDEX = '10001';

// For AR
const DEFAULT_RESOLUTION = { width: 1024, height: 2048 };
const DEFAULT_DEVICE_SIZE = { width: 0.05, height: 0.1, depth: 0.005 };

// @TODO: Duplicated with content-scripts.js. Move to somewhere common place?
const dispatchCustomEvent = (type, detail) => {
	window.dispatchEvent(
		new CustomEvent(type, {
			detail:
				// eslint-disable-next-line no-undef
				typeof cloneInto !== 'undefined' ? cloneInto(detail, window) : detail,
		}),
	);
};

export default class EmulatedXRDevice extends XRDevice {
	// @TODO: write config parameter comment

	constructor(global, config = {}) {
		super(global);

		this.sessions = new Map();

		this.modes = config.modes || DEFAULT_MODES;
		this.features = config.features || [];
		this.xrScene = new XRScene();

		// headset
		this.position = vec3.copy(vec3.create(), DEFAULT_HEADSET_POSITION);
		this.quaternion = quat.create();
		this.scale = vec3.fromValues(1, 1, 1);
		this.matrix = mat4.create();
		this.projectionMatrix = mat4.create();
		this.leftProjectionMatrix = mat4.create();
		this.rightProjectionMatrix = mat4.create();
		this.viewMatrix = mat4.create();
		this.leftViewMatrix = mat4.create();
		this.rightViewMatrix = mat4.create();

		this.handMode = true;
		this.handPoseData = {
			left: { poseId: 'relaxed', pinchValue: 0, prevPinchValue: 0 },
			right: { poseId: 'relaxed', pinchValue: 0, prevPinchValue: 0 },
		};

		// controllers
		this.gamepads = [];
		this.gamepadInputSources = [];

		// hands
		this.handGamepads = [];
		this.handInputSources = [];

		// other configurations
		this.stereoEffectEnabled =
			config.stereoEffect !== undefined ? config.stereoEffect : true;

		// @TODO: Edit this comment
		// For case where baseLayer's canvas isn't in document.body

		const createCanvasContainer = (zIndex) => {
			const canvasContainer = document.createElement('div');
			canvasContainer.style.position = 'fixed';
			canvasContainer.style.width = '100%';
			canvasContainer.style.height = '100%';
			canvasContainer.style.top = '0';
			canvasContainer.style.left = '0';
			canvasContainer.style.zIndex = zIndex;
			return canvasContainer;
		};

		this.appCanvasContainer = createCanvasContainer(APP_CANVAS_Z_INDEX);
		// console.log(this.appCanvasContainer);
		this.arCanvasContainer = createCanvasContainer(AR_CANVAS_Z_INDEX);

		this.originalCanvasParams = {
			parentElement: null,
			width: 0,
			height: 0,
		};

		// For DOM overlay API

		this.domOverlayRoot = null;

		// For AR

		// Assuming a device supports at most either one VR or AR
		this.resolution =
			config.resolution !== undefined ? config.resolution : DEFAULT_RESOLUTION;
		this.deviceSize =
			config.size !== undefined ? config.size : DEFAULT_DEVICE_SIZE;
		this.touched = false;
		this.isPointerAndTabledCloseEnough = false; // UGH... @TODO: Rename

		this.hitTestSources = [];
		this.hitTestResults = new Map();

		this.hitTestSourcesForTransientInput = [];
		this.hitTestResultsForTransientInput = new Map();

		//
		this._initializeControllers(config);
		this._initializeHands();
		this._setupEventListeners();
	}

	onBaseLayerSet(sessionId, layer) {
		const session = this.sessions.get(sessionId);

		// Remove old canvas first
		if (session.immersive && session.baseLayer) {
			this._removeBaseLayerCanvasFromDiv(sessionId);
		}

		session.baseLayer = layer;
		if (session.immersive && session.baseLayer) {
			this._appendBaseLayerCanvasToDiv(sessionId);
		}
	}

	isSessionSupported(mode) {
		return this.modes.includes(mode);
	}

	isFeatureSupported(featureDescriptor) {
		if (this.features.includes(featureDescriptor)) {
			return true;
		}
		switch (featureDescriptor) {
			case 'viewer':
				return true;
			case 'local':
				return true;
			case 'local-floor':
				return true;
			case 'bounded-floor':
				return false;
			case 'unbounded':
				return false;
			case 'dom-overlay':
				return true;
			case 'anchors':
				return true;
			case 'plane-detection':
				return true;
			case 'hit-test':
				return true;
			case 'high-fixed-foveation-level':
				console.warn(
					'The high-fixed-foveation-level feature is non-standard and deprecated. Refer to the documentation at https://immersive-web.github.io/layers/#dom-xrprojectionlayer-fixedfoveation for the standard way to adjust fixed foveation level.',
				);
				return true;
			case 'hand-tracking':
				return true;
			case 'mesh-detection':
				return true;
			default:
				return false; // @TODO: Throw an error?
		}
	}

	async requestSession(mode, enabledFeatures) {
		if (!this.isSessionSupported(mode)) {
			return Promise.reject();
		}
		const session = new Session(mode, enabledFeatures);
		this.sessions.set(session.id, session);
		if (mode === 'immersive-ar') {
			document.body.appendChild(this.arCanvasContainer);
			this.xrScene.inject(this.arCanvasContainer);
		}
		if (session.immersive) {
			this.dispatchEvent('@@webxr-polyfill/vr-present-start', session.id);
			this._notifyEnterImmersive();
		}
		return Promise.resolve(session.id);
	}

	requestAnimationFrame(callback) {
		return this.global.requestAnimationFrame(callback);
	}

	cancelAnimationFrame(handle) {
		this.global.cancelAnimationFrame(handle);
	}

	onFrameStart(sessionId, renderState) {
		const session = this.sessions.get(sessionId);
		// guaranteed by the caller that session.baseLayer is not null
		const context = session.baseLayer.context;
		const canvas = context.canvas;
		const near = renderState.depthNear;
		const far = renderState.depthFar;
		const width = canvas.width;
		const height = canvas.height;

		// If session is not an inline session, XRWebGLLayer's composition disabled boolean
		// should be false and then framebuffer should be marked as opaque.
		// The buffers attached to an opaque framebuffer must be cleared prior to the
		// processing of each XR animation frame.
		if (session.immersive) {
			const currentClearColor = context.getParameter(context.COLOR_CLEAR_VALUE);
			const currentClearDepth = context.getParameter(context.DEPTH_CLEAR_VALUE);
			const currentClearStencil = context.getParameter(
				context.STENCIL_CLEAR_VALUE,
			);
			context.clearColor(0.0, 0.0, 0.0, 0.0);
			context.clearDepth(1, 0);
			context.clearStencil(0.0);
			context.clear(
				context.DEPTH_BUFFER_BIT |
					context.COLOR_BUFFER_BIT |
					context.STENCIL_BUFFER_BIT,
			);
			context.clearColor(
				currentClearColor[0],
				currentClearColor[1],
				currentClearColor[2],
				currentClearColor[3],
			);
			context.clearDepth(currentClearDepth);
			context.clearStencil(currentClearStencil);
		}

		this.gamepads.forEach((gamepad) => {
			gamepad.connected = session.immersive;
		});

		if (session.vr || (session.ar && session.immersive)) {
			// @TODO: proper FOV
			const aspect = (width * (this.stereoEffectEnabled ? 0.5 : 1.0)) / height;
			mat4.perspective(
				this.leftProjectionMatrix,
				Math.PI / 2,
				aspect,
				near,
				far,
			);
			mat4.perspective(
				this.rightProjectionMatrix,
				Math.PI / 2,
				aspect,
				near,
				far,
			);
		} else if (session.ar) {
			// @TODO: support mobile AR
			// @TODO: proper FOV
			const aspect = this.deviceSize.width / this.deviceSize.height;
			mat4.perspective(this.projectionMatrix, Math.PI / 2, aspect, near, far);
		} else {
			const aspect = width / height;
			mat4.perspective(
				this.projectionMatrix,
				renderState.inlineVerticalFieldOfView,
				aspect,
				near,
				far,
			);
		}
		if (session.ar && !session.immersive) {
			mat4.fromRotationTranslationScale(
				this.matrix,
				this.gamepads[1].pose.orientation,
				this.gamepads[1].pose.position,
				this.scale,
			);
		} else {
			mat4.fromRotationTranslationScale(
				this.matrix,
				this.quaternion,
				this.position,
				this.scale,
			);
		}
		mat4.invert(this.viewMatrix, this.matrix);

		// Move matrices left/right a bit and then calculate left/rightViewMatrix
		// @TODO: proper left/right distance
		mat4.invert(
			this.leftViewMatrix,
			translateOnX(mat4.copy(this.leftViewMatrix, this.matrix), -0.02),
		);
		mat4.invert(
			this.rightViewMatrix,
			translateOnX(mat4.copy(this.rightViewMatrix, this.matrix), 0.02),
		);

		// @TODO: Confirm if input events are only for immersive session
		// @TODO: If there are multiple immersive sessions, input events are fired only for the first session.
		//        Fix this issue (if multiple immersive sessions can be created).
		if (session.immersive) {
			for (let i = 0; i < this.gamepads.length; ++i) {
				const gamepad = this.gamepads[i];
				const inputSourceImpl = this.gamepadInputSources[i];
				const handInputImpl = this.handInputSources[i];
				inputSourceImpl.updateFromGamepad(gamepad);
				const handedness = handInputImpl.handedness;
				const pinchValue = this.handPoseData[handedness]
					? this.handPoseData[handedness].pinchValue
					: 0;
				handInputImpl.updateFromGamepad(gamepad, pinchValue);
				if (inputSourceImpl.primaryButtonIndex !== -1) {
					const primaryActionPressed =
						gamepad.buttons[inputSourceImpl.primaryButtonIndex].pressed;
					if (primaryActionPressed && !inputSourceImpl.primaryActionPressed) {
						this.dispatchEvent('@@webxr-polyfill/input-select-start', {
							sessionId: session.id,
							inputSource: inputSourceImpl.inputSource,
						});
					} else if (
						!primaryActionPressed &&
						inputSourceImpl.primaryActionPressed
					) {
						this.dispatchEvent('@@webxr-polyfill/input-select-end', {
							sessionId: session.id,
							inputSource: inputSourceImpl.inputSource,
						});
					}
					// imputSourceImpl.primaryActionPressed is updated in onFrameEnd().
				}
				if (inputSourceImpl.primarySqueezeButtonIndex !== -1) {
					const primarySqueezeActionPressed =
						gamepad.buttons[inputSourceImpl.primarySqueezeButtonIndex].pressed;
					if (
						primarySqueezeActionPressed &&
						!inputSourceImpl.primarySqueezeActionPressed
					) {
						this.dispatchEvent('@@webxr-polyfill/input-squeeze-start', {
							sessionId: session.id,
							inputSource: inputSourceImpl.inputSource,
						});
					} else if (
						!primarySqueezeActionPressed &&
						inputSourceImpl.primarySqueezeActionPressed
					) {
						this.dispatchEvent('@@webxr-polyfill/input-squeeze-end', {
							sessionId: session.id,
							inputSource: inputSourceImpl.inputSource,
						});
					}
					inputSourceImpl.primarySqueezeActionPressed =
						primarySqueezeActionPressed;
				}
				if (
					this.handPoseData[gamepad.hand].pinchValue == 1 &&
					this.handPoseData[gamepad.hand].prevPinchValue != 1
				) {
					this.dispatchEvent('@@webxr-polyfill/input-select-start', {
						sessionId: session.id,
						inputSource: handInputImpl.inputSource,
					});
				}
				if (
					this.handPoseData[gamepad.hand].pinchValue != 1 &&
					this.handPoseData[gamepad.hand].prevPinchValue == 1
				) {
					this.dispatchEvent('@@webxr-polyfill/input-select-end', {
						sessionId: session.id,
						inputSource: handInputImpl.inputSource,
					});
				}
				this.handPoseData[gamepad.hand].prevPinchValue =
					this.handPoseData[gamepad.hand].pinchValue;
			}

			this._hitTest(sessionId, this.hitTestSources, this.hitTestResults);
			this._hitTest(
				sessionId,
				this.hitTestSourcesForTransientInput,
				this.hitTestResultsForTransientInput,
			);
		}
	}

	onFrameEnd(sessionId) {
		// We handle touch event on AR device as transient input for now.
		// If primary action happens on transient input
		// 1. First fire intputsourceschange event
		// 2. And then fire select start event
		// But in webxr-polyfill.js, inputsourceschange event is fired
		// after onFrameStart() by making an input source active.
		// So I need to postpone input select event until onFrameEnd() here.
		// Regarding select and select end events, they should be fired
		// before inputsourceschange event, so ok to be in onFrameStart().
		const session = this.sessions.get(sessionId);
		if (session.immersive) {
			for (let i = 0; i < this.gamepads.length; ++i) {
				const gamepad = this.gamepads[i];
				const inputSourceImpl = this.gamepadInputSources[i];
				if (inputSourceImpl.primaryButtonIndex !== -1) {
					const primaryActionPressed =
						gamepad.buttons[inputSourceImpl.primaryButtonIndex].pressed;
					inputSourceImpl.primaryActionPressed = primaryActionPressed;
				}
			}
		}
	}

	async requestFrameOfReferenceTransform(type, _options) {
		// @TODO: Add note
		const matrix = mat4.create();
		switch (type) {
			case 'viewer':
			case 'local':
				matrix[13] = -DEFAULT_HEADSET_POSITION[1];
				return matrix;

			case 'local-floor':
				return matrix;

			case 'bounded-floor':
			case 'unbound':
			default:
				// @TODO: Throw an error?
				return matrix;
		}
	}

	endSession(sessionId) {
		const session = this.sessions.get(sessionId);
		if (session.immersive && session.baseLayer) {
			this._removeBaseLayerCanvasFromDiv(sessionId);
			this.domOverlayRoot = null;
			this.dispatchEvent('@@webxr-polyfill/vr-present-end', sessionId);
			this._notifyLeaveImmersive(sessionId);
		}
		session.ended = true;
	}

	doesSessionSupportReferenceSpace(sessionId, type) {
		const session = this.sessions.get(sessionId);
		if (session.ended) {
			return false;
		}
		return session.enabledFeatures.has(type);
	}

	getViewport(sessionId, eye, _layer, target) {
		const session = this.sessions.get(sessionId);
		const canvas = session.baseLayer.context.canvas;
		const width = canvas.width;
		const height = canvas.height;
		if (session.ar && !session.immersive) {
			// Currently the polyfill let any immersive mode has two ViewSpaces left and right.
			// Return the same viewport for any eye type so far.
			// @TODO: Send feedback to webxr-polyfill.js about one 'none' view option
			//        for AR monoscopic device
			target.x = 0;
			target.y = 0;
			target.width = width;
			target.height = height;
		} else {
			if (eye === 'none') {
				target.x = 0;
				target.width = width;
			} else if (this.stereoEffectEnabled) {
				target.x = eye === 'left' ? 0 : width / 2;
				target.width = width / 2;
			} else {
				target.x = 0;
				target.width = eye === 'left' ? width : 0;
			}
			target.y = 0;
			target.height = height;
		}
		return true;
	}

	getProjectionMatrix(eye) {
		return eye === 'none'
			? this.projectionMatrix
			: eye === 'left'
			? this.leftProjectionMatrix
			: this.rightProjectionMatrix;
	}

	getBasePoseMatrix() {
		return this.matrix;
	}

	getBaseViewMatrix(eye) {
		if (eye === 'none' || !this.stereoEffectEnabled) {
			return this.viewMatrix;
		}
		return eye === 'left' ? this.leftViewMatrix : this.rightViewMatrix;
	}

	getInputSources() {
		const inputSources = [];
		for (const inputSourceImpl of this.handMode
			? this.handInputSources
			: this.gamepadInputSources) {
			if (inputSourceImpl.active) {
				inputSources.push(inputSourceImpl.inputSource);
			}
		}

		return inputSources;
	}

	getInputPose(inputSource, coordinateSystem, poseType) {
		for (const inputSourceImpl of [].concat(
			this.gamepadInputSources,
			this.handInputSources,
		)) {
			if (inputSourceImpl.inputSource === inputSource) {
				const pose = inputSourceImpl.getXRPose(coordinateSystem, poseType);

				return pose;
			}
		}
		return null;
	}

	onWindowResize() {
		// @TODO: implement
	}

	// DOM Overlay API

	setDomOverlayRoot(root) {
		this.domOverlayRoot = root;
	}

	// AR Hitting test

	addHitTestSource(source) {
		this.hitTestSources.push(source);
	}

	getHitTestResults(source) {
		return this.hitTestResults.get(source) || [];
	}

	addHitTestSourceForTransientInput(source) {
		this.hitTestSourcesForTransientInput.push(source);
	}

	getHitTestResultsForTransientInput(source) {
		return this.hitTestResultsForTransientInput.get(source) || [];
	}

	_hitTest(sessionId, hitTestSources, hitTestResults) {
		// Remove inactive sources first
		let activeHitTestSourceNum = 0;
		for (let i = 0; i < hitTestSources.length; i++) {
			const source = hitTestSources[i];
			if (source._active) {
				hitTestSources[activeHitTestSourceNum++] = source;
			}
		}
		hitTestSources.length = activeHitTestSourceNum;

		// Do hit test next
		hitTestResults.clear();
		for (const source of hitTestSources) {
			if (sessionId !== source._session[XRSESSION_PRIVATE].id) {
				continue;
			}

			// Gets base matrix depending on hit test source type
			let baseMatrix;
			if (source instanceof XRTransientInputHitTestSource) {
				if (!this.gamepadInputSources[0].active) {
					continue;
				}
				if (!source._profile.includes('touch')) {
					continue;
				}
				const gamepad = this.gamepads[0];
				const matrix = mat4.identity(mat4.create());
				matrix[12] = gamepad.axes[0];
				matrix[13] = -gamepad.axes[1];
				baseMatrix = mat4.multiply(matrix, this.matrix, matrix);
			} else {
				baseMatrix = source._space._baseMatrix;
				if (!baseMatrix) {
					continue;
				}
			}

			// Calculates origin and direction used for hit test in AR scene
			const offsetRay = source._offsetRay;
			const origin = vec3.set(
				vec3.create(),
				offsetRay.origin.x,
				offsetRay.origin.y,
				offsetRay.origin.z,
			);
			const direction = vec3.set(
				vec3.create(),
				offsetRay.direction.x,
				offsetRay.direction.y,
				offsetRay.direction.z,
			);
			vec3.transformMat4(origin, origin, baseMatrix);
			vec3.transformQuat(
				direction,
				direction,
				mat4.getRotation(quat.create(), baseMatrix),
			);

			// Do hit test in AR scene and stores the result matrices
			const arHitTestResults = this.xrScene.getHitTestResults(
				origin,
				direction,
			);
			hitTestResults.set(source, arHitTestResults);
		}
	}

	// Private methods

	// If session is immersive mode, resize the canvas size to full window size.
	// To do that, changing canvas size and moving the canvas to
	// the special div. They are restored when exiting immersive mode.
	// @TODO: Simplify the method names

	_appendBaseLayerCanvasToDiv(sessionId) {
		const session = this.sessions.get(sessionId);
		const canvas = session.baseLayer.context.canvas;

		this.originalCanvasParams.width = canvas.width;
		this.originalCanvasParams.height = canvas.height;

		document.body.appendChild(this.appCanvasContainer);

		// If canvas is OffscreenCanvas we don't further touch so far.
		if (!(canvas instanceof HTMLCanvasElement)) {
			return;
		}

		this.originalCanvasParams.parentElement = canvas.parentElement;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		this.appCanvasContainer.appendChild(canvas);

		// DOM overlay API
		// @TODO: Is this the best place to handle?
		// @TODO: What if dom element is appened/removed while in immersive mode?
		//        Should we observe?
		if (this.domOverlayRoot) {
			const el = this.domOverlayRoot;
			el.style._zIndex = el.style.zIndex; // Polluting is bad...
			el.style.zIndex = DOM_OVERLAY_Z_INDEX;
		}
	}

	_removeBaseLayerCanvasFromDiv(sessionId) {
		const session = this.sessions.get(sessionId);
		const canvas = session.baseLayer.context.canvas;

		canvas.width = this.originalCanvasParams.width;
		canvas.height = this.originalCanvasParams.height;

		// There may be a case where an application operates DOM elements
		// in immersive mode. In such case, we don't restore DOM elements
		// hierarchies so far.
		if (this.appCanvasContainer.parentElement === document.body) {
			document.body.removeChild(this.appCanvasContainer);
		}
		if (canvas.parentElement === this.appCanvasContainer) {
			this.appCanvasContainer.removeChild(canvas);
		}

		// If canvas is OffscreenCanvas we don't touch so far.
		if (!(canvas instanceof HTMLCanvasElement)) {
			return;
		}

		if (this.originalCanvasParams.parentElement) {
			this.originalCanvasParams.parentElement.appendChild(canvas);
		}
		this.originalCanvasParams.parentElement = null;

		// DOM overlay API
		// @TODO: Is this the best place to handle?
		if (this.domOverlayRoot) {
			const el = this.domOverlayRoot;
			el.style.zIndex = el.style._zIndex;
			delete el.style._zIndex;
			this.appCanvasContainer.style.zIndex = APP_CANVAS_Z_INDEX;
		}
	}

	// For AR. Check if right controller(pointer) is touched with left controller(tablet)

	// UGH... @TODO: Rename
	_isPointerCloseEnoughToTablet() {
		// @TODO: Optimize if possible
		const pose = this.gamepads[0].pose;
		const matrix = mat4.fromRotationTranslation(
			mat4.create(),
			pose.orientation,
			pose.position,
		);
		mat4.multiply(matrix, this.viewMatrix, matrix);
		const dx = matrix[12] / (this.deviceSize.width * 0.5);
		const dy = matrix[13] / (this.deviceSize.height * 0.5);
		const dz = matrix[14];
		return (
			dx <= 1.0 &&
			dx >= -1.0 &&
			dy <= 1.0 &&
			dy >= -1.0 &&
			dz <= 0.01 &&
			dz >= 0.0
		);
	}

	_getTouchCoordinates() {
		// @TODO: Optimize if possible
		const pose = this.gamepads[0].pose;
		const matrix = mat4.fromRotationTranslation(
			mat4.create(),
			pose.orientation,
			pose.position,
		);
		mat4.multiply(matrix, this.viewMatrix, matrix);
		const dx = matrix[12] / (this.deviceSize.width * 0.5);
		const dy = matrix[13] / (this.deviceSize.height * 0.5);
		return [dx, dy];
	}

	// Notify the update to panel

	_notifyPoseUpdate() {
		dispatchCustomEvent('device-pose', {
			position: this.position,
			quaternion: this.quaternion,
		});
	}

	// controllerIndex: 0 => Right, 1 => Left
	_notifyInputPoseUpdate(controllerIndex) {
		const pose = this.gamepads[controllerIndex].pose;
		const objectName =
			controllerIndex === 0 ? 'right-controller' : 'left-controller';
		dispatchCustomEvent('device-input-pose', {
			position: pose.position,
			quaternion: pose.orientation,
			objectName: objectName,
		});
	}

	_notifyEnterImmersive() {
		dispatchCustomEvent(CLIENT_ACTIONS.ENTER_IMMERSIVE, {});
	}

	_notifyLeaveImmersive(sessionId) {
		const session = this.sessions.get(sessionId);
		if (session.mode === 'immersive-ar') {
			this.arCanvasContainer.remove();
		}
		dispatchCustomEvent(CLIENT_ACTIONS.EXIT_IMMERSIVE, {});
	}

	// Device status update methods invoked from event listeners.

	_updateStereoEffect(enabled) {
		this.stereoEffectEnabled = enabled;
	}

	_updatePose(positionArray, quaternionArray) {
		for (let i = 0; i < 3; i++) {
			this.position[i] = positionArray[i];
		}
		for (let i = 0; i < 4; i++) {
			this.quaternion[i] = quaternionArray[i];
		}
	}

	_updateInputPose(positionArray, quaternionArray, index) {
		if (index >= this.gamepads.length) {
			return;
		}
		const gamepad = this.gamepads[index];
		const pose = gamepad.pose;
		for (let i = 0; i < 3; i++) {
			pose.position[i] = positionArray[i];
		}
		for (let i = 0; i < 4; i++) {
			pose.orientation[i] = quaternionArray[i];
		}
		this.gamepadInputSources[index].inputSource[
			XRINPUTSOURCE_PRIVATE
		].targetRaySpace._baseMatrix =
			this.gamepadInputSources[index].basePoseMatrix;
	}

	_updateInputButtonPressed(pressed, controllerIndex, buttonIndex) {
		if (controllerIndex >= this.gamepads.length) {
			return;
		}
		const gamepad = this.gamepads[controllerIndex];
		if (buttonIndex >= gamepad.buttons.length) {
			return;
		}
		gamepad.buttons[buttonIndex].pressed = pressed;
		gamepad.buttons[buttonIndex].value = pressed ? 1.0 : 0.0;
	}

	_updateInputButton(
		controllerIndex,
		buttonIndex,
		pressed,
		touched = false,
		value = null,
	) {
		if (controllerIndex >= this.gamepads.length) {
			return;
		}
		const gamepad = this.gamepads[controllerIndex];
		if (buttonIndex >= gamepad.buttons.length) {
			return;
		}
		gamepad.buttons[buttonIndex].pressed = pressed;
		gamepad.buttons[buttonIndex].touched = touched;
		if (value != null) {
			gamepad.buttons[buttonIndex].value = value;
		} else {
			gamepad.buttons[buttonIndex].value = pressed ? 1.0 : 0.0;
		}
	}

	_updateInputAxisValue(value, controllerIndex, axisIndex) {
		if (controllerIndex >= this.gamepads.length) {
			return;
		}
		const gamepad = this.gamepads[controllerIndex];
		if (axisIndex >= gamepad.axes.length) {
			return;
		}
		gamepad.axes[axisIndex] = value;
	}

	_initializeControllers(config) {
		const hasController = config.controllers !== undefined;
		const controllerNum = hasController ? config.controllers.length : 0;
		this.gamepads.length = 0;
		this.gamepadInputSources.length = 0;
		for (let i = 0; i < controllerNum; i++) {
			const controller = config.controllers[i];
			const id = controller.id || '';
			const hasPosition = controller.hasPosition || false;
			const buttonNum = controller.buttonNum || 0;
			const primaryButtonIndex =
				controller.primaryButtonIndex !== undefined
					? controller.primaryButtonIndex
					: 0;
			const primarySqueezeButtonIndex =
				controller.primarySqueezeButtonIndex !== undefined
					? controller.primarySqueezeButtonIndex
					: -1;
			this.gamepads.push(
				createGamepad(id, i === 0 ? 'right' : 'left', buttonNum, hasPosition),
			);
			// @TODO: targetRayMode should be screen for right controller(pointer) in AR
			const imputSourceImpl = new GamepadXRInputSource(
				this,
				{},
				primaryButtonIndex,
				primarySqueezeButtonIndex,
			);
			imputSourceImpl.active = true; // Override property for transient imput
			imputSourceImpl.profilesOverride =
				GamepadMappings[controller.id].profiles;
			this.gamepadInputSources.push(imputSourceImpl);
		}
	}

	_initializeHands() {
		this.handInputSources.length = 0;
		for (let i = 0; i < 2; i++) {
			const handInputImpl = new HandXRInputSource(this);
			handInputImpl.active = true;
			this.handInputSources.push(handInputImpl);
		}
	}

	// Set up event listeners. Events are sent from panel via background.

	_setupEventListeners() {
		window.addEventListener(POLYFILL_ACTIONS.DEVICE_TYPE_CHANGE, (event) => {
			const config = event.detail.deviceDefinition;

			this.modes = config.modes || DEFAULT_MODES;
			this.features = config.features || [];
			this.resolution =
				config.resolution !== undefined
					? config.resolution
					: DEFAULT_RESOLUTION;
			this.deviceSize =
				config.size !== undefined ? config.size : DEFAULT_DEVICE_SIZE;

			// Note: Just in case release primary buttons and wait for two frames to fire selectend event
			//       before initialize controllers.
			// @TODO: Very hacky. We should go with more proper way.
			for (let i = 0; i < this.gamepads.length; ++i) {
				const gamepad = this.gamepads[i];
				const inputSourceImpl = this.gamepadInputSources[i];
				inputSourceImpl.active = true;
				if (inputSourceImpl.primaryButtonIndex !== -1) {
					gamepad.buttons[inputSourceImpl.primaryButtonIndex].pressed = false;
				}
				if (inputSourceImpl.primarySqueezeButtonIndex !== -1) {
					gamepad.buttons[
						inputSourceImpl.primarySqueezeButtonIndex
					].pressed = false;
				}
			}

			this.requestAnimationFrame(() => {
				this.requestAnimationFrame(() => {
					this._initializeControllers(config);
				});
			});
		});

		window.addEventListener(
			POLYFILL_ACTIONS.HEADSET_POSE_CHANGE,
			(event) => {
				const positionArray = event.detail.position;
				const quaternionArray = event.detail.quaternion;
				this._updatePose(positionArray, quaternionArray);
				if (this.xrScene) {
					this.xrScene.updateCameraTransform(positionArray, quaternionArray);
				}
			},
			false,
		);

		window.addEventListener(
			POLYFILL_ACTIONS.CONTROLLER_POSE_CHANGE,
			(event) => {
				const positionArray = event.detail.position;
				const quaternionArray = event.detail.quaternion;
				const objectName = event.detail.objectName;

				switch (objectName) {
					case 'right-controller':
					case 'left-controller':
						this._updateInputPose(
							positionArray,
							quaternionArray,
							objectName === 'right-controller' ? 0 : 1,
						); // @TODO: remove magic number
						break;
				}
			},
		);

		window.addEventListener(
			POLYFILL_ACTIONS.BUTTON_STATE_CHANGE,
			(event) => {
				const objectName = event.detail.objectName;
				const buttonIndex = event.detail.buttonIndex;
				const pressed = event.detail.pressed;
				const touched = event.detail.touched;
				const value = event.detail.value;

				switch (objectName) {
					case 'right-controller':
					case 'left-controller':
						this._updateInputButton(
							objectName === 'right-controller' ? 0 : 1, // @TODO: remove magic number
							buttonIndex,
							pressed,
							touched,
							value,
						);
						break;
				}
			},
			false,
		);

		window.addEventListener(
			POLYFILL_ACTIONS.ANALOG_VALUE_CHANGE,
			(event) => {
				const value = event.detail.value;
				const objectName = event.detail.objectName;
				const axisIndex = event.detail.axisIndex;

				switch (objectName) {
					case 'right-controller':
					case 'left-controller':
						this._updateInputAxisValue(
							value,
							objectName === 'right-controller' ? 0 : 1, // @TODO: remove magic number
							axisIndex,
						);
						break;
				}
			},
			false,
		);

		window.addEventListener(POLYFILL_ACTIONS.ROOM_DIMENSION_CHANGE, (event) => {
			const dimension = event.detail.dimension;
			this.xrScene.createRoom(dimension);
		});

		window.addEventListener(POLYFILL_ACTIONS.STEREO_TOGGLE, (event) => {
			this._updateStereoEffect(event.detail.enabled);
		});

		window.addEventListener(POLYFILL_ACTIONS.INPUT_MODE_CHANGE, (event) => {
			this.handMode = event.detail.inputMode === 'hands';
		});

		window.addEventListener(POLYFILL_ACTIONS.HAND_POSE_CHANGE, (event) => {
			const handedness = event.detail.handedness;
			const poseId = event.detail.pose;
			this.handPoseData[handedness].poseId = poseId;
		});

		window.addEventListener(POLYFILL_ACTIONS.PINCH_VALUE_CHANGE, (event) => {
			const handedness = event.detail.handedness;
			const pinchValue = event.detail.value;
			this.handPoseData[handedness].pinchValue = pinchValue;
		});

		window.addEventListener(POLYFILL_ACTIONS.USER_OBJECTS_CHANGE, (event) => {
			const objects = event.detail.objects;
			this.xrScene.updateUserObjects(objects);
		});
	}
}

let SESSION_ID = 0;
class Session {
	constructor(mode, enabledFeatures) {
		this.mode = mode;
		// @TODO support mobile non-immersive
		this.immersive = mode == 'immersive-vr' || mode == 'immersive-ar';
		this.vr = mode === 'immersive-vr';
		this.ar = mode == 'immersive-ar';
		this.id = ++SESSION_ID;
		this.baseLayer = null;
		this.inlineVerticalFieldOfView = Math.PI * 0.5;
		this.ended = false;
		this.enabledFeatures = enabledFeatures;
	}
}

const createGamepad = (id, hand, buttonNum, hasPosition) => {
	const buttons = [];
	for (let i = 0; i < buttonNum; i++) {
		buttons.push({
			pressed: false,
			touched: false,
			value: 0.0,
		});
	}
	return {
		id: id || '',
		pose: {
			hasPosition: hasPosition,
			position: [0, 0, 0],
			orientation: [0, 0, 0, 1],
		},
		buttons: buttons,
		hand: hand,
		mapping: 'xr-standard',
		axes: [0, 0],
	};
};

const tmpVec3 = vec3.create();
const translateOnX = (matrix, distance) => {
	vec3.set(tmpVec3, distance, 0, 0);
	return mat4.translate(matrix, matrix, tmpVec3);
};
