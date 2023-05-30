import XRPose from 'webxr-polyfill/src/api/XRPose';

export const PRIVATE = Symbol('@@webxr-polyfill/XRJointPose');

export class XRJointPose extends XRPose {
	constructor(transform, radius) {
		super(transform);
		this[PRIVATE] = {
			radius,
		};
	}

	get radius() {
		return this[PRIVATE].radius;
	}
}
