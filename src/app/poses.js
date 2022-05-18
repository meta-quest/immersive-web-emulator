const poses = {};

const serializeAllDeviceTransform = () => {
  let devicesData = {};
  for (const key in assetNodes) {
    const device = assetNodes[key];
    if (!device) continue;
    devicesData[key] = {
      position: device.position.toArray(),
      rotation: device.rotation.toArray(),
    };
  }
  return JSON.stringify(devicesData);
};

const deserializeAllDeviceTransform = (poseString) => {
  let devicesData = JSON.parse(poseString);
  for (const key in assetNodes) {
    const device = assetNodes[key];
    if (!device) continue;
    device.position.fromArray(devicesData[key].position);
    device.rotation.fromArray(devicesData[key].rotation);

    devicesData[key] = {
      position: device.position.toArray(),
      rotation: device.rotation.toArray(),
    };
  }
  updateDeviceTransformData(DEVICE.HEADSET);
  updateDeviceTransformData(DEVICE.RIGHT_CONTROLLER);
  updateDeviceTransformData(DEVICE.LEFT_CONTROLLER);
  createTransformCheckpoint(DEVICE.HEADSET);
  createTransformCheckpoint(DEVICE.RIGHT_CONTROLLER);
  createTransformCheckpoint(DEVICE.LEFT_CONTROLLER);
  notifyPoses();
  render();
};

const addPose = () => {
  let i = 1;
  while (true) {
    const key = "Pose " + i;
    if (!poses[key]) {
      poses[key] = serializeAllDeviceTransform();
      return key;
    }
    i++;
  }
};

const deletePose = (key) => {
  delete poses[key];
  createTransformCheckpoint(DEVICE.HEADSET, true);
  createTransformCheckpoint(DEVICE.LEFT_CONTROLLER, true);
  createTransformCheckpoint(DEVICE.RIGHT_CONTROLLER, true);
};

const overwritePose = (key) => {
  poses[key] = serializeAllDeviceTransform();
};

const loadPose = (key) => {
  if (!poses[key]) return;
  if (key == "default") {
    resetDevicePose();
    createTransformCheckpoint(DEVICE.HEADSET, true);
    createTransformCheckpoint(DEVICE.LEFT_CONTROLLER, true);
    createTransformCheckpoint(DEVICE.RIGHT_CONTROLLER, true);
  } else {
    deserializeAllDeviceTransform(poses[key]);
  }
  checkAllTransformDiff();
};

const refreshPoseSelect = () => {
  const poseSelect = document.getElementById("pose-select");
  poseSelect.innerHTML = "";
  const option = document.createElement("option");
  option.text = "Default Pose";
  option.value = "default";
  poseSelect.add(option);
  for (const key in poses) {
    const option = document.createElement("option");
    option.value = key;
    option.text = key;
    poseSelect.add(option);
  }
};

const updateButtonStates = () => {
  const poseSelect = document.getElementById("pose-select");
  const poseDelete = document.getElementById("pose-delete");
  const poseRevert = document.getElementById("pose-revert");
  const poseApply = document.getElementById("pose-apply");
  if (!(poseSelect && poseDelete && poseRevert && poseApply)) return;

  const noPose = Object.entries(poses).length == 0;
  const onDefault = poseSelect.value == "default";
  const diffExists = checkAllTransformDiff();

  poseSelect.disabled = noPose;
  poseDelete.disabled = onDefault;
  poseRevert.disabled = !diffExists;
  poseApply.disabled = !(diffExists & !onDefault);
};

const setupPoseButtons = () => {
  const poseSelect = document.getElementById("pose-select");
  const poseDelete = document.getElementById("pose-delete");
  const poseReset = document.getElementById("pose-reset");
  const poseRevert = document.getElementById("pose-revert");
  const poseApply = document.getElementById("pose-apply");
  const poseSave = document.getElementById("pose-save");

  poseSelect.addEventListener("change", function () {
    loadPose(poseSelect.value);
    updateButtonStates();
  });

  poseDelete.addEventListener("click", function () {
    deletePose(poseSelect.value);
    refreshPoseSelect();
    updateButtonStates();
  });

  poseRevert.addEventListener("click", function () {
    loadPose(poseSelect.value);
    updateButtonStates();
  });

  const saveCopy = () => {
    const key = addPose(poseSelect.value);
    refreshPoseSelect();
    poseSelect.value = key;
    loadPose(key);
  };

  poseApply.addEventListener("click", function () {
    const noPose = Object.entries(poses).length == 0;
    if (noPose) {
      saveCopy();
    } else {
      const key = poseSelect.value;
      overwritePose(key);
      refreshPoseSelect();
      poseSelect.value = key;
      loadPose(key);
    }
    updateButtonStates();
  });

  poseSave.addEventListener("click", function () {
    saveCopy();
    updateButtonStates();
  });

  poseReset.addEventListener("click", function () {
    resetDevicePose();
    updateButtonStates();
  });
};

$("#pose-component").load("pose-component.html", () => {
  refreshPoseSelect();
  setupPoseButtons();
});
