const DEVICE = {
  HEADSET: "0",
  RIGHT_CONTROLLER: "2",
  LEFT_CONTROLLER: "3",
};

const ASSET_PATH = {};
ASSET_PATH[DEVICE.HEADSET] = "../../assets/headset.glb";
ASSET_PATH[DEVICE.LEFT_CONTROLLER] = "../../assets/controller-left.glb";
ASSET_PATH[DEVICE.RIGHT_CONTROLLER] = "../../assets/controller-right.glb";

const OBJECT_NAME = {};
OBJECT_NAME[DEVICE.HEADSET] = "headset";
OBJECT_NAME[DEVICE.LEFT_CONTROLLER] = "left-controller";
OBJECT_NAME[DEVICE.RIGHT_CONTROLLER] = "right-controller";

const transformControls = {};
transformControls[DEVICE.HEADSET] = null;
transformControls[DEVICE.RIGHT_CONTROLLER] = null;
transformControls[DEVICE.LEFT_CONTROLLER] = null;

const assetNodes = {};
assetNodes[DEVICE.HEADSET] = null;
assetNodes[DEVICE.RIGHT_CONTROLLER] = null;
assetNodes[DEVICE.LEFT_CONTROLLER] = null;

const defaultTransforms = {};
defaultTransforms[DEVICE.HEADSET] = {
  position: new THREE.Vector3(0, 1.7, 0),
  rotation: new THREE.Euler(0, 0, 0),
};
defaultTransforms[DEVICE.RIGHT_CONTROLLER] = {
  position: new THREE.Vector3(0.25, 1.5, -0.4),
  rotation: new THREE.Euler(0, 0, 0),
};
defaultTransforms[DEVICE.LEFT_CONTROLLER] = {
  position: new THREE.Vector3(-0.25, 1.5, -0.4),
  rotation: new THREE.Euler(0, 0, 0),
};

// initialize Three.js objects

// renderer

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(1, 1);
renderer.domElement.style.position = "absolute";
// renderer.domElement.style.borderRadius =
//   " 0px 0px 20px 20px / 0px 0px 10px 10px";
renderer.domElement.style.paddingLeft = "13px";
document.getElementById("renderComponent").appendChild(renderer.domElement);

// Canvas size relying on browser's flexbox
// then waiting for the flex box determines the size.
const onResize = () => {
  const div = document.getElementById("renderComponent");
  renderer.setSize(1, 1);
  // Not sure if 1ms is long enough but seems working fine for now.
  setTimeout(() => {
    const width = div.offsetWidth;
    const height = div.offsetHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width - 5, height);
    render();
  }, 50);
};

// scene, camera, light, grid

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x505050);

const camera = new THREE.PerspectiveCamera(45, 1 / 1, 0.1, 100);
camera.position.set(-1.5, 2, 2);
camera.lookAt(new THREE.Vector3(0, 2, 0));

const render = () => {
  renderer.render(scene, camera);
};

const light1 = new THREE.DirectionalLight(0xffffff, 1);
light1.position.set(-1, 1, -1);
scene.add(light1);

const light2 = new THREE.DirectionalLight(0xffffff, 1);
light2.position.set(1, 1, 1);
scene.add(light2);

const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);

// orbit controls for camera

const orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
orbitControls.addEventListener("change", render);
orbitControls.target.set(0, 2, 0);
orbitControls.update(); // seems like this line is necessary if I set non-zero as target

// transform controls for device assets

const createTransformControls = (target, onChange) => {
  const controls = new THREE.TransformControls(camera, renderer.domElement);
  controls.setSpace("local");
  controls.attach(target);
  controls.enabled = false;
  controls.visible = false;

  controls.addEventListener(
    "mouseDown",
    () => {
      orbitControls.enabled = false;
    },
    false
  );

  controls.addEventListener(
    "mouseUp",
    () => {
      orbitControls.enabled = true;
    },
    false
  );

  controls.addEventListener(
    "change",
    () => {
      onChange();
      render();
    },
    false
  );

  return controls;
};

