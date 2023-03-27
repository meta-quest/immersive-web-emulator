import XRSpace from 'webxr-polyfill/src/api/XRSpace';
import { generateUUID } from 'three/src/math/MathUtils';
import localforage from 'localforage';

export const PRIVATE = Symbol('@@webxr-polyfill/XRAnchor');

const ANCHOR_DELETED_ERROR =
	'Unable to access anchor properties, the anchor was already deleted.';

export class XRAnchor {
	/**
	 * @param {import('webxr-polyfill/src/api/XRSession').default} session
	 * @param {import('webxr-polyfill/src/api/XRSpace').default} anchorSpace
	 */
	constructor(session, anchorSpace) {
		this[PRIVATE] = {
			session,
			anchorSpace,
		};
	}

	/**
	 * @type {import('webxr-polyfill/src/api/XRSpace').default}
	 */
	get anchorSpace() {
		if (this[PRIVATE].session.hasTrackedAnchor(this)) {
			return this[PRIVATE].anchorSpace;
		} else {
			throw new DOMException(ANCHOR_DELETED_ERROR, 'InvalidStateError');
		}
	}

	async requestPersistentHandle() {
		const handle = await savePersistentAnchor(this);
		await restorePersistentAnchors(this[PRIVATE].session);
		return handle;
	}

	delete() {
		this[PRIVATE].session.deleteTrackedAnchor(this);
	}
}

export class XRAnchorSet extends Set {}

export const savePersistentAnchor = async (anchor) => {
	const existingUUID = anchor[PRIVATE].session.getPersistentAnchorUUID(anchor);
	if (existingUUID) {
		return existingUUID;
	}
	const prefix = window.location.hostname + PRIVATE.toString();
	const anchorHandle = generateUUID();
	const matrix = Array.from(anchor[PRIVATE].anchorSpace._baseMatrix);
	await localforage.setItem(
		prefix + anchorHandle,
		JSON.stringify({ uuid: anchorHandle, matrixValue: matrix }),
	);
	return anchorHandle;
};

export const deletePersistentAnchor = async (uuid) => {
	const prefix = window.location.hostname + PRIVATE.toString();
	await localforage.removeItem(prefix + uuid);
};

export const restorePersistentAnchors = async (session) => {
	session.persistentAnchorsMap = new Map();
	const prefix = window.location.hostname + PRIVATE.toString();
	const keys = (await localforage.keys()).filter((key) =>
		key.startsWith(prefix),
	);
	keys.forEach(async (key) => {
		const { uuid, matrixValue } = JSON.parse(await localforage.getItem(key));
		const matrix = new Float32Array(matrixValue);
		const anchorSpace = new XRSpace();
		anchorSpace._baseMatrix = matrix;
		const anchor = new XRAnchor(session, anchorSpace);
		session.persistentAnchorsMap.set(uuid, anchor);
	});
};
