import { mat4 } from 'gl-matrix';

/**
 * @see https://immersive-web.github.io/real-world-geometry/plane-detection.html#plane-orientation
 * @enum {string}
 */
export const XRPlaneOrientation = {
	Horizontal: 'horizontal',
	Vertical: 'vertical',
};

/**
 * @see https://immersive-web.github.io/real-world-geometry/plane-detection.html#plane
 */
export class XRPlane {
	/**
	 * @param {import('webxr-polyfill/src/api/XRSpace').default} planeSpace
	 * @param {DOMPointReadOnly[]} pointArray
	 * @param {XRPlaneOrientation} orientation
	 * @param {string} semanticLabel
	 */
	constructor(planeSpace, pointArray, orientation, semanticLabel) {
		this._planeSpace = planeSpace;
		this._polygon = pointArray;
		Object.freeze(this._polygon);
		this._orientation = orientation;
		this._lastChangedTime = performance.now();
		this._semanticLabel = semanticLabel;
	}

	/**
	 * @type {import('webxr-polyfill/src/api/XRSpace').default}
	 * @readonly
	 */
	get planeSpace() {
		return this._planeSpace;
	}

	/**
	 * @type {DOMPointReadOnly[]}
	 * @readonly
	 */
	get polygon() {
		return this._polygon;
	}

	/**
	 * @type {XRPlaneOrientation}
	 * @readonly
	 */
	get orientation() {
		return this._orientation;
	}

	/**
	 * @type {DOMHighResTimeStamp}
	 * @readonly
	 */
	get lastChangedTime() {
		return this._lastChangedTime;
	}

	/**
	 * @type {string}
	 * @readonly
	 */
	get semanticLabel() {
		return this._semanticLabel;
	}

	/**
	 * non-standard
	 * @param {number[]} position
	 * @param {number[]} quaternion
	 */
	_updateMatrix(position, quaternion) {
		const meshMatrix = new Float32Array(16);
		mat4.fromRotationTranslation(meshMatrix, quaternion, position);
		this._planeSpace._baseMatrix = meshMatrix;
	}
}

export class XRPlaneSet extends Set {}
