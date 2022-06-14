export default class ARScene {
  constructor(deviceSize) {}

  inject(div) {}

  eject() {}

  setCanvas(canvas) {}

  releaseCanvas() {}

  // Raycasting for AR hit testing API
  getHitTestResults(origin, direction) {
    return [];
  }

  loadVirtualRoomAsset(buffer) {}

  updateCameraTransform(positionArray, quaternionArray) {}

  updateTabletTransform(positionArray, quaternionArray) {}

  updatePointerTransform(positionArray, quaternionArray) {}

  touched() {}

  released() {}
}
