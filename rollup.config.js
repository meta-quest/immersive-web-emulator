/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import cleanup from 'rollup-plugin-cleanup';
import commonjs from 'rollup-plugin-commonjs';
import css from 'rollup-plugin-import-css';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';

export default [
	{
		input: './src/devtool/index.js',
		output: {
			file: './build/devtool.js',
			format: 'umd',
			name: 'immersive-web-emulator-devtool',
			sourcemap: true,
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
		],
	},
	{
		input: './src/extension/content-script.js',
		output: {
			file: './build/content.js',
			format: 'umd',
			name: 'immersive-web-emulator-content-script',
			sourcemap: true,
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
