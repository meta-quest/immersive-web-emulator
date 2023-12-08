/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as THREE from 'three';

import {
	CONTROLLER_STRINGS,
	DEVICE,
	HAND_STRINGS,
	OBJECT_NAME,
} from './constants';
import { EmulatorSettings, emulatorStates } from './emulatorStates';

import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry.js';
import { EventEmitter } from 'events';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { generateUUID } from 'three/src/math/MathUtils.js';
import { updateUserObjects } from './messenger';

const SELECTION_MOUSE_DOWN_THRESHOLD = 300;

const isNumber = function isNumber(value) {
	return typeof value === 'number' && isFinite(value);
};

export default class EmulatedDevice extends EventEmitter {
	constructor() {
		super();
		this._renderer = new THREE.WebGLRenderer({ antialias: true });
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._renderer.setSize(1, 1);
		this._renderer.domElement.style.position = 'absolute';

		this._scene = new THREE.Scene();
		this._scene.background = new THREE.Color(0x505050);
		this._scene.add(new THREE.DirectionalLight(0xffffff, 1));
		this._scene.add(new THREE.AmbientLight(0x404040, 2));

		this._camera = new THREE.PerspectiveCamera(45, 1 / 1, 0.1, 100);
		this._camera.position.set(-1.5, 1.7, 2);
		this._camera.lookAt(new THREE.Vector3(0, 1.6, 0));

		this._controllerMeshes = [];
		this._handMeshes = [];

		this._labelContainer = document.createElement('div');

		const oc = new OrbitControls(this._camera, this.canvas);
		oc.addEventListener('change', this.render.bind(this));
		oc.target.set(0, 1.6, 0);
		oc.update();
		this._orbitControls = oc;

		const loader = new GLTFLoader();
		this._transformControls = {};
		Object.values(DEVICE).forEach((deviceKey) => {
			const node = new THREE.Group();
			node.position.fromArray(
				EmulatorSettings.instance.defaultPose[deviceKey].position,
			);
			node.rotation.fromArray(
				EmulatorSettings.instance.defaultPose[deviceKey].rotation,
			);
			emulatorStates.assetNodes[deviceKey] = node;
			this._scene.add(node);

			// add device node mesh to parent
			loader.load(`./assets/${OBJECT_NAME[deviceKey]}.glb`, (gltf) => {
				const mesh = gltf.scene;
				mesh.scale.setScalar(2);
				mesh.rotateY(Math.PI);
				mesh.traverse((child) => {
					child.userData['deviceKey'] = deviceKey;
				});
				node.add(mesh);
				if (CONTROLLER_STRINGS[deviceKey]) {
					this._controllerMeshes.push(mesh);
					mesh.visible = EmulatorSettings.instance.inputMode === 'controllers';
				}
				this.render();
			});

			if (HAND_STRINGS[deviceKey]) {
				loader.load(`./assets/${HAND_STRINGS[deviceKey].name}.glb`, (gltf) => {
					const mesh = gltf.scene;
					mesh.scale.setScalar(2);
					mesh.rotateY(Math.PI);
					mesh.traverse((child) => {
						child.userData['deviceKey'] = deviceKey;
					});
					node.add(mesh);
					this._handMeshes.push(mesh);
					mesh.visible = EmulatorSettings.instance.inputMode === 'hands';
					this.render();
				});
			}

			// setup transform control
			const controls = new TransformControls(this._camera, this.canvas);
			controls.attach(node);
			controls.enabled = false;
			controls.visible = false;
			controls.addEventListener('mouseDown', () => (oc.enabled = false));
			controls.addEventListener('mouseUp', () => (oc.enabled = true));
			controls.addEventListener('change', () => {
				this._emitPoseEvent(deviceKey);
				this.render();
			});
			this._transformControls[deviceKey] = controls;
			this._scene.add(controls);
		});

		this._userObjects = {};
		this._recoverObjects();

		// check device node selection by raycast
		this._raycaster = new THREE.Raycaster();
		this._mouseVec2 = new THREE.Vector2();
		this._mouseDownTime = null;
		this._selectedDeviceKey = null;
		this.canvas.addEventListener('mousedown', (event) => {
			this._selectedDeviceKey = this._findSelectedDeviceNode(event);
			this._mouseDownTime = performance.now();
		});
		this.canvas.addEventListener('mouseup', () => {
			if (this._selectedDeviceKey != null) {
				const currentTime = performance.now();
				if (
					currentTime - this._mouseDownTime <
					SELECTION_MOUSE_DOWN_THRESHOLD
				) {
					this.toggleControlMode(this._selectedDeviceKey);
					oc.enabled = true;
				}
			}
		});

		this.updateRoom();
	}

	_emitPoseEvent(deviceKey) {
		const node = this.getDeviceNode(deviceKey);
		this.emit('pose', {
			deviceKey,
			position: node.position.toArray(),
			rotation: node.rotation.toArray(),
			quaternion: node.quaternion.toArray(),
		});
	}

