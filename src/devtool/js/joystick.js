/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';

const CIRCUMFERENCE = 2 * Math.PI;
const LINEWIDTH = 4;
const OUTER_STROKE_COLOR = '#e4e6eb';
const INNER_FILL_COLOR = '#317BEF';

export class Joystick extends EventEmitter {
	constructor(size, autoReturn, renderScale = 2) {
		super();
		this._renderScale = renderScale;
		this._autoReturn = autoReturn;

		const canvas = document.createElement('canvas');
		canvas.id = 'Joystick';
		canvas.width = size * renderScale;
		canvas.height = size * renderScale;
		this._radius = (size / 2) * renderScale;
		canvas.style.width = 75;
		canvas.style.height = 75;
		this._canvas = canvas;

		this._pressed = false;
		this._innerRadius = this._radius / 2;
		this._outerRadius = this._innerRadius * 1.5;
		this._maxStickDelta = this._outerRadius - this._innerRadius / 2;

		this._centerX = this._radius;
		this._centerY = this._radius;
		this._refX = 0;
		this._refY = 0;
		this._deltaX = 0;
		this._deltaY = 0;

		canvas.addEventListener('mousedown', this._onMouseDown.bind(this), false);
		document.addEventListener('mousemove', this._onMouseMove.bind(this), false);
		document.addEventListener('mouseup', this._onMouseUp.bind(this), false);

		this._drawOuterCircle();
		this._drawInnerCircle();
	}

	_drawOuterCircle() {
		const context = this._canvas.getContext('2d');
		context.imageSmoothingQuality = 'high';
		context.beginPath();
		context.arc(
			this._centerX,
			this._centerY,
			this._outerRadius,
			0,
			CIRCUMFERENCE,
			false,
		);

		context.lineWidth = LINEWIDTH * this._renderScale;
		context.strokeStyle = OUTER_STROKE_COLOR;
		context.stroke();
	}

	_drawInnerCircle() {
		const context = this._canvas.getContext('2d');
		context.beginPath();
		const deltaDistance = Math.sqrt(
			this._deltaX * this._deltaX + this._deltaY * this._deltaY,
		);
		const scaleFactor = deltaDistance / this._maxStickDelta;
		if (scaleFactor > 1) {
			this._deltaX /= scaleFactor;
			this._deltaY /= scaleFactor;
		}
		context.arc(
			this._deltaX + this._centerX,
			this._deltaY + this._centerY,
			this._innerRadius,
			0,
			CIRCUMFERENCE,
			false,
		);

		context.fillStyle = INNER_FILL_COLOR;
		context.fill();
		context.lineWidth = 0;
	}

	_onMouseDown(event) {
		this._refX = event.pageX;
		this._refY = event.pageY;
		this._pressed = true;
		this._dispatchEvent();
	}

	_onMouseUp(_event) {
		const context = this._canvas.getContext('2d');
		this._pressed = false;

		if (this._autoReturn) {
			this._deltaX = 0;
			this._deltaY = 0;
		}

		context.clearRect(0, 0, this._canvas.width, this._canvas.height);

		this._drawOuterCircle();
		this._drawInnerCircle();
		this._dispatchEvent();
	}

	_onMouseMove(event) {
		if (this._pressed) {
			const context = this._canvas.getContext('2d');
			this._deltaX = (event.pageX - this._refX) * this._renderScale;
			this._deltaY = (event.pageY - this._refY) * this._renderScale;

			context.clearRect(0, 0, this._canvas.width, this._canvas.height);

			this._drawOuterCircle();
			this._drawInnerCircle();
			this._dispatchEvent();
		}
	}

	_dispatchEvent() {
		this.emit('joystickmove');
	}

	overrideMove(x, y) {
		const context = this._canvas.getContext('2d');
		this._deltaX = x * this._maxStickDelta;
		this._deltaY = y * this._maxStickDelta;

		context.clearRect(0, 0, this._canvas.width, this._canvas.height);

		this._drawOuterCircle();
		this._drawInnerCircle();
		this._dispatchEvent();
	}

	addToParent(parent) {
		parent.appendChild(this._canvas);
	}

	getX() {
		return (100 * (this._deltaX / this._maxStickDelta)).toFixed() / 100;
	}

	getY() {
		return (100 * (this._deltaY / this._maxStickDelta)).toFixed() / 100;
	}

	reset() {
		this._deltaX = 0;
		this._deltaY = 0;
		this._onMouseUp();
	}

	get sticky() {
		return !this._autoReturn;
	}

	setSticky(sticky) {
		this._autoReturn = !sticky;
		this._onMouseUp();
	}
}
