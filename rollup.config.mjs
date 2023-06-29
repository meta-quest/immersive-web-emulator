/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import babel from '@rollup/plugin-babel';
import cleanup from 'rollup-plugin-cleanup';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import css from 'rollup-plugin-import-css';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
export default [
	{
		input: './src/devtool/devtool-panel.jsx',
		output: {
			file: './dist/devtool-panel.js',
			format: 'umd',
			name: 'immersive-web-emulator-devtool',
		},
		plugins: [
			nodeResolve({
				extensions: ['.js', 'jsx'],
				preferBuiltins: false,
			}),
			babel({
				babelHelpers: 'bundled',
				presets: [
					[
						'@babel/preset-react',
						{
							runtime: 'automatic',
						},
					],
				],
				extensions: ['.jsx'],
			}),
			commonjs(),
			cleanup({
				comments: 'none',
			}),
			css(),
			replace({
				preventAssignment: true,
				'process.env.NODE_ENV': JSON.stringify('production'),
			}),
			copy({
				targets: [
					{ src: 'src/devtool/devtool-panel.html', dest: 'dist' },
					{ src: 'src/devtool/assets/*', dest: 'dist/assets' },
					{ src: 'src/extension/devtools.html', dest: 'dist' },
					{ src: 'src/extension/devtools.js', dest: 'dist' },
					{ src: 'src/extension/popup.html', dest: 'dist' },
					{ src: 'src/extension/popup.js', dest: 'dist' },
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
				preventAssignment: true,
				'process.env.NODE_ENV': JSON.stringify('production'),
			}),
			nodeResolve(),
			commonjs(),
			cleanup({
				comments: 'none',
			}),
		],
	},
	{
		input: './src/extension/service-worker.js',
		output: {
			file: './dist/service-worker.js',
			format: 'umd',
			name: 'immersive-web-emulator-service-worker',
		},
		plugins: [
			replace({
				preventAssignment: true,
				'process.env.NODE_ENV': JSON.stringify('production'),
			}),
			nodeResolve(),
			commonjs(),
			cleanup({
				comments: 'none',
			}),
		],
	},
];