	_findSelectedDeviceNode(mouseEvent) {
		const rect = this.canvas.getBoundingClientRect();
		const point = {
			x: (mouseEvent.clientX - rect.left) / rect.width,
			y: (mouseEvent.clientY - rect.top) / rect.height,
		};
		this._mouseVec2.set(point.x * 2 - 1, -(point.y * 2) + 1);
		this._raycaster.setFromCamera(this._mouseVec2, this._camera);
		const intersect = this._raycaster.intersectObjects(
			[
				...Object.values(emulatorStates.assetNodes),
				...Object.values(this._userObjects),
			],
			true,
		)[0];

		return (
			intersect?.object.userData['deviceKey'] ??
			intersect?.object.userData['userObjectId']
		);
	}

	updateRoom() {
		const dimension = EmulatorSettings.instance.roomDimension;
		if (this._roomObject) {
			this._scene.remove(this._roomObject);
		}
		this._roomObject = new THREE.LineSegments(
			new BoxLineGeometry(
				dimension.x,
				dimension.y,
				dimension.z,
				Math.ceil(dimension.x * 2),
				Math.ceil(dimension.y * 2),
				Math.ceil(dimension.z * 2),
			),
			new THREE.LineBasicMaterial({ color: 0x808080 }),
		);
		this._roomObject.geometry.translate(0, dimension.y / 2, 0);
		this._scene.add(this._roomObject);
		this.render();
	}

	addObject(object, semanticLabel, idOverride = null) {
		this._scene.add(object);
		const controls = new TransformControls(this._camera, this.canvas);
		controls.attach(object);
		controls.enabled = false;
		controls.visible = false;
		controls.addEventListener(
			'mouseDown',
			() => (this._orbitControls.enabled = false),
		);
		controls.addEventListener('mouseUp', () => {
			this._orbitControls.enabled = true;
			this._updateObjects();
		});
		controls.addEventListener('change', () => {
			this.render();
		});
		this._scene.add(controls);
		const userObjectId = idOverride ?? generateUUID();
		this._transformControls[userObjectId] = controls;
		this._userObjects[userObjectId] = object;
		const label = document.createElement('div');
		label.classList.add('semantic-label');
		label.innerHTML = semanticLabel;
		this._labelContainer.appendChild(label);
		object.userData = { userObjectId, controls, semanticLabel, label };
		if (idOverride == null) {
			this.render();
		}
		return userObjectId;
	}

	addMesh(
		width,
		height,
		depth,
		semanticLabel,
		idOverride = null,
		active = true,
	) {
		if (
			!isNumber(width) ||
			!isNumber(height) ||
			!isNumber(depth) ||
			width * height * depth == 0
		) {
			return;
		}
		const object = new THREE.Mesh(
			new THREE.BoxGeometry(width, height, depth),
			new THREE.MeshPhongMaterial({
				color: 0xffffff * Math.random(),
				transparent: true,
			}),
		);
		const userObjectId = this.addObject(object, semanticLabel, idOverride);
		EmulatorSettings.instance.userObjects[userObjectId] = {
			type: 'mesh',
			active: true,
			width,
			height,
			depth,
			semanticLabel,
			position: object.position.toArray(),
			quaternion: object.quaternion.toArray(),
		};
		this._toggleObjectVisibility(userObjectId, active);
		EmulatorSettings.instance.write().then(updateUserObjects);
		return object;
	}

	addPlane(
		width,
		height,
		isVertical,
		semanticLabel,
		idOverride = null,
		active = true,
	) {
		if (!isNumber(width) || !isNumber(height) || width * height == 0) {
			return;
		}
		const planeGeometry = new THREE.PlaneGeometry(width, height);
		planeGeometry.rotateX(Math.PI / 2);
		const object = new THREE.Mesh(
			planeGeometry,
			new THREE.MeshPhongMaterial({
				color: 0xffffff * Math.random(),
				side: THREE.DoubleSide,
				transparent: true,
			}),
		);
		if (isVertical) {
			object.rotateX(Math.PI / 2);
		}
		const userObjectId = this.addObject(object, semanticLabel, idOverride);
		EmulatorSettings.instance.userObjects[userObjectId] = {
			type: 'plane',
			active: true,
			width,
			height,
			isVertical,
			semanticLabel,
			position: object.position.toArray(),
			quaternion: object.quaternion.toArray(),
		};
		this._toggleObjectVisibility(userObjectId, active);
		EmulatorSettings.instance.write().then(updateUserObjects);
		return object;
	}

	deleteSelectedObject() {
		Object.entries(this._transformControls).forEach(([key, controls]) => {
			if (controls.enabled) {
				const object = this._userObjects[key];
				if (object) {
					const { label } = object.userData;
					this._labelContainer.removeChild(label);
					controls.detach();
					this._scene.remove(object);
					delete this._userObjects[key];
					controls.dispose();
					delete this._transformControls[key];
					this.render();
					delete EmulatorSettings.instance.userObjects[key];
					EmulatorSettings.instance.write().then(updateUserObjects);
				}
			}
		});
	}

