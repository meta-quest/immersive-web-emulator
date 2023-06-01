/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as THREE from 'three';

import { ASSET_PATH, DEVICE, OBJECT_NAME } from './constants';
import { EmulatorSettings, emulatorStates } from './emulatorStates';
import {
	applyAllPoseChanges,
	applyDevicePoseChange,
	changeRoomDimension,
} from './messenger';

import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

export const setupEmulatorScene = () => {};

const transformControls = {};
transformControls[DEVICE.HEADSET] = null;
transformControls[DEVICE.RIGHT_CONTROLLER] = null;
transformControls[DEVICE.LEFT_CONTROLLER] = null;

emulatorStates.assetNodes[DEVICE.HEADSET] = null;
emulatorStates.assetNodes[DEVICE.RIGHT_CONTROLLER] = null;
emulatorStates.assetNodes[DEVICE.LEFT_CONTROLLER] = null;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(1, 1);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.paddingLeft = '13px';
document.getElementById('renderComponent').appendChild(renderer.domElement);

export const onResize = () => {
	if (document.body.offsetHeight < 600) {
		document.getElementById('mask').style.display = 'block';
		document.getElementById('mask-text').innerHTML =
			'Not Enough Vertical Space';
	} else if (document.body.offsetWidth < 550) {
		document.getElementById('mask').style.display = 'block';
		document.getElementById('mask-text').innerHTML =
			'Not Enough Horizontal Space';
	} else {
		document.getElementById('mask').style.display = 'none';
	}

	const div = document.getElementById('renderComponent');
	renderer.setSize(1, 1);
	setTimeout(() => {
		const width = div.offsetWidth;
		const height = div.offsetHeight;
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		renderer.setSize(width - 5, height);
		render();
	}, 50);
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x505050);

const camera = new THREE.PerspectiveCamera(45, 1 / 1, 0.1, 100);
camera.position.set(-1.5, 1.7, 2);
camera.lookAt(new THREE.Vector3(0, 1.6, 0));

export const render = () => {
	renderer.render(scene, camera);
};

const light1 = new THREE.DirectionalLight(0xffffff, 1);
light1.position.set(-1, 1, -1);
scene.add(light1);

const light2 = new THREE.DirectionalLight(0xffffff, 1);
light2.position.set(1, 1, 1);
scene.add(light2);

const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

