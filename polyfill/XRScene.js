import {
	Color,
	DirectionalLight,
	LineBasicMaterial,
	LineSegments,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from 'three';

import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry';

const DEFAULT_CAMERA_POSITION = [0, 1.6, 0];

export default class XRScene {
	constructor() {
		this.renderer = null;
		this.camera = null;

		this.onCameraPoseUpdate = null;

		this._init();
	}

	_init() {
		const width = window.innerWidth;
		const height = window.innerHeight;

		const canvas = document.createElement('canvas');
		const context = canvas.getContext('webgl2', { antialias: true });
		context.globalCompositeOperation = 'destination-over';

		const renderer = new WebGLRenderer({ canvas: canvas, context: context });
		renderer.setSize(width, height);
		canvas.width = width;
		canvas.height = height;
		renderer.domElement.oncontextmenu = () => {
			return false;
		};

		const scene = new Scene();
		scene.background = new Color(0x444444);

		const room = new LineSegments(
			new BoxLineGeometry(6, 3, 6, 10, 5, 10),
			new LineBasicMaterial({ color: 0x808080 }),
		);
		room.geometry.translate(0, 1.5, 0);
		scene.add(room);

		const camera = new PerspectiveCamera(90, width / height, 0.001, 1000.0);
		camera.position.fromArray(DEFAULT_CAMERA_POSITION);

		const light = new DirectionalLight(0xffffff, 4.0);
		light.position.set(-1, 1, -1);
		scene.add(light);

		// @TODO: only animate when headset pose change
		const animate = () => {
			requestAnimationFrame(animate);
			renderer.render(scene, camera);
			const canvas = renderer.domElement;
			var destCtx = canvas.getContext('2d');

			if (this.canvas) {
				destCtx.drawImage(this.appCanvas, 0, 0);
			}
		};

		animate();

		window.addEventListener(
			'resize',
			(_event) => {
				const width = window.innerWidth;
				const height = window.innerHeight;
				renderer.setSize(width, height);
				camera.aspect = width / height;
				camera.updateProjectionMatrix();
			},
			false,
		);

		this.renderer = renderer;
		this.scene = scene;
		this.camera = camera;
	}

	inject(canvasContainer) {
		const appendCanvas = () => {
			canvasContainer.appendChild(this.renderer.domElement);
		};

		if (document.body) {
			appendCanvas();
		} else {
			document.addEventListener('DOMContentLoaded', appendCanvas);
		}
	}

	eject() {
		const element = this.renderer.domElement;
		element.parentElement.removeChild(element);
	}

	setCanvas(canvas) {
		this.appCanvas = canvas;
	}

	updateCameraTransform(positionArray, quaternionArray) {
		this.camera.position.fromArray(positionArray);
		this.camera.quaternion.fromArray(quaternionArray);
	}
}