	_toggleObjectVisibility(objectId, active = undefined) {
		const object = this._userObjects[objectId];
		if (object) {
			const isActive =
				active ?? !EmulatorSettings.instance.userObjects[objectId].active;
			EmulatorSettings.instance.userObjects[objectId].active = isActive;
			const { label, semanticLabel } = object.userData;
			if (isActive) {
				object.material.opacity = 1;
				label.innerHTML = semanticLabel;
			} else {
				object.material.opacity = 0.4;
				label.innerHTML = '[hidden] ' + semanticLabel;
			}
		}
	}

	toggleSelectedObjectVisibility() {
		Object.entries(this._transformControls).forEach(([objectId, controls]) => {
			if (controls.enabled) {
				this._toggleObjectVisibility(objectId);
				this.render();
				EmulatorSettings.instance.write().then(updateUserObjects);
			}
		});
	}

	_updateObjects() {
		Object.entries(this._transformControls).forEach(
			([userObjectId, controls]) => {
				if (controls.enabled) {
					const object = this._userObjects[userObjectId];
					if (object) {
						EmulatorSettings.instance.userObjects[userObjectId].position =
							object.position.toArray();
						EmulatorSettings.instance.userObjects[userObjectId].quaternion =
							object.quaternion.toArray();
					}
				}
			},
		);
		EmulatorSettings.instance.write().then(updateUserObjects);
	}

	_recoverObjects() {
		Object.entries(EmulatorSettings.instance.userObjects).forEach(
			([userObjectId, objectData]) => {
				const {
					type,
					active,
					width,
					height,
					depth,
					isVertical,
					semanticLabel,
					position,
					quaternion,
				} = objectData;
				let object;
				if (type === 'mesh') {
					object = this.addMesh(
						width,
						height,
						depth,
						semanticLabel,
						userObjectId,
						active,
					);
				} else if (type === 'plane') {
					object = this.addPlane(
						width,
						height,
						isVertical,
						semanticLabel,
						userObjectId,
						active,
					);
				}
				if (object) {
					object.position.fromArray(position);
					object.quaternion.fromArray(quaternion);
				}
			},
		);
	}

	get canvas() {
		return this._renderer.domElement;
	}

	get labels() {
		return this._labelContainer;
	}

	getDeviceNode(deviceKey) {
		return emulatorStates.assetNodes[deviceKey];
	}

	forceEmitPose() {
		Object.values(DEVICE).forEach((deviceKey) => {
			this._emitPoseEvent(deviceKey);
		});
	}

	toggleControlMode(deviceKey, clearOthers = true) {
		if (clearOthers) {
			Object.entries(this._transformControls).forEach(([key, controls]) => {
				if (key != deviceKey) {
					controls.enabled = false;
					controls.visible = false;
				}
			});
		}
		const controls = this._transformControls[deviceKey];
		if (!controls.enabled) {
			controls.enabled = true;
			controls.visible = true;
			controls.setMode('translate');
		} else if (controls.getMode() === 'translate') {
			controls.setMode('rotate');
		} else {
			controls.enabled = false;
			controls.visible = false;
		}
		this.render();
	}

	setDeviceTransform(deviceKey, position, rotation) {
		const deviceNode = this.getDeviceNode(deviceKey);
		if (deviceNode) {
			deviceNode.position.fromArray(position);
			deviceNode.rotation.fromArray(rotation);
			this._emitPoseEvent(deviceKey);
			this.render();
		}
	}

	resetPose() {
		Object.values(DEVICE).forEach((deviceKey) => {
			const deviceNode = this.getDeviceNode(deviceKey);
			deviceNode.position.fromArray(
				EmulatorSettings.instance.defaultPose[deviceKey].position,
			);
			deviceNode.rotation.fromArray(
				EmulatorSettings.instance.defaultPose[deviceKey].rotation,
			);
			this._emitPoseEvent(deviceKey);
		});
		this.render();
	}

	render() {
		this._handMeshes.forEach((mesh) => {
			mesh.visible = EmulatorSettings.instance.inputMode === 'hands';
		});
		this._controllerMeshes.forEach((mesh) => {
			mesh.visible = EmulatorSettings.instance.inputMode === 'controllers';
		});
		const parent = this.canvas.parentElement;
		if (!parent) return;
		const width = parent.offsetWidth;
		const height = parent.offsetHeight;
		if (width != this._lastWidth || height != this._lastHeight) {
			this._camera.aspect = width / height;
			this._camera.updateProjectionMatrix();
			this._renderer.setSize(width, height);
			this._lastWidth = width;
			this._lastHeight = height;
		}
		this._renderer.render(this._scene, this._camera);

		const sceneContainer = this._renderer.domElement.parentElement;
		if (!sceneContainer) return;

		Object.values(this._userObjects).forEach((object) => {
			const { label } = object.userData;
			if (label) {
				const screenVec = object.position.clone().project(this._camera);
				screenVec.x = ((screenVec.x + 1) * sceneContainer.offsetWidth) / 2;
				screenVec.y = (-(screenVec.y - 1) * sceneContainer.offsetHeight) / 2;
				label.style.top = `${screenVec.y}px`;
				label.style.left = `${screenVec.x}px`;
			}
		});
	}
}
