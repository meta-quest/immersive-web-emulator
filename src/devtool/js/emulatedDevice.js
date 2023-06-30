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

const SELECTION_MOUSE_DOWN_THRESHOLD = 300;

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

		const oc = new OrbitControls(this._camera, this.canvas);
		oc.addEventListener('change', this.render.bind(this));
		oc.target.set(0, 1.6, 0);
		oc.update();

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
			Object.values(emulatorStates.assetNodes),
			true,
		)[0];

		return intersect?.object.userData['deviceKey'];
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

	get canvas() {
		return this._renderer.domElement;
	}

	getDeviceNode(deviceKey) {
		return emulatorStates.assetNodes[deviceKey];
	}

	forceEmitPose() {
		Object.values(DEVICE).forEach((deviceKey) => {
			this._emitPoseEvent(deviceKey);
		});
	}

	toggleControlMode(deviceKey, clearOthers = false) {
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
	}
}
