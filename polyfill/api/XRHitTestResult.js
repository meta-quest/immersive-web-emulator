export const PRIVATE = Symbol('@@webxr-polyfill/XRHitTestResult');

import { XRAnchor } from './XRAnchor';
import { PRIVATE as XRFRAME_PRIVATE } from 'webxr-polyfill/src/api/XRFrame';
import XRSpace from 'webxr-polyfill/src/api/XRSpace';
import { mat4 } from 'gl-matrix';

export default class XRHitTestResult {
	constructor(frame, transform) {
		this[PRIVATE] = {
			frame,
			transform,
		};
	}

	getPose(baseSpace) {
		const space = new XRSpace();
		space._baseMatrix = mat4.copy(
			mat4.create(),
			this[PRIVATE].transform.matrix,
		);
		return this[PRIVATE].frame.getPose(space, baseSpace);
	}

	async createAnchor() {
		const anchorSpace = new XRSpace();
		anchorSpace._baseMatrix = mat4.copy(
			mat4.create(),
			this[PRIVATE].transform.matrix,
		);
		const session = this[PRIVATE].frame[XRFRAME_PRIVATE].session;
		const anchor = new XRAnchor(session, anchorSpace);
		session.addTrackedAnchor(anchor);
		return anchor;
	}
}
