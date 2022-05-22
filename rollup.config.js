import cleanup from 'rollup-plugin-cleanup';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'polyfill/CustomWebXRPolyfill.js',
  output: {
    file: './polyfill/build/webxr-polyfill.js',
    format: 'umd',
    name: 'CustomWebXRPolyfill',
    // Note: These banner and footer are the trick to inject polyfill in content-script
    banner: 'function WebXRPolyfillInjection() {',
    footer: '}'
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
};