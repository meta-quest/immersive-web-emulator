/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
	CONTROLLER_STRINGS,
	DEVICE,
	HAND_STRINGS,
	OBJECT_NAME,
	SEMANTIC_LABELS,
} from '../js/constants';

import { EmulatorSettings } from '../js/emulatorStates';
import React from 'react';
import { changeRoomDimension } from '../js/messenger';

export default function Inspector({ device, inputMode }) {
	const sceneContainerRef = React.useRef();
	// plane setting refs
	const planeWidthRef = React.useRef();
	const planeHeightRef = React.useRef();
	const [planeVertical, setPlaneVertical] = React.useState(true);
	const planeSemanticLabelRef = React.useRef();
	// mesh setting refs
	const meshWidthRef = React.useRef();
	const meshHeightRef = React.useRef();
	const meshDepthRef = React.useRef();
	const meshSemanticLabelRef = React.useRef();

	const [showTransforms, setShowTransforms] = React.useState(true);
	const [showRoomSettings, setShowRoomSettings] = React.useState(false);
	const [showPlaneSettings, setShowPlaneSettings] = React.useState(false);
	const [showMeshSettings, setShowMeshSettings] = React.useState(false);
	const transformData = {};
	Object.values(DEVICE).forEach((deviceKey) => {
		const deviceName = OBJECT_NAME[deviceKey];
		transformData[deviceName] = React.useState({
			position: [0, 0, 0],
			rotation: [0, 0, 0],
		});
	});

	const [inputValues, setInputValues] = React.useState(
		Object.values(DEVICE).reduce((acc, deviceKey) => {
			const deviceName = OBJECT_NAME[deviceKey];
			for (let i = 0; i < 3; i++) {
				acc[`${deviceName}-position-${i}`] =
					transformData[deviceName][0].position[i];
				acc[`${deviceName}-rotation-${i}`] =
					transformData[deviceName][0].rotation[i];
			}
			return acc;
		}, {}),
	);

	function handleInputChange(key, event) {
		const value = parseFloat(event.target.value);
		if (!isNaN(value)) {
			const clampedValue = roundAndClamp(value);
			setInputValues((prevValues) => ({
				...prevValues,
				[key]: clampedValue,
			}));
			// Split the key into its components
			const [deviceName, type, index] = key.split('-');
			const deviceKey = Object.keys(OBJECT_NAME).find(
				(key) => OBJECT_NAME[key] === deviceName,
			);
			// Update the device transform
			if (deviceKey) {
				const position = [...transformData[deviceName][0].position];
				const rotation = [...transformData[deviceName][0].rotation];
				if (type === 'position') {
					position[index] = clampedValue;
				} else if (type === 'rotation') {
					rotation[index] = clampedValue;
				}
				device.setDeviceTransform(deviceKey, position, rotation);
			}
		}
	}

	function roundAndClamp(number) {
		const rounded = Math.round(number * 100) / 100;
		return Math.min(Math.max(rounded, -99.99), 99.99);
	}

	React.useEffect(() => {
		sceneContainerRef.current.appendChild(device.canvas);
		sceneContainerRef.current.appendChild(device.labels);
		device.on('pose', (event) => {
			const { deviceKey, position, rotation } = event;
			const deviceName = OBJECT_NAME[deviceKey];
			const transform = transformData[deviceName];
			const setTransform = transform[1];
			setTransform({ position, rotation });
			setInputValues((prevValues) => ({
				...prevValues,
				[`${deviceName}-position-0`]: roundAndClamp(position[0]),
				[`${deviceName}-position-1`]: roundAndClamp(position[1]),
				[`${deviceName}-position-2`]: roundAndClamp(position[2]),
				[`${deviceName}-rotation-0`]: roundAndClamp(rotation[0]),
				[`${deviceName}-rotation-1`]: roundAndClamp(rotation[1]),
				[`${deviceName}-rotation-2`]: roundAndClamp(rotation[2]),
			}));
		});
		device.forceEmitPose();
	}, []);
	return (
		<>
			<div ref={sceneContainerRef} id="scene-container"></div>
			<div id="transform-component">
				<button
					onClick={() => {
						setShowTransforms(!showTransforms);
						setShowRoomSettings(false);
						setShowPlaneSettings(false);
						setShowMeshSettings(false);
					}}
					className={showTransforms ? 'active' : ''}
				>
					device
				</button>
				<button
					onClick={() => {
						setShowRoomSettings(!showRoomSettings);
						setShowTransforms(false);
						setShowPlaneSettings(false);
						setShowMeshSettings(false);
					}}
					className={showRoomSettings ? 'active' : ''}
				>
					room
				</button>
				<button
					onClick={() => {
						setShowPlaneSettings(!showPlaneSettings);
						setShowRoomSettings(false);
						setShowTransforms(false);
						setShowMeshSettings(false);
					}}
					className={showPlaneSettings ? 'active' : ''}
				>
					plane
				</button>
				<button
					onClick={() => {
						setShowMeshSettings(!showMeshSettings);
						setShowRoomSettings(false);
						setShowTransforms(false);
						setShowPlaneSettings(false);
					}}
					className={showMeshSettings ? 'active' : ''}
				>
					mesh
				</button>
				{showTransforms &&
					Object.values(DEVICE).map((deviceKey) => {
						const deviceName = OBJECT_NAME[deviceKey];
						return (
							<div key={deviceKey} className="row transform-card">
								<button
									className="col-2 transform-icon d-flex justify-content-center align-items-center"
									onClick={() => {
										device.toggleControlMode(deviceKey);
									}}
								>
									<img
										src={`./assets/images/${
											deviceKey === DEVICE.HEADSET
												? OBJECT_NAME[deviceKey]
												: inputMode === 'hands'
												? HAND_STRINGS[deviceKey].name
												: CONTROLLER_STRINGS[deviceKey].name
										}.png`}
										className="control-icon"
									/>
								</button>
								<div className="col-10 transform-body">
									{['position', 'rotation'].map((type) => (
										<div className="row" key={`${deviceName}-${type}`}>
											<div className="value">
												{[0, 1, 2].map((i) => (
													<input
														key={`${deviceName}-${type}-${i}`}
														type="number"
														value={inputValues[`${deviceName}-${type}-${i}`]}
														onChange={(event) =>
															handleInputChange(
																`${deviceName}-${type}-${i}`,
																event,
															)
														}
													/>
												))}
											</div>
										</div>
									))}
								</div>
							</div>
						);
					})}{' '}
				{showRoomSettings && (
					<div className="row transform-card" id="room-dimension-settings">
						<div className="col-2 transform-icon d-flex justify-content-center align-items-center">
							<img
								src="./assets/images/roomscale.png"
								className="control-icon"
							/>
						</div>
						<div className="col-10 transform-body">
							{[
								['x', 'width'],
								['y', 'height'],
								['z', 'depth'],
							].map(([key, name]) => (
								<div key={name + key} className="row">
									<span>Space {name}:</span>
									<input
										type="number"
										defaultValue={EmulatorSettings.instance.roomDimension[key]}
										onChange={(event) => {
											EmulatorSettings.instance.roomDimension[key] = parseFloat(
												event.target.value,
											);
											EmulatorSettings.instance.write();
											device.updateRoom();
											changeRoomDimension();
										}}
									/>
								</div>
							))}
						</div>
					</div>
				)}
				{showPlaneSettings && (
					<div className="mesh-menu">
						<div>
							<input
								ref={planeWidthRef}
								type="number"
								placeholder="width"
								min={0}
							/>
							<input
								ref={planeHeightRef}
								type="number"
								placeholder="height"
								min={0}
							/>
							<button
								onClick={() => {
									setPlaneVertical(!planeVertical);
								}}
							>
								<img
									src={`./assets/images/${
										planeVertical ? 'vertical' : 'horizontal'
									}.png`}
									style={{ width: '1.5em', height: '1.5em' }}
								/>
							</button>
						</div>
						<div>
							<select ref={planeSemanticLabelRef}>
								{Object.values(SEMANTIC_LABELS).map((semanticLabel) => (
									<option key={semanticLabel} value={semanticLabel}>
										{semanticLabel}
									</option>
								))}
							</select>
							<button
								onClick={() => {
									device.addPlane(
										Number(planeWidthRef.current.value),
										Number(planeHeightRef.current.value),
										Number(planeVertical),
										planeSemanticLabelRef.current.value,
									);
								}}
							>
								create
							</button>
						</div>
						<div>
							<button
								onClick={() => {
									device.deleteSelectedObject();
								}}
								style={{ width: `${124}px` }}
							>
								delete selected
							</button>
						</div>
						<div>
							<button
								onClick={() => {
									device.toggleSelectedObjectVisibility();
								}}
								style={{ width: `${124}px` }}
							>
								show/hide selected
							</button>
						</div>
					</div>
				)}
				{showMeshSettings && (
					<div className="mesh-menu">
						<div>
							<input
								ref={meshWidthRef}
								type="number"
								placeholder="width"
								min={0}
							/>
							<input
								ref={meshHeightRef}
								type="number"
								placeholder="height"
								min={0}
							/>
							<input
								ref={meshDepthRef}
								type="number"
								placeholder="depth"
								min={0}
							/>
						</div>
						<div>
							<select ref={meshSemanticLabelRef}>
								{Object.values(SEMANTIC_LABELS).map((semanticLabel) => (
									<option key={semanticLabel} value={semanticLabel}>
										{semanticLabel}
									</option>
								))}
							</select>
							<button
								onClick={() => {
									device.addMesh(
										Number(meshWidthRef.current.value),
										Number(meshHeightRef.current.value),
										Number(meshDepthRef.current.value),
										meshSemanticLabelRef.current.value,
									);
								}}
							>
								create
							</button>
						</div>
						<div>
							<button
								onClick={() => {
									device.deleteSelectedObject();
								}}
								style={{ width: `${124}px` }}
							>
								delete selected
							</button>
						</div>
						<div>
							<button
								onClick={() => {
									device.toggleSelectedObjectVisibility();
								}}
								style={{ width: `${124}px` }}
							>
								show/hide selected
							</button>
						</div>
					</div>
				)}
			</div>
		</>
	);
}