const updateVec3Display = (elementId, vec3, checkpointVec3) => {
  const generateSign = (number) => {
    return number >= 0 ? "\xa0" : "";
  };
  const checkDiff = (element, value, checkpointValue) => {
    // const diff = checkpointValue != null && value != checkpointValue;
    element.innerHTML = generateSign(value) + value.toFixed(2);
    // element.classList.toggle("value-changed", diff);
  };
  let container = document.getElementById(elementId);
  if (container) {
    checkDiff(
      container.getElementsByClassName("x-value")[0],
      vec3.x,
      checkpointVec3?.x
    );
    checkDiff(
      container.getElementsByClassName("y-value")[0],
      vec3.y,
      checkpointVec3?.y
    );
    checkDiff(
      container.getElementsByClassName("z-value")[0],
      vec3.z,
      checkpointVec3?.z
    );
  }
};

const checkTransformDiff = (device) => {
  const assetNode = assetNodes[device];
  if (!assetNode) return false;
  const deviceName = OBJECT_NAME[device];
  const checkpoint = states.transformCheckpoint[device];
  const position = assetNode.position;
  const rotation = assetNode.rotation;
  let diffExists = false;
  const checkDiff = (attribute, axis, value) => {
    const container = document.getElementById(deviceName + "-" + attribute);
    const element = container.getElementsByClassName(axis + "-value")[0];
    const checkpointValue = checkpoint[attribute][axis];

    const diff = checkpointValue != null && value != checkpointValue;
    element.classList.toggle("value-changed", diff);
    diffExists = diffExists || diff;
  };
  checkDiff("position", "x", position.x);
  checkDiff("position", "y", position.y);
  checkDiff("position", "z", position.z);
  checkDiff("rotation", "x", rotation.x);
  checkDiff("rotation", "y", rotation.y);
  checkDiff("rotation", "z", rotation.z);
  return diffExists;
};

const createTransformCheckpoint = (device, reset = false) => {
  const assetNode = reset ? defaultTransforms[device] : assetNodes[device];
  states.transformCheckpoint[device] = {
    position: {
      x: assetNode.position.x,
      y: assetNode.position.y,
      z: assetNode.position.z,
    },
    rotation: {
      x: assetNode.rotation.x,
      y: assetNode.rotation.y,
      z: assetNode.rotation.z,
    },
  };
};

const checkAllTransformDiff = () => {
  let diff = {};
  diff[DEVICE.HEADSET] = checkTransformDiff(DEVICE.HEADSET);
  diff[DEVICE.LEFT_CONTROLLER] = checkTransformDiff(DEVICE.LEFT_CONTROLLER);
  diff[DEVICE.RIGHT_CONTROLLER] = checkTransformDiff(DEVICE.RIGHT_CONTROLLER);
  return (
    diff[DEVICE.HEADSET] ||
    diff[DEVICE.LEFT_CONTROLLER] ||
    diff[DEVICE.RIGHT_CONTROLLER]
  );
};

const updateDeviceTransformData = (device) => {
  const assetNode = assetNodes[device];
  if (!assetNode) return;
  const deviceName = OBJECT_NAME[device];
  const checkpoint = states.transformCheckpoint[device];
  updateVec3Display(
    deviceName + "-position",
    assetNode.position,
    checkpoint?.position
  );
  updateVec3Display(
    deviceName + "-rotation",
    assetNode.rotation,
    checkpoint?.rotation
  );
};

const loadDeviceAsset = (device) => {
  new THREE.GLTFLoader().load(ASSET_PATH[device], (gltf) => {
    const headset = gltf.scene;
    const parent = new THREE.Object3D();
    parent.scale.setScalar(2);
    parent.position.copy(defaultTransforms[device].position);
    parent.rotation.copy(defaultTransforms[device].rotation);
    headset.rotation.y = -Math.PI;

    scene.add(parent.add(headset));
    assetNodes[device] = parent;

    const onChange = () => {
      updateDeviceTransformData(device);
      notifyInputPoseChange(device, parent);
      updateButtonStates();
    };

    const controls = createTransformControls(parent, () => {});
    scene.add(controls);
    transformControls[device] = controls;

    createTransformCheckpoint(device, true);
    onChange();
    render();
  });
};

