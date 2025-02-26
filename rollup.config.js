import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import strip from '@rollup/plugin-strip';
import terser from '@rollup/plugin-terser';

export default [
	{
		input: 'lib/index.js',
		plugins: [
			resolve(),
			commonjs(),
			json(),
			replace({
				'process.env.NODE_ENV': JSON.stringify('production'),
				preventAssignment: true,
			}),
			replace({
				__IS_UMD__: 'true', // Set to true for UMD builds
				preventAssignment: true,
			}),
			strip({
				functions: ['console.*'],
			}),
		],
		output: {
			file: 'build/iwe.min.js',
			format: 'umd',
			name: 'IWE',
			plugins: [terser()],
			footer: 'IWE.injectRuntime();',
		},
	},
	{
		input: 'lib/service-worker.js',
		plugins: [resolve(), commonjs()],
		output: {
			file: 'build/service-worker.min.js',
			format: 'esm',
			plugins: [terser()],
		},
	},
];
