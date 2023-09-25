import { mat4 } from 'gl-matrix';

/**
 * @see https://immersive-web.github.io/real-world-meshing/
 */
export class XRMesh {
	/**
	 * @param {import('webxr-polyfill/src/api/XRSpace').default} planeSpace
	 * @param {Float32Array} pointArray
	 * @param {Float32Array} indexArray
	 * @param {string} semanticLabel
	 */
	constructor(meshSpace, vertices, indices, semanticLabel) {
		this._meshSpace = meshSpace;
		this._vertices = vertices;
		this._indices = indices;
		this._lastChangedTime = performance.now();
		this._semanticLabel = semanticLabel;
	}

	/**
	 * @type {import('webxr-polyfill/src/api/XRSpace').default}
	 * @readonly
	 */
	get meshSpace() {
		return this._meshSpace;
	}

	/**
	 * @type {Float32Array}
	 * @readonly
	 */
	get vertices() {
		return this._vertices;
	}

	/**
	 * @type {Float32Array}
	 * @readonly
	 */
	get indices() {
		return this._indices;
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
		this._meshSpace._baseMatrix = meshMatrix;
	}
}

export class XRMeshSet extends Set {}
