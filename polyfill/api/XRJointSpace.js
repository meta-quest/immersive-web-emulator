import XRSpace from 'webxr-polyfill/src/api/XRSpace';

export const PRIVATE = Symbol('@@webxr-polyfill/XRJointSpace');

export class XRJointSpace extends XRSpace {
	constructor(jointName, xrhand) {
		super();
		this[PRIVATE] = {
			jointName,
			xrhand,
		};
	}

	get jointName() {
		return this[PRIVATE].jointName;
	}
}
