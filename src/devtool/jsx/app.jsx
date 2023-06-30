/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ControllerPanel from './controllers.jsx';
import { DEVICE } from '../js/constants';
import { EmulatorSettings } from '../js/emulatorStates.js';
import HandPanel from './hands.jsx';
import HeadsetBar from './headset.jsx';
import Inspector from './inspector.jsx';
import PoseBar from './pose.jsx';
import React from 'react';

const MIN_PANEL_WIDTH = 327;
const MIN_PANEL_HEIGHT = 256;
const MIN_INPUT_PANEL_WIDTH = 420;
const MIN_INPUT_PANEL_HEIGHTS = {
	controllers: 452,
	hands: 327,
};

export default function App({ device }) {
	const [inputMode, setInputMode] = React.useState(
		EmulatorSettings.instance.inputMode,
	);
	const [showInspector, setShowInspector] = React.useState(true);
	const [showControls, setShowControls] = React.useState(true);
	const sizeWarningRef = React.useRef();
	React.useEffect(onResize, [inputMode]);

	React.useEffect(() => {
		window.addEventListener('resize', function () {
			onResize();
		});
	});

	function onResize() {
		if (document.body.offsetHeight < MIN_PANEL_HEIGHT) {
			if (showInspector) setShowInspector(false);
			if (showControls) setShowControls(false);
			sizeWarningRef.current.innerHTML = 'Not Enough Vertical Space';
		} else if (document.body.offsetWidth < MIN_PANEL_WIDTH) {
			if (showInspector) setShowInspector(false);
			if (showControls) setShowControls(false);
			sizeWarningRef.current.innerHTML = 'Not Enough Horizontal Space';
		} else {
			if (!showInspector) setShowInspector(true);
			const inputMode = EmulatorSettings.instance.inputMode;
			if (document.body.offsetWidth < MIN_INPUT_PANEL_WIDTH) {
				if (showControls) setShowControls(false);
				sizeWarningRef.current.innerHTML = 'Not Enough Horizontal Space';
			} else if (
				document.body.offsetHeight < MIN_INPUT_PANEL_HEIGHTS[inputMode]
			) {
				if (showControls) setShowControls(false);
				sizeWarningRef.current.innerHTML = 'Not Enough Vertical Space';
			} else {
				if (!showControls) setShowControls(true);
			}
		}
		device.render();
	}

	return (
		<>
			<div
				className="root-panel inspector-panel"
				style={{ display: showInspector ? 'flex' : 'none' }}
			>
				<div id="headset-component" className="component-container row">
					<HeadsetBar device={device} />
				</div>
				<div id="render-component" className="component-container row">
					<Inspector device={device} inputMode={inputMode} />
				</div>
				<div id="pose-component" className="component-container row">
					<PoseBar device={device} setInputMode={setInputMode} />
				</div>
			</div>
			<div
				className="root-panel controls-panel"
				style={{ display: showControls ? 'flex' : 'none' }}
			>
				<div
					className="row controller-panel"
					style={{ display: inputMode === 'controllers' ? 'flex' : 'none' }}
				>
					{[DEVICE.INPUT_LEFT, DEVICE.INPUT_RIGHT].map((deviceKey) => (
						<ControllerPanel key={deviceKey} deviceKey={deviceKey} />
					))}
				</div>
				<div
					className="row controller-panel"
					style={{ display: inputMode === 'hands' ? 'flex' : 'none' }}
				>
					{[DEVICE.INPUT_LEFT, DEVICE.INPUT_RIGHT].map((deviceKey) => (
						<HandPanel key={deviceKey} deviceKey={deviceKey} />
					))}
				</div>
			</div>

			<div
				className="root-panel size-panel"
				style={{
					display: !showControls ? 'flex' : 'none',
					flex: !showControls && !showInspector ? '1 1 auto' : '0 1 auto',
				}}
			>
				<div className="component-container">
					<div ref={sizeWarningRef} className="card resize-warning-card"></div>
				</div>
			</div>
		</>
	);
}