let roomObject = null;
export const drawRoom = () => {
	const dimension = EmulatorSettings.instance.roomDimension;
	if (roomObject) scene.remove(roomObject);
	roomObject = new THREE.LineSegments(
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
	roomObject.geometry.translate(0, dimension.y / 2, 0);
	scene.add(roomObject);
	render();
};

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.addEventListener('change', render);
orbitControls.target.set(0, 1.6, 0);
orbitControls.update();

const createTransformControls = (target, onChange) => {
	const controls = new TransformControls(camera, renderer.domElement);
	controls.attach(target);
	controls.enabled = false;
	controls.visible = false;

	controls.addEventListener(
		'mouseDown',
		() => {
			orbitControls.enabled = false;
		},
		false,
	);

	controls.addEventListener(
		'mouseUp',
		() => {
			orbitControls.enabled = true;
		},
		false,
	);

	controls.addEventListener(
		'change',
		() => {
			onChange();
			render();
		},
		false,
	);

	return controls;
};

const updateVec3Display = (elementId, vec3, checkpointVec3) => {
	const generateSign = (number) => {
		return number >= 0 ? '\xa0' : '';
	};
	const checkDiff = (element, value, checkpointValue) => {
		const diff = checkpointValue != null && value != checkpointValue;
		element.innerHTML = generateSign(value) + value.toFixed(2);
		element.classList.toggle('value-changed', diff);
	};
	let container = document.getElementById(elementId);
	if (container) {
		checkDiff(
			container.getElementsByClassName('x-value')[0],
			vec3.x,
			checkpointVec3?.x,
		);
		checkDiff(
			container.getElementsByClassName('y-value')[0],
			vec3.y,
			checkpointVec3?.y,
		);
		checkDiff(
			container.getElementsByClassName('z-value')[0],
			vec3.z,
			checkpointVec3?.z,
		);
	}
};

const checkTransformDiff = (device) => {
	const assetNode = emulatorStates.assetNodes[device];
	if (!assetNode) return false;
	const deviceName = OBJECT_NAME[device];
	const checkpoint = EmulatorSettings.instance.defaultPose[device];
	const position = assetNode.position;
	const rotation = assetNode.rotation;
	let diffExists = false;
	const checkDiff = (attribute, axis, value) => {
		const container = document.getElementById(deviceName + '-' + attribute);
		const element = container.getElementsByClassName(axis + '-value')[0];
		const checkpointValue = checkpoint[attribute][axis];

		const diff = checkpointValue != null && value != checkpointValue;
		element.classList.toggle('value-changed', diff);
		diffExists = diffExists || diff;
	};
	checkDiff('position', 'x', position.x);
	checkDiff('position', 'y', position.y);
	checkDiff('position', 'z', position.z);
	checkDiff('rotation', 'x', rotation.x);
	checkDiff('rotation', 'y', rotation.y);
	checkDiff('rotation', 'z', rotation.z);
	return diffExists;
};

export const checkAllTransformDiff = () => {
	let diff = {};
	diff[DEVICE.HEADSET] = checkTransformDiff(DEVICE.HEADSET);
	diff[DEVICE.LEFT_CONTROLLER] = checkTransformDiff(DEVICE.LEFT_CONTROLLER);
	diff[DEVICE.RIGHT_CONTROLLER] = checkTransformDiff(DEVICE.RIGHT_CONTROLLER);
	return (
		diff[DEVICE.HEADSET] ||
		diff[DEVICE.LEFT_CONTROLLER] ||
		diff[DEVICE.RIGHT_CONTROLLER]
	);
};

export const updateDeviceTransformData = (device) => {
	const assetNode = emulatorStates.assetNodes[device];
	if (!assetNode) return;
	const deviceName = OBJECT_NAME[device];
	const checkpoint = EmulatorSettings.instance.defaultPose[device];
	updateVec3Display(
		deviceName + '-position',
		assetNode.position,
		checkpoint?.position,
	);
	updateVec3Display(
		deviceName + '-rotation',
		assetNode.rotation,
		checkpoint?.rotation,
	);
};

export const loadDeviceAsset = (device) => {
	new GLTFLoader().load(ASSET_PATH[device], (gltf) => {
		const headset = gltf.scene;
		const parent = new THREE.Object3D();
		parent.scale.setScalar(2);
		parent.position.fromArray(
			EmulatorSettings.instance.defaultPose[device].position,
		);
		parent.rotation.fromArray(
			EmulatorSettings.instance.defaultPose[device].rotation,
		);
		headset.rotation.y = -Math.PI;

		scene.add(parent.add(headset));
		emulatorStates.assetNodes[device] = parent;

		const onChange = () => {
			updateDeviceTransformData(device);
			applyDevicePoseChange(device, parent);
		};

		const controls = createTransformControls(parent, onChange);
		scene.add(controls);
		transformControls[device] = controls;

		onChange();
		render();
	});
};

export const setupRoomDimensionSettings = () => {
	drawRoom();
	const dimensionX = document.getElementById('room-width');
	dimensionX.value = EmulatorSettings.instance.roomDimension.x;
	dimensionX.onchange = () => {
		EmulatorSettings.instance.roomDimension.x = parseFloat(dimensionX.value);
		EmulatorSettings.instance.write();
		drawRoom();
		changeRoomDimension();
	};

	const dimensionY = document.getElementById('room-height');
	dimensionY.value = EmulatorSettings.instance.roomDimension.y;
	dimensionY.onchange = () => {
		EmulatorSettings.instance.roomDimension.y = parseFloat(dimensionY.value);
		EmulatorSettings.instance.write();
		drawRoom();
		changeRoomDimension();
	};

	const dimensionZ = document.getElementById('room-depth');
	dimensionZ.value = EmulatorSettings.instance.roomDimension.z;
	dimensionZ.onchange = () => {
		EmulatorSettings.instance.roomDimension.z = parseFloat(dimensionZ.value);
		EmulatorSettings.instance.write();
		drawRoom();
		changeRoomDimension();
	};
};

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mousedownTime = null;
let intersectKey = null;
const thresholdTime = 300;

const raycast = (event) => {
	const rect = renderer.domElement.getBoundingClientRect();
	const point = {
		x: (event.clientX - rect.left) / rect.width,
		y: (event.clientY - rect.top) / rect.height,
	};
	mouse.set(point.x * 2 - 1, -(point.y * 2) + 1);
	raycaster.setFromCamera(mouse, camera);
	const targetObjects = [];
	for (const key in emulatorStates.assetNodes) {
		const node = emulatorStates.assetNodes[key];
		if (node) {
			targetObjects.push(node);
		}
	}
	return raycaster.intersectObjects(targetObjects, true);
};

const getNearestIntersectedObjectKey = (event) => {
	const intersects = raycast(event);
	if (intersects.length === 0) {
		return null;
	}
	const intersect = intersects[0];
	let target = null;
	const check = (object) => {
		for (const key in emulatorStates.assetNodes) {
			const node = emulatorStates.assetNodes[key];
			if (!node) {
				continue;
			}
			if (object === node) {
				target = key;
			}
		}
	};
	check(intersect.object);
	intersect.object.traverseAncestors(check);
	return target;
};

document.addEventListener('keypress', (e) => {
	switch (e.key) {
		case '1':
			toggleControlMode(DEVICE.HEADSET);
			break;
		case '2':
			toggleControlMode(DEVICE.LEFT_CONTROLLER);
			break;
		case '3':
			toggleControlMode(DEVICE.RIGHT_CONTROLLER);
			break;
		default:
			break;
	}
});

renderer.domElement.addEventListener(
	'mousedown',
	(event) => {
		intersectKey = getNearestIntersectedObjectKey(event);
		mousedownTime = performance.now();
	},
	false,
);

renderer.domElement.addEventListener(
	'mouseup',
	(_event) => {
		if (intersectKey === null) {
			return;
		}
		const currentTime = performance.now();
		if (currentTime - mousedownTime < thresholdTime) {
			toggleControlMode(intersectKey);
			orbitControls.enabled = true;
		}
	},
	false,
);

window.addEventListener('resize', onResize, false);

const toggleControlMode = (key) => {
	const controls = transformControls[key];
	if (!controls) {
		return;
	}
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
	render();
};

export const resetDevicePose = () => {
	for (const key in emulatorStates.assetNodes) {
		const device = emulatorStates.assetNodes[key];

		device.position.fromArray(
			EmulatorSettings.instance.defaultPose[key].position,
		);
		device.rotation.fromArray(
			EmulatorSettings.instance.defaultPose[key].rotation,
		);

		updateDeviceTransformData(key);
	}
	applyAllPoseChanges();
	render();
};

export const serializeAllDeviceTransform = () => {
	let devicesData = {};
	for (const key in emulatorStates.assetNodes) {
		const device = emulatorStates.assetNodes[key];
		if (!device) continue;
		devicesData[key] = {
			position: device.position.toArray(),
			rotation: device.rotation.toArray(),
		};
	}
	return JSON.stringify(devicesData);
};

export const deserializeAllDeviceTransform = (poseString) => {
	let devicesData = JSON.parse(poseString);
	for (const key in emulatorStates.assetNodes) {
		const device = emulatorStates.assetNodes[key];
		if (!device) continue;
		device.position.fromArray(devicesData[key].position);
		device.rotation.fromArray(devicesData[key].rotation);
	}
	updateDeviceTransformData(DEVICE.HEADSET);
	updateDeviceTransformData(DEVICE.RIGHT_CONTROLLER);
	updateDeviceTransformData(DEVICE.LEFT_CONTROLLER);
	applyAllPoseChanges();
	render();
};