// Raycasting for transform controls enable/disable

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mousedownTime = null;
let intersectKey = null;
const thresholdTime = 300;

const raycast = (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  // left-top (0, 0), right-bottom (1, 1)
  const point = {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
  };
  mouse.set(point.x * 2 - 1, -(point.y * 2) + 1);
  raycaster.setFromCamera(mouse, camera);
  const targetObjects = [];
  for (const key in assetNodes) {
    const node = assetNodes[key];
    if (node) {
      targetObjects.push(node);
    }
  }
  return raycaster.intersectObjects(targetObjects, true);
};

const getNearestIntersectedObjectKey = (event) => {
  // @TODO: Optimize
  const intersects = raycast(event);
  if (intersects.length === 0) {
    return null;
  }
  const intersect = intersects[0];
  let target = null;
  const check = (object) => {
    for (const key in assetNodes) {
      const node = assetNodes[key];
      if (!node) {
        continue;
      }
      if (object === node) {
        target = key;
      }
    }
  };
  check(intersect.object);
  intersect.object.traverseAncestors(check);
  return target;
};

document.addEventListener("keypress", (e) => {
  switch (e.key) {
    case "1":
      toggleControlMode(DEVICE.HEADSET);
      break;
    case "2":
      toggleControlMode(DEVICE.LEFT_CONTROLLER);
      break;
    case "3":
      toggleControlMode(DEVICE.RIGHT_CONTROLLER);
      break;
    default:
      break;
  }
});

renderer.domElement.addEventListener(
  "mousedown",
  (event) => {
    intersectKey = getNearestIntersectedObjectKey(event);
    mousedownTime = performance.now();
  },
  false
);

renderer.domElement.addEventListener(
  "mouseup",
  (event) => {
    if (intersectKey === null) {
      return;
    }
    const currentTime = performance.now();
    if (currentTime - mousedownTime < thresholdTime) {
      toggleControlMode(intersectKey);
      // We add event listener to transformControls mouseUp event to set orbitControls.enabled true.
      // But if disabling transformControls, its mouseUp event won't be fired.
      // Then setting orbitControls.enabled true here as workaround.
      orbitControls.enabled = true;
    }
  },
  false
);

// event handlers

window.addEventListener("resize", onResize, false);

const toggleControlMode = (key) => {
  const controls = transformControls[key];
  if (!controls) {
    return;
  }
  // Translate -> Rotate -> Disable -> Translate -> ...
  if (!controls.enabled) {
    controls.enabled = true;
    controls.visible = true;
    controls.setMode("translate");
  } else if (controls.getMode() === "translate") {
    controls.setMode("rotate");
  } else {
    controls.enabled = false;
    controls.visible = false;
  }
  render();
};

const resetDevicePose = () => {
  for (const key in assetNodes) {
    const device = assetNodes[key];

    let defaultTransformKey = key;
    device.position.copy(defaultTransforms[defaultTransformKey].position);
    device.rotation.copy(defaultTransforms[defaultTransformKey].rotation);
  }
  updateDeviceTransformData(DEVICE.HEADSET);
  updateDeviceTransformData(DEVICE.LEFT_CONTROLLER);
  updateDeviceTransformData(DEVICE.RIGHT_CONTROLLER);
  notifyPoses();
  render();
};

$("#transform-component").load(
  "transform-component.html",
  () => {
    loadDeviceAsset(DEVICE.HEADSET);
    loadDeviceAsset(DEVICE.RIGHT_CONTROLLER);
    loadDeviceAsset(DEVICE.LEFT_CONTROLLER);

    setInterval(() => {
      [DEVICE.HEADSET, DEVICE.LEFT_CONTROLLER, DEVICE.RIGHT_CONTROLLER].forEach(
        (deviceId) => {
          updateDeviceTransformData(deviceId);
          if (assetNodes[deviceId]) {
            notifyInputPoseChange(deviceId, assetNodes[deviceId]);
          }
        }
      );
      updateButtonStates();
      render();
    });
  },
  100
);
