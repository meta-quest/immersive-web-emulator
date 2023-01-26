/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import cleanup from 'rollup-plugin-cleanup';
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy';
import css from 'rollup-plugin-import-css';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';

export default [
	{
		input: './src/devtool/devtool-panel.js',
		output: {
			file: './dist/devtool-panel.js',
			format: 'umd',
			name: 'immersive-web-emulator-devtool',
		},
		plugins: [
			replace({
				'process.env.NODE_ENV': JSON.stringify('production'),
			}),
			resolve(),
			commonjs(),
			cleanup({
				comments: 'none',
			}),
			css(),
			copy({
				targets: [
					{ src: 'src/devtool/devtool-panel.html', dest: 'dist' },
					{ src: 'src/extension/devtools.html', dest: 'dist' },
					{ src: 'src/extension/devtools.js', dest: 'dist' },
					{ src: 'src/devtool/ui-components/*', dest: 'dist/ui-components' },
					{ src: 'src/devtool/styles/*', dest: 'dist/styles' },
					{ src: 'src/devtool/assets/*', dest: 'dist/assets' },
				],
			}),
		],
	},
	{
		input: './src/extension/content-script.js',
		output: {
			file: './dist/content.js',
			format: 'umd',
			name: 'immersive-web-emulator-content-script',
		},
		plugins: [
			replace({
				'process.env.NODE_ENV': JSON.stringify('production'),
			}),
			resolve(),
			commonjs(),
			cleanup({
				comments: 'none',
			}),
		],
	},
];
