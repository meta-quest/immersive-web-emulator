/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const DEVICE_DEFINITIONS = {
	'Oculus Rift CV1': {
		id: 'Oculus Rift CV1',
		name: 'Oculus Rift CV1',
		shortName: 'Rift CV1',
		profile: 'oculus-touch',
		modes: ['inline', 'immersive-vr'],
		headset: {
			hasPosition: true,
			hasRotation: true,
		},
		controllers: [
			{
				id: 'Oculus Touch (Left)',
				buttonNum: 7,
				/**
				 * this is not the index in gamepad.buttons, but the index used for input remapping in WebXR Polyfill
				 * @see https://github.com/immersive-web/webxr-polyfill/blob/main/src/devices/GamepadMappings.js
				 */
				primaryButtonIndex: 1,
				primarySqueezeButtonIndex: 2,
				hasPosition: true,
				hasRotation: true,
				hasSqueezeButton: true,
				handedness: 'left',
			},
			{
				id: 'Oculus Touch (Right)',
				buttonNum: 7,
				primaryButtonIndex: 1,
				primarySqueezeButtonIndex: 2,
				hasPosition: true,
				hasRotation: true,
				hasSqueezeButton: true,
				handedness: 'right',
			},
		],
		polyfillInputMapping: {
			axes: [2, 3, 0, 1],
			buttons: [1, 2, null, 0, 3, 4, null],
		},
	},
	'Oculus Rift S': {
		id: 'Oculus Rift S',
		name: 'Oculus Rift S',
		shortName: 'Rift S',
		profile: 'oculus-touch-v2',
		modes: ['inline', 'immersive-vr'],
		headset: {
			hasPosition: true,
			hasRotation: true,
		},
		controllers: [
			{
				id: 'Oculus Touch V2 (Left)',
				buttonNum: 7,
				primaryButtonIndex: 1,
				primarySqueezeButtonIndex: 2,
				hasPosition: true,
				hasRotation: true,
				hasSqueezeButton: true,
				handedness: 'left',
			},
			{
				id: 'Oculus Touch V2 (Right)',
				buttonNum: 7,
				primaryButtonIndex: 1,
				primarySqueezeButtonIndex: 2,
				hasPosition: true,
				hasRotation: true,
				hasSqueezeButton: true,
				handedness: 'right',
			},
		],
		polyfillInputMapping: {
			axes: [2, 3, 0, 1],
			buttons: [1, 2, null, 0, 3, 4, null],
		},
	},
	'Oculus Quest': {
		id: 'Oculus Quest',
		name: 'Oculus Quest',
		shortName: 'Quest 1',
		profile: 'oculus-touch-v2',
		modes: ['inline', 'immersive-vr'],
		headset: {
			hasPosition: true,
			hasRotation: true,
		},
		controllers: [
			{
				id: 'Oculus Touch V2 (Left)',
				buttonNum: 7,
				primaryButtonIndex: 1,
				primarySqueezeButtonIndex: 2,
				hasPosition: true,
				hasRotation: true,
				hasSqueezeButton: true,
				handedness: 'left',
			},
			{
				id: 'Oculus Touch V2 (Right)',
				buttonNum: 7,
				primaryButtonIndex: 1,
				primarySqueezeButtonIndex: 2,
				hasPosition: true,
				hasRotation: true,
				hasSqueezeButton: true,
				handedness: 'right',
			},
		],
		polyfillInputMapping: {
			axes: [2, 3, 0, 1],
			buttons: [1, 2, null, 0, 3, 4, null],
		},
	},
	'Oculus Quest 2': {
		id: 'Oculus Quest 2',
		name: 'Oculus Quest 2',
		shortName: 'Quest 2',
		profile: 'oculus-touch-v3',
		modes: ['inline', 'immersive-vr', 'immersive-ar'],
		headset: {
			hasPosition: true,
			hasRotation: true,
		},
		controllers: [
			{
				id: 'Oculus Touch V3 (Left)',
				buttonNum: 7,
				primaryButtonIndex: 1,
				primarySqueezeButtonIndex: 2,
				hasPosition: true,
				hasRotation: true,
				hasSqueezeButton: true,
				handedness: 'left',
			},
			{
				id: 'Oculus Touch V3 (Right)',
				buttonNum: 7,
				primaryButtonIndex: 1,
				primarySqueezeButtonIndex: 2,
				hasPosition: true,
				hasRotation: true,
				hasSqueezeButton: true,
				handedness: 'right',
			},
		],
		polyfillInputMapping: {
			axes: [2, 3, 0, 1],
			buttons: [1, 2, null, 0, 3, 4, null],
		},
	},
	'Meta Quest Pro': {
		id: 'Meta Quest Pro',
		name: 'Meta Quest Pro',
		shortName: 'Quest Pro',
		profile: 'meta-quest-touch-pro',
		modes: ['inline', 'immersive-vr', 'immersive-ar'],
		headset: {
			hasPosition: true,
			hasRotation: true,
		},
		controllers: [
			{
				id: 'Meta Quest Touch Pro (Left)',
				buttonNum: 7,
				primaryButtonIndex: 1,
				primarySqueezeButtonIndex: 2,
				hasPosition: true,
				hasRotation: true,
				hasSqueezeButton: true,
				handedness: 'left',
			},
			{
				id: 'Meta Quest Touch Pro (Right)',
				buttonNum: 7,
				primaryButtonIndex: 1,
				primarySqueezeButtonIndex: 2,
				hasPosition: true,
				hasRotation: true,
				hasSqueezeButton: true,
				handedness: 'right',
			},
		],
		polyfillInputMapping: {
			axes: [2, 3, 0, 1],
			buttons: [1, 2, null, 0, 3, 4, null],
		},
	},
	'Meta Quest 3': {
		id: 'Meta Quest 3',
		name: 'Meta Quest 3',
		shortName: 'Quest 3',
		profile: 'meta-quest-touch-plus',
		modes: ['inline', 'immersive-vr', 'immersive-ar'],
		headset: {
			hasPosition: true,
			hasRotation: true,
		},
		controllers: [
			{
				id: 'Meta Quest Touch Plus (Left)',
				buttonNum: 7,
				primaryButtonIndex: 1,
				primarySqueezeButtonIndex: 2,
				hasPosition: true,
				hasRotation: true,
				hasSqueezeButton: true,
				handedness: 'left',
			},
			{
				id: 'Meta Quest Touch Plus (Right)',
				buttonNum: 7,
				primaryButtonIndex: 1,
				primarySqueezeButtonIndex: 2,
				hasPosition: true,
				hasRotation: true,
				hasSqueezeButton: true,
				handedness: 'right',
			},
		],
		polyfillInputMapping: {
			axes: [2, 3, 0, 1],
			buttons: [1, 2, null, 0, 3, 4, null],
		},
	},
};
