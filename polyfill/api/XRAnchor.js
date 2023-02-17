const ANCHOR_DELETED_ERROR =
	'Unable to access anchor properties, the anchor was already deleted.';

export class XRAnchor {
	/**
	 * @param {import('webxr-polyfill/src/api/XRSession').default} session
	 * @param {import('webxr-polyfill/src/api/XRSpace').default} anchorSpace
	 */
	constructor(session, anchorSpace) {
		this._session = session;
		this._anchorSpace = anchorSpace;
	}

	/**
	 * @type {import('webxr-polyfill/src/api/XRSpace').default}
	 */
	get anchorSpace() {
		if (this._session.hasTrackedAnchor(this)) {
			return this._anchorSpace;
		} else {
			throw new DOMException(ANCHOR_DELETED_ERROR, 'InvalidStateError');
		}
	}

	delete() {
		this._session.deleteTrackedAnchor(this);
	}
}

export class XRAnchorSet extends Set {}
