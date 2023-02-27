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
	 */
	constructor(planeSpace, pointArray, orientation) {
		this._planeSpace = planeSpace;
		this._polygon = pointArray;
		Object.freeze(this._polygon);
		this._orientation = orientation;
		this._lastChangedTime = performance.now();
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
}

export class XRPlaneSet extends Set {}
