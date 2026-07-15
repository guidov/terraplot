var Fn = (e) => {
  throw TypeError(e);
};
var Ze = (e, t, n) => t.has(e) || Fn("Cannot " + n);
var I = (e, t, n) => (Ze(e, t, "read from private field"), n ? n.call(e) : t.get(e)), St = (e, t, n) => t.has(e) ? Fn("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), Pt = (e, t, n, i) => (Ze(e, t, "write to private field"), i ? i.call(e, n) : t.set(e, n), n), zt = (e, t, n) => (Ze(e, t, "access private method"), n);
import * as z from "three";
import { Controls as or, Vector3 as yt, MOUSE as At, TOUCH as Dt, Quaternion as vn, Spherical as Nn, Vector2 as ut, Ray as sr, Plane as cr, MathUtils as lr } from "three";
const Pn = { type: "change" }, wn = { type: "start" }, wi = { type: "end" }, ce = new sr(), jn = new cr(), fr = Math.cos(70 * lr.DEG2RAD), B = new yt(), rt = 2 * Math.PI, W = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6
}, Oe = 1e-6;
class hr extends or {
  /**
   * Constructs a new controls instance.
   *
   * @param {Object3D} object - The object that is managed by the controls.
   * @param {?HTMLElement} domElement - The HTML element used for event listeners.
   */
  constructor(t, n = null) {
    super(t, n), this.state = W.NONE, this.target = new yt(), this.cursor = new yt(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.keyRotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: At.ROTATE, MIDDLE: At.DOLLY, RIGHT: At.PAN }, this.touches = { ONE: Dt.ROTATE, TWO: Dt.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._cursorStyle = "auto", this._domElementKeyEvents = null, this._lastPosition = new yt(), this._lastQuaternion = new vn(), this._lastTargetPosition = new yt(), this._quat = new vn().setFromUnitVectors(t.up, new yt(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new Nn(), this._sphericalDelta = new Nn(), this._scale = 1, this._panOffset = new yt(), this._rotateStart = new ut(), this._rotateEnd = new ut(), this._rotateDelta = new ut(), this._panStart = new ut(), this._panEnd = new ut(), this._panDelta = new ut(), this._dollyStart = new ut(), this._dollyEnd = new ut(), this._dollyDelta = new ut(), this._dollyDirection = new yt(), this._mouse = new ut(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = dr.bind(this), this._onPointerDown = ur.bind(this), this._onPointerUp = pr.bind(this), this._onContextMenu = wr.bind(this), this._onMouseWheel = gr.bind(this), this._onKeyDown = yr.bind(this), this._onTouchStart = Er.bind(this), this._onTouchMove = xr.bind(this), this._onMouseDown = br.bind(this), this._onMouseMove = mr.bind(this), this._interceptControlDown = Gr.bind(this), this._interceptControlUp = Sr.bind(this), this.domElement !== null && this.connect(this.domElement), this.update();
  }
  /**
   * Defines the visual representation of the cursor.
   *
   * @type {('auto'|'grab')}
   * @default 'auto'
   */
  set cursorStyle(t) {
    this._cursorStyle = t, t === "grab" ? this.domElement.style.cursor = "grab" : this.domElement.style.cursor = "auto";
  }
  get cursorStyle() {
    return this._cursorStyle;
  }
  connect(t) {
    super.connect(t), this.domElement.addEventListener("pointerdown", this._onPointerDown), this.domElement.addEventListener("pointercancel", this._onPointerUp), this.domElement.addEventListener("contextmenu", this._onContextMenu), this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: !1 }), this.domElement.getRootNode().addEventListener("keydown", this._interceptControlDown, { passive: !0, capture: !0 }), this.domElement.style.touchAction = "none";
  }
  disconnect() {
    this.domElement.removeEventListener("pointerdown", this._onPointerDown), this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp), this.domElement.removeEventListener("pointercancel", this._onPointerUp), this.domElement.removeEventListener("wheel", this._onMouseWheel), this.domElement.removeEventListener("contextmenu", this._onContextMenu), this.stopListenToKeyEvents(), this.domElement.getRootNode().removeEventListener("keydown", this._interceptControlDown, { capture: !0 }), this.domElement.style.touchAction = "";
  }
  dispose() {
    this.disconnect();
  }
  /**
   * Get the current vertical rotation, in radians.
   *
   * @return {number} The current vertical rotation, in radians.
   */
  getPolarAngle() {
    return this._spherical.phi;
  }
  /**
   * Get the current horizontal rotation, in radians.
   *
   * @return {number} The current horizontal rotation, in radians.
   */
  getAzimuthalAngle() {
    return this._spherical.theta;
  }
  /**
   * Returns the distance from the camera to the target.
   *
   * @return {number} The distance from the camera to the target.
   */
  getDistance() {
    return this.object.position.distanceTo(this.target);
  }
  /**
   * Adds key event listeners to the given DOM element.
   * `window` is a recommended argument for using this method.
   *
   * @param {HTMLElement} domElement - The DOM element
   */
  listenToKeyEvents(t) {
    t.addEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = t;
  }
  /**
   * Removes the key event listener previously defined with `listenToKeyEvents()`.
   */
  stopListenToKeyEvents() {
    this._domElementKeyEvents !== null && (this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = null);
  }
  /**
   * Save the current state of the controls. This can later be recovered with `reset()`.
   */
  saveState() {
    this.target0.copy(this.target), this.position0.copy(this.object.position), this.zoom0 = this.object.zoom;
  }
  /**
   * Reset the controls to their state from either the last time the `saveState()`
   * was called, or the initial state.
   */
  reset() {
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(Pn), this.update(), this.state = W.NONE;
  }
  /**
   * Programmatically pan the camera.
   *
   * @param {number} deltaX - The horizontal pan amount in pixels.
   * @param {number} deltaY - The vertical pan amount in pixels.
   */
  pan(t, n) {
    this._pan(t, n), this.update();
  }
  /**
   * Programmatically dolly in (zoom in for perspective camera).
   *
   * @param {number} dollyScale - The dolly scale factor.
   */
  dollyIn(t) {
    this._dollyIn(t), this.update();
  }
  /**
   * Programmatically dolly out (zoom out for perspective camera).
   *
   * @param {number} dollyScale - The dolly scale factor.
   */
  dollyOut(t) {
    this._dollyOut(t), this.update();
  }
  /**
   * Programmatically rotate the camera left (around the vertical axis).
   *
   * @param {number} angle - The rotation angle in radians.
   */
  rotateLeft(t) {
    this._rotateLeft(t), this.update();
  }
  /**
   * Programmatically rotate the camera up (around the horizontal axis).
   *
   * @param {number} angle - The rotation angle in radians.
   */
  rotateUp(t) {
    this._rotateUp(t), this.update();
  }
  update(t = null) {
    const n = this.object.position;
    B.copy(n).sub(this.target), B.applyQuaternion(this._quat), this._spherical.setFromVector3(B), this.autoRotate && this.state === W.NONE && this._rotateLeft(this._getAutoRotationAngle(t)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let i = this.minAzimuthAngle, r = this.maxAzimuthAngle;
    isFinite(i) && isFinite(r) && (i < -Math.PI ? i += rt : i > Math.PI && (i -= rt), r < -Math.PI ? r += rt : r > Math.PI && (r -= rt), i <= r ? this._spherical.theta = Math.max(i, Math.min(r, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (i + r) / 2 ? Math.max(i, this._spherical.theta) : Math.min(r, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
    let a = !1;
    if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera)
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    else {
      const o = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), a = o != this._spherical.radius;
    }
    if (B.setFromSpherical(this._spherical), B.applyQuaternion(this._quatInverse), n.copy(this.target).add(B), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
      let o = null;
      if (this.object.isPerspectiveCamera) {
        const s = B.length();
        o = this._clampDistance(s * this._scale);
        const h = s - o;
        this.object.position.addScaledVector(this._dollyDirection, h), this.object.updateMatrixWorld(), a = !!h;
      } else if (this.object.isOrthographicCamera) {
        const s = new yt(this._mouse.x, this._mouse.y, 0);
        s.unproject(this.object);
        const h = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), a = h !== this.object.zoom;
        const c = new yt(this._mouse.x, this._mouse.y, 0);
        c.unproject(this.object), this.object.position.sub(c).add(s), this.object.updateMatrixWorld(), o = B.length();
      } else
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      o !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position) : (ce.origin.copy(this.object.position), ce.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(ce.direction)) < fr ? this.object.lookAt(this.target) : (jn.setFromNormalAndCoplanarPoint(this.object.up, this.target), ce.intersectPlane(jn, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const o = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), o !== this.object.zoom && (this.object.updateProjectionMatrix(), a = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, a || this._lastPosition.distanceToSquared(this.object.position) > Oe || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > Oe || this._lastTargetPosition.distanceToSquared(this.target) > Oe ? (this.dispatchEvent(Pn), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
  }
  _getAutoRotationAngle(t) {
    return t !== null ? rt / 60 * this.autoRotateSpeed * t : rt / 60 / 60 * this.autoRotateSpeed;
  }
  _getZoomScale(t) {
    const n = Math.abs(t * 0.01);
    return Math.pow(0.95, this.zoomSpeed * n);
  }
  _rotateLeft(t) {
    this._sphericalDelta.theta -= t;
  }
  _rotateUp(t) {
    this._sphericalDelta.phi -= t;
  }
  _panLeft(t, n) {
    B.setFromMatrixColumn(n, 0), B.multiplyScalar(-t), this._panOffset.add(B);
  }
  _panUp(t, n) {
    this.screenSpacePanning === !0 ? B.setFromMatrixColumn(n, 1) : (B.setFromMatrixColumn(n, 0), B.crossVectors(this.object.up, B)), B.multiplyScalar(t), this._panOffset.add(B);
  }
  // deltaX and deltaY are in pixels; right and down are positive
  _pan(t, n) {
    const i = this.domElement;
    if (this.object.isPerspectiveCamera) {
      const r = this.object.position;
      B.copy(r).sub(this.target);
      let a = B.length();
      a *= Math.tan(this.object.fov / 2 * Math.PI / 180), this._panLeft(2 * t * a / i.clientHeight, this.object.matrix), this._panUp(2 * n * a / i.clientHeight, this.object.matrix);
    } else this.object.isOrthographicCamera ? (this._panLeft(t * (this.object.right - this.object.left) / this.object.zoom / i.clientWidth, this.object.matrix), this._panUp(n * (this.object.top - this.object.bottom) / this.object.zoom / i.clientHeight, this.object.matrix)) : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."), this.enablePan = !1);
  }
  _dollyOut(t) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale /= t : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  _dollyIn(t) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale *= t : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  _updateZoomParameters(t, n) {
    if (!this.zoomToCursor)
      return;
    this._performCursorZoom = !0;
    const i = this.domElement.getBoundingClientRect(), r = t - i.left, a = n - i.top, o = i.width, s = i.height;
    this._mouse.x = r / o * 2 - 1, this._mouse.y = -(a / s) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
  }
  _clampDistance(t) {
    return Math.max(this.minDistance, Math.min(this.maxDistance, t));
  }
  //
  // event callbacks - update the object state
  //
  _handleMouseDownRotate(t) {
    this._rotateStart.set(t.clientX, t.clientY);
  }
  _handleMouseDownDolly(t) {
    this._updateZoomParameters(t.clientX, t.clientX), this._dollyStart.set(t.clientX, t.clientY);
  }
  _handleMouseDownPan(t) {
    this._panStart.set(t.clientX, t.clientY);
  }
  _handleMouseMoveRotate(t) {
    this._rotateEnd.set(t.clientX, t.clientY), this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const n = this.domElement;
    this._rotateLeft(rt * this._rotateDelta.x / n.clientHeight), this._rotateUp(rt * this._rotateDelta.y / n.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
  }
  _handleMouseMoveDolly(t) {
    this._dollyEnd.set(t.clientX, t.clientY), this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart), this._dollyDelta.y > 0 ? this._dollyOut(this._getZoomScale(this._dollyDelta.y)) : this._dollyDelta.y < 0 && this._dollyIn(this._getZoomScale(this._dollyDelta.y)), this._dollyStart.copy(this._dollyEnd), this.update();
  }
  _handleMouseMovePan(t) {
    this._panEnd.set(t.clientX, t.clientY), this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd), this.update();
  }
  _handleMouseWheel(t) {
    this._updateZoomParameters(t.clientX, t.clientY), t.deltaY < 0 ? this._dollyIn(this._getZoomScale(t.deltaY)) : t.deltaY > 0 && this._dollyOut(this._getZoomScale(t.deltaY)), this.update();
  }
  _handleKeyDown(t) {
    let n = !1;
    switch (t.code) {
      case this.keys.UP:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(rt * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, this.keyPanSpeed), n = !0;
        break;
      case this.keys.BOTTOM:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(-rt * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, -this.keyPanSpeed), n = !0;
        break;
      case this.keys.LEFT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(rt * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(this.keyPanSpeed, 0), n = !0;
        break;
      case this.keys.RIGHT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(-rt * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(-this.keyPanSpeed, 0), n = !0;
        break;
    }
    n && (t.preventDefault(), this.update());
  }
  _handleTouchStartRotate(t) {
    if (this._pointers.length === 1)
      this._rotateStart.set(t.pageX, t.pageY);
    else {
      const n = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + n.x), r = 0.5 * (t.pageY + n.y);
      this._rotateStart.set(i, r);
    }
  }
  _handleTouchStartPan(t) {
    if (this._pointers.length === 1)
      this._panStart.set(t.pageX, t.pageY);
    else {
      const n = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + n.x), r = 0.5 * (t.pageY + n.y);
      this._panStart.set(i, r);
    }
  }
  _handleTouchStartDolly(t) {
    const n = this._getSecondPointerPosition(t), i = t.pageX - n.x, r = t.pageY - n.y, a = Math.sqrt(i * i + r * r);
    this._dollyStart.set(0, a);
  }
  _handleTouchStartDollyPan(t) {
    this.enableZoom && this._handleTouchStartDolly(t), this.enablePan && this._handleTouchStartPan(t);
  }
  _handleTouchStartDollyRotate(t) {
    this.enableZoom && this._handleTouchStartDolly(t), this.enableRotate && this._handleTouchStartRotate(t);
  }
  _handleTouchMoveRotate(t) {
    if (this._pointers.length == 1)
      this._rotateEnd.set(t.pageX, t.pageY);
    else {
      const i = this._getSecondPointerPosition(t), r = 0.5 * (t.pageX + i.x), a = 0.5 * (t.pageY + i.y);
      this._rotateEnd.set(r, a);
    }
    this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const n = this.domElement;
    this._rotateLeft(rt * this._rotateDelta.x / n.clientHeight), this._rotateUp(rt * this._rotateDelta.y / n.clientHeight), this._rotateStart.copy(this._rotateEnd);
  }
  _handleTouchMovePan(t) {
    if (this._pointers.length === 1)
      this._panEnd.set(t.pageX, t.pageY);
    else {
      const n = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + n.x), r = 0.5 * (t.pageY + n.y);
      this._panEnd.set(i, r);
    }
    this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd);
  }
  _handleTouchMoveDolly(t) {
    const n = this._getSecondPointerPosition(t), i = t.pageX - n.x, r = t.pageY - n.y, a = Math.sqrt(i * i + r * r);
    this._dollyEnd.set(0, a), this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed)), this._dollyOut(this._dollyDelta.y), this._dollyStart.copy(this._dollyEnd);
    const o = (t.pageX + n.x) * 0.5, s = (t.pageY + n.y) * 0.5;
    this._updateZoomParameters(o, s);
  }
  _handleTouchMoveDollyPan(t) {
    this.enableZoom && this._handleTouchMoveDolly(t), this.enablePan && this._handleTouchMovePan(t);
  }
  _handleTouchMoveDollyRotate(t) {
    this.enableZoom && this._handleTouchMoveDolly(t), this.enableRotate && this._handleTouchMoveRotate(t);
  }
  // pointers
  _addPointer(t) {
    this._pointers.push(t.pointerId);
  }
  _removePointer(t) {
    delete this._pointerPositions[t.pointerId];
    for (let n = 0; n < this._pointers.length; n++)
      if (this._pointers[n] == t.pointerId) {
        this._pointers.splice(n, 1);
        return;
      }
  }
  _isTrackingPointer(t) {
    for (let n = 0; n < this._pointers.length; n++)
      if (this._pointers[n] == t.pointerId) return !0;
    return !1;
  }
  _trackPointer(t) {
    let n = this._pointerPositions[t.pointerId];
    n === void 0 && (n = new ut(), this._pointerPositions[t.pointerId] = n), n.set(t.pageX, t.pageY);
  }
  _getSecondPointerPosition(t) {
    const n = t.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];
    return this._pointerPositions[n];
  }
  //
  _customWheelEvent(t) {
    const n = t.deltaMode, i = {
      clientX: t.clientX,
      clientY: t.clientY,
      deltaY: t.deltaY
    };
    switch (n) {
      case 1:
        i.deltaY *= 16;
        break;
      case 2:
        i.deltaY *= 100;
        break;
    }
    return t.ctrlKey && !this._controlActive && (i.deltaY *= 10), i;
  }
}
function ur(e) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(e.pointerId), this.domElement.ownerDocument.addEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(e) && (this._addPointer(e), e.pointerType === "touch" ? this._onTouchStart(e) : this._onMouseDown(e), this._cursorStyle === "grab" && (this.domElement.style.cursor = "grabbing")));
}
function dr(e) {
  this.enabled !== !1 && (e.pointerType === "touch" ? this._onTouchMove(e) : this._onMouseMove(e));
}
function pr(e) {
  switch (this._removePointer(e), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(e.pointerId), this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove), this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(wi), this.state = W.NONE, this._cursorStyle === "grab" && (this.domElement.style.cursor = "grab");
      break;
    case 1:
      const t = this._pointers[0], n = this._pointerPositions[t];
      this._onTouchStart({ pointerId: t, pageX: n.x, pageY: n.y });
      break;
  }
}
function br(e) {
  let t;
  switch (e.button) {
    case 0:
      t = this.mouseButtons.LEFT;
      break;
    case 1:
      t = this.mouseButtons.MIDDLE;
      break;
    case 2:
      t = this.mouseButtons.RIGHT;
      break;
    default:
      t = -1;
  }
  switch (t) {
    case At.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseDownDolly(e), this.state = W.DOLLY;
      break;
    case At.ROTATE:
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(e), this.state = W.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(e), this.state = W.ROTATE;
      }
      break;
    case At.PAN:
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(e), this.state = W.ROTATE;
      } else {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(e), this.state = W.PAN;
      }
      break;
    default:
      this.state = W.NONE;
  }
  this.state !== W.NONE && this.dispatchEvent(wn);
}
function mr(e) {
  switch (this.state) {
    case W.ROTATE:
      if (this.enableRotate === !1) return;
      this._handleMouseMoveRotate(e);
      break;
    case W.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseMoveDolly(e);
      break;
    case W.PAN:
      if (this.enablePan === !1) return;
      this._handleMouseMovePan(e);
      break;
  }
}
function gr(e) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== W.NONE || (e.preventDefault(), this.dispatchEvent(wn), this._handleMouseWheel(this._customWheelEvent(e)), this.dispatchEvent(wi));
}
function yr(e) {
  this.enabled !== !1 && this._handleKeyDown(e);
}
function Er(e) {
  switch (this._trackPointer(e), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case Dt.ROTATE:
          if (this.enableRotate === !1) return;
          this._handleTouchStartRotate(e), this.state = W.TOUCH_ROTATE;
          break;
        case Dt.PAN:
          if (this.enablePan === !1) return;
          this._handleTouchStartPan(e), this.state = W.TOUCH_PAN;
          break;
        default:
          this.state = W.NONE;
      }
      break;
    case 2:
      switch (this.touches.TWO) {
        case Dt.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(e), this.state = W.TOUCH_DOLLY_PAN;
          break;
        case Dt.DOLLY_ROTATE:
          if (this.enableZoom === !1 && this.enableRotate === !1) return;
          this._handleTouchStartDollyRotate(e), this.state = W.TOUCH_DOLLY_ROTATE;
          break;
        default:
          this.state = W.NONE;
      }
      break;
    default:
      this.state = W.NONE;
  }
  this.state !== W.NONE && this.dispatchEvent(wn);
}
function xr(e) {
  switch (this._trackPointer(e), this.state) {
    case W.TOUCH_ROTATE:
      if (this.enableRotate === !1) return;
      this._handleTouchMoveRotate(e), this.update();
      break;
    case W.TOUCH_PAN:
      if (this.enablePan === !1) return;
      this._handleTouchMovePan(e), this.update();
      break;
    case W.TOUCH_DOLLY_PAN:
      if (this.enableZoom === !1 && this.enablePan === !1) return;
      this._handleTouchMoveDollyPan(e), this.update();
      break;
    case W.TOUCH_DOLLY_ROTATE:
      if (this.enableZoom === !1 && this.enableRotate === !1) return;
      this._handleTouchMoveDollyRotate(e), this.update();
      break;
    default:
      this.state = W.NONE;
  }
}
function wr(e) {
  this.enabled !== !1 && e.preventDefault();
}
function Gr(e) {
  e.key === "Control" && (this._controlActive = !0, this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function Sr(e) {
  e.key === "Control" && (this._controlActive = !1, this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function R(e) {
  const t = atob(e), n = new Uint8Array(t.length);
  for (let i = 0; i < t.length; i++) n[i] = t.charCodeAt(i);
  return n;
}
function T(e) {
  return (t) => {
    const n = Math.max(0, Math.min(1, t)) * 255, i = Math.floor(n), r = n - i, a = Math.min(i + 1, 255);
    return [
      Math.round(e[i * 3] * (1 - r) + e[a * 3] * r),
      Math.round(e[i * 3 + 1] * (1 - r) + e[a * 3 + 1] * r),
      Math.round(e[i * 3 + 2] * (1 - r) + e[a * 3 + 2] * r)
    ];
  };
}
const De = {
  algae: T(R("1/nQ1vjO1PfN0/bL0vXK0fTIz/THzvPFzfLEzPHDyvDBye/AyO6+x+29xey7xOu6w+u5wuq3wOm2v+i0vuezveaxu+WwuuSvueStuOOstuKrteGptOCost+msd6lsN6kr92irdyhrNugq9qeqtqdqNmcp9iapteZpNaYo9WWotWVoNSUn9OSntKRndGQm9GPmtCNmc+Ml86Lls2Klc2Ik8yHksuGkcqFj8qDjsmCjMiBi8eAisd+iMZ9h8V8hcR7hMR6g8N5gcJ3gMF2fsF1fcB0e79zer5yeL5xd71vdbxudLttcrtscbprb7lqbrlpbLhoa7dnabZmZ7ZlZrVkZLRjYrRiYbNhX7JgXbJfW7FeWrBdWK9dVq9cVK5bUq1aUK1ZTqxZTKtYSqtXSKpXRqlWRKhVQqhVP6dUPaZUO6ZUOaVTN6RTNKNTMqNSMKJSLqFSLKBSKqBSKJ9RJp5RJJ1RIpxRIJxRHptRHJpRG5lRGZhRGJdQFpZQFZZQE5VQEpRQEJNQD5JQDpFQDZBPDI9PC49PCo5PCY1PCYxPCItOCIpOB4lOB4hOB4dNB4ZNB4ZNB4VNB4RNB4NMB4JMCIFMCIBLCH9LCX5LCX1LCnxKCnxKC3tKC3pJDHlJDHhJDXdIDXZIDnVIDnRHD3NHD3NHEHJGEHFGEXBFEW9FEm5FEm1EEmxEE2tDE2pDFGpDFGlCFGhCFWdBFWZBFWVAFmRAFmNAFmI/F2I/F2E+F2A+F189GF49GF08GFw8GFs7GFs7GVo6GVk6GVg5GVc5GVY4GVU4GVQ3GVQ3GlM2GlI1GlE1GlA0Gk80Gk4zGk0zGk0yGkwyGksxGkowGkkwGkgvGkcvGkcuGkYuGkUtGkQsGkMsGUIrGUErGUAqGUApGT8pGT4oGT0nGTwnGDsmGDsmGDolGDkkGDgkGDcjFzYiFzUiFzUhFzQgFzMgFjIfFjEeFjAeFi8dFS8cFS4cFS0bFCwaFCsaFCoZFCkYEykYEygXEycWEiYWEiUVEiQU")),
  algae_r: T(R("EiQUEiUVEiYWEycWEygXEykYFCkYFCoZFCsaFCwaFS0bFS4cFS8cFi8dFjAeFjEeFjIfFzMgFzQgFzUhFzUiFzYiGDcjGDgkGDkkGDolGDsmGDsmGTwnGT0nGT4oGT8pGUApGUAqGUErGUIrGkMsGkQsGkUtGkYuGkcuGkcvGkgvGkkwGkowGksxGkwyGk0yGk0zGk4zGk80GlA0GlE1GlI1GlM2GVQ3GVQ3GVU4GVY4GVc5GVg5GVk6GVo6GFs7GFs7GFw8GF08GF49F189F2A+F2E+F2I/FmI/FmNAFmRAFWVAFWZBFWdBFGhCFGlCFGpDE2pDE2tDEmxEEm1EEm5FEW9FEXBFEHFGEHJGD3NHD3NHDnRHDnVIDXZIDXdIDHhJDHlJC3pJC3tKCnxKCnxKCX1LCX5LCH9LCIBLCIFMB4JMB4NMB4RNB4VNB4ZNB4ZNB4dNB4hOB4lOCIpOCItOCYxPCY1PCo5PC49PDI9PDZBPDpFQD5JQEJNQEpRQE5VQFZZQFpZQGJdQGZhRG5lRHJpRHptRIJxRIpxRJJ1RJp5RKJ9RKqBSLKBSLqFSMKJSMqNSNKNTN6RTOaVTO6ZUPaZUP6dUQqhVRKhVRqlWSKpXSqtXTKtYTqxZUK1ZUq1aVK5bVq9cWK9dWrBdW7FeXbJfX7JgYbNhYrRiZLRjZrVkZ7ZlabZma7dnbLhobrlpb7lqcbprcrtsdLttdbxud71veL5xer5ye79zfcB0fsF1gMF2gcJ3g8N5hMR6hcR7h8V8iMZ9isd+i8eAjMiBjsmCj8qDkcqFksuGk8yHlc2Ils2Kl86Lmc+MmtCNm9GPndGQntKRn9OSoNSUotWVo9WWpNaYpteZp9iaqNmcqtqdq9qerNugrdyhr92isN6ksd6lst+mtOCoteGptuKruOOsueStuuSvu+Wwveaxvuezv+i0wOm2wuq3w+u5xOu6xey7x+29yO6+ye/AyvDBzPHDzfLEzvPFz/TH0fTI0vXK0/bL1PfN1vjO1/nQ")),
  amp: T(R("8e3s8ezr8Ovp7+no7+jn7ufl7ubk7eXj7ePh7OLg7OHe6+Dd69/c6t3a6tzZ6dvX6drW6dnU6NjT6NbS59XQ59TP5tPN5tLM5tHK5c/J5c7I5M3G5MzF5MvD48nC48jA4se/4sa94sW84cS74cO54cG44MC24L+1376z372y37yw3rqv3rmu3ris3ber3bap3bWo3LSm3LKl3LGj27Ci26+h266f2q2e2qyc2aqb2amZ2aiY2KeW2KaV2KWU16SS16KR16GP1qCO1p+M1p6L1Z2J1ZyI1ZqH1JmF1JiE1JeC05aB05V/05R+0pJ90pF70pB60Y940Y530Y120Ix00Itz0Ilxz4hwz4dvz4ZtzoVszoRqzYNpzYFozYBmzH9lzH5kzH1iy3xhy3pgy3leynhdyndbyXZayXVZyXRXyHJWyHFVyHBUx29Sx25Rxm1QxmtOxmpNxWlMxWhKxWdJxGVIxGRHw2NGw2JEw2FDwl9Cwl5BwV0/wVw+wFs9wFk8wFg7v1c6v1Y5vlQ4vlM2vVI1vVE0vU8zvE4yvE0xu0wwu0owukkvukguuUYtuUUsuEQruEIrt0Eqt0Aptj8ptT0otTwntDsntDkmszgmsjcmsjUlsTQlsDMlsDElrzAkri8kri0krSwkrCskqyokqigkqickqSYkqCUkpyQkpiIlpSElpCAlox8loh4loR0loBwmnxsmnhomnRkmnBgnmxcnmhYnmRUnmBUnlxQolRMolBMokxIokhEokREpkBApjhApjRApjA8piw8piQ8piA8phw4phQ4phA4pgw4pgQ4pgA4pfw4pfQ4pfA4pew4peQ4peA4odw4odQ4odA4ocw4ncQ4ncA4nbw4mbQ4mbA8maw8laQ8laA8lZw8kZQ8kZA4jYw4jYQ4iYA4iXw4hXQ4hXA4hWw4gWg4fWA4fVw4eVg4eVA0dUw0dUg0cUQ0cTw0bTg0aTQwaSwwZSgwZSQwYSAsXRgsXRQsWRAsWQwoVQQoUQAoUPwoTPQkSPAkS")),
  amp_r: T(R("PAkSPQkSPwoTQAoUQQoUQwoVRAsWRQsWRgsXSAsXSQwYSgwZSwwZTQwaTg0aTw0bUQ0cUg0cUw0dVA0dVg4eVw4eWA4fWg4fWw4gXA4hXQ4hXw4hYA4iYQ4iYw4jZA4jZQ8kZw8kaA8laQ8law8lbA8mbQ4mbw4mcA4ncQ4ncw4ndA4odQ4odw4oeA4oeQ4pew4pfA4pfQ4pfw4pgA4pgQ4pgw4phA4phQ4phw4piA8piQ8piw8pjA8pjRApjhApkBApkREpkhEokxIolBMolRMolxQomBUnmRUnmhYnmxcnnBgnnRkmnhomnxsmoBwmoR0loh4lox8lpCAlpSElpiIlpyQkqCUkqSYkqickqigkqyokrCskrSwkri0kri8krzAksDElsDMlsTQlsjUlsjcmszgmtDkmtDsntTwntT0otj8pt0Apt0EquEIruEQruUUsuUYtukguukkvu0owu0wwvE0xvE4yvU8zvVE0vVI1vlM2vlQ4v1Y5v1c6wFg7wFk8wFs9wVw+wV0/wl5Bwl9Cw2FDw2JEw2NGxGRHxGVIxWdJxWhKxWlMxmpNxmtOxm1Qx25Rx29SyHBUyHFVyHJWyXRXyXVZyXZayndbynhdy3ley3pgy3xhzH1izH5kzH9lzYBmzYFozYNpzoRqzoVsz4Ztz4dvz4hw0Ilx0Itz0Ix00Y120Y530Y940pB60pF70pJ905R+05V/05aB1JeC1JiE1JmF1ZqH1ZyI1Z2J1p6L1p+M1qCO16GP16KR16SS2KWU2KaV2KeW2aiY2amZ2aqb2qyc2q2e266f26+h27Ci3LGj3LKl3LSm3bWo3bap3ber3ris3rmu3rqv37yw372y376z4L+14MC24cG44cO54cS74sW84sa94se/48jA48nC5MvD5MzF5M3G5c7I5c/J5tHK5tLM5tPN59TP59XQ6NbS6NjT6dnU6drW6dvX6tzZ6t3a69/c6+Dd7OHe7OLg7ePh7eXj7ubk7ufl7+jn7+no8Ovp8ezr8e3s")),
  balance: T(R("GBxDGR5GGh9JGyFMHCJPHSNSHiVVHyZYICdbISlfISpiIitlIy1pJC5sJS9vJTBzJjJ2JzN6JzR9KDaBKDeEKTiIKTqMKTuPKTyTKT6XKT+aKUCeKUKiKEOlJ0WpJkesJUiwI0qzIUy2H064HFC6GVK8FlW9E1e+EFm+DVu+DF6+CmC+CmK+CmS+C2a9DWi9D2q9EWy8E268FnC8GXK7G3S7Hna7IXi7I3q6Jnu6KX26K3+6LoG6MIO6M4S6Noa6OIi6O4m6Pou6QI26Q4+6RpC6SJK6S5S6TpW6UZe6U5m6Vpq7WZy7XJ27X5+7YqC7ZaK8aKS8a6W8bqe9cai9daq+eKu+e6y/fq6/ga/AhbHAiLLBi7TCjrXDkbfDlLjEmLrFm7vGnrzHob7IpL/Jp8HKqsLLrcTMsMXNs8fOtsnPucrQvMzSv83Twc/UxNDVx9LXytTYzdXZ0Nfa09nc1drd2Nze297g3uDh4eHj4+Pk5uXm6efn6+np7urq8ezs8ezr8Orp7+jm7uXj7ePg7ODe697b6tzY6dnV6NfS59XP5tLN5dDK5c7H5MvE48nB4se+4cS74cK44MC1372y37uw3rmt3baq3LSn3LKk26+h2q2e2qub2amY2KaW2KST16KQ1p+N1p2K1ZuH1JmE05aB05R/0pJ80Y950Y120Itzz4lwz4ZuzoRrzYJozX9lzH1jy3tgynldynZbyXRYyHJVx29Tx21QxmtNxWhLxGZIw2NGw2FDwl9BwVw/wFo8v1c6vlU4vlI2vVA0vE0yu0swukguuUUsuEMrt0Aptj0otDsnszgmsjUlsTMlrzAkri4krCskqykkqSYkpyQkpSElox8loR0lnxsmnRkmmxcnmRYnlxQolBMokhIokBApjRApiw8piA8phg4pgw4pgA4pfg4pew4peA4odg4ocw4ncA4nbQ4maw8laA8lZQ8kYw4jYA4iXg4hWw4gWA4fVg4eUw0dUQ0cTg0bSwwZSQwYRgsXRAsWQQoUPwoTPAkS")),
  balance_r: T(R("PAkSPwoTQQoURAsWRgsXSQwYSwwZTg0bUQ0cUw0dVg4eWA4fWw4gXg4hYA4iYw4jZQ8kaA8law8lbQ4mcA4ncw4ndg4oeA4oew4pfg4pgA4pgw4phg4piA8piw8pjRApkBApkhIolBMolxQomRYnmxcnnRkmnxsmoR0lox8lpSElpyQkqSYkqykkrCskri4krzAksTMlsjUlszgmtDsntj0ot0ApuEMruUUsukguu0swvE0yvVA0vlI2vlU4v1c6wFo8wVw/wl9Bw2FDw2NGxGZIxWhLxmtNx21Qx29TyHJVyXRYynZbynldy3tgzH1jzX9lzYJozoRrz4Zuz4lw0Itz0Y120Y950pJ805R/05aB1JmE1ZuH1p2K1p+N16KQ2KST2KaW2amY2qub2q2e26+h3LKk3LSn3baq3rmt37uw372y4MC14cK44cS74se+48nB5MvE5c7H5dDK5tLN59XP6NfS6dnV6tzY697b7ODe7ePg7uXj7+jm8Orp8ezr8ezs7urq6+np6efn5uXm4+Pk4eHj3uDh297g2Nze1drd09nc0NfazdXZytTYx9LXxNDVwc/Uv83TvMzSucrQtsnPs8fOsMXNrcTMqsLLp8HKpL/Job7InrzHm7vGmLrFlLjEkbfDjrXDi7TCiLLBhbHAga/Afq6/e6y/eKu+daq+cai9bqe9a6W8aKS8ZaK8YqC7X5+7XJ27WZy7Vpq7U5m6UZe6TpW6S5S6SJK6RpC6Q4+6QI26Pou6O4m6OIi6Noa6M4S6MIO6LoG6K3+6KX26Jnu6I3q6IXi7Hna7G3S7GXK7FnC8E268EWy8D2q9DWi9C2a9CmS+CmK+CmC+DF6+DVu+EFm+E1e+FlW9GVK8HFC6H064IUy2I0qzJUiwJkesJ0WpKEOlKUKiKUCeKT+aKT6XKTyTKTuPKTqMKTiIKDeEKDaBJzR9JzN6JjJ2JTBzJS9vJC5sIy1pIitlISpiISlfICdbHyZYHiVVHSNSHCJPGyFMGh9JGR5GGBxD")),
  curl: T(R("FR1EFR9FFiFGFiNHFyVIFydJGClKGCtLGC1MGS9NGTFPGjNQGjVRGjdSGzhTGzpUGzxWGz5XHEBYHEJZHENaHEVbHEddHEleHEtfHE1gHE5hHFBiHFJkHFRlG1ZmG1hnG1loGltpGl1qGl9rGWFsGGNtGGVuF2dvF2hwFmpxFWxyFG5zFHB0E3J1EnR2EnZ2EXh3EXl4EXt5EX15EX96EoF7E4N7FIV8Fod8GIh9Gop9HYx+H45+Io9+JpF/KZN/LZWAMJaANJiAOJmBPJuBQJyCRJ6CSJ+DTKGDUKKEVKSEWKWFXKeGYKiHZKmIaKuJbKyKb66Lc6+Md7CNerKPfrOQgrSRhbaTibeUjLiWkLqYk7uZlr2bmr6dnb+foMGho8Kjp8SlqsWnrcapsMirs8mttsuwucyyvM60wM+3w9G5xdK8yNS+y9bBztfD0dnG1NrI19zL2t7O3d/R4OHT4uPW5eXZ6Obc6+jf7urh8Ozk8+7n9u/q+fHt+/Pw/vXz/fX0/PPw+/Dt+u7q+Ozm9+nj9ufg9eTc9OLZ89/W8t3S8drP8NjM79XI79PF7tDC7c6+7Mu768m468a16sSy6cGv6L+r6L2o57ql5rii5rWf5bOc5LCa5K6X46uU46mR4qaO4aSM4aGJ4J6H35yE35mC3peA3ZR93ZJ73I9524132op12oh02YVy2INw14Bv1n5t1Xts1Hlr03Zp0nRo0XJn0G9mz21mzmplzGhky2ZkymNjyGFix19ixl1ixFphw1hhwVZhwFRhvlJgvFBgu05guUxgt0pgtUhgtEZgskRgsEJgrkBgrD5gqjxgqDpgpjhgpDdgojVgoDNgnjFgnDBgmi5gmCxhlithlClhkShgjyZgjSVgiyNgiCJghiFghB9ggR5ffx1ffBxfehtedxpedRldchhccBhcbRdbahZaaBZZZRVYYxVXYBRVXRRUWxRSWBNRVRNPUxNOUBJMTRJKSxJISBFGRhFEQxBCQBBAPg8+Ow88OQ46Ng43NA01")),
  curl_r: T(R("NA01Ng43OQ46Ow88Pg8+QBBAQxBCRhFESBFGSxJITRJKUBJMUxNOVRNPWBNRWxRSXRRUYBRVYxVXZRVYaBZZahZabRdbcBhcchhcdRlddxpeehtefBxffx1fgR5fhB9ghiFgiCJgiyNgjSVgjyZgkShglClhlithmCxhmi5gnDBgnjFgoDNgojVgpDdgpjhgqDpgqjxgrD5grkBgsEJgskRgtEZgtUhgt0pguUxgu05gvFBgvlJgwFRhwVZhw1hhxFphxl1ix19iyGFiymNjy2ZkzGhkzmplz21m0G9m0XJn0nRo03Zp1Hlr1Xts1n5t14Bv2INw2YVy2oh02op124133I953ZJ73ZR93peA35mC35yE4J6H4aGJ4aSM4qaO46mR46uU5K6X5LCa5bOc5rWf5rii57ql6L2o6L+r6cGv6sSy68a168m47Mu77c6+7tDC79PF79XI8NjM8drP8t3S89/W9OLZ9eTc9ufg9+nj+Ozm+u7q+/Dt/PPw/fX0/vXz+/Pw+fHt9u/q8+7n8Ozk7urh6+jf6Obc5eXZ4uPW4OHT3d/R2t7O19zL1NrI0dnGztfDy9bByNS+xdK8w9G5wM+3vM60ucyytsuws8mtsMirrcapqsWnp8Slo8KjoMGhnb+fmr6dlr2bk7uZkLqYjLiWibeUhbaTgrSRfrOQerKPd7CNc6+Mb66LbKyKaKuJZKmIYKiHXKeGWKWFVKSEUKKETKGDSJ+DRJ6CQJyCPJuBOJmBNJiAMJaALZWAKZN/JpF/Io9+H45+HYx+Gop9GIh9Fod8FIV8E4N7EoF7EX96EX15EXt5EXl4EXh3EnZ2EnR2E3J1FHB0FG5zFWxyFmpxF2hwF2dvGGVuGGNtGWFsGl9rGl1qGltpG1loG1hnG1ZmHFRlHFJkHFBiHE5hHE1gHEtfHEleHEddHEVbHENaHEJZHEBYGz5XGzxWGzpUGzhTGjdSGjVRGjNQGTFPGS9NGC1MGCtLGClKFydJFyVIFiNHFiFGFR9FFR1E")),
  deep: T(R("/f7M+/3L+fzK9/vI9frH8/rG8fnF7/jE7ffD6/fB6fbA5/W/5fS+4/S94fO83/K73fK62/G52fC41++31O+20u610O20zuyzzOyzyuuyyOqxxuqwxOmvweivv+euveetu+asueWst+WrteSqsuOqsOKpruKprOGoquCop+Cnpd+no96mod2mn92lnNylmtulmNqkltqklNmkktikkNekjdeji9ajidWjh9SjhdOjg9OjgdKjf9GjfdCjfM+jes6jeM6jds2jdcyjc8ujccqjcMmjbsijbceja8ajasWkacSkZ8OkZsKkZcKkZMGkY8CkYr+kYb6kYL2kX7ykXrukXbqkXLmkW7ikWrekWrakWbSkWLOkWLKkV7GkVrCkVq+kVa6jVa2jVKyjU6ujU6qjUqmjUqijUaejUaaiUaWiUKSiUKOiT6KiT6GiT6CiTp+hTp6hTZ2hTZyhTZuhTJqgTJmgS5igS5egS5agSpWfSpSfSpOfSZKfSZGeSZCeSI+eSI6eSI2dR4ydR4udR4qdRomdRoicRoecRYacRYWcRYSbRIObRIKbRIGbRICbQ3+aQ36aQ32aQnyaQnuZQnqZQnmZQXiZQXeZQXaYQHWYQHSYQHOYQHKYQHGXP3CXP2+XP26XP22XP2yWPmuWPmqWPmmWPmiWPmeVPmaVPmWVPmSVPmOUPmKUPmGUPmCUPl+TPl6TPlyTPluTPlqSPlmSPliSPleRPlaRP1WQP1SQP1OPP1KPP1COQE+NQE6NQE2MQEyLQUuKQUqJQUmIQUiHQUeFQUaEQUWDQUSBQkOAQUJ+QUF9QUB7QUB6QT94QT52QT11QDxzQDxxQDtwQDpuPzlsPzhrPzhpPjdnPjZmPTVkPTViPTRhPDNfPDJdOzJcOzFaOjBYOjBXOS9VOS5UOC1SOC1RNyxPNitNNipMNSpKNSlJNChHNChGMydEMiZDMiVBMSVAMCQ+MCM9LyI7LyI6LiE5LSA3LR82LB80Kx4zKx0yKhwwKRwvKBstKBos")),
  deep_r: T(R("KBosKBstKRwvKhwwKx0yKx4zLB80LR82LSA3LiE5LyI6LyI7MCM9MCQ+MSVAMiVBMiZDMydENChGNChHNSlJNSpKNipMNitNNyxPOC1ROC1SOS5UOS9VOjBXOjBYOzFaOzJcPDJdPDNfPTRhPTViPTVkPjZmPjdnPzhpPzhrPzlsQDpuQDtwQDxxQDxzQT11QT52QT94QUB6QUB7QUF9QUJ+QkOAQUSBQUWDQUaEQUeFQUiHQUmIQUqJQUuKQEyLQE2MQE6NQE+NP1COP1KPP1OPP1SQP1WQPlaRPleRPliSPlmSPlqSPluTPlyTPl6TPl+TPmCUPmGUPmKUPmOUPmSVPmWVPmaVPmeVPmiWPmmWPmqWPmuWP2yWP22XP26XP2+XP3CXQHGXQHKYQHOYQHSYQHWYQXaYQXeZQXiZQnmZQnqZQnuZQnyaQ32aQ36aQ3+aRICbRIGbRIKbRIObRYSbRYWcRYacRoecRoicRomdR4qdR4udR4ydSI2dSI6eSI+eSZCeSZGeSZKfSpOfSpSfSpWfS5agS5egS5igTJmgTJqgTZuhTZyhTZ2hTp6hTp+hT6CiT6GiT6KiUKOiUKSiUaWiUaaiUaejUqijUqmjU6qjU6ujVKyjVa2jVa6jVq+kVrCkV7GkWLKkWLOkWbSkWrakWrekW7ikXLmkXbqkXrukX7ykYL2kYb6kYr+kY8CkZMGkZcKkZsKkZ8OkacSkasWka8ajbcejbsijcMmjccqjc8ujdcyjds2jeM6jes6jfM+jfdCjf9GjgdKjg9OjhdOjh9SjidWji9ajjdejkNekktiklNmkltqkmNqkmtulnNyln92lod2mo96mpd+np+CnquCorOGoruKpsOKpsuOqteSqt+WrueWsu+asveetv+euweivxOmvxuqwyOqxyuuyzOyzzuyz0O200u611O+21++32fC42/G53fK63/K74fO84/S95fS+5/W/6fbA6/fB7ffD7/jE8fnF8/rG9frH9/vI+fzK+/3L/f7M")),
  delta: T(R("ESBAEiFDFCJGFSRJFiVMFydQGShTGilWGypaHCxdHi1gHy5kIDBnITFrIjJvIzNyJDV2JTZ6JTd+JjiCJjqGJzuKJz2NJj6RJUCUJEKXI0SYIUeaIEmbH0ubHk2cHVCcHFKdHFSdG1adG1ieG1qeG1yeG16fG2CfG2OfG2WfHGegHGmgHWqgHmyhHm6hH3CiIHKiIXSiInajI3ijJHqkJXykJn6lJ4ClKIKmKoSmK4WmLIenLomnL4uoMI2oMo+pM5GpNZOqN5WqOJerOpirPJqsPpysQJ6tQqCtRaKuR6OuSqWuTaevUKmvU6qwVqywWq6wXa+xYbGxZbOyabSzbbazcbe0dbi1ebq1fbu2gb23hL64iMC5jMG6kMO8lMS9l8W+m8e/nsjBosrCpsvDqc3ErM7GsNDHs9LJt9PKutXMvdbNwdjOxNrQx9vRyt3Tzd/U0eDW1OLX1+TZ2uba3efb4Ond4+ve5u3f6u/g7fHi8PPj8/Xj9vfk+vjl/frm//zM/frI/PfE+vW/+fO7+PC39u6y9euu9Omq8uem8eSh8OKd7uCZ7d6U69yQ6tmM6NeH59WD5dN/5NF64s924M1x38tt3clp28dk2cVg18Rc1cJY0sBT0L5Pzr1Ly7tHyLpDxrg/w7c8wLU4vbQ0urMxt7EutLAqsa8nrq0kq6whqKsepKoboagYnqcWmqYTl6URk6QOkKIMjKEKiaAJhZ8Hgp4GfpwGe5sGd5oGdJkGcJgHbJYHaZUIZZQKYZILXpENWpAOV48QU40RT4wTTIsVSIkWRIgYQYYZPYUbOoMcNoIdM4AfL38gLH0hKXwiJnokInklH3cmHXUnGnQnF3IoFXApE24qEW0qD2srDWkrDGcsC2UsC2QsC2ItC2AtC14tDFwtDVotDlgtD1YsD1UsEFMsEVEsEk8rE00rFEsqFUkqFkcpFkUoF0MnF0EnGEAmGD4lGTwkGTojGTgiGTYhGTQfGTIeGTAdGS4cGSwaGSsZGCkXGCcWGCUUFyMT")),
  delta_r: T(R("FyMTGCUUGCcWGCkXGSsZGSwaGS4cGTAdGTIeGTQfGTYhGTgiGTojGTwkGD4lGEAmF0EnF0MnFkUoFkcpFUkqFEsqE00rEk8rEVEsEFMsD1UsD1YsDlgtDVotDFwtC14tC2AtC2ItC2QsC2UsDGcsDWkrD2srEW0qE24qFXApF3IoGnQnHXUnH3cmInklJnokKXwiLH0hL38gM4AfNoIdOoMcPYUbQYYZRIgYSIkWTIsVT4wTU40RV48QWpAOXpENYZILZZQKaZUIbJYHcJgHdJkGd5oGe5sGfpwGgp4GhZ8HiaAJjKEKkKIMk6QOl6URmqYTnqcWoagYpKobqKseq6whrq0ksa8ntLAqt7EuurMxvbQ0wLU4w7c8xrg/yLpDy7tHzr1L0L5P0sBT1cJY18Rc2cVg28dk3clp38tt4M1x4s925NF65dN/59WD6NeH6tmM69yQ7d6U7uCZ8OKd8eSh8uem9Omq9euu9u6y+PC3+fO7+vW//PfE/frI//zM/frm+vjl9vfk8/Xj8PPj7fHi6u/g5u3f4+ve4Ond3efb2uba1+TZ1OLX0eDWzd/Uyt3Tx9vRxNrQwdjOvdbNutXMt9PKs9LJsNDHrM7Gqc3EpsvDosrCnsjBm8e/l8W+lMS9kMO8jMG6iMC5hL64gb23fbu2ebq1dbi1cbe0bbazabSzZbOyYbGxXa+xWq6wVqywU6qwUKmvTaevSqWuR6OuRaKuQqCtQJ6tPpysPJqsOpirOJerN5WqNZOqM5GpMo+pMI2oL4uoLomnLIenK4WmKoSmKIKmJ4ClJn6lJXykJHqkI3ijInajIXSiIHKiH3CiHm6hHmyhHWqgHGmgHGegG2WfG2OfG2CfG16fG1yeG1qeG1ieG1adHFSdHFKdHVCcHk2cH0ubIEmbIUeaI0SYJEKXJUCUJj6RJz2NJzuKJjqGJjiCJTd+JTZ6JDV2IzNyIjJvITFrIDBnHy5kHi1gHCxdGypaGilWGShTFydQFiVMFSRJFCJGEiFDESBA")),
  dense: T(R("5vHx5PDw4+/v4e7v3+3u3e3t3Ozt2uvs2Ors1+nr1enr0+jq0efq0ObpzuXpzOToy+ToyePox+LnxuHnxODmwt/mwd/mv97mvt3lvNzlutvludrkt9rkttnktNjkstfksdbjr9XjrtTjrNTjq9PjqdLjqNHjptDjpc/io87ios7ioM3in8zinsvinMrim8nimsjimMfil8bilsXilMXik8TiksPikMLij8HijsDijb/ijL7iir3jibzjiLvjh7rjhrnjhbjjhLfjg7bjgrXjgbTjgLPjf7Ljf7HkfrDkfa/kfK7ke63ke6zkeqvkearkeankeKjkeKfkd6bkd6XkdqTldqPldaHldaDldZ/ldZ7ldJ3ldJzkdJvkdJrkdJjkc5fkc5bkc5Xkc5Tkc5Pjc5Hjc5Djc4/jc47idI3idIvidIridInhdIjhdIfgdIXgdYTfdYPfdYLedYHedX/ddX7ddn3cdnzcdnvbdnnadnjad3fZd3bYd3XXd3PXd3LWeHHVeHDUeG/TeG7SeGzSeGvReGrQeWnPeWjOeWbNeWXMeWTLeWPKeWLJeWHIeWDHeV7FeV3EeVzDeVvCeVrBeVnAeVi/eVe9eVa8eVS7eVO6eVK4eVG3eVC2eU+1eE6zeE2yeEyxeEuveEqueEmtd0ird0eqd0apd0Wnd0OmdkKldkGjdkCidj+gdT6fdT2ddTycdDubdDuZdDqYczmWcziVczeTcjaScjWQcjSPcTONcTKMcDGKcDCIby+Hby6Fbi2Ebi2CbSyBbSt/bCp+bCl8ayh6ayh5aid3aiZ1aSV0aCRyaCRxZyNvZyJtZiFsZSFqZSBoZB9nYx9lYh5jYh1iYR1gYBxeXxtdXxtbXhpZXRpYXBlWWxlUWhhTWhhRWRdQWBdOVxZMVhZLVRZJVBVIUxVGUhVEURRDUBRBTxRAThM+TRM9SxM7ShM6SRI4SBI3RxI2RhI0RREzRBEyQhEwQREvQBAuPxAtPhArPBAqOw8pOg8oOQ8nOA8lNg4k")),
  dense_r: T(R("Ng4kOA8lOQ8nOg8oOw8pPBAqPhArPxAtQBAuQREvQhEwRBEyRREzRhI0RxI2SBI3SRI4ShM6SxM7TRM9ThM+TxRAUBRBURRDUhVEUxVGVBVIVRZJVhZLVxZMWBdOWRdQWhhRWhhTWxlUXBlWXRpYXhpZXxtbXxtdYBxeYR1gYh1iYh5jYx9lZB9nZSBoZSFqZiFsZyJtZyNvaCRxaCRyaSV0aiZ1aid3ayh5ayh6bCl8bCp+bSt/bSyBbi2Cbi2Eby6Fby+HcDCIcDGKcTKMcTONcjSPcjWQcjaSczeTcziVczmWdDqYdDuZdDubdTycdT2ddT6fdj+gdkCidkGjdkKld0Omd0Wnd0apd0eqd0ireEmteEqueEuveEyxeE2yeE6zeU+1eVC2eVG3eVK4eVO6eVS7eVa8eVe9eVi/eVnAeVrBeVvCeVzDeV3EeV7FeWDHeWHIeWLJeWPKeWTLeWXMeWbNeWjOeWnPeGrQeGvReGzSeG7SeG/TeHDUeHHVd3LWd3PXd3XXd3bYd3fZdnjadnnadnvbdnzcdn3cdX7ddX/ddYHedYLedYPfdYTfdIXgdIfgdIjhdInhdIridIvidI3ic47ic4/jc5Djc5Hjc5Pjc5Tkc5Xkc5bkc5fkdJjkdJrkdJvkdJzkdJ3ldZ7ldZ/ldaDldaHldqPldqTld6Xkd6bkeKfkeKjkeankearkeqvke6zke63kfK7kfa/kfrDkf7Hkf7LjgLPjgbTjgrXjg7bjhLfjhbjjhrnjh7rjiLvjibzjir3jjL7ijb/ijsDij8HikMLiksPik8TilMXilsXil8bimMfimsjim8ninMrinsvin8zioM3ios7io87ipc/iptDjqNHjqdLjq9PjrNTjrtTjr9XjsdbjstfktNjkttnkt9rkudrkutvlvNzlvt3lv97mwd/mwt/mxODmxuHnx+LnyePoy+TozOTozuXp0Obp0efq0+jq1enr1+nr2Ors2uvs3Ozt3e3t3+3u4e7v4+/v5PDw5vHx")),
  diff: T(R("CCNACSVCCiZECyhFDCpHDCxJDS1LDi9NDzFPEDJRETRTETZVEjdWEzlYFDtaFD1cFT5eFkBfF0JhGENjGUVkGkdmG0hnHUpoH0xpIU1qJE9rJlBsKFJtK1NuLVVvL1ZwMVhxNFlzNlt0OFx1Ol52PF93PmF4QWJ5Q2R6RWV7R2d9SWh+S2p/TWuAT22BUW6CU3CEVXGFWHOGWnSHXHaIXniKYHmLYnuMZHyNZn6OaH+QaoGRbIKSboSUcIaVcoeWdImXdoqZeIyae42bfY+df5GegZKfg5ShhZaih5ejiZmli5qmjZynj56pkp+qlKGslqOtmKWvmqawnKixnqqzoKu0o622pa+3p7G5qbK6q7S8rra9sLi/srrAtLvCtr3Eub/Fu8HHvcPIv8XKwsbMxMjNxsrPyMzRy87SzdDUz9LW0tTX1NbZ1tjb2drd29ze3d7g4ODi4uLj5OPl5uXn6Ofo6+nq7Orr7uzs8O3u8e7v8+/v9PDw9fHw9fHw9vHw9vHw9fHv9fDu9O/t8+7r8u3p8evo7+rl7ujj7Obh6uXf6OPc5+Ha5d/X493U4dvS39nP3dfN29XK2dPH19HF1c/C083A0su90Mm7zse4zMW1ysOzyMGwx7+uxb2rw7upwbmmv7ekvrWhvLOfurGdubCat66YtayVs6qTsqiQsKaOrqWMraOJq6GHqZ+FqJ2CppyApJp9o5h7oZZ5oJV2npN0nJFym49wmY5tmIxrlopplYlnk4dkkYVikIRgjoJejYBbi39Zin1XiHtVh3pThXhQg3ZOgnVMgHNKf3JIfXBGfG5Dem1BeWs/d2o9dmg7dGY5cmU3cWM1b2IzbmAwbF8ual0saFwrZ1opZVknY1gmYVYlX1UkXVQjW1IiWVEhV08gVU4gU00fUUseT0odTUgdS0ccSUUbR0QaRUMaQ0EZQkAYQD4XPj0WPDsWOjoVODkUNjcTNDYSMzQSMTMRLzEQLTAPKy4OKS0NJysMJioLJCgKIicJICUJHiQIHCIH")),
  diff_r: T(R("HCIHHiQIICUJIicJJCgKJioLJysMKS0NKy4OLTAPLzEQMTMRMzQSNDYSNjcTODkUOjoVPDsWPj0WQD4XQkAYQ0EZRUMaR0QaSUUbS0ccTUgdT0odUUseU00fVU4gV08gWVEhW1IiXVQjX1UkYVYlY1gmZVknZ1opaFwral0sbF8ubmAwb2IzcWM1cmU3dGY5dmg7d2o9eWs/em1BfG5DfXBGf3JIgHNKgnVMg3ZOhXhQh3pTiHtVin1Xi39ZjYBbjoJekIRgkYVik4dklYlnloppmIxrmY5tm49wnJFynpN0oJV2oZZ5o5h7pJp9ppyAqJ2CqZ+Fq6GHraOJrqWMsKaOsqiQs6qTtayVt66YubCaurGdvLOfvrWhv7ekwbmmw7upxb2rx7+uyMGwysOzzMW1zse40Mm70su9083A1c/C19HF2dPH29XK3dfN39nP4dvS493U5d/X5+Ha6OPc6uXf7Obh7ujj7+rl8evo8u3p8+7r9O/t9fDu9fHv9vHw9vHw9fHw9fHw9PDw8+/v8e7v8O3u7uzs7Orr6+nq6Ofo5uXn5OPl4uLj4ODi3d7g29ze2drd1tjb1NbZ0tTXz9LWzdDUy87SyMzRxsrPxMjNwsbMv8XKvcPIu8HHub/Ftr3EtLvCsrrAsLi/rra9q7S8qbK6p7G5pa+3o622oKu0nqqznKixmqawmKWvlqOtlKGskp+qj56pjZyni5qmiZmlh5ejhZaig5ShgZKff5GefY+de42beIyadoqZdImXcoeWcIaVboSUbIKSaoGRaH+QZn6OZHyNYnuMYHmLXniKXHaIWnSHWHOGVXGFU3CEUW6CT22BTWuAS2p/SWh+R2d9RWV7Q2R6QWJ5PmF4PF93Ol52OFx1Nlt0NFlzMVhxL1ZwLVVvK1NuKFJtJlBsJE9rIU1qH0xpHUpoG0hnGkdmGUVkGENjF0JhFkBfFT5eFD1cFDtaEzlYEjdWETZVETRTEDJRDzFPDi9NDS1LDCxJDCpHCyhFCiZECSVCCCNA")),
  gray: T(R("AAAAAAAAAAAAAAAAAQEBAQEBAgICAgICAwMDAwMDBAQEBQUFBQUFBgYGBwcHCAgICQkJCgoKCwsLDAwMDQ0NDw4OEA8PERAQEhERExISFBMTFRQUFhUVFxYWGBcXGRgYGhkZGxoaHBsbHRwcHR0dHh4eHx8fICAgISEhIiIiIyMjJCQkJSUkJiYlJyYmKCcnKSgoKikpKyoqKysrLCwsLS0tLi4uLy8uMDAvMTAwMjExMzIyNDMzNTQ0NTU1NjY2Nzc3ODg3OTk4Ojk5Ozo6PDs7PTw8Pj09Pj4+Pz8/QEBAQUFAQkJBQ0JCRENDRURERkVFR0ZGR0dHSEhISUlISkpJS0tKTEtLTUxMTk1NT05OUE9PUFBQUVFQUlJRU1NSVFRTVVRUVlVVV1ZWWFdXWVhYWllZWlpaW1taXFxbXV1cXl5dX15eYF9fYWBgYmFhY2JiZGNjZWRkZWVkZmZlZ2dmaGhnaWloamppa2tqbGtrbWxsbm1tb25ucG9vcXBwcnFxc3Jxc3NydHRzdXV0dnZ1d3d2eHh3eXl4enp5e3t6fHx7fX18fn19f35+gH9/gYCAgoGBg4KChIODhYSEhoWFh4aGiIeHiYiIiomJi4qKjIuLjYyMjo2Nj46OkI+PkZCQkpGRk5KSlJOTlZSUlpWVl5aWmJeXmZiYmpmZm5qanJubnZ2cnp6dn5+eoKCfoaGgoqKho6OipKSjpaWkpqalp6emqKinqqmoq6qprKuqraysrq2tr6+usLCvsbGwsrKxs7OytLSztrW0t7a1uLe2ubm4urq5u7u6vLy7vb28vr69wL++wcC/wsLBw8PCxMTDxcXExsbFyMfGycjHysrJy8vKzMzLzc3Mz87N0NDO0dHQ0tLR09PS1dTT1tbU19fW2NjX2dnY29rZ3Nzb3d3c3t7d4N/e4eHf4uLh4+Pi5eTj5ubk5+fm6Ojn6uro6+vq7Ozr7u3s7+/t8PDv8vHw8/Px9PTz9fX09/f1+Pj3+fn4+/v5/Pz7/v38///9")),
  gray_r: T(R("///9/v38/Pz7+/v5+fn4+Pj39/f19fX09PTz8/Px8vHw8PDv7+/t7u3s7Ozr6+vq6uro6Ojn5+fm5ubk5eTj4+Pi4uLh4eHf4N/e3t7d3d3c3Nzb29rZ2dnY2NjX19fW1tbU1dTT09PS0tLR0dHQ0NDOz87Nzc3MzMzLy8vKysrJycjHyMfGxsbFxcXExMTDw8PCwsLBwcC/wL++vr69vb28vLy7u7u6urq5ubm4uLe2t7a1trW0tLSzs7OysrKxsbGwsLCvr6+urq2traysrKuqq6qpqqmoqKinp6empqalpaWkpKSjo6OioqKhoaGgoKCfn5+enp6dnZ2cnJubm5qampmZmZiYmJeXl5aWlpWVlZSUlJOTk5KSkpGRkZCQkI+Pj46Ojo2NjYyMjIuLi4qKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgH9/f35+fn19fX18fHx7e3t6enp5eXl4eHh3d3d2dnZ1dXV0dHRzc3Nyc3JxcnFxcXBwcG9vb25ubm1tbWxsbGtra2tqamppaWloaGhnZ2dmZmZlZWVkZWRkZGNjY2JiYmFhYWBgYF9fX15eXl5dXV1cXFxbW1taWlpaWllZWVhYWFdXV1ZWVlVVVVRUVFRTU1NSUlJRUVFQUFBQUE9PT05OTk1NTUxMTEtLS0tKSkpJSUlISEhIR0dHR0ZGRkVFRURERENDQ0JCQkJBQUFAQEBAPz8/Pj4+Pj09PTw8PDs7Ozo6Ojk5OTk4ODg3Nzc3NjY2NTU1NTQ0NDMzMzIyMjExMTAwMDAvLy8uLi4uLS0tLCwsKysrKyoqKikpKSgoKCcnJyYmJiYlJSUkJCQkIyMjIiIiISEhICAgHx8fHh4eHR0dHRwcHBsbGxoaGhkZGRgYGBcXFxYWFhUVFRQUFBMTExISEhERERAQEA8PDw4ODQ0NDAwMCwsLCgoKCQkJCAgIBwcHBgYGBQUFBQUFBAQEAwMDAwMDAgICAgICAQEBAQEBAAAAAAAAAAAAAAAA")),
  haline: T(R("KhhsKhluKhlxKxlzKxl1LBp4LBp6LRp9LRp/LRuCLhuELhuHLhyJLhyMLhyOLh2RLh2TLh6VLh6YLh+aLSCcLSGdLCKfKySgKiWhKSeiKCmjJiujJS2jJC6jIjCjITKiIDSiHjWhHTehHDmgGzqgGTyfGD2eFz+eFkCdFUGcFEOcE0SbEkWbEUeaEEiZD0mZD0qYDkyXDU2XDU6WDU+WDFCVDFGVDFKUDFOUDFSTDVWTDVaSDVeSDliRDlmRD1qRD1uQEFyQEV2PEV6PEl+PE2COFGGOFGKOFWOOFmONF2SNGGWNGGaMGWeMGmiMG2mMHGqMHWuLHWuLHmyLH22LIG6LIW+LInCKInGKI3GKJHKKJXOKJnSKJnWKJ3aKKHaJKXeJKXiJKnmJK3qJK3uJLHyJLXyJLX2JLn6JL3+JL4CJMIGJMYKJMYKIMoOIM4SIM4WINIaINIeINYiINYmINomIN4qIN4uIOIyIOI2IOY6IOY+IOpCHOpCHO5GHO5KHPJOHPJSHPZWHPZaHPpeHPpiGP5mGP5mGQJqGQZuGQZyFQp2FQp6FQ5+FQ6CERKGERKKERaOERqSDRqSDR6WDSKaCSKeCSaiCSqmBSqqBS6uBTKyATK2ATa5/Tq5/T69+ULB+UbF9UbJ9UrN8U7R8VLV7VbZ7Vrd6V7h5WLh5Wrl4W7p3XLt3Xbx2Xr11X751Yb90Yr9zY8ByZcFyZsJxaMNwacRva8RubMVubsZtcMdscchrc8hqdclpd8poeMtoestnfMxmfs1lgM5kgs5jhM9ihtBiidBhi9FgjdJfj9JfktNelNNdl9RdmdRdm9VcntZcoNZco9dcpddcqNhcqthcrdhcr9ldsdldtNpettpfuNtgu9thvdxiv9xjwd1kxN1lxt5myN5nyt9pzN9qzuBs0OBt0uFv1OFw1uJy2OJz2uN13ON33uR54OV64eV84+Z+5eaA5+eB6eeD6+iF7OmH7umJ8OqK8uqM8+uO9eyQ9+yS+O2U+u6W/O6Y/e+a")),
  haline_r: T(R("/e+a/O6Y+u6W+O2U9+yS9eyQ8+uO8uqM8OqK7umJ7OmH6+iF6eeD5+eB5eaA4+Z+4eV84OV63uR53ON32uN12OJz1uJy1OFw0uFv0OBtzuBszN9qyt9pyN5nxt5mxN1lwd1kv9xjvdxiu9thuNtgttpftNpesdldr9ldrdhcqthcqNhcpddco9dcoNZcntZcm9VcmdRdl9RdlNNdktNej9JfjdJfi9FgidBhhtBihM9igs5jgM5kfs1lfMxmestneMtod8podclpc8hqcchrcMdsbsZtbMVua8RuacRvaMNwZsJxZcFyY8ByYr9zYb90X751Xr11Xbx2XLt3W7p3Wrl4WLh5V7h5Vrd6VbZ7VLV7U7R8UrN8UbJ9UbF9ULB+T69+Tq5/Ta5/TK2ATKyAS6uBSqqBSqmBSaiCSKeCSKaCR6WDRqSDRqSDRaOERKKERKGEQ6CEQ5+FQp6FQp2FQZyFQZuGQJqGP5mGP5mGPpiGPpeHPZaHPZWHPJSHPJOHO5KHO5GHOpCHOpCHOY+IOY6IOI2IOIyIN4uIN4qINomINYmINYiINIeINIaIM4WIM4SIMoOIMYKIMYKJMIGJL4CJL3+JLn6JLX2JLXyJLHyJK3uJK3qJKnmJKXiJKXeJKHaJJ3aKJnWKJnSKJXOKJHKKI3GKInGKInCKIW+LIG6LH22LHmyLHWuLHWuLHGqMG2mMGmiMGWeMGGaMGGWNF2SNFmONFWOOFGKOFGGOE2COEl+PEV6PEV2PEFyQD1uQD1qRDlmRDliRDVeSDVaSDVWTDFSTDFOUDFKUDFGVDFCVDU+WDU6WDU2XDkyXD0qYD0mZEEiZEUeaEkWbE0SbFEOcFUGcFkCdFz+eGD2eGTyfGzqgHDmgHTehHjWhIDSiITKiIjCjJC6jJS2jJiujKCmjKSeiKiWhKySgLCKfLSGdLSCcLh+aLh6YLh6VLh2TLh2RLhyOLhyMLhyJLhuHLhuELRuCLRp/LRp9LBp6LBp4Kxl1KxlzKhlxKhluKhhs")),
  ice: T(R("BAYTBQYUBQcVBggXBwkYCAoaCQsbCgwdCw0eDA0fDQ4hDg8iDxAkEBElERInEhMoExMqFBQrFRUsFhYuFxcvFxgxGBgyGRk0Gho1Gxs3HBw4HRw6Hh07Hx49Hx8+IB9AISBBIiFDIyJEJCJGJSNHJSRJJiVKJyVMKCZOKSdPKShRKihSKylULCpVLCtXLStZLixaLy1cLy5eMC9fMS9hMTBiMjFkMzJmMzJnNDNpNTRrNTVsNjVuNjZwNzdxODhzODl1OTl2OTp4Ojt6Ojx7Oj19Oz5/Oz6APD+CPECEPEGFPUKHPUOJPUSKPkWMPkaNPkePPkiQPkmSPkmTP0qVP0uWP0yXP06ZP0+aP1CbP1GdP1KeP1OfP1SgP1WhP1aiP1ejP1ikP1mlPlqmPlynPl2oPl6pPl+qPmCrPmGrPmKsPmOtPmWtPmauPmevPmivPmmwPmqwP2uxP2yyP26yP2+zP3CzP3G0QHK0QHO0QHS1QHW1QXa2QXi2Qnm3Qnq3Qnu3Q3y4Q324RH65RH+5RYC5RYG6RoK6RoS7R4W7R4a7SIe8SYi8SYm8Soq9S4u9S4y9TI2+TY6+To+/TpC/T5G/UJLAUZTAUZXAUpbBU5fBVJjCVZnCVZrCVpvDV5zDWJ3DWZ7EWp/EW6DFXKHFXaLFXqPGX6TGX6bHYKfHYajHYqnIY6rIZKvJZazJZ63JaK7Kaa/KarDLa7HLbLLLbbPMbrTMb7XNcbbNcrjOc7nOdLrOdbvPd7zPeL3Qeb7Qe7/QfMDRfcHRf8LSgMPSgsTTg8XThcbThsfUiMjUicnVi8rVjMvWjszWkM3Xks7Xk8/YldDYl9HZmdLZmtPanNTantXboNbcotbcpNfdptjeqNneqdrfq9vgrdzgr93hsd7is9/jteDjt+HkueLluuPmvOTnvuXnwObowubpxOfqxujryOnsyerty+vuzezvz+3v0e7w0+/x1fDy1vHz2PL02vP13PT23vX34Pb44ff54/n65fr75/v76Pz86v39")),
  ice_r: T(R("6v396Pz85/v75fr74/n64ff54Pb43vX33PT22vP12PL01vHz1fDy0+/x0e7wz+3vzezvy+vuyertyOnsxujrxOfqwubpwObovuXnvOTnuuPmueLlt+HkteDjs9/jsd7ir93hrdzgq9vgqdrfqNneptjepNfdotbcoNbcntXbnNTamtPamdLZl9HZldDYk8/Yks7XkM3XjszWjMvWi8rVicnViMjUhsfUhcbTg8XTgsTTgMPSf8LSfcHRfMDRe7/Qeb7QeL3Qd7zPdbvPdLrOc7nOcrjOcbbNb7XNbrTMbbPMbLLLa7HLarDLaa/KaK7KZ63JZazJZKvJY6rIYqnIYajHYKfHX6bHX6TGXqPGXaLFXKHFW6DFWp/EWZ7EWJ3DV5zDVpvDVZrCVZnCVJjCU5fBUpbBUZXAUZTAUJLAT5G/TpC/To+/TY6+TI2+S4y9S4u9Soq9SYm8SYi8SIe8R4a7R4W7RoS7RoK6RYG6RYC5RH+5RH65Q324Q3y4Qnu3Qnq3Qnm3QXi2QXa2QHW1QHS1QHO0QHK0P3G0P3CzP2+zP26yP2yyP2uxPmqwPmmwPmivPmevPmauPmWtPmOtPmKsPmGrPmCrPl+qPl6pPl2oPlynPlqmP1mlP1ikP1ejP1aiP1WhP1SgP1OfP1KeP1GdP1CbP0+aP06ZP0yXP0uWP0qVPkmTPkmSPkiQPkePPkaNPkWMPUSKPUOJPUKHPEGFPECEPD+COz6AOz5/Oj19Ojx7Ojt6OTp4OTl2ODl1ODhzNzdxNjZwNjVuNTVsNTRrNDNpMzJnMzJmMjFkMTBiMS9hMC9fLy5eLy1cLixaLStZLCtXLCpVKylUKihSKShRKSdPKCZOJyVMJiVKJSRJJSNHJCJGIyJEIiFDISBBIB9AHx8+Hx49Hh07HRw6HBw4Gxs3Gho1GRk0GBgyFxgxFxcvFhYuFRUsFBQrExMqEhMoERInEBElDxAkDg8iDQ4hDA0fCw0eCgwdCQsbCAoaBwkYBggXBQcVBQYUBAYT")),
  matter: T(R("/u2w/eyv/eqt/ems/eir/eap/eWo/eOn/eKl/OGk/N+j/N6h/Nyg/Nuf/Nqd/Nic+9eb+9Wa+9SY+9OX+9GW+9CU+8+T+s2S+syR+sqQ+smO+siN+saM+sWL+cOK+cKI+cGH+b+G+b6F+b2E+LuD+LqC+LiA+Ld/+LZ+97R997N897J797B696959q549qx39qt29ql19ah09adz9aVy9aRx9aNw9KFv9KBu9J9t9J1s85xr85pq85lp8pho8pZo8pVn8pRm8ZJl8ZFk8Y9j8I5j8I1i8Ith74pg74lg74df7oZe7oVe7oNd7YJc7YFc7X9b7H5a7Hxa7HtZ63pZ63hY6ndY6nZX6XRX6XNW6XJW6HBW6G9V525V52xV5mtU5mpU5WhU5WdU5GZT42RT42NT4mJT4mBT4V9T4F5T4F1T31tT31pT3llT3VhT3FZT3FVT21RT2lNT2VFT2VBT2E9U105U1k1U1UxU1UtU1EpV00hV0kdV0UZW0EVWz0RWzkNWzUJXzEFXy0BXyj9YyT5YyD1Yxz1ZxjxZxTtZxDpawzlawjhawTdbwDZbvzZbvjVcvTRcuzNcujJduTJduDFdtzBeti9etS9esy5fsi1fsS1fsCxfrytgritgrCpgqylgqilhqShhpyhhpidhpSZipCZioyVioSVioCRinyRiniNjnCNjmyJjmiJjmSJjlyFjliFjlSBjkyBjkh9jkR9jkB9jjh5jjR5jjB5jih1jiR1jiB1jhh1jhRxjhBxjghxjgRxjgBtifhtifRtifBtiehtieRpheBphdhphdRphdBpgchpgcRlgcBlfbhlfbRleaxleahleaRldZxldZhhcZRhcYxhbYhhbYRhaXxhaXhhZXRdYWxdYWhdXWRdXVxdWVhdVVRdVUxZUUhZTURZTTxZSThZRTRVRSxVQShVPSRVORxVORhRNRRRMRBRLQhRLQRNKQBNJPhNIPRNHPBJHOxJGORJFOBFENxFDNhFCNBFBMxBBMhBAMA8/Lw8+")),
  matter_r: T(R("Lw8+MA8/MhBAMxBBNBFBNhFCNxFDOBFEORJFOxJGPBJHPRNHPhNIQBNJQRNKQhRLRBRLRRRMRhRNRxVOSRVOShVPSxVQTRVRThZRTxZSURZTUhZTUxZUVRdVVhdVVxdWWRdXWhdXWxdYXRdYXhhZXxhaYRhaYhhbYxhbZRhcZhhcZxldaRldahleaxlebRlebhlfcBlfcRlgchpgdBpgdRphdhpheBpheRphehtifBtifRtifhtigBtigRxjghxjhBxjhRxjhh1jiB1jiR1jih1jjB5jjR5jjh5jkB9jkR9jkh9jkyBjlSBjliFjlyFjmSJjmiJjmyJjnCNjniNjnyRioCRioSVioyVipCZipSZipidhpyhhqShhqilhqylgrCpgritgrytgsCxfsS1fsi1fsy5ftS9eti9etzBeuDFduTJdujJduzNcvTRcvjVcvzZbwDZbwTdbwjhawzlaxDpaxTtZxjxZxz1ZyD1YyT5Yyj9Yy0BXzEFXzUJXzkNWz0RW0EVW0UZW0kdV00hV1EpV1UtU1UxU1k1U105U2E9U2VBT2VFT2lNT21RT3FVT3FZT3VhT3llT31pT31tT4F1T4F5T4V9T4mBT4mJT42NT42RT5GZT5WdU5WhU5mpU5mtU52xV525V6G9V6HBW6XJW6XNW6XRX6nZX6ndY63hY63pZ7HtZ7Hxa7H5a7X9b7YFc7YJc7oNd7oVe7oZe74df74lg74pg8Ith8I1i8I5j8Y9j8ZFk8ZJl8pRm8pVn8pZo8pho85lp85pq85xr9J1s9J9t9KBu9KFv9aNw9aRx9aVy9adz9ah09ql19qt29qx39q54969597B697J797N897R9+LZ++Ld/+LiA+LqC+LuD+b2E+b6F+b+G+cGH+cKI+cOK+sWL+saM+siN+smO+sqQ+syR+s2S+8+T+9CU+9GW+9OX+9SY+9Wa+9eb/Nic/Nqd/Nuf/Nyg/N6h/N+j/OGk/eKl/eOn/eWo/eap/eir/ems/eqt/eyv/u2w")),
  oxy: T(R("QAUFQQUFQwYGRAYGRwYHSAYHSQYHSwYITQcITwcJUAcJUQcJVAcKVQcLVwcLWAcLWwcMXAcMXQcMXwcNYgcNYwcOZAcOZgcOaAcOagYPawYPbQYPbwYPcQYPcgYPcwUPdgUPeAUPeQUPegUPfQUOfgUOfwYNgQYNgwgMhAkMhQoLhgwLiA4KiRAKihEJixMJjRUIjhcIjxgIUE9PUFBQUVFQUlFRU1NTVFRTVVRUVlVVV1dWWFdXWVhYWVlYW1paXFtbXFxbXV1cX15eX19eYGBfYWBgYmJhY2NiZGNjZWRkZmZlZ2ZmaGdnaGhnamlpa2pqa2tqbGxrbm1tb25ub29ucHBvcnFxcnJxc3NydHNzdnV0dnZ1d3d2eHd3eXl4enp5e3t6fHt7fX18fn59f39+gYB/gYGAgoKBg4OChYSDhYWEhoaFh4eGiYiHiYmIioqJi4uKjYyMjY2Mjo6Nj4+OkZCQkpGQkpKRk5OSlZWUlpWVl5aVl5eWmZmYmpqZm5qanJuanZ2cnp6dn5+eoKCfoqGgo6Kho6OipKSjpqalp6amqKenqainqqqpq6uqrKyrra2sr66usK+usbCvsbGws7OytLSztbW0t7e2uLe3ubi3urm4u7u6vLy7vb28vr69wMC/wcHAwsLBw8PCxcXDxsXEx8bFyMfGysnIy8rJzMvKzMzLzs7Nz8/O0NDP0dHQ09PS1NTT1dXU1tbV2NjX2dnY2trZ29va3d3c3t7d39/e4ODf4uLh4+Pi5OTj5uXk6Ofm6ejn6uno6+vp7e3r7u7s7+/u8PDv8vLx8/Py9PTz+P5p9v1n9fxk9Pxi8fpd8Pla7/hX7vdU7PVO6/NL6/JI6vFF6u5A6u0+6us96uo76uc46eY36eQ26eM06eAy6N8x6N0w6Nww6Nku59gt59cs59Ur5tMq5tEp5tAo5c8o5cwm5csm5Mkl5Mgl48Yj48Qj48Mi4sIh4r8g4b4g4b0f4Lsf4Lke37gd37Yd37Uc3rMb3bEa3bAa3a8Z")),
  oxy_r: T(R("3a8Z3bAa3bEa3rMb37Uc37Yd37gd4Lke4Lsf4b0f4b4g4r8g4sIh48Mi48Qj48Yj5Mgl5Mkl5csm5cwm5c8o5tAo5tEp5tMq59Ur59cs59gt6Nku6Nww6N0w6N8x6eAy6eM06eQ26eY36uc46uo76us96u0+6u5A6vFF6/JI6/NL7PVO7vdU7/hX8Pla8fpd9Pxi9fxk9v1n+P5p9PTz8/Py8vLx8PDv7+/u7u7s7e3r6+vp6uno6ejn6Ofm5uXk5OTj4+Pi4uLh4ODf39/e3t7d3d3c29va2trZ2dnY2NjX1tbV1dXU1NTT09PS0dHQ0NDPz8/Ozs7NzMzLzMvKy8rJysnIyMfGx8bFxsXExcXDw8PCwsLBwcHAwMC/vr69vb28vLy7u7u6urm4ubi3uLe3t7e2tbW0tLSzs7OysbGwsbCvsK+ur66ura2srKyrq6uqqqqpqainqKenp6ampqalpKSjo6Oio6KhoqGgoKCfn5+enp6dnZ2cnJuam5qampqZmZmYl5eWl5aVlpWVlZWUk5OSkpKRkpGQkZCQj4+Ojo6NjY2MjYyMi4uKioqJiYmIiYiHh4eGhoaFhYWEhYSDg4OCgoKBgYGAgYB/f39+fn59fX18fHt7e3t6enp5eXl4eHd3d3d2dnZ1dnV0dHNzc3NycnJxcnFxcHBvb29ub25ubm1tbGxra2tqa2pqamlpaGhnaGdnZ2ZmZmZlZWRkZGNjY2NiYmJhYWBgYGBfX19eX15eXV1cXFxbXFtbW1paWVlYWVhYWFdXV1dWVlVVVVRUVFRTU1NTUlFRUVFQUFBQUE9PjxgIjhcIjRUIixMJihEJiRAKiA4KhgwLhQoLhAkMgwgMgQYNfwYNfgUOfQUOegUPeQUPeAUPdgUPcwUPcgYPcQYPbwYPbQYPawYPagYPaAcOZgcOZAcOYwcOYgcNXwcNXQcMXAcMWwcMWAcLVwcLVQcLVAcKUQcJUAcJTwcJTQcISwYISQYHSAYHRwYHRAYGQwYGQQUFQAUF")),
  phase: T(R("qHgNqXcPq3YRrHUTrnQUr3MWsXIYsnEZs3AbtW8dtm4et20guWwiumsju2olvWkmvmgov2cqwGYrwWUtwmQuxGIwxWEyxmAzx181yF43yV04ylw6y1o8zFk+zVg/zldBz1ZD0FRF0FNH0VJJ0lFL009N1E5P1U1R1UtT1kpV10lX2Eda2EZc2UVe2UNh2kJj20Bm2z9o3D1r3Dxt3Tpw3Tlz3Th23jZ43jV73jN+3jKB3zGE3y+H3y6K3y2N3yuQ3yqT3imX3iia3iid3ieg3Saj3Sam3CWp3CWt2yWw2iWz2ia22Sa52Ce81ye+1ijB1SnE1CrH0yvJ0i3M0S7O0C/QzzHTzTLVzDTXyzXZyTfbyDndxjrfxTzhwz7iwj/kwEHlvkPnvUXou0bpuUjruErstkvttE3usk/vsFDvrlLwrFTxqlXxqVfyp1nzpFrzolzzoF30nl/0nGD0mmL0mGP0lWX0k2b0kWj0j2n0jGvzimzzh23zhW/ygnDxgHHxfXPwe3TveHXvdnfuc3jtcHnsbnrra3vpaHzoZn7nY3/mYIDkXYHjWoLhWIPfVYTeUoXcT4baTYfYSofXR4jVRYnTQorRQIrPPYvNO4zLOIzJNo3HNI7EMo7CMI/ALo++LJC8KpC6KJG4J5G2JZG0JJKyI5KwIZKuIJOsH5OqHpOoHZSmHJSkG5SiGpSgGZWeGZWcGJWaF5WYFpaWFZaUFJaSFJaQE5eOEpeMEZeKEJeID5eGDpiEDZiCDZiADJh+DJh8C5l5C5l3C5l1DJlzDZlwDpluD5prEZppE5pmFZpjF5phGZpeHJpbH5pYIZpVJJpSJ5pPK5pMLppJMZlGNZlDOJlAPJk8QJg5Q5g2R5cyS5cvT5YsU5YpVpUmWpQjXpQgYZMeZZIbaJEZa5AXb5AWco8UdI4Td40SeowRfYsQf4sPgooPhIkOhogOiIcOi4YNjYUNj4QNkYMNk4MNlYINl4ENmYANm38NnX4Nn30NoXwNonsNpHoNpnkNqHgN")),
  phase_r: T(R("qHgNpnkNpHoNonsNoXwNn30NnX4Nm38NmYANl4ENlYINk4MNkYMNj4QNjYUNi4YNiIcOhogOhIkOgooPf4sPfYsQeowRd40SdI4Tco8Ub5AWa5AXaJEZZZIbYZMeXpQgWpQjVpUmU5YpT5YsS5cvR5cyQ5g2QJg5PJk8OJlANZlDMZlGLppJK5pMJ5pPJJpSIZpVH5pYHJpbGZpeF5phFZpjE5pmEZppD5prDpluDZlwDJlzC5l1C5l3C5l5DJh8DJh+DZiADZiCDpiED5eGEJeIEZeKEpeME5eOFJaQFJaSFZaUFpaWF5WYGJWaGZWcGZWeGpSgG5SiHJSkHZSmHpOoH5OqIJOsIZKuI5KwJJKyJZG0J5G2KJG4KpC6LJC8Lo++MI/AMo7CNI7ENo3HOIzJO4zLPYvNQIrPQorRRYnTR4jVSofXTYfYT4baUoXcVYTeWIPfWoLhXYHjYIDkY3/mZn7naHzoa3vpbnrrcHnsc3jtdnfueHXve3TvfXPwgHHxgnDxhW/yh23zimzzjGvzj2n0kWj0k2b0lWX0mGP0mmL0nGD0nl/0oF30olzzpFrzp1nzqVfyqlXxrFTxrlLwsFDvsk/vtE3utkvtuErsuUjru0bpvUXovkPnwEHlwj/kwz7ixTzhxjrfyDndyTfbyzXZzDTXzTLVzzHT0C/Q0S7O0i3M0yvJ1CrH1SnE1ijB1ye+2Ce82Sa52ia22iWz2yWw3CWt3CWp3Sam3Saj3ieg3iid3iia3imX3yqT3yuQ3y2N3y6K3y+H3zGE3jKB3jN+3jV73jZ43Th23Tlz3Tpw3Dxt3D1r2z9o20Bm2kJj2UNh2UVe2EZc2Eda10lX1kpV1UtT1U1R1E5P009N0lFL0VJJ0FNH0FRFz1ZDzldBzVg/zFk+y1o8ylw6yV04yF43x181xmAzxWEyxGIwwmQuwWUtwGYrv2cqvmgovWkmu2olumsjuWwit20gtm4etW8ds3AbsnEZsXIYr3MWrnQUrHUTq3YRqXcPqHgN")),
  rain: T(R("7u3z7uzx7evw7Oru6+ns6+jr6ufp6ebo6OXm6OTl5+Pj5uLi5eHg5N/f5N7d493c49za4tvY4trW4dnU4NjT4NfR39bP39XN3tTL3tPJ3dHH3dDF3M/D3M7B282/28y+28u82sq62sm42ci22Me02May18Ww18Su1sOs1cKq1cGo1MCm07+k0r+i0b6g0L2ez7yczbybzLuZy7qYybqWyLmVxrmUxLiSw7eRwbeQwLaPvraOvLWNurWNubSMt7OLtbOKtLKJsrKJsLGIrrGHrbCHq7CGqa+FqK6Fpq6EpK2Eoq2DoayCn6yCnauBnKqBmqqAmKmAlql/lah+k6h+kad9kKd9jqZ8jKV8iqV7iaR7h6R6haN6g6N5gqJ4gKF4fqF3fKB3eqB2eZ92d591dZ51c511cZ10b5x0bZxza5tzaZtyZ5pyZZpyZJlxYZhxX5hxXZdwW5dwWZZwV5VvVZVvU5RvUZRvT5NuTJNuSpJuSJFuRpFuQ5BuQY9uP49uPY5uOo1tOI1tNoxtNIttMYtuL4puLYluK4luKYhuJoduJIZuIoZuIIVuHoRuHINuG4JuGYFuF4FuFYBuFH9uEn5uEX1uD3xuDnxuDHtuC3puCnluCXhuCHduB3ZuBnVuBnRuBXRuBXNuBHJuBHFuBHBtA29tA25tA21tA2xtBGttBGttBGpsBGlsBWhsBWdsBmZsB2VrB2RrCGNrCWJrCmFqC2BqDF9qDV9pDl5pD11pEFxoEVtoElpnE1lnFFhnFVdmFlZmFlVlF1RlGFNkGVJkGlFjGlBjG09iHE5hHE1hHUxgHktfHkpfH0leH0hdIEhdIUdcIUZbIUVaIkRaIkNZI0JYI0FXI0BWJD9WJD5VJD1UJDxTJDtSJTpRJTlRJThQJTdPJTdOJTZNJTVMJTRMJTNLJTJKJTFJJTBIJS9IJS5HJS1GJSxFJStFJSpEJClDJChCJCdCJCdBJCZAJCU/IyQ/IyM+IyI9IyE9IyA8Ih87Ih46Ih06Ihw5Ihs4")),
  rain_r: T(R("Ihs4Ihw5Ih06Ih46Ih87IyA8IyE9IyI9IyM+IyQ/JCU/JCZAJCdBJCdCJChCJClDJSpEJStFJSxFJS1GJS5HJS9IJTBIJTFJJTJKJTNLJTRMJTVMJTZNJTdOJTdPJThQJTlRJTpRJDtSJDxTJD1UJD5VJD9WI0BWI0FXI0JYIkNZIkRaIUVaIUZbIUdcIEhdH0hdH0leHkpfHktfHUxgHE1hHE5hG09iGlBjGlFjGVJkGFNkF1RlFlVlFlZmFVdmFFhnE1lnElpnEVtoEFxoD11pDl5pDV9pDF9qC2BqCmFqCWJrCGNrB2RrB2VrBmZsBWdsBWhsBGlsBGpsBGttBGttA2xtA21tA25tA29tBHBtBHFuBHJuBXNuBXRuBnRuBnVuB3ZuCHduCXhuCnluC3puDHtuDnxuD3xuEX1uEn5uFH9uFYBuF4FuGYFuG4JuHINuHoRuIIVuIoZuJIZuJoduKYhuK4luLYluL4puMYtuNIttNoxtOI1tOo1tPY5uP49uQY9uQ5BuRpFuSJFuSpJuTJNuT5NuUZRvU5RvVZVvV5VvWZZwW5dwXZdwX5hxYZhxZJlxZZpyZ5pyaZtya5tzbZxzb5x0cZ10c511dZ51d591eZ92eqB2fKB3fqF3gKF4gqJ4g6N5haN6h6R6iaR7iqV7jKV8jqZ8kKd9kad9k6h+lah+lql/mKmAmqqAnKqBnauBn6yCoayCoq2DpK2Epq6EqK6Fqa+Fq7CGrbCHrrGHsLGIsrKJtLKJtbOKt7OLubSMurWNvLWNvraOwLaPwbeQw7eRxLiSxrmUyLmVybqWy7qYzLuZzbybz7yc0L2e0b6g0r+i07+k1MCm1cGo1cKq1sOs18Su18Ww2May2Me02ci22sm42sq628u828y+282/3M7B3M/D3dDF3dHH3tPJ3tTL39XN39bP4NfR4NjT4dnU4trW4tvY49za493c5N7d5N/f5eHg5uLi5+Pj6OTl6OXm6ebo6ufp6+jr6+ns7Oru7evw7uzx7u3z")),
  solar: T(R("MxQYNRQYNhUZNxUZOBUaOhYaOxYbPBcbPRccPhgcQBgdQRgdQhkdQxkeRRoeRhofRxofSBsfShsgSxsgTBwgTRwhTxwhUB0hUR0iUh4iVB4iVR4iVh8jVx8jWR8jWiAjWyAjXCAkXiEkXyEkYCEkYSIkYyIkZCIkZSMkZiMlaCMlaSQlaiQlayQlbSUlbiUlbyUlcCYlciYlcyckdCckdSckdygkeCgkeSkkeikkeyokfCojfisjfysjgCwjgSwigi0igy0ihC4ihS4hhy8hiDAhiTAhijEgizEgjDIgjTMfjjQfjzQfkDUekTYekjYekzcdkzgdlDkdlTodljoclzscmDwcmT0bmj4bmj8bm0AanEAanUEankIan0MZn0QZoEUZoUYZokcYo0gYo0kYpEoYpUoXpksXpkwXp00XqE4WqE8WqVAWqlEWq1IWq1MVrFQVrVUVrVYVrlcVr1gUr1kUsFoUsVsUsVwUsl0Usl4Us18UtGATtGETtWITtmMTtmQTt2UTt2YTuGgTuGkTuWoTumsTumwTu20Tu24TvG8TvHATvXETvnITvnMTv3QTv3UTwHYTwHcUwXkUwXoUwnsUwnwUw30Uw34VxH8VxIAVxYEVxYIVxoQWxoUWx4YWx4cWx4gXyIkXyIoXyYsYyYwYyo4Yyo8Zy5AZy5EZy5IazJMazJQazZYbzZcbzpgczpkczpocz5sdz5wd0J4e0J8e0KAf0aEf0aIg0aQg0qUg0qYh06ch06gi06ki1Ksj1Kwk1K0k1a4l1a8l1bEm1rIm1rMn1rQn17Uo17co17gp17kq2Loq2Lwr2L0r2b4s2b8s2cEt2cIu2sMu2sQv2sYv2scw28gx28kx28sy28wy3M0z3M403NA03NE13dI23dQ23dU33dY33dc43tk53to53ts63t073t473t883+E93+I93+M+3+U/3+Y/3+dA3+lB4OpB4OtC4O1D4O5D4PBE4PFF4PJF4PRG4PVH4PZH4PhI4PlJ4PtJ4fxK4f1L")),
  solar_r: T(R("4f1L4fxK4PtJ4PlJ4PhI4PZH4PVH4PRG4PJF4PFF4PBE4O5D4O1D4OtC4OpB3+lB3+dA3+Y/3+U/3+M+3+I93+E93t883t473t073ts63to53tk53dc43dY33dU33dQ23dI23NE13NA03M403M0z28wy28sy28kx28gx2scw2sYv2sQv2sMu2cIu2cEt2b8s2b4s2L0r2Lwr2Loq17kq17gp17co17Uo1rQn1rMn1rIm1bEm1a8l1a4l1K0k1Kwk1Ksj06ki06gi06ch0qYh0qUg0aQg0aIg0aEf0KAf0J8e0J4ez5wdz5sdzpoczpkczpgczZcbzZYbzJQazJMay5Iay5EZy5AZyo8Zyo4YyYwYyYsYyIoXyIkXx4gXx4cWx4YWxoUWxoQWxYIVxYEVxIAVxH8Vw34Vw30UwnwUwnsUwXoUwXkUwHcUwHYTv3UTv3QTvnMTvnITvXETvHATvG8Tu24Tu20TumwTumsTuWoTuGkTuGgTt2YTt2UTtmQTtmMTtWITtGETtGATs18Usl4Usl0UsVwUsVsUsFoUr1kUr1gUrlcVrVYVrVUVrFQVq1MVq1IWqlEWqVAWqE8WqE4Wp00XpkwXpksXpUoXpEoYo0kYo0gYokcYoUYZoEUZn0QZn0MZnkIanUEanEAam0Aamj8bmj4bmT0bmDwclzscljoclTodlDkdkzgdkzcdkjYekTYekDUejzQfjjQfjTMfjDIgizEgijEgiTAhiDAhhy8hhS4hhC4igy0igi0igSwigCwjfysjfisjfCojeyokeikkeSkkeCgkdygkdSckdCckcyckciYlcCYlbyUlbiUlbSUlayQlaiQlaSQlaCMlZiMlZSMkZCIkYyIkYSIkYCEkXyEkXiEkXCAkWyAjWiAjWR8jVx8jVh8jVR4iVB4iUh4iUR0iUB0hTxwhTRwhTBwgSxsgShsgSBsfRxofRhofRRoeQxkeQhkdQRgdQBgdPhgcPRccPBcbOxYbOhYaOBUaNxUZNhUZNRQYMxQY")),
  speed: T(R("//3N/vzL/vrJ/fnH/PjF/PfC+/bA+vS++fO8+fK6+PG49/C29+609u2x9uyv9eut9Oqr8+mp8+en8ual8eWi8eSg8OOe7+Kc7+Ga7t+Y7d6W7d2T7NyR69uP6tqN6tmL6diJ6NeG59aE59WC5tSA5dN+5NJ749B548934s514c1z4M1x38xu3sts3cpq3Mlo28hm2sdk2cZh2MVf18Rd1sNb1cJZ1MFX08FV0sBT0b9R0L5Pzr1Mzb1KzLxIy7tGybpFyLlDx7lBxbg/xLc9w7c7wbY5wLU3vrQ2vbQ0u7MyurIwuLIvt7EttbArtLAqsq8osa4nr64lra0jrK0iqqwgqasfp6sepaocpKkboqkZoKgYn6gXnacVm6YUmqYTmKUSlqUQlaQPk6MOkaMNj6IMjqILjKEKiqAJiKAIh58IhZ8Hg54HgZ0GgJ0GfpwGfJwGepsGeZoGd5oGdZkGc5kGcZgGcJcHbpcHbJYHapUIaJUJZpQJZZQKY5MLYZILX5IMXZENXJAOWpAPWI8PVo4QVI4RUo0SUYwST4wTTYsUS4oVSYoWSIkWRogXRIgYQocZQIYZP4UaPYUbO4QcOYMcOIMdNoIeNIEeMoAfMX8gL38gLX4hLH0hKnwiKHwjJ3sjJXokJHkkInglIXglH3cmHnYmHHUnG3QnGnMnGHMoF3IoFnEpFXApE28pEm4qEW0qEGwqD2wrD2srDmorDWkrDWgrDGcsDGYsC2UsC2QsC2MsC2MsC2ItC2EtC2AtC18tC14tDF0tDFwtDFstDVotDVktDlgtDlctD1YsD1UsEFQsEFQsEFMsEVIsEVEsElArEk8rE04rE00rFEwqFEsqFEoqFUkqFUgpFkcpFkYpFkUoF0QoF0MnF0InF0EnGEAmGD8mGD8lGD4lGT0kGTwkGTsjGTojGTkiGTgiGTchGTYhGTUgGTQfGTMfGTIeGTEeGTAdGS8cGS4cGS0bGSwaGSwZGSsZGSoYGCkXGCgXGCcWGCYVGCUUFyQTFyMT")),
  speed_r: T(R("FyMTFyQTGCUUGCYVGCcWGCgXGCkXGSoYGSsZGSwZGSwaGS0bGS4cGS8cGTAdGTEeGTIeGTMfGTQfGTUgGTYhGTchGTgiGTkiGTojGTsjGTwkGT0kGD4lGD8lGD8mGEAmF0EnF0InF0MnF0QoFkUoFkYpFkcpFUgpFUkqFEoqFEsqFEwqE00rE04rEk8rElArEVEsEVIsEFMsEFQsEFQsD1UsD1YsDlctDlgtDVktDVotDFstDFwtDF0tC14tC18tC2AtC2EtC2ItC2MsC2MsC2QsC2UsDGYsDGcsDWgrDWkrDmorD2srD2wrEGwqEW0qEm4qE28pFXApFnEpF3IoGHMoGnMnG3QnHHUnHnYmH3cmIXglInglJHkkJXokJ3sjKHwjKnwiLH0hLX4hL38gMX8gMoAfNIEeNoIeOIMdOYMcO4QcPYUbP4UaQIYZQocZRIgYRogXSIkWSYoWS4oVTYsUT4wTUYwSUo0SVI4RVo4QWI8PWpAPXJAOXZENX5IMYZILY5MLZZQKZpQJaJUJapUIbJYHbpcHcJcHcZgGc5kGdZkGd5oGeZoGepsGfJwGfpwGgJ0GgZ0Gg54HhZ8Hh58IiKAIiqAJjKEKjqILj6IMkaMNk6MOlaQPlqUQmKUSmqYTm6YUnacVn6gXoKgYoqkZpKkbpaocp6seqasfqqwgrK0ira0jr64lsa4nsq8otLAqtbArt7EtuLIvurIwu7MyvbQ0vrQ2wLU3wbY5w7c7xLc9xbg/x7lByLlDybpFy7tGzLxIzb1Kzr1M0L5P0b9R0sBT08FV1MFX1cJZ1sNb18Rd2MVf2cZh2sdk28hm3Mlo3cpq3sts38xu4M1x4c1z4s51489349B55NJ75dN+5tSA59WC59aE6NeG6diJ6tmL6tqN69uP7NyR7d2T7d6W7t+Y7+Ga7+Kc8OOe8eSg8eWi8ual8+en8+mp9Oqr9eut9uyv9u2x9+609/C2+PG4+fK6+fO8+vS++/bA/PfC/PjF/fnH/vrJ/vzL//3N")),
  tarn: T(R("FyMOGCUOGScOGykPHCoPHSwPHy4QIDAQITEQIjMQIzUQJTcQJjgQJzoQKDwQKj0QKz8PLEEPLkIPL0QOMEYOMkcNNEkMNkoMOUsMPE0NP04OQk8PRFAQR1ERSlMSTVQTT1UUUlYVVVcWV1gXWlkYXVsZYFwaYl0aZV4baF8ca2AdbWEecGIfc2MgdmQheGYhe2cifmgjgWkkhGolhmsmiWwnjG0nj24okm8plXAqmHErm3IsnnMtoHQuo3UvpnYwqXcxrHgyr3kzsno1tXs2uHw3u305vn46wX88xIA+xoFByYJEy4RIzIZMzYhPzopTz4xX0I9a0ZFd0pNh0pZk05ho1Jpr1Zxv1p9y16F12KN52aZ82qiA26qD262H3K+K3bGO3rOR37aV4LiY4bqc4r2f47+j5MGm5cSq5sat58ix6Mu06c246tC769K/7NTC7dfG79nJ8NvN8d7R8uDU8+PY9OXb9ujf9+ri+Ozl+e/p+vHs+/Pv/PXy/Pb0/Pf2/Pf2/Pf1+/bz+/Xw+fTt+PLq9vDn9O7j8uzg8Orc7+jY7ebV6+TR6eLN59/K5d3G49vC4dm/39e73da42tS019Ky1NGv0c+tzs6ry8yqx8uoxMmnwcimvsalusSkt8OjtMGiscChrr6gq72fqLuepbmdoricn7abnLWambOZl7KYlLCXka6Wjq2Vi6uUiKqThaiSgqeSf6WRfKSQeaKPdqGOc5+NcJ6MbZyLapuKZ5qJZJiJYZeIXpWHWpSGV5KFVJGFUY+ETo6DSoyDR4uCRImCQYiBPYaAOoWAN4N/NIF/MYB+Ln5+LHx9Knt9J3l8JXd8JHV7InR6IXJ6IHB5IG54H2x3H2p2Hml2Hmd1HWV0HWNzHGFyHF9xG11wGlxvGlpvGVhuGFZtGFRsF1NrFlFrFU9qFE1pE0toEkloEUhnEEZmEERlD0JlDkBkDT5jDDxjCztiCjliCTdhCTVgCTNgCTFfCi9eCy1dDCpbDShZDiZYDiRWDyJUDyBSEB5P")),
  tarn_r: T(R("EB5PDyBSDyJUDiRWDiZYDShZDCpbCy1dCi9eCTFfCTNgCTVgCTdhCjliCztiDDxjDT5jDkBkD0JlEERlEEZmEUhnEkloE0toFE1pFU9qFlFrF1NrGFRsGFZtGVhuGlpvGlxvG11wHF9xHGFyHWNzHWV0Hmd1Hml2H2p2H2x3IG54IHB5IXJ6InR6JHV7JXd8J3l8Knt9LHx9Ln5+MYB+NIF/N4N/OoWAPYaAQYiBRImCR4uCSoyDTo6DUY+EVJGFV5KFWpSGXpWHYZeIZJiJZ5qJapuKbZyLcJ6Mc5+NdqGOeaKPfKSQf6WRgqeShaiSiKqTi6uUjq2Vka6WlLCXl7KYmbOZnLWan7aboricpbmdqLueq72frr6gscChtMGit8OjusSkvsalwcimxMmnx8uoy8yqzs6r0c+t1NGv19Ky2tS03da439e74dm/49vC5d3G59/K6eLN6+TR7ebV7+jY8Orc8uzg9O7j9vDn+PLq+fTt+/Xw+/bz/Pf1/Pf2/Pf2/Pb0/PXy+/Pv+vHs+e/p+Ozl9+ri9ujf9OXb8+PY8uDU8d7R8NvN79nJ7dfG7NTC69K/6tC76c246Mu058ix5sat5cSq5MGm47+j4r2f4bqc4LiY37aV3rOR3bGO3K+K262H26qD2qiA2aZ82KN516F11p9y1Zxv1Jpr05ho0pZk0pNh0ZFd0I9az4xXzopTzYhPzIZMy4RIyYJExoFBxIA+wX88vn46u305uHw3tXs2sno1r3kzrHgyqXcxpnYwo3UvoHQunnMtm3IsmHErlXAqkm8pj24ojG0niWwnhmsmhGolgWkkfmgje2cieGYhdmQhc2MgcGIfbWEea2AdaF8cZV4bYl0aYFwaXVsZWlkYV1gXVVcWUlYVT1UUTVQTSlMSR1ERRFAQQk8PP04OPE0NOUsMNkoMNEkMMkcNMEYOL0QOLkIPLEEPKz8PKj0QKDwQJzoQJjgQJTcQIzUQIjMQITEQIDAQHy4QHSwPHCoPGykPGScOGCUOFyMO")),
  tempo: T(R("//b0/fXz/PTx+/Pw+fLu+PHt9/Dr9e/q9O7o8u3n8ezl8Ovk7uri7erh6+nf6uje6efd5+bb5uXa5OTY4+PX4uLW4OLU3+HT3eDR3N/Q297P2d3N2N3M1tzL1dvJ09rI0tnH0djFz9jEztfDzNbBy9XAydS/yNS+xtO8xdK7w9G6wtG5wNC3v8+2vc61vM60us2zucyyt8uwtsuvtMqus8mtscissMirrseqrMapq8WoqcWmqMSlpsOkpMOjo8KiocGhoMCgnsCfnL+fm76emb6dl72clryblLyakruZkbqYj7qXjbmXi7iWireViLeUhraThbWTg7WSgbSRf7OQfbOQfLKPerGOeLGOdrCNdK+Ncq+Mca6Lb62Lba2Ka6yKaauJZ6uJZaqIY6mIYamHX6iHXaeGW6aGWaaFV6WFVqSFVKSEUqOEUKKETqGDS6GDSaCDR5+CRZ+CQ56CQZ2CP5yBPZyBO5uBOpqBOJmBNpiANJiAMpeAMJaALpWALJR/KpN/KZN/J5J/JZF/JJB/Io9+IY5+H41+Ho1+HIx+G4t9Gop9GYl9F4h9Fod8FoZ8FYV8FIR8E4R7E4N7EoJ7EoF7EYB6EX96EX56EX15EXx5EXt5EXp4EXl4EXh4EXd3EXZ3EnZ2EnV2EnR2E3N1E3J1E3F0FHB0FG9zFG5zFW1zFWxyFmtyFmpxFmlxF2hwF2dwF2ZvGGVvGGVuGGRuGWNtGWJtGWFsGWBsGl9rGl5rGl1qGlxqGltpG1poG1loG1hnG1hnG1dmG1ZmHFVlHFRlHFNkHFJjHFFjHFBiHE9iHE5hHE1hHExgHExfHEtfHEpeHEleHEhdHEddHEZcHEVbHERbHENaHEJaHEJZHEFYHEBYGz9XGz5XGz1WGzxWGztVGzpUGzlUGzhTGjdTGjZSGjZRGjVRGjRQGjNQGTJPGTFPGTBOGS9NGS5NGC1MGCxMGCtLGCpLGClKFyhKFydJFyZIFyVIFyRHFiNHFiJGFiFGFiBFFR9FFR5EFR1E")),
  tempo_r: T(R("FR1EFR5EFR9FFiBFFiFGFiJGFiNHFyRHFyVIFyZIFydJFyhKGClKGCpLGCtLGCxMGC1MGS5NGS9NGTBOGTFPGTJPGjNQGjRQGjVRGjZRGjZSGjdTGzhTGzlUGzpUGztVGzxWGz1WGz5XGz9XHEBYHEFYHEJZHEJaHENaHERbHEVbHEZcHEddHEhdHEleHEpeHEtfHExfHExgHE1hHE5hHE9iHFBiHFFjHFJjHFNkHFRlHFVlG1ZmG1dmG1hnG1hnG1loG1poGltpGlxqGl1qGl5rGl9rGWBsGWFsGWJtGWNtGGRuGGVuGGVvF2ZvF2dwF2hwFmlxFmpxFmtyFWxyFW1zFG5zFG9zFHB0E3F0E3J1E3N1EnR2EnV2EnZ2EXZ3EXd3EXh4EXl4EXp4EXt5EXx5EX15EX56EX96EYB6EoF7EoJ7E4N7E4R7FIR8FYV8FoZ8Fod8F4h9GYl9Gop9G4t9HIx+Ho1+H41+IY5+Io9+JJB/JZF/J5J/KZN/KpN/LJR/LpWAMJaAMpeANJiANpiAOJmBOpqBO5uBPZyBP5yBQZ2CQ56CRZ+CR5+CSaCDS6GDTqGDUKKEUqOEVKSEVqSFV6WFWaaFW6aGXaeGX6iHYamHY6mIZaqIZ6uJaauJa6yKba2Kb62Lca6Lcq+MdK+NdrCNeLGOerGOfLKPfbOQf7OQgbSRg7WShbWThraTiLeUireVi7iWjbmXj7qXkbqYkruZlLyalrybl72cmb6dm76enL+fnsCfoMCgocGho8KipMOjpsOkqMSlqcWmq8WorMaprseqsMirsciss8mttMqutsuvt8uwucyyus2zvM60vc61v8+2wNC3wtG5w9G6xdK7xtO8yNS+ydS/y9XAzNbBztfDz9jE0djF0tnH09rI1dvJ1tzL2N3M2d3N297P3N/Q3eDR3+HT4OLU4uLW4+PX5OTY5uXa5+bb6efd6uje6+nf7erh7uri8Ovk8ezl8u3n9O7o9e/q9/Dr+PHt+fLu+/Pw/PTx/fXz//b0")),
  thermal: T(R("BCMzBCQ1BCU3BCU5BSY7BSc9BSc/BShBBSlDBilFBipHBitJBytLByxNByxQCC1SCC5UCS5WCS9ZCi9bCzBdDDBgDDBiDTFlDjFnDzJqEDJsEjJvEzNyFDN0FjN3FzN6GTN8GjR/HDSCHjSEHzSHITSKIzSMJTSPJzSRKjOTLDOVLjOXMDOZMzObNTOcNzOdOTOePDOfPjSfQDSfQjSgRDWgRjWgRzagSTafSzefTTefTjieUDmeUjmdUzqdVTudVjucWDycWT2bWz2bXD6aXj+aXz+ZYECZYkGYY0GYZUKXZkOXZ0OWaUSWakWVbEWVbUaUbkeUcEeUcUiTckiTdEmSdUqSdkqSeEuReUuRekyRfE2QfU2Qfk6QgE6PgU+Pg1CPhFCOhVGOh1GOiFKNiVKNi1ONjFOMjlSMj1SMkFWLklWLk1aLlVaKlleKl1eKmViJmliJnFmJnVmIn1qIoFqHoluHo1uGpVyGplyGqF2FqV2Eq12ErF6Drl6Dr1+CsV+CsmCBtGCAtWGAt2F/uGJ+umJ+u2J9vWN8vmN7wGR7wWR6w2V5xGV4xmZ3x2Z2yWd1ymd0zGhzzWhyzmlx0Glw0Wpv02pu1Gtt1mxs12xr2G1q2m5p225o3G9m3nBl33Bk4HFj4XJi43Jg5HNf5XRe5nVd53Zb6Hda6nhZ63lY7HlW7XpV7ntU7n1T735S8H9Q8YBP8oFO84JN84NM9IVL9YZK9YdJ9ohI9opH94tG94xF+I5E+I9D+ZFD+ZJC+ZNB+pVB+pZA+pg/+5k/+5s++5w++54++589+6E9/KM9/KQ9/KY8/Kc8/Kk8/Ko8/Kw8/K48/K88/LE8+7I9+7Q9+7Y9+7c9+7k++7s++7w++r4/+r8/+sFA+sNA+cRB+cZB+chC+MlD+MtD+M1E985F99BF99JG9tNH9tVH9ddI9dhJ9NpK9NxL891L899M8uFN8uJO8eRP8eZQ8OhR7+lR7+tS7u1T7e5U7fBV7PJW6/RX6vVY6vdZ6fla6Ppb")),
  thermal_r: T(R("6Ppb6fla6vdZ6vVY6/RX7PJW7fBV7e5U7u1T7+tS7+lR8OhR8eZQ8eRP8uJO8uFN899M891L9NxL9NpK9dhJ9ddI9tVH9tNH99JG99BF985F+M1E+MtD+MlD+chC+cZB+cRB+sNA+sFA+r8/+r4/+7w++7s++7k++7c9+7Y9+7Q9+7I9/LE8/K88/K48/Kw8/Ko8/Kk8/Kc8/KY8/KQ9/KM9+6E9+589+54++5w++5s++5k/+pg/+pZA+pVB+ZNB+ZJC+ZFD+I9D+I5E94xF94tG9opH9ohI9YdJ9YZK9IVL84NM84JN8oFO8YBP8H9Q735S7n1T7ntU7XpV7HlW63lY6nhZ6Hda53Zb5nVd5XRe5HNf43Jg4XJi4HFj33Bk3nBl3G9m225o2m5p2G1q12xr1mxs1Gtt02pu0Wpv0GlwzmlxzWhyzGhzymd0yWd1x2Z2xmZ3xGV4w2V5wWR6wGR7vmN7vWN8u2J9umJ+uGJ+t2F/tWGAtGCAsmCBsV+Cr1+Crl6DrF6Dq12EqV2EqF2FplyGpVyGo1uGoluHoFqHn1qInVmInFmJmliJmViJl1eKlleKlVaKk1aLklWLkFWLj1SMjlSMjFOMi1ONiVKNiFKNh1GOhVGOhFCOg1CPgU+PgE6Pfk6QfU2QfE2QekyReUuReEuRdkqSdUqSdEmSckiTcUiTcEeUbkeUbUaUbEWVakWVaUSWZ0OWZkOXZUKXY0GYYkGYYECZXz+ZXj+aXD6aWz2bWT2bWDycVjucVTudUzqdUjmdUDmeTjieTTefSzefSTafRzagRjWgRDWgQjSgQDSfPjSfPDOfOTOeNzOdNTOcMzObMDOZLjOXLDOVKjOTJzSRJTSPIzSMITSKHzSHHjSEHDSCGjR/GTN8FzN6FjN3FDN0EzNyEjJvEDJsDzJqDjFnDTFlDDBiDDBgCzBdCi9bCS9ZCS5WCC5UCC1SByxQByxNBytLBitJBipHBilFBSlDBShBBSc/BSc9BSY7BCU5BCU3BCQ1BCMz")),
  topo: T(R("KBosKRwvKx0yLB80LSA3LyI6MCM9MSVAMiZDNChGNSlJNipMNyxPOC1SOS9VOjBYOzJcPDNfPTViPjZmPzhpPzlsQDtwQDxzQT52QUB6QUF9QkOAQUWDQUeFQUmIQUuKQE2MQE+NP1KPP1SQPlaRPliSPlqSPlyTPl+TPmGUPmOUPmWVPmeVPmmWPmuWP22XP2+XQHGXQHOYQHWYQXeZQnmZQnuZQ32aQ3+aRIGbRIObRYWcRoecRomdR4udSI2dSI+eSZGeSpOfSpWfS5egTJmgTZuhTZ2hTp+hT6GiUKOiUaWiUaejUqmjU6ujVa2jVq+kV7GkWLOkWrakW7ikXbqkX7ykYb6kY8CkZcKkZ8OkasWkbcejcMmjc8ujds2jes6jfdCjgdKjhdOjidWjjdejktikltqkmtuln92lo96mp+CnrOGosOKpteSqueWsveetweivxuqwyuuyzuyz0u611++32/G53/K74/S95/W/6/fB7/jE8/rG9/vI+/3LDSUUDicVDykVECoWESwXEi4XEzAYFDIYFTMZFjUaFzcaFzkbGDobGTwcGj4cG0AcG0EdHEMdHUUdHkceH0geIEoeIUweI04eJU8eJ1EeKlIeLVMfMFUgM1YiNlcjOVglPFomP1soQVwqRF0rR18tSWAvTGEwTmIxUWMzVGU0VmY1WWc2XGg3Xmo4YWs5ZGw6Zm06aW87a3A8bnE8cXI9c3Q9dnU+eXY+e3c+fnk/gXo/g3s/hnw/iX5AjH9AjoBAkYFAlINAloRAmYVAnIZAn4hAoYlApIo/p4w/qo0/rY4/sI8/s5E/tpI/uZM+vJQ+v5U/wZdBw5lFxJtIxZ1Mxp9Qx6FTyKNXyqVay6dezKlhzatlzq1oz7Bs0LJv0bRz0rZ207h61Lt91b2B1r+E18GI2MOL2saP28iS3MqW3cyZ3s+d39Gg4NOk4tWn49ir5Nqu5dyy5t+26OG56eO96ubA7OjE7erH7u3L8O/P8fHS8vTW9PbZ9fnd9/vh+f3k")),
  topo_r: T(R("+f3k9/vh9fnd9PbZ8vTW8fHS8O/P7u3L7erH7OjE6ubA6eO96OG55t+25dyy5Nqu49ir4tWn4NOk39Gg3s+d3cyZ3MqW28iS2saP2MOL18GI1r+E1b2B1Lt907h60rZ20bRz0LJvz7Bszq1ozatlzKlhy6deyqVayKNXx6FTxp9QxZ1MxJtIw5lFwZdBv5U/vJQ+uZM+tpI/s5E/sI8/rY4/qo0/p4w/pIo/oYlAn4hAnIZAmYVAloRAlINAkYFAjoBAjH9AiX5Ahnw/g3s/gXo/fnk/e3c+eXY+dnU+c3Q9cXI9bnE8a3A8aW87Zm06ZGw6YWs5Xmo4XGg3WWc2VmY1VGU0UWMzTmIxTGEwSWAvR18tRF0rQVwqP1soPFomOVglNlcjM1YiMFUgLVMfKlIeJ1EeJU8eI04eIUweIEoeH0geHkceHUUdHEMdG0EdG0AcGj4cGTwcGDobFzkbFzcaFjUaFTMZFDIYEzAYEi4XESwXECoWDykVDicVDSUU+/3L9/vI8/rG7/jE6/fB5/W/4/S93/K72/G51++30u61zuyzyuuyxuqwweivveetueWsteSqsOKprOGop+Cno96mn92lmtulltqkktikjdejidWjhdOjgdKjfdCjes6jds2jc8ujcMmjbcejasWkZ8OkZcKkY8CkYb6kX7ykXbqkW7ikWrakWLOkV7GkVq+kVa2jU6ujUqmjUaejUaWiUKOiT6GiTp+hTZ2hTZuhTJmgS5egSpWfSpOfSZGeSI+eSI2dR4udRomdRoecRYWcRIObRIGbQ3+aQ32aQnuZQnmZQXeZQHWYQHOYQHGXP2+XP22XPmuWPmmWPmeVPmWVPmOUPmGUPl+TPlyTPlqSPliSPlaRP1SQP1KPQE+NQE2MQUuKQUmIQUeFQUWDQkOAQUF9QUB6QT52QDxzQDtwPzlsPzhpPjZmPTViPDNfOzJcOjBYOS9VOC1SNyxPNipMNSlJNChGMiZDMSVAMCM9LyI6LSA3LB80Kx0yKRwvKBos")),
  turbid: T(R("6far6PWq6POo5/Kn5vGl5vCk5e+i5e6h5Oyf5Oue4+qc4+mb4uia4ueY4eWX4OSV4OOU3+KS3+GR3uCP3t+O3d2N3dyL3NuK3NqI29mH29iG2teE2tWD2dSC2dOA2dJ/2NF+2NB8189718561sx41st31cp21cl01Mhz1Mdy08Zx08Vv08Nu0sJt0sFs0cBr0b9p0L5o0L1nz7xmz7tlz7pkzrhizrdhzbZgzbVfzLRezLNdy7Jcy7FbyrBayq9Zyq5YyaxXyatWyKpVyKlUx6hTx6dSxqZRxqVRxaRQxaNPxKJOxKFNw6BNw59Mwp5LwpxKwZtKwZpJwJlIwJhIv5dHv5ZHvpVGvZRFvZNFvJJEvJFEu5BDu49Duo5CuY1CuYxCuItBt4pBt4lAtolAtohAtYdAtIY/s4U/s4Q/soM+sYI+sYE+sIA+r389r349rn09rX09rHw9rHs9q3o8qnk8qXg8qHc8qHc8p3Y8pnU8pXQ8pHM7pHI7o3I7onE7oXA7oG87n247nm47nm07nWw7nGs7m2s7mmo7mWk7mGg7l2g6lmc6lmY6lWU6lGU6k2Q6kmM6kWI6kGI6j2E6jmA6jWA6jF86i146il46iV06iFw6h1w5hls5hVo5hFo5g1k5glg5gVg5gFc5f1Y5flY5fVU4fFQ4e1Q4elM4eVM4eFI4d1E4dlE4dVA3dE83c083ck43cU43cE03b0w2bkw2bUs2bEs2a0o1akk1aUk1Z0g1Zkg1ZUc0ZEY0Y0Y0YkU0YUUzYEQzX0MzXkMzXUIyXEIyW0EyWkExWUAxWD8xVz8wVj4wVT4wVD0wUzwvUjwvUTsvUDsuTzouTjkuTTktSzgtSjgsSTcsSDYsRzYrRjUrRTUrRDQqQzMqQjMpQTIpQDIpPzEoPjAoPTAnPC8nOy8nOi4mOS0mOC0lNywlNiskNSskNCokMyojMikjMSgiMCgiLychLiYhLSYgLCUgKyQfKiQfKSMfKCMeJyIeJiEdJSEdJCAcIx8cIh8b")),
  turbid_r: T(R("Ih8bIx8cJCAcJSEdJiEdJyIeKCMeKSMfKiQfKyQfLCUgLSYgLiYhLychMCgiMSgiMikjMyojNCokNSskNiskNywlOC0lOS0mOi4mOy8nPC8nPTAnPjAoPzEoQDIpQTIpQjMpQzMqRDQqRTUrRjUrRzYrSDYsSTcsSjgsSzgtTTktTjkuTzouUDsuUTsvUjwvUzwvVD0wVT4wVj4wVz8wWD8xWUAxWkExW0EyXEIyXUIyXkMzX0MzYEQzYUUzYkU0Y0Y0ZEY0ZUc0Zkg1Z0g1aUk1akk1a0o1bEs2bUs2bkw2b0w2cE03cU43ck43c083dE83dVA3dlE4d1E4eFI4eVM4elM4e1Q4fFQ4fVU4flY5f1Y5gFc5gVg5glg5g1k5hFo5hVo5hls5h1w5iFw6iV06il46i146jF86jWA6jmA6j2E6kGI6kWI6kmM6k2Q6lGU6lWU6lmY6lmc6l2g6mGg7mWk7mmo7m2s7nGs7nWw7nm07nm47n247oG87oXA7onE7o3I7pHI7pHM7pXQ8pnU8p3Y8qHc8qHc8qXg8qnk8q3o8rHs9rHw9rX09rn09r349r389sIA+sYE+sYI+soM+s4Q/s4U/tIY/tYdAtohAtolAt4lAt4pBuItBuYxCuY1Cuo5Cu49Du5BDvJFEvJJEvZNFvZRFvpVGv5ZHv5dHwJhIwJlIwZpJwZtKwpxKwp5Lw59Mw6BNxKFNxKJOxaNPxaRQxqVRxqZRx6dSx6hTyKlUyKpVyatWyaxXyq5Yyq9ZyrBay7Fby7JczLNdzLRezbVfzbZgzrdhzrhiz7pkz7tlz7xm0L1n0L5o0b9p0cBr0sFs0sJt08Nu08Vv08Zx1Mdy1Mhz1cl01cp21st31sx4185618972NB82NF+2dJ/2dOA2dSC2tWD2teE29iG29mH3NqI3NuK3dyL3d2N3t+O3uCP3+GR3+KS4OOU4OSV4eWX4ueY4uia4+mb4+qc5Oue5Oyf5e6h5e+i5vCk5vGl5/Kn6POo6PWq6far"))
};
function it(e) {
  for (var t = e.length / 6 | 0, n = new Array(t), i = 0; i < t; ) n[i] = "#" + e.slice(i * 6, ++i * 6);
  return n;
}
function Gn(e, t, n) {
  e.prototype = t.prototype = n, n.constructor = e;
}
function Gi(e, t) {
  var n = Object.create(e.prototype);
  for (var i in t) n[i] = t[i];
  return n;
}
function oe() {
}
var ee = 0.7, xe = 1 / ee, Vt = "\\s*([+-]?\\d+)\\s*", ne = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", wt = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", kr = /^#([0-9a-f]{3,8})$/, Mr = new RegExp(`^rgb\\(${Vt},${Vt},${Vt}\\)$`), Fr = new RegExp(`^rgb\\(${wt},${wt},${wt}\\)$`), vr = new RegExp(`^rgba\\(${Vt},${Vt},${Vt},${ne}\\)$`), Nr = new RegExp(`^rgba\\(${wt},${wt},${wt},${ne}\\)$`), Pr = new RegExp(`^hsl\\(${ne},${wt},${wt}\\)$`), jr = new RegExp(`^hsla\\(${ne},${wt},${wt},${ne}\\)$`), Rn = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
Gn(oe, Sn, {
  copy(e) {
    return Object.assign(new this.constructor(), this, e);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: Tn,
  // Deprecated! Use color.formatHex.
  formatHex: Tn,
  formatHex8: Rr,
  formatHsl: Tr,
  formatRgb: In,
  toString: In
});
function Tn() {
  return this.rgb().formatHex();
}
function Rr() {
  return this.rgb().formatHex8();
}
function Tr() {
  return Si(this).formatHsl();
}
function In() {
  return this.rgb().formatRgb();
}
function Sn(e) {
  var t, n;
  return e = (e + "").trim().toLowerCase(), (t = kr.exec(e)) ? (n = t[1].length, t = parseInt(t[1], 16), n === 6 ? Un(t) : n === 3 ? new ot(t >> 8 & 15 | t >> 4 & 240, t >> 4 & 15 | t & 240, (t & 15) << 4 | t & 15, 1) : n === 8 ? le(t >> 24 & 255, t >> 16 & 255, t >> 8 & 255, (t & 255) / 255) : n === 4 ? le(t >> 12 & 15 | t >> 8 & 240, t >> 8 & 15 | t >> 4 & 240, t >> 4 & 15 | t & 240, ((t & 15) << 4 | t & 15) / 255) : null) : (t = Mr.exec(e)) ? new ot(t[1], t[2], t[3], 1) : (t = Fr.exec(e)) ? new ot(t[1] * 255 / 100, t[2] * 255 / 100, t[3] * 255 / 100, 1) : (t = vr.exec(e)) ? le(t[1], t[2], t[3], t[4]) : (t = Nr.exec(e)) ? le(t[1] * 255 / 100, t[2] * 255 / 100, t[3] * 255 / 100, t[4]) : (t = Pr.exec(e)) ? Jn(t[1], t[2] / 100, t[3] / 100, 1) : (t = jr.exec(e)) ? Jn(t[1], t[2] / 100, t[3] / 100, t[4]) : Rn.hasOwnProperty(e) ? Un(Rn[e]) : e === "transparent" ? new ot(NaN, NaN, NaN, 0) : null;
}
function Un(e) {
  return new ot(e >> 16 & 255, e >> 8 & 255, e & 255, 1);
}
function le(e, t, n, i) {
  return i <= 0 && (e = t = n = NaN), new ot(e, t, n, i);
}
function Ir(e) {
  return e instanceof oe || (e = Sn(e)), e ? (e = e.rgb(), new ot(e.r, e.g, e.b, e.opacity)) : new ot();
}
function we(e, t, n, i) {
  return arguments.length === 1 ? Ir(e) : new ot(e, t, n, i ?? 1);
}
function ot(e, t, n, i) {
  this.r = +e, this.g = +t, this.b = +n, this.opacity = +i;
}
Gn(ot, we, Gi(oe, {
  brighter(e) {
    return e = e == null ? xe : Math.pow(xe, e), new ot(this.r * e, this.g * e, this.b * e, this.opacity);
  },
  darker(e) {
    return e = e == null ? ee : Math.pow(ee, e), new ot(this.r * e, this.g * e, this.b * e, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new ot(Ct(this.r), Ct(this.g), Ct(this.b), Ge(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && -0.5 <= this.g && this.g < 255.5 && -0.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
  },
  hex: Cn,
  // Deprecated! Use color.formatHex.
  formatHex: Cn,
  formatHex8: Ur,
  formatRgb: _n,
  toString: _n
}));
function Cn() {
  return `#${Ut(this.r)}${Ut(this.g)}${Ut(this.b)}`;
}
function Ur() {
  return `#${Ut(this.r)}${Ut(this.g)}${Ut(this.b)}${Ut((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function _n() {
  const e = Ge(this.opacity);
  return `${e === 1 ? "rgb(" : "rgba("}${Ct(this.r)}, ${Ct(this.g)}, ${Ct(this.b)}${e === 1 ? ")" : `, ${e})`}`;
}
function Ge(e) {
  return isNaN(e) ? 1 : Math.max(0, Math.min(1, e));
}
function Ct(e) {
  return Math.max(0, Math.min(255, Math.round(e) || 0));
}
function Ut(e) {
  return e = Ct(e), (e < 16 ? "0" : "") + e.toString(16);
}
function Jn(e, t, n, i) {
  return i <= 0 ? e = t = n = NaN : n <= 0 || n >= 1 ? e = t = NaN : t <= 0 && (e = NaN), new pt(e, t, n, i);
}
function Si(e) {
  if (e instanceof pt) return new pt(e.h, e.s, e.l, e.opacity);
  if (e instanceof oe || (e = Sn(e)), !e) return new pt();
  if (e instanceof pt) return e;
  e = e.rgb();
  var t = e.r / 255, n = e.g / 255, i = e.b / 255, r = Math.min(t, n, i), a = Math.max(t, n, i), o = NaN, s = a - r, h = (a + r) / 2;
  return s ? (t === a ? o = (n - i) / s + (n < i) * 6 : n === a ? o = (i - t) / s + 2 : o = (t - n) / s + 4, s /= h < 0.5 ? a + r : 2 - a - r, o *= 60) : s = h > 0 && h < 1 ? 0 : o, new pt(o, s, h, e.opacity);
}
function Cr(e, t, n, i) {
  return arguments.length === 1 ? Si(e) : new pt(e, t, n, i ?? 1);
}
function pt(e, t, n, i) {
  this.h = +e, this.s = +t, this.l = +n, this.opacity = +i;
}
Gn(pt, Cr, Gi(oe, {
  brighter(e) {
    return e = e == null ? xe : Math.pow(xe, e), new pt(this.h, this.s, this.l * e, this.opacity);
  },
  darker(e) {
    return e = e == null ? ee : Math.pow(ee, e), new pt(this.h, this.s, this.l * e, this.opacity);
  },
  rgb() {
    var e = this.h % 360 + (this.h < 0) * 360, t = isNaN(e) || isNaN(this.s) ? 0 : this.s, n = this.l, i = n + (n < 0.5 ? n : 1 - n) * t, r = 2 * n - i;
    return new ot(
      Ye(e >= 240 ? e - 240 : e + 120, r, i),
      Ye(e, r, i),
      Ye(e < 120 ? e + 240 : e - 120, r, i),
      this.opacity
    );
  },
  clamp() {
    return new pt(Zn(this.h), fe(this.s), fe(this.l), Ge(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  },
  formatHsl() {
    const e = Ge(this.opacity);
    return `${e === 1 ? "hsl(" : "hsla("}${Zn(this.h)}, ${fe(this.s) * 100}%, ${fe(this.l) * 100}%${e === 1 ? ")" : `, ${e})`}`;
  }
}));
function Zn(e) {
  return e = (e || 0) % 360, e < 0 ? e + 360 : e;
}
function fe(e) {
  return Math.max(0, Math.min(1, e || 0));
}
function Ye(e, t, n) {
  return (e < 60 ? t + (n - t) * e / 60 : e < 180 ? n : e < 240 ? t + (n - t) * (240 - e) / 60 : t) * 255;
}
function _r(e, t, n, i, r) {
  var a = e * e, o = a * e;
  return ((1 - 3 * e + 3 * a - o) * t + (4 - 6 * a + 3 * o) * n + (1 + 3 * e + 3 * a - 3 * o) * i + o * r) / 6;
}
function Jr(e) {
  var t = e.length - 1;
  return function(n) {
    var i = n <= 0 ? n = 0 : n >= 1 ? (n = 1, t - 1) : Math.floor(n * t), r = e[i], a = e[i + 1], o = i > 0 ? e[i - 1] : 2 * r - a, s = i < t - 1 ? e[i + 2] : 2 * a - r;
    return _r((n - i / t) * t, o, r, a, s);
  };
}
const ki = (e) => () => e;
function Zr(e, t) {
  return function(n) {
    return e + n * t;
  };
}
function Or(e, t, n) {
  return e = Math.pow(e, n), t = Math.pow(t, n) - e, n = 1 / n, function(i) {
    return Math.pow(e + i * t, n);
  };
}
function Dr(e) {
  return (e = +e) == 1 ? Mi : function(t, n) {
    return n - t ? Or(t, n, e) : ki(isNaN(t) ? n : t);
  };
}
function Mi(e, t) {
  var n = t - e;
  return n ? Zr(e, n) : ki(isNaN(e) ? t : e);
}
(function e(t) {
  var n = Dr(t);
  function i(r, a) {
    var o = n((r = we(r)).r, (a = we(a)).r), s = n(r.g, a.g), h = n(r.b, a.b), c = Mi(r.opacity, a.opacity);
    return function(l) {
      return r.r = o(l), r.g = s(l), r.b = h(l), r.opacity = c(l), r + "";
    };
  }
  return i.gamma = e, i;
})(1);
function Yr(e) {
  return function(t) {
    var n = t.length, i = new Array(n), r = new Array(n), a = new Array(n), o, s;
    for (o = 0; o < n; ++o)
      s = we(t[o]), i[o] = s.r || 0, r[o] = s.g || 0, a[o] = s.b || 0;
    return i = e(i), r = e(r), a = e(a), s.opacity = 1, function(h) {
      return s.r = i(h), s.g = r(h), s.b = a(h), s + "";
    };
  };
}
var Hr = Yr(Jr);
const bt = (e) => Hr(e[e.length - 1]);
var Ar = new Array(3).concat(
  "ef8a62f7f7f767a9cf",
  "ca0020f4a58292c5de0571b0",
  "ca0020f4a582f7f7f792c5de0571b0",
  "b2182bef8a62fddbc7d1e5f067a9cf2166ac",
  "b2182bef8a62fddbc7f7f7f7d1e5f067a9cf2166ac",
  "b2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac",
  "b2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac",
  "67001fb2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac053061",
  "67001fb2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac053061"
).map(it);
const On = bt(Ar);
var Vr = new Array(3).concat(
  "fc8d59ffffbf91bfdb",
  "d7191cfdae61abd9e92c7bb6",
  "d7191cfdae61ffffbfabd9e92c7bb6",
  "d73027fc8d59fee090e0f3f891bfdb4575b4",
  "d73027fc8d59fee090ffffbfe0f3f891bfdb4575b4",
  "d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4",
  "d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4",
  "a50026d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4313695",
  "a50026d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4313695"
).map(it);
const Dn = bt(Vr);
var Wr = new Array(3).concat(
  "fc8d59ffffbf99d594",
  "d7191cfdae61abdda42b83ba",
  "d7191cfdae61ffffbfabdda42b83ba",
  "d53e4ffc8d59fee08be6f59899d5943288bd",
  "d53e4ffc8d59fee08bffffbfe6f59899d5943288bd",
  "d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd",
  "d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd",
  "9e0142d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd5e4fa2",
  "9e0142d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd5e4fa2"
).map(it);
const Yn = bt(Wr);
var Kr = new Array(3).concat(
  "e0ecf49ebcda8856a7",
  "edf8fbb3cde38c96c688419d",
  "edf8fbb3cde38c96c68856a7810f7c",
  "edf8fbbfd3e69ebcda8c96c68856a7810f7c",
  "edf8fbbfd3e69ebcda8c96c68c6bb188419d6e016b",
  "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d6e016b",
  "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d810f7c4d004b"
).map(it);
const zr = bt(Kr);
var Lr = new Array(3).concat(
  "fee8c8fdbb84e34a33",
  "fef0d9fdcc8afc8d59d7301f",
  "fef0d9fdcc8afc8d59e34a33b30000",
  "fef0d9fdd49efdbb84fc8d59e34a33b30000",
  "fef0d9fdd49efdbb84fc8d59ef6548d7301f990000",
  "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301f990000",
  "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301fb300007f0000"
).map(it);
const qr = bt(Lr);
var Qr = new Array(3).concat(
  "ece2f0a6bddb1c9099",
  "f6eff7bdc9e167a9cf02818a",
  "f6eff7bdc9e167a9cf1c9099016c59",
  "f6eff7d0d1e6a6bddb67a9cf1c9099016c59",
  "f6eff7d0d1e6a6bddb67a9cf3690c002818a016450",
  "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016450",
  "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016c59014636"
).map(it);
const Xr = bt(Qr);
var Br = new Array(3).concat(
  "edf8b17fcdbb2c7fb8",
  "ffffcca1dab441b6c4225ea8",
  "ffffcca1dab441b6c42c7fb8253494",
  "ffffccc7e9b47fcdbb41b6c42c7fb8253494",
  "ffffccc7e9b47fcdbb41b6c41d91c0225ea80c2c84",
  "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea80c2c84",
  "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea8253494081d58"
).map(it);
const $r = bt(Br);
var ta = new Array(3).concat(
  "ffeda0feb24cf03b20",
  "ffffb2fecc5cfd8d3ce31a1c",
  "ffffb2fecc5cfd8d3cf03b20bd0026",
  "ffffb2fed976feb24cfd8d3cf03b20bd0026",
  "ffffb2fed976feb24cfd8d3cfc4e2ae31a1cb10026",
  "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cb10026",
  "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cbd0026800026"
).map(it);
const ea = bt(ta);
var na = new Array(3).concat(
  "deebf79ecae13182bd",
  "eff3ffbdd7e76baed62171b5",
  "eff3ffbdd7e76baed63182bd08519c",
  "eff3ffc6dbef9ecae16baed63182bd08519c",
  "eff3ffc6dbef9ecae16baed64292c62171b5084594",
  "f7fbffdeebf7c6dbef9ecae16baed64292c62171b5084594",
  "f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b"
).map(it);
const ia = bt(na);
var ra = new Array(3).concat(
  "e5f5e0a1d99b31a354",
  "edf8e9bae4b374c476238b45",
  "edf8e9bae4b374c47631a354006d2c",
  "edf8e9c7e9c0a1d99b74c47631a354006d2c",
  "edf8e9c7e9c0a1d99b74c47641ab5d238b45005a32",
  "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45005a32",
  "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45006d2c00441b"
).map(it);
const aa = bt(ra);
var oa = new Array(3).concat(
  "f0f0f0bdbdbd636363",
  "f7f7f7cccccc969696525252",
  "f7f7f7cccccc969696636363252525",
  "f7f7f7d9d9d9bdbdbd969696636363252525",
  "f7f7f7d9d9d9bdbdbd969696737373525252252525",
  "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525",
  "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525000000"
).map(it);
const sa = bt(oa);
function Ie(e) {
  var t = e.length;
  return function(n) {
    return e[Math.max(0, Math.min(t - 1, Math.floor(n * t)))];
  };
}
const ca = Ie(it("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));
var la = Ie(it("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf")), fa = Ie(it("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4")), ha = Ie(it("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));
function Fi(e) {
  const t = e.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (t) return [+t[1], +t[2], +t[3]];
  const n = e.replace("#", "");
  return [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
}
function tt(e) {
  return (t) => Fi(e(Math.max(0, Math.min(1, t))));
}
function He(e) {
  return (t) => Fi(e(1 - Math.max(0, Math.min(1, t))));
}
const Ae = {
  // Perceptually uniform sequential
  viridis: tt(ca),
  plasma: tt(ha),
  inferno: tt(fa),
  magma: tt(la),
  // Diverging — most useful for anomalies
  RdYlBu: tt(Dn),
  RdYlBu_r: He(Dn),
  // warm=red, cold=blue (standard temp anomaly)
  RdBu: tt(On),
  RdBu_r: He(On),
  Spectral: tt(Yn),
  Spectral_r: He(Yn),
  // Sequential multi-hue
  BuPu: tt(zr),
  YlGnBu: tt($r),
  // good for precip
  PuBuGn: tt(Xr),
  // good for SST
  OrRd: tt(qr),
  YlOrRd: tt(ea),
  Blues: tt(ia),
  Greens: tt(aa),
  Greys: tt(sa)
  // cloud cover, wind speed
};
function vt(e) {
  if (typeof e == "function") return e;
  if (typeof e == "string") {
    if (Ae[e]) return Ae[e];
    if (De[e]) return De[e];
    const t = [...Object.keys(Ae), ...Object.keys(De)].join(", ");
    throw new Error(`terraplot: unknown colormap "${e}". Available: ${t}`);
  }
  throw new Error("terraplot: cmap must be a string or function");
}
const Lt = 1024, qt = 512;
class ua {
  constructor(t, n, i, r, a) {
    const {
      cmap: o = "viridis",
      alpha: s = 0.7,
      levels: h = null,
      // null = smooth (pcolormesh), integer = banded (contourf)
      vmin: c = null,
      vmax: l = null,
      zorder: f = 0
    } = r, u = vt(o), p = da(t, n, i, { colorFn: u, alpha: s, levels: h, vmin: c, vmax: l }), d = a * (1.003 + f * 2e-3);
    this.mesh = new z.Mesh(
      new z.SphereGeometry(d, 72, 36),
      new z.MeshBasicMaterial({ map: p, transparent: !0, depthWrite: !1 })
    ), this._texture = p;
  }
  dispose() {
    this.mesh.geometry.dispose(), this.mesh.material.dispose(), this._texture.dispose();
  }
}
function da(e, t, n, { colorFn: i, alpha: r, levels: a, vmin: o, vmax: s }) {
  const h = e.length, c = t.length, f = !Array.isArray(n[0]) && !(n[0] instanceof Float32Array || n[0] instanceof Float64Array) ? (G, S) => n[G * h + S] : (G, S) => n[G][S];
  let u = o, p = s;
  if (u == null || p == null) {
    u = 1 / 0, p = -1 / 0;
    for (let G = 0; G < c; G++)
      for (let S = 0; S < h; S++) {
        const F = f(G, S);
        !isNaN(F) && F < u && (u = F), !isNaN(F) && F > p && (p = F);
      }
  }
  const d = p - u || 1, E = t[c - 1] > t[0], b = document.createElement("canvas");
  b.width = Lt, b.height = qt;
  const g = b.getContext("2d"), x = g.createImageData(Lt, qt), m = x.data, w = Math.round(Math.max(0, Math.min(1, r)) * 255);
  for (let G = 0; G < qt; G++)
    for (let S = 0; S < Lt; S++) {
      const F = e[0] + S / Lt * (e[h - 1] - e[0]), v = E ? t[c - 1] - G / qt * (t[c - 1] - t[0]) : t[0] - G / qt * (t[0] - t[c - 1]), P = (F - e[0]) / (e[h - 1] - e[0]), M = E ? (v - t[0]) / (t[c - 1] - t[0]) : (t[0] - v) / (t[0] - t[c - 1]), k = P * (h - 1), D = M * (c - 1), U = Math.max(0, Math.floor(k)), j = Math.min(U + 1, h - 1), y = Math.max(0, Math.floor(D)), N = Math.min(y + 1, c - 1), Z = k - U, Y = D - y, H = f(y, U), K = f(y, j), V = f(N, U), X = f(N, j), q = (G * Lt + S) * 4;
      if (isNaN(H) || isNaN(K) || isNaN(V) || isNaN(X)) {
        m[q + 3] = 0;
        continue;
      }
      const val = H * (1 - Z) * (1 - Y) + K * Z * (1 - Y) + V * (1 - Z) * Y + X * Z * Y;
      let $ = (val - u) / d;
      if (a != null) {
        if (Array.isArray(a)) {
          if (val < a[0]) {
            $ = 0;
          } else if (val >= a[a.length - 1]) {
            $ = 1;
          } else {
            let idx = 0;
            for (let idx2 = 0; idx2 < a.length - 1; idx2++) {
              if (val >= a[idx2] && val < a[idx2 + 1]) {
                idx = idx2;
                break;
              }
            }
            $ = (idx + 0.5) / (a.length - 1);
          }
        } else if (a > 1) {
          $ = Math.floor($ * a) / a;
        }
      }
      const [gt, _e, Je] = i(Math.max(0, Math.min(1, $)));
      m[q] = gt, m[q + 1] = _e, m[q + 2] = Je, m[q + 3] = w;
    }
  return g.putImageData(x, 0, 0), new z.CanvasTexture(b);
}
function pa(e, t) {
  let n = 0;
  for (let i of e)
    i != null && (i = +i) >= i && ++n;
  return n;
}
function ba(e, t) {
  let n, i;
  if (t === void 0)
    for (const r of e)
      r != null && (n === void 0 ? r >= r && (n = i = r) : (n > r && (n = r), i < r && (i = r)));
  else {
    let r = -1;
    for (let a of e)
      (a = t(a, ++r, e)) != null && (n === void 0 ? a >= a && (n = i = a) : (n > a && (n = a), i < a && (i = a)));
  }
  return [n, i];
}
class _t {
  constructor() {
    this._partials = new Float64Array(32), this._n = 0;
  }
  add(t) {
    const n = this._partials;
    let i = 0;
    for (let r = 0; r < this._n && r < 32; r++) {
      const a = n[r], o = t + a, s = Math.abs(t) < Math.abs(a) ? t - (o - a) : a - (o - t);
      s && (n[i++] = s), t = o;
    }
    return n[i] = t, this._n = i + 1, this;
  }
  valueOf() {
    const t = this._partials;
    let n = this._n, i, r, a, o = 0;
    if (n > 0) {
      for (o = t[--n]; n > 0 && (i = o, r = t[--n], o = i + r, a = r - (o - i), !a); )
        ;
      n > 0 && (a < 0 && t[n - 1] < 0 || a > 0 && t[n - 1] > 0) && (r = a * 2, i = o + r, r == i - o && (o = i));
    }
    return o;
  }
}
const ma = Math.sqrt(50), ga = Math.sqrt(10), ya = Math.sqrt(2);
function Se(e, t, n) {
  const i = (t - e) / Math.max(0, n), r = Math.floor(Math.log10(i)), a = i / Math.pow(10, r), o = a >= ma ? 10 : a >= ga ? 5 : a >= ya ? 2 : 1;
  let s, h, c;
  return r < 0 ? (c = Math.pow(10, -r) / o, s = Math.round(e * c), h = Math.round(t * c), s / c < e && ++s, h / c > t && --h, c = -c) : (c = Math.pow(10, r) * o, s = Math.round(e / c), h = Math.round(t / c), s * c < e && ++s, h * c > t && --h), h < s && 0.5 <= n && n < 2 ? Se(e, t, n * 2) : [s, h, c];
}
function Ea(e, t, n) {
  if (t = +t, e = +e, n = +n, !(n > 0)) return [];
  if (e === t) return [e];
  const i = t < e, [r, a, o] = i ? Se(t, e, n) : Se(e, t, n);
  if (!(a >= r)) return [];
  const s = a - r + 1, h = new Array(s);
  if (i)
    if (o < 0) for (let c = 0; c < s; ++c) h[c] = (a - c) / -o;
    else for (let c = 0; c < s; ++c) h[c] = (a - c) * o;
  else if (o < 0) for (let c = 0; c < s; ++c) h[c] = (r + c) / -o;
  else for (let c = 0; c < s; ++c) h[c] = (r + c) * o;
  return h;
}
function xa(e, t, n) {
  return t = +t, e = +e, n = +n, Se(e, t, n)[2];
}
function wa(e, t, n) {
  let i;
  for (; ; ) {
    const r = xa(e, t, n);
    if (r === i || r === 0 || !isFinite(r))
      return [e, t];
    r > 0 ? (e = Math.floor(e / r) * r, t = Math.ceil(t / r) * r) : r < 0 && (e = Math.ceil(e * r) / r, t = Math.floor(t * r) / r), i = r;
  }
}
function Ga(e) {
  return Math.max(1, Math.ceil(Math.log(pa(e)) / Math.LN2) + 1);
}
function* Sa(e) {
  for (const t of e)
    yield* t;
}
function vi(e) {
  return Array.from(Sa(e));
}
function Yt(e, t, n) {
  e = +e, t = +t, n = (r = arguments.length) < 2 ? (t = e, e = 0, 1) : r < 3 ? 1 : +n;
  for (var i = -1, r = Math.max(0, Math.ceil((t - e) / n)) | 0, a = new Array(r); ++i < r; )
    a[i] = e + i * n;
  return a;
}
var ka = Array.prototype, Ma = ka.slice;
function Fa(e, t) {
  return e - t;
}
function va(e) {
  for (var t = 0, n = e.length, i = e[n - 1][1] * e[0][0] - e[n - 1][0] * e[0][1]; ++t < n; ) i += e[t - 1][1] * e[t][0] - e[t - 1][0] * e[t][1];
  return i;
}
const Hn = (e) => () => e;
function Na(e, t) {
  for (var n = -1, i = t.length, r; ++n < i; ) if (r = Pa(e, t[n])) return r;
  return 0;
}
function Pa(e, t) {
  for (var n = t[0], i = t[1], r = -1, a = 0, o = e.length, s = o - 1; a < o; s = a++) {
    var h = e[a], c = h[0], l = h[1], f = e[s], u = f[0], p = f[1];
    if (ja(h, f, t)) return 0;
    l > i != p > i && n < (u - c) * (i - l) / (p - l) + c && (r = -r);
  }
  return r;
}
function ja(e, t, n) {
  var i;
  return Ra(e, t, n) && Ta(e[i = +(e[0] === t[0])], n[i], t[i]);
}
function Ra(e, t, n) {
  return (t[0] - e[0]) * (n[1] - e[1]) === (n[0] - e[0]) * (t[1] - e[1]);
}
function Ta(e, t, n) {
  return e <= t && t <= n || n <= t && t <= e;
}
function Ia() {
}
var kt = [
  [],
  [[[1, 1.5], [0.5, 1]]],
  [[[1.5, 1], [1, 1.5]]],
  [[[1.5, 1], [0.5, 1]]],
  [[[1, 0.5], [1.5, 1]]],
  [[[1, 1.5], [0.5, 1]], [[1, 0.5], [1.5, 1]]],
  [[[1, 0.5], [1, 1.5]]],
  [[[1, 0.5], [0.5, 1]]],
  [[[0.5, 1], [1, 0.5]]],
  [[[1, 1.5], [1, 0.5]]],
  [[[0.5, 1], [1, 0.5]], [[1.5, 1], [1, 1.5]]],
  [[[1.5, 1], [1, 0.5]]],
  [[[0.5, 1], [1.5, 1]]],
  [[[1, 1.5], [1.5, 1]]],
  [[[0.5, 1], [1, 1.5]]],
  []
];
function Be() {
  var e = 1, t = 1, n = Ga, i = h;
  function r(c) {
    var l = n(c);
    if (Array.isArray(l))
      l = l.slice().sort(Fa);
    else {
      const f = ba(c, Ua);
      for (l = Ea(...wa(f[0], f[1], l), l); l[l.length - 1] >= f[1]; ) l.pop();
      for (; l[1] < f[0]; ) l.shift();
    }
    return l.map((f) => a(c, f));
  }
  function a(c, l) {
    const f = l == null ? NaN : +l;
    if (isNaN(f)) throw new Error(`invalid value: ${l}`);
    var u = [], p = [];
    return o(c, f, function(d) {
      i(d, c, f), va(d) > 0 ? u.push([d]) : p.push(d);
    }), p.forEach(function(d) {
      for (var E = 0, b = u.length, g; E < b; ++E)
        if (Na((g = u[E])[0], d) !== -1) {
          g.push(d);
          return;
        }
    }), {
      type: "MultiPolygon",
      value: l,
      coordinates: u
    };
  }
  function o(c, l, f) {
    var u = new Array(), p = new Array(), d, E, b, g, x, m;
    for (d = E = -1, g = It(c[0], l), kt[g << 1].forEach(w); ++d < e - 1; )
      b = g, g = It(c[d + 1], l), kt[b | g << 1].forEach(w);
    for (kt[g << 0].forEach(w); ++E < t - 1; ) {
      for (d = -1, g = It(c[E * e + e], l), x = It(c[E * e], l), kt[g << 1 | x << 2].forEach(w); ++d < e - 1; )
        b = g, g = It(c[E * e + e + d + 1], l), m = x, x = It(c[E * e + d + 1], l), kt[b | g << 1 | x << 2 | m << 3].forEach(w);
      kt[g | x << 3].forEach(w);
    }
    for (d = -1, x = c[E * e] >= l, kt[x << 2].forEach(w); ++d < e - 1; )
      m = x, x = It(c[E * e + d + 1], l), kt[x << 2 | m << 3].forEach(w);
    kt[x << 3].forEach(w);
    function w(G) {
      var S = [G[0][0] + d, G[0][1] + E], F = [G[1][0] + d, G[1][1] + E], v = s(S), P = s(F), M, k;
      (M = p[v]) ? (k = u[P]) ? (delete p[M.end], delete u[k.start], M === k ? (M.ring.push(F), f(M.ring)) : u[M.start] = p[k.end] = { start: M.start, end: k.end, ring: M.ring.concat(k.ring) }) : (delete p[M.end], M.ring.push(F), p[M.end = P] = M) : (M = u[P]) ? (k = p[v]) ? (delete u[M.start], delete p[k.end], M === k ? (M.ring.push(F), f(M.ring)) : u[k.start] = p[M.end] = { start: k.start, end: M.end, ring: k.ring.concat(M.ring) }) : (delete u[M.start], M.ring.unshift(S), u[M.start = v] = M) : u[v] = p[P] = { start: v, end: P, ring: [S, F] };
    }
  }
  function s(c) {
    return c[0] * 2 + c[1] * (e + 1) * 4;
  }
  function h(c, l, f) {
    c.forEach(function(u) {
      var p = u[0], d = u[1], E = p | 0, b = d | 0, g = Ve(l[b * e + E]);
      p > 0 && p < e && E === p && (u[0] = An(p, Ve(l[b * e + E - 1]), g, f)), d > 0 && d < t && b === d && (u[1] = An(d, Ve(l[(b - 1) * e + E]), g, f));
    });
  }
  return r.contour = a, r.size = function(c) {
    if (!arguments.length) return [e, t];
    var l = Math.floor(c[0]), f = Math.floor(c[1]);
    if (!(l >= 0 && f >= 0)) throw new Error("invalid size");
    return e = l, t = f, r;
  }, r.thresholds = function(c) {
    return arguments.length ? (n = typeof c == "function" ? c : Array.isArray(c) ? Hn(Ma.call(c)) : Hn(c), r) : n;
  }, r.smooth = function(c) {
    return arguments.length ? (i = c ? h : Ia, r) : i === h;
  }, r;
}
function Ua(e) {
  return isFinite(e) ? e : NaN;
}
function It(e, t) {
  return e == null ? !1 : +e >= t;
}
function Ve(e) {
  return e == null || isNaN(e = +e) ? -1 / 0 : e;
}
function An(e, t, n, i) {
  const r = i - t, a = n - t, o = isFinite(r) || isFinite(a) ? r / a : Math.sign(r) / Math.sign(a);
  return isNaN(o) ? e : e + o - 0.5;
}
class Ca {
  constructor(t, n, i, r, a) {
    const {
      levels: o = 8,
      cmap: s = null,
      color: h = "#ffffff",
      alpha: c = 0.9,
      vmin: l = null,
      vmax: f = null,
      zorder: u = 1,
      smoothFactor: p = 4,
      // bilinear upsample before contouring (1 = off)
      chaikin: d = 2
      // corner-cutting iterations on output rings (0 = off)
    } = r;
    let E = t.length, b = n.length;
    const g = a * (1.006 + u * 1e-3);
    let x = Za(i, b, E);
    p > 1 && ({ field: x, nlat: b, nlon: E } = _a(x, b, E, p));
    let m = l, w = f;
    if (m == null || w == null) {
      m = 1 / 0, w = -1 / 0;
      for (let y = 0; y < x.length; y++)
        isNaN(x[y]) || (x[y] < m && (m = x[y]), x[y] > w && (w = x[y]));
    }
    const G = w - m || 1, S = Array.isArray(o) ? o : Array.from({ length: o }, (y, N) => m + (N + 0.5) / o * G), v = Be().size([E, b]).thresholds(S)(x), P = s ? vt(s) : null, M = n[n.length - 1] - n[0], k = t[t.length - 1] - t[0], D = [], U = [];
    for (const y of v) {
      const N = (y.value - m) / G, [Z, Y, H] = P ? P(Math.max(0, Math.min(1, N))) : Oa(h), K = Z / 255, V = Y / 255, X = H / 255;
      for (const q of y.coordinates)
        for (const mt of q) {
          const $ = d > 0 ? Ja(mt, d) : mt;
          for (let gt = 0; gt < $.length - 1; gt++) {
            const [_e, Je] = $[gt], [tr, er] = $[gt + 1];
            if ((_e < 0.01 && tr < 0.01) ||
                (_e > E - 1.01 && tr > E - 1.01) ||
                (Je < 0.01 && er < 0.01) ||
                (Je > b - 1.01 && er > b - 1.01)) {
              continue;
            }
            const nr = t[0] + _e / (E - 1) * k, ir = n[0] + Je / (b - 1) * M, rr = t[0] + tr / (E - 1) * k, ar = n[0] + er / (b - 1) * M;
            D.push(...Vn(ir, nr, g), ...Vn(ar, rr, g)), U.push(K, V, X, K, V, X);
          }
        }
    }
    const j = new z.BufferGeometry();
    j.setAttribute("position", new z.Float32BufferAttribute(D, 3)), j.setAttribute("color", new z.Float32BufferAttribute(U, 3)), this.mesh = new z.LineSegments(
      j,
      new z.LineBasicMaterial({ vertexColors: !0, transparent: c < 1, opacity: c })
    ), this._geo = j, this._mat = this.mesh.material;
  }
  dispose() {
    this._geo.dispose(), this._mat.dispose();
  }
}
function _a(e, t, n, i) {
  const r = (t - 1) * i + 1, a = (n - 1) * i + 1, o = new Float32Array(r * a);
  for (let s = 0; s < r; s++) {
    const h = s / i, c = Math.min(Math.floor(h), t - 2), l = h - c;
    for (let f = 0; f < a; f++) {
      const u = f / i, p = Math.min(Math.floor(u), n - 2), d = u - p;
      o[s * a + f] = e[c * n + p] * (1 - d) * (1 - l) + e[c * n + (p + 1)] * d * (1 - l) + e[(c + 1) * n + p] * (1 - d) * l + e[(c + 1) * n + (p + 1)] * d * l;
    }
  }
  return { field: o, nlat: r, nlon: a };
}
function Ja(e, t) {
  let n = e;
  const i = n[0][0] === n[n.length - 1][0] && n[0][1] === n[n.length - 1][1];
  for (let r = 0; r < t; r++) {
    const a = [], o = n.length - 1;
    for (let s = 0; s < o; s++) {
      const [h, c] = n[s], [l, f] = n[s + 1];
      a.push([0.75 * h + 0.25 * l, 0.75 * c + 0.25 * f]), a.push([0.25 * h + 0.75 * l, 0.25 * c + 0.75 * f]);
    }
    i && a.push(a[0]), n = a;
  }
  return n;
}
function Za(e, t, n) {
  if (!Array.isArray(e[0]) && !(e[0] instanceof Float32Array) && !(e[0] instanceof Float64Array)) return e instanceof Float32Array ? e : new Float32Array(e);
  const r = new Float32Array(t * n);
  for (let a = 0; a < t; a++)
    for (let o = 0; o < n; o++)
      r[a * n + o] = e[a][o];
  return r;
}
function Vn(e, t, n) {
  const i = (90 - e) * (Math.PI / 180), r = (t + 180) * (Math.PI / 180);
  return [
    -n * Math.sin(i) * Math.cos(r),
    n * Math.cos(i),
    n * Math.sin(i) * Math.sin(r)
  ];
}
function Oa(e) {
  const t = e.replace("#", "");
  return [parseInt(t.slice(0, 2), 16), parseInt(t.slice(2, 4), 16), parseInt(t.slice(4, 6), 16)];
}
const Ho = {
  COASTLINES: "coastlines",
  BORDERS: "borders",
  LAND: "land",
  OCEAN: "ocean",
  RIVERS: "rivers"
}, We = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson", Ni = {
  coastlines: `${We}/ne_110m_coastline.geojson`,
  borders: `${We}/ne_110m_admin_0_boundary_lines_land.geojson`,
  rivers: `${We}/ne_110m_rivers_lake_centerlines.geojson`
}, Mt = 100, Da = {
  globeTexture: "https://unpkg.com/three-globe/example/img/earth-night.jpg",
  bumpTexture: "https://unpkg.com/three-globe/example/img/earth-topology.png",
  background: "#090912",
  autoRotate: !0,
  autoRotateSpeed: 0.5
};
var et, ct, dt, at, Ft, Te, ae, Tt, $e, tn;
class Ao {
  constructor(t, n = {}) {
    St(this, Tt);
    St(this, et);
    St(this, ct);
    St(this, dt);
    St(this, at);
    St(this, Ft, []);
    // { id, type, layer }
    St(this, Te, []);
    St(this, ae, null);
    const i = typeof t == "string" ? document.querySelector(t) : t;
    if (!i) throw new Error("terraplot: container element not found");
    const r = { ...Da, ...n };
    Pt(this, dt, new z.WebGLRenderer({ antialias: !0 })), I(this, dt).setPixelRatio(window.devicePixelRatio), I(this, dt).setSize(i.clientWidth, i.clientHeight), i.appendChild(I(this, dt).domElement), Pt(this, et, new z.Scene()), I(this, et).background = new z.Color(r.background), Pt(this, ct, new z.PerspectiveCamera(50, i.clientWidth / i.clientHeight, 0.1, 5e4)), I(this, ct).position.z = Mt * 2.5, I(this, et).add(new z.AmbientLight(16777215, 0.85));
    const a = new z.DirectionalLight(16777215, 0.6);
    a.position.set(300, 200, 300), I(this, et).add(a);
    let globeTex = r.globeTexture;
    let bumpTex = r.bumpTexture;
    if (r.earthSurface === "satellite") {
      globeTex = "https://unpkg.com/three-globe/example/img/earth-night.jpg";
      bumpTex = "https://unpkg.com/three-globe/example/img/earth-topology.png";
    } else if (r.earthSurface === "shaded_relief" || r.earthSurface === "stock") {
      globeTex = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
      bumpTex = "https://unpkg.com/three-globe/example/img/earth-topology.png";
    } else if (r.earthSurface === "outline") {
      globeTex = "#0f172a";
      bumpTex = "none";
    } else if (r.earthSurface && (r.earthSurface.startsWith("http") || r.earthSurface.startsWith("/") || r.earthSurface.startsWith("."))) {
      globeTex = r.earthSurface;
    }
    const o = new z.TextureLoader(), s = new z.SphereGeometry(Mt, 72, 36);
    const materialOpts = {
      specular: new z.Color(2236962),
      shininess: 8
    };
    if (globeTex && globeTex.startsWith("#")) {
      materialOpts.color = new z.Color(globeTex);
    } else if (globeTex && globeTex !== "none") {
      materialOpts.map = o.load(globeTex);
      if (bumpTex && bumpTex !== "none") {
        materialOpts.bumpMap = o.load(bumpTex);
        materialOpts.bumpScale = 0.5;
      }
    } else {
      materialOpts.color = new z.Color("#0b0f19");
    }
    const h = new z.MeshPhongMaterial(materialOpts);
    I(this, et).add(new z.Mesh(s, h)), Pt(this, at, new hr(I(this, ct), I(this, dt).domElement)), I(this, at).autoRotate = r.autoRotate, I(this, at).autoRotateSpeed = r.autoRotateSpeed, I(this, at).enableDamping = !0, I(this, at).dampingFactor = 0.05, I(this, at).minDistance = Mt * 1.15, I(this, at).maxDistance = Mt * 6, new ResizeObserver(() => {
      const l = i.clientWidth, f = i.clientHeight;
      I(this, ct).aspect = l / f, I(this, ct).updateProjectionMatrix(), I(this, dt).setSize(l, f);
    }).observe(i), zt(this, Tt, $e).call(this);
  }
  // ── Camera ──────────────────────────────────────────────────────────────────
  setPointOfView({ lat: t = 0, lng: n = 0, altitude: i = 2.5 } = {}) {
    const r = (90 - t) * (Math.PI / 180), a = (n + 180) * (Math.PI / 180), o = Mt * i;
    return I(this, ct).position.set(
      -o * Math.sin(r) * Math.cos(a),
      o * Math.cos(r),
      o * Math.sin(r) * Math.sin(a)
    ), I(this, ct).lookAt(0, 0, 0), I(this, at).update(), this;
  }
  setAutoRotate(t) {
    return I(this, at).autoRotate = t, this;
  }
  // ── Field layers ─────────────────────────────────────────────────────────────
  /**
   * Smooth gradient field — equivalent to ax.pcolormesh() in cartopy.
   * lons: 1D array  [-180 … 180]
   * lats: 1D array  [90 … -90] or [-90 … 90]
   * field: 2D array field[j][i] or flat TypedArray (row-major, lat-major)
   */
  pcolormesh(t, n, i, r = {}) {
    return zt(this, Tt, tn).call(this, "pcolormesh", t, n, i, { ...r, levels: null });
  }
  /**
   * Discrete banded contour fill — equivalent to ax.contourf() in cartopy.
   * Same signature as pcolormesh; options.levels controls number of bands (default 12).
   */
  contourf(t, n, i, r = {}) {
    const a = r.levels ?? 12;
    return zt(this, Tt, tn).call(this, "contourf", t, n, i, { ...r, levels: a });
  }
  /**
   * Contour isolines — equivalent to ax.contour() in cartopy.
   * options.levels: number of levels or explicit threshold array (default 8)
   * options.cmap:   colormap for level colors (overrides options.color)
   * options.color:  single color for all lines (default '#ffffff')
   */
  contour(t, n, i, r = {}) {
    const a = new Ca(t, n, i, r, Mt);
    I(this, et).add(a.mesh);
    const o = `contour_${Date.now()}`;
    return I(this, Ft).push({ id: o, type: "contour", layer: a }), o;
  }
  // ── Feature lines ────────────────────────────────────────────────────────────
  /**
   * Add a geographic feature (coastlines, borders).
   * Equivalent to ax.add_feature(cartopy.feature.COASTLINES).
   */
  addFeature(t, n = {}) {
    const { color: i = "#ffffff", linewidth: r = 0.6, opacity: a = 0.7, url: o = null } = n, s = o ?? Ni[t];
    return s ? (fetch(s).then((h) => h.json()).then((h) => {
      const c = Ya(h, Mt * 1.001), l = new z.LineBasicMaterial({
        color: i,
        opacity: a,
        transparent: a < 1,
        linewidth: r
        // only works on WebGL2 with certain extensions
      }), f = new z.LineSegments(c, l);
      I(this, et).add(f), I(this, Te).push(f);
    }).catch((h) => console.warn("terraplot: failed to load feature", t, h)), this) : (console.warn(`terraplot: unknown feature "${t}"`), this);
  }
  // ── Animation ────────────────────────────────────────────────────────────────
  /**
   * Animate through an array of field frames — for S2S lead-time steps.
   *
   * frames: array of { lons, lats, field } objects
   *         OR compact format { lons, lats, frames: [{ field, coord_value }] }
   *         (the compact format is what pyterraplot.frames_compact() produces)
   *
   * options.type:         layer type to use — 'pcolormesh' | 'contourf' (default 'pcolormesh')
   * options.interval:     ms between frames (default 600)
   * options.loop:         loop back to start (default true)
   * options.layerOptions: passed to the plot call
   * options.onFrame:      callback(frameIndex, frameData) fired each step
   *
   * Returns { play, pause, stop, seek(i), frame }
   */
  animate(t, n = {}) {
    const {
      type: i = "pcolormesh",
      interval: r = 600,
      loop: a = !0,
      layerOptions: o = {},
      onFrame: s = null
    } = n;
    let h, c, l;
    !Array.isArray(t) && t.frames ? (c = t.lons, l = t.lats, h = t.frames) : h = t;
    let f = 0, u = !1, p = null;
    const d = (w) => {
      const G = h[w], S = c ?? G.lons, F = l ?? G.lats;
      this.clear(i), this[i](S, F, G.field, o), s == null || s(w, G);
    }, E = () => {
      d(f), f = (f + 1) % h.length, !a && f === 0 && g();
    }, b = () => {
      u || (u = !0, E(), p = setInterval(E, r));
    }, g = () => {
      u = !1, clearInterval(p);
    }, x = () => {
      g(), f = 0, this.clear(i);
    }, m = (w) => {
      f = Math.max(0, Math.min(h.length - 1, w)), d(f);
    };
    return b(), { play: b, pause: g, stop: x, seek: m, get frame() {
      return f;
    } };
  }
  // ── Layer management ─────────────────────────────────────────────────────────
  /** Remove all layers of a given type ('pcolormesh', 'contourf', 'contour') or by id. */
  clear(t) {
    return Pt(this, Ft, I(this, Ft).filter(({ id: n, type: i, layer: r }) => n === t || i === t ? (I(this, et).remove(r.mesh), r.dispose(), !1) : !0)), this;
  }
  clearAll() {
    for (const { layer: t } of I(this, Ft))
      I(this, et).remove(t.mesh), t.dispose();
    return Pt(this, Ft, []), this;
  }
  dispose() {
    cancelAnimationFrame(I(this, ae)), this.clearAll(), I(this, dt).dispose();
  }
  // Expose for advanced Three.js usage
  get scene() {
    return I(this, et);
  }
  get camera() {
    return I(this, ct);
  }
  get controls() {
    return I(this, at);
  }
  get globeRadius() {
    return Mt;
  }
}
et = new WeakMap(), ct = new WeakMap(), dt = new WeakMap(), at = new WeakMap(), Ft = new WeakMap(), Te = new WeakMap(), ae = new WeakMap(), Tt = new WeakSet(), $e = function() {
  Pt(this, ae, requestAnimationFrame(() => zt(this, Tt, $e).call(this))), I(this, at).update(), I(this, dt).render(I(this, et), I(this, ct));
}, tn = function(t, n, i, r, a) {
  const o = new ua(n, i, r, a, Mt);
  I(this, et).add(o.mesh);
  const s = `${t}_${Date.now()}`;
  return I(this, Ft).push({ id: s, type: t, layer: o }), s;
};
function Wn(e, t, n) {
  const i = (90 - e) * (Math.PI / 180), r = (t + 180) * (Math.PI / 180);
  return [
    -n * Math.sin(i) * Math.cos(r),
    n * Math.cos(i),
    n * Math.sin(i) * Math.sin(r)
  ];
}
function Ya(e, t) {
  const n = [], i = (o) => {
    for (let s = 0; s < o.length - 1; s++) {
      const [h, c] = o[s], [l, f] = o[s + 1];
      n.push(...Wn(c, h, t)), n.push(...Wn(f, l, t));
    }
  }, r = (o) => {
    o && (o.type === "Polygon" ? o.coordinates.forEach(i) : o.type === "MultiPolygon" ? o.coordinates.forEach((s) => s.forEach(i)) : o.type === "LineString" ? i(o.coordinates) : o.type === "MultiLineString" && o.coordinates.forEach(i));
  };
  e.type === "FeatureCollection" ? e.features.forEach((o) => r(o.geometry)) : e.type === "Feature" ? r(e.geometry) : r(e);
  const a = new z.BufferGeometry();
  return a.setAttribute("position", new z.Float32BufferAttribute(n, 3)), a;
}
var C = 1e-6, _ = Math.PI, Q = _ / 2, Kn = _ / 4, st = _ * 2, nt = 180 / _, L = _ / 180, A = Math.abs, se = Math.atan, Rt = Math.atan2, O = Math.cos, he = Math.ceil, Ha = Math.exp, en = Math.log, Ke = Math.pow, J = Math.sin, jt = Math.sign || function(e) {
  return e > 0 ? 1 : e < 0 ? -1 : 0;
}, ht = Math.sqrt, Pi = Math.tan;
function Aa(e) {
  return e > 1 ? 0 : e < -1 ? _ : Math.acos(e);
}
function Gt(e) {
  return e > 1 ? Q : e < -1 ? -Q : Math.asin(e);
}
function ft() {
}
function ke(e, t) {
  e && Ln.hasOwnProperty(e.type) && Ln[e.type](e, t);
}
var zn = {
  Feature: function(e, t) {
    ke(e.geometry, t);
  },
  FeatureCollection: function(e, t) {
    for (var n = e.features, i = -1, r = n.length; ++i < r; ) ke(n[i].geometry, t);
  }
}, Ln = {
  Sphere: function(e, t) {
    t.sphere();
  },
  Point: function(e, t) {
    e = e.coordinates, t.point(e[0], e[1], e[2]);
  },
  MultiPoint: function(e, t) {
    for (var n = e.coordinates, i = -1, r = n.length; ++i < r; ) e = n[i], t.point(e[0], e[1], e[2]);
  },
  LineString: function(e, t) {
    nn(e.coordinates, t, 0);
  },
  MultiLineString: function(e, t) {
    for (var n = e.coordinates, i = -1, r = n.length; ++i < r; ) nn(n[i], t, 0);
  },
  Polygon: function(e, t) {
    qn(e.coordinates, t);
  },
  MultiPolygon: function(e, t) {
    for (var n = e.coordinates, i = -1, r = n.length; ++i < r; ) qn(n[i], t);
  },
  GeometryCollection: function(e, t) {
    for (var n = e.geometries, i = -1, r = n.length; ++i < r; ) ke(n[i], t);
  }
};
function nn(e, t, n) {
  var i = -1, r = e.length - n, a;
  for (t.lineStart(); ++i < r; ) a = e[i], t.point(a[0], a[1], a[2]);
  t.lineEnd();
}
function qn(e, t) {
  var n = -1, i = e.length;
  for (t.polygonStart(); ++n < i; ) nn(e[n], t, 1);
  t.polygonEnd();
}
function Ot(e, t) {
  e && zn.hasOwnProperty(e.type) ? zn[e.type](e, t) : ke(e, t);
}
function rn(e) {
  return [Rt(e[1], e[0]), Gt(e[2])];
}
function Wt(e) {
  var t = e[0], n = e[1], i = O(n);
  return [i * O(t), i * J(t), J(n)];
}
function ue(e, t) {
  return e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
}
function Me(e, t) {
  return [e[1] * t[2] - e[2] * t[1], e[2] * t[0] - e[0] * t[2], e[0] * t[1] - e[1] * t[0]];
}
function ze(e, t) {
  e[0] += t[0], e[1] += t[1], e[2] += t[2];
}
function de(e, t) {
  return [e[0] * t, e[1] * t, e[2] * t];
}
function an(e) {
  var t = ht(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);
  e[0] /= t, e[1] /= t, e[2] /= t;
}
function on(e, t) {
  function n(i, r) {
    return i = e(i, r), t(i[0], i[1]);
  }
  return e.invert && t.invert && (n.invert = function(i, r) {
    return i = t.invert(i, r), i && e.invert(i[0], i[1]);
  }), n;
}
function sn(e, t) {
  return A(e) > _ && (e -= Math.round(e / st) * st), [e, t];
}
sn.invert = sn;
function ji(e, t, n) {
  return (e %= st) ? t || n ? on(Xn(e), Bn(t, n)) : Xn(e) : t || n ? Bn(t, n) : sn;
}
function Qn(e) {
  return function(t, n) {
    return t += e, A(t) > _ && (t -= Math.round(t / st) * st), [t, n];
  };
}
function Xn(e) {
  var t = Qn(e);
  return t.invert = Qn(-e), t;
}
function Bn(e, t) {
  var n = O(e), i = J(e), r = O(t), a = J(t);
  function o(s, h) {
    var c = O(h), l = O(s) * c, f = J(s) * c, u = J(h), p = u * n + l * i;
    return [
      Rt(f * r - p * a, l * n - u * i),
      Gt(p * r + f * a)
    ];
  }
  return o.invert = function(s, h) {
    var c = O(h), l = O(s) * c, f = J(s) * c, u = J(h), p = u * r - f * a;
    return [
      Rt(f * r + u * a, l * n + p * i),
      Gt(p * n - l * i)
    ];
  }, o;
}
function Va(e) {
  e = ji(e[0] * L, e[1] * L, e.length > 2 ? e[2] * L : 0);
  function t(n) {
    return n = e(n[0] * L, n[1] * L), n[0] *= nt, n[1] *= nt, n;
  }
  return t.invert = function(n) {
    return n = e.invert(n[0] * L, n[1] * L), n[0] *= nt, n[1] *= nt, n;
  }, t;
}
function Wa(e, t, n, i, r, a) {
  if (n) {
    var o = O(t), s = J(t), h = i * n;
    r == null ? (r = t + i * st, a = t - h / 2) : (r = $n(o, r), a = $n(o, a), (i > 0 ? r < a : r > a) && (r += i * st));
    for (var c, l = r; i > 0 ? l > a : l < a; l -= h)
      c = rn([o, -s * O(l), -s * J(l)]), e.point(c[0], c[1]);
  }
}
function $n(e, t) {
  t = Wt(t), t[0] -= e, an(t);
  var n = Aa(-t[1]);
  return ((-t[2] < 0 ? -n : n) + st - C) % st;
}
function Ri() {
  var e = [], t;
  return {
    point: function(n, i, r) {
      t.push([n, i, r]);
    },
    lineStart: function() {
      e.push(t = []);
    },
    lineEnd: ft,
    rejoin: function() {
      e.length > 1 && e.push(e.pop().concat(e.shift()));
    },
    result: function() {
      var n = e;
      return e = [], t = null, n;
    }
  };
}
function ye(e, t) {
  return A(e[0] - t[0]) < C && A(e[1] - t[1]) < C;
}
function pe(e, t, n, i) {
  this.x = e, this.z = t, this.o = n, this.e = i, this.v = !1, this.n = this.p = null;
}
function Ti(e, t, n, i, r) {
  var a = [], o = [], s, h;
  if (e.forEach(function(d) {
    if (!((E = d.length - 1) <= 0)) {
      var E, b = d[0], g = d[E], x;
      if (ye(b, g)) {
        if (!b[2] && !g[2]) {
          for (r.lineStart(), s = 0; s < E; ++s) r.point((b = d[s])[0], b[1]);
          r.lineEnd();
          return;
        }
        g[0] += 2 * C;
      }
      a.push(x = new pe(b, d, null, !0)), o.push(x.o = new pe(b, null, x, !1)), a.push(x = new pe(g, d, null, !1)), o.push(x.o = new pe(g, null, x, !0));
    }
  }), !!a.length) {
    for (o.sort(t), ti(a), ti(o), s = 0, h = o.length; s < h; ++s)
      o[s].e = n = !n;
    for (var c = a[0], l, f; ; ) {
      for (var u = c, p = !0; u.v; ) if ((u = u.n) === c) return;
      l = u.z, r.lineStart();
      do {
        if (u.v = u.o.v = !0, u.e) {
          if (p)
            for (s = 0, h = l.length; s < h; ++s) r.point((f = l[s])[0], f[1]);
          else
            i(u.x, u.n.x, 1, r);
          u = u.n;
        } else {
          if (p)
            for (l = u.p.z, s = l.length - 1; s >= 0; --s) r.point((f = l[s])[0], f[1]);
          else
            i(u.x, u.p.x, -1, r);
          u = u.p;
        }
        u = u.o, l = u.z, p = !p;
      } while (!u.v);
      r.lineEnd();
    }
  }
}
function ti(e) {
  if (t = e.length) {
    for (var t, n = 0, i = e[0], r; ++n < t; )
      i.n = r = e[n], r.p = i, i = r;
    i.n = r = e[0], r.p = i;
  }
}
function Le(e) {
  return A(e[0]) <= _ ? e[0] : jt(e[0]) * ((A(e[0]) + _) % st - _);
}
function Ka(e, t) {
  var n = Le(t), i = t[1], r = J(i), a = [J(n), -O(n), 0], o = 0, s = 0, h = new _t();
  r === 1 ? i = Q + C : r === -1 && (i = -Q - C);
  for (var c = 0, l = e.length; c < l; ++c)
    if (u = (f = e[c]).length)
      for (var f, u, p = f[u - 1], d = Le(p), E = p[1] / 2 + Kn, b = J(E), g = O(E), x = 0; x < u; ++x, d = w, b = S, g = F, p = m) {
        var m = f[x], w = Le(m), G = m[1] / 2 + Kn, S = J(G), F = O(G), v = w - d, P = v >= 0 ? 1 : -1, M = P * v, k = M > _, D = b * S;
        if (h.add(Rt(D * P * J(M), g * F + D * O(M))), o += k ? v + P * st : v, k ^ d >= n ^ w >= n) {
          var U = Me(Wt(p), Wt(m));
          an(U);
          var j = Me(a, U);
          an(j);
          var y = (k ^ v >= 0 ? -1 : 1) * Gt(j[2]);
          (i > y || i === y && (U[0] || U[1])) && (s += k ^ v >= 0 ? 1 : -1);
        }
      }
  return (o < -C || o < C && h < -1e-12) ^ s & 1;
}
function Ii(e, t, n, i) {
  return function(r) {
    var a = t(r), o = Ri(), s = t(o), h = !1, c, l, f, u = {
      point: p,
      lineStart: E,
      lineEnd: b,
      polygonStart: function() {
        u.point = g, u.lineStart = x, u.lineEnd = m, l = [], c = [];
      },
      polygonEnd: function() {
        u.point = p, u.lineStart = E, u.lineEnd = b, l = vi(l);
        var w = Ka(c, i);
        l.length ? (h || (r.polygonStart(), h = !0), Ti(l, La, w, n, r)) : w && (h || (r.polygonStart(), h = !0), r.lineStart(), n(null, null, 1, r), r.lineEnd()), h && (r.polygonEnd(), h = !1), l = c = null;
      },
      sphere: function() {
        r.polygonStart(), r.lineStart(), n(null, null, 1, r), r.lineEnd(), r.polygonEnd();
      }
    };
    function p(w, G) {
      e(w, G) && r.point(w, G);
    }
    function d(w, G) {
      a.point(w, G);
    }
    function E() {
      u.point = d, a.lineStart();
    }
    function b() {
      u.point = p, a.lineEnd();
    }
    function g(w, G) {
      f.push([w, G]), s.point(w, G);
    }
    function x() {
      s.lineStart(), f = [];
    }
    function m() {
      g(f[0][0], f[0][1]), s.lineEnd();
      var w = s.clean(), G = o.result(), S, F = G.length, v, P, M;
      if (f.pop(), c.push(f), f = null, !!F) {
        if (w & 1) {
          if (P = G[0], (v = P.length - 1) > 0) {
            for (h || (r.polygonStart(), h = !0), r.lineStart(), S = 0; S < v; ++S) r.point((M = P[S])[0], M[1]);
            r.lineEnd();
          }
          return;
        }
        F > 1 && w & 2 && G.push(G.pop().concat(G.shift())), l.push(G.filter(za));
      }
    }
    return u;
  };
}
function za(e) {
  return e.length > 1;
}
function La(e, t) {
  return ((e = e.x)[0] < 0 ? e[1] - Q - C : Q - e[1]) - ((t = t.x)[0] < 0 ? t[1] - Q - C : Q - t[1]);
}
const ei = Ii(
  function() {
    return !0;
  },
  qa,
  Xa,
  [-_, -Q]
);
function qa(e) {
  var t = NaN, n = NaN, i = NaN, r;
  return {
    lineStart: function() {
      e.lineStart(), r = 1;
    },
    point: function(a, o) {
      var s = a > 0 ? _ : -_, h = A(a - t);
      A(h - _) < C ? (e.point(t, n = (n + o) / 2 > 0 ? Q : -Q), e.point(i, n), e.lineEnd(), e.lineStart(), e.point(s, n), e.point(a, n), r = 0) : i !== s && h >= _ && (A(t - i) < C && (t -= i * C), A(a - s) < C && (a -= s * C), n = Qa(t, n, a, o), e.point(i, n), e.lineEnd(), e.lineStart(), e.point(s, n), r = 0), e.point(t = a, n = o), i = s;
    },
    lineEnd: function() {
      e.lineEnd(), t = n = NaN;
    },
    clean: function() {
      return 2 - r;
    }
  };
}
function Qa(e, t, n, i) {
  var r, a, o = J(e - n);
  return A(o) > C ? se((J(t) * (a = O(i)) * J(n) - J(i) * (r = O(t)) * J(e)) / (r * a * o)) : (t + i) / 2;
}
function Xa(e, t, n, i) {
  var r;
  if (e == null)
    r = n * Q, i.point(-_, r), i.point(0, r), i.point(_, r), i.point(_, 0), i.point(_, -r), i.point(0, -r), i.point(-_, -r), i.point(-_, 0), i.point(-_, r);
  else if (A(e[0] - t[0]) > C) {
    var a = e[0] < t[0] ? _ : -_;
    r = n * a / 2, i.point(-a, r), i.point(0, r), i.point(a, r);
  } else
    i.point(t[0], t[1]);
}
function Ba(e) {
  var t = O(e), n = 2 * L, i = t > 0, r = A(t) > C;
  function a(l, f, u, p) {
    Wa(p, e, n, u, l, f);
  }
  function o(l, f) {
    return O(l) * O(f) > t;
  }
  function s(l) {
    var f, u, p, d, E;
    return {
      lineStart: function() {
        d = p = !1, E = 1;
      },
      point: function(b, g) {
        var x = [b, g], m, w = o(b, g), G = i ? w ? 0 : c(b, g) : w ? c(b + (b < 0 ? _ : -_), g) : 0;
        if (!f && (d = p = w) && l.lineStart(), w !== p && (m = h(f, x), (!m || ye(f, m) || ye(x, m)) && (x[2] = 1)), w !== p)
          E = 0, w ? (l.lineStart(), m = h(x, f), l.point(m[0], m[1])) : (m = h(f, x), l.point(m[0], m[1], 2), l.lineEnd()), f = m;
        else if (r && f && i ^ w) {
          var S;
          !(G & u) && (S = h(x, f, !0)) && (E = 0, i ? (l.lineStart(), l.point(S[0][0], S[0][1]), l.point(S[1][0], S[1][1]), l.lineEnd()) : (l.point(S[1][0], S[1][1]), l.lineEnd(), l.lineStart(), l.point(S[0][0], S[0][1], 3)));
        }
        w && (!f || !ye(f, x)) && l.point(x[0], x[1]), f = x, p = w, u = G;
      },
      lineEnd: function() {
        p && l.lineEnd(), f = null;
      },
      // Rejoin first and last segments if there were intersections and the first
      // and last points were visible.
      clean: function() {
        return E | (d && p) << 1;
      }
    };
  }
  function h(l, f, u) {
    var p = Wt(l), d = Wt(f), E = [1, 0, 0], b = Me(p, d), g = ue(b, b), x = b[0], m = g - x * x;
    if (!m) return !u && l;
    var w = t * g / m, G = -t * x / m, S = Me(E, b), F = de(E, w), v = de(b, G);
    ze(F, v);
    var P = S, M = ue(F, P), k = ue(P, P), D = M * M - k * (ue(F, F) - 1);
    if (!(D < 0)) {
      var U = ht(D), j = de(P, (-M - U) / k);
      if (ze(j, F), j = rn(j), !u) return j;
      var y = l[0], N = f[0], Z = l[1], Y = f[1], H;
      N < y && (H = y, y = N, N = H);
      var K = N - y, V = A(K - _) < C, X = V || K < C;
      if (!V && Y < Z && (H = Z, Z = Y, Y = H), X ? V ? Z + Y > 0 ^ j[1] < (A(j[0] - y) < C ? Z : Y) : Z <= j[1] && j[1] <= Y : K > _ ^ (y <= j[0] && j[0] <= N)) {
        var q = de(P, (-M + U) / k);
        return ze(q, F), [j, rn(q)];
      }
    }
  }
  function c(l, f) {
    var u = i ? e : _ - e, p = 0;
    return l < -u ? p |= 1 : l > u && (p |= 2), f < -u ? p |= 4 : f > u && (p |= 8), p;
  }
  return Ii(o, s, a, i ? [0, -e] : [-_, e - _]);
}
function $a(e, t, n, i, r, a) {
  var o = e[0], s = e[1], h = t[0], c = t[1], l = 0, f = 1, u = h - o, p = c - s, d;
  if (d = n - o, !(!u && d > 0)) {
    if (d /= u, u < 0) {
      if (d < l) return;
      d < f && (f = d);
    } else if (u > 0) {
      if (d > f) return;
      d > l && (l = d);
    }
    if (d = r - o, !(!u && d < 0)) {
      if (d /= u, u < 0) {
        if (d > f) return;
        d > l && (l = d);
      } else if (u > 0) {
        if (d < l) return;
        d < f && (f = d);
      }
      if (d = i - s, !(!p && d > 0)) {
        if (d /= p, p < 0) {
          if (d < l) return;
          d < f && (f = d);
        } else if (p > 0) {
          if (d > f) return;
          d > l && (l = d);
        }
        if (d = a - s, !(!p && d < 0)) {
          if (d /= p, p < 0) {
            if (d > f) return;
            d > l && (l = d);
          } else if (p > 0) {
            if (d < l) return;
            d < f && (f = d);
          }
          return l > 0 && (e[0] = o + l * u, e[1] = s + l * p), f < 1 && (t[0] = o + f * u, t[1] = s + f * p), !0;
        }
      }
    }
  }
}
var Qt = 1e9, be = -Qt;
function to(e, t, n, i) {
  function r(c, l) {
    return e <= c && c <= n && t <= l && l <= i;
  }
  function a(c, l, f, u) {
    var p = 0, d = 0;
    if (c == null || (p = o(c, f)) !== (d = o(l, f)) || h(c, l) < 0 ^ f > 0)
      do
        u.point(p === 0 || p === 3 ? e : n, p > 1 ? i : t);
      while ((p = (p + f + 4) % 4) !== d);
    else
      u.point(l[0], l[1]);
  }
  function o(c, l) {
    return A(c[0] - e) < C ? l > 0 ? 0 : 3 : A(c[0] - n) < C ? l > 0 ? 2 : 1 : A(c[1] - t) < C ? l > 0 ? 1 : 0 : l > 0 ? 3 : 2;
  }
  function s(c, l) {
    return h(c.x, l.x);
  }
  function h(c, l) {
    var f = o(c, 1), u = o(l, 1);
    return f !== u ? f - u : f === 0 ? l[1] - c[1] : f === 1 ? c[0] - l[0] : f === 2 ? c[1] - l[1] : l[0] - c[0];
  }
  return function(c) {
    var l = c, f = Ri(), u, p, d, E, b, g, x, m, w, G, S, F = {
      point: v,
      lineStart: D,
      lineEnd: U,
      polygonStart: M,
      polygonEnd: k
    };
    function v(y, N) {
      r(y, N) && l.point(y, N);
    }
    function P() {
      for (var y = 0, N = 0, Z = p.length; N < Z; ++N)
        for (var Y = p[N], H = 1, K = Y.length, V = Y[0], X, q, mt = V[0], $ = V[1]; H < K; ++H)
          X = mt, q = $, V = Y[H], mt = V[0], $ = V[1], q <= i ? $ > i && (mt - X) * (i - q) > ($ - q) * (e - X) && ++y : $ <= i && (mt - X) * (i - q) < ($ - q) * (e - X) && --y;
      return y;
    }
    function M() {
      l = f, u = [], p = [], S = !0;
    }
    function k() {
      var y = P(), N = S && y, Z = (u = vi(u)).length;
      (N || Z) && (c.polygonStart(), N && (c.lineStart(), a(null, null, 1, c), c.lineEnd()), Z && Ti(u, s, y, a, c), c.polygonEnd()), l = c, u = p = d = null;
    }
    function D() {
      F.point = j, p && p.push(d = []), G = !0, w = !1, x = m = NaN;
    }
    function U() {
      u && (j(E, b), g && w && f.rejoin(), u.push(f.result())), F.point = v, w && l.lineEnd();
    }
    function j(y, N) {
      var Z = r(y, N);
      if (p && d.push([y, N]), G)
        E = y, b = N, g = Z, G = !1, Z && (l.lineStart(), l.point(y, N));
      else if (Z && w) l.point(y, N);
      else {
        var Y = [x = Math.max(be, Math.min(Qt, x)), m = Math.max(be, Math.min(Qt, m))], H = [y = Math.max(be, Math.min(Qt, y)), N = Math.max(be, Math.min(Qt, N))];
        $a(Y, H, e, t, n, i) ? (w || (l.lineStart(), l.point(Y[0], Y[1])), l.point(H[0], H[1]), Z || l.lineEnd(), S = !1) : Z && (l.lineStart(), l.point(y, N), S = !1);
      }
      x = y, m = N, w = Z;
    }
    return F;
  };
}
function ni(e, t, n) {
  var i = Yt(e, t - C, n).concat(t);
  return function(r) {
    return i.map(function(a) {
      return [r, a];
    });
  };
}
function ii(e, t, n) {
  var i = Yt(e, t - C, n).concat(t);
  return function(r) {
    return i.map(function(a) {
      return [a, r];
    });
  };
}
function ri() {
  var e, t, n, i, r, a, o, s, h = 10, c = h, l = 90, f = 360, u, p, d, E, b = 2.5;
  function g() {
    return { type: "MultiLineString", coordinates: x() };
  }
  function x() {
    return Yt(he(i / l) * l, n, l).map(d).concat(Yt(he(s / f) * f, o, f).map(E)).concat(Yt(he(t / h) * h, e, h).filter(function(m) {
      return A(m % l) > C;
    }).map(u)).concat(Yt(he(a / c) * c, r, c).filter(function(m) {
      return A(m % f) > C;
    }).map(p));
  }
  return g.lines = function() {
    return x().map(function(m) {
      return { type: "LineString", coordinates: m };
    });
  }, g.outline = function() {
    return {
      type: "Polygon",
      coordinates: [
        d(i).concat(
          E(o).slice(1),
          d(n).reverse().slice(1),
          E(s).reverse().slice(1)
        )
      ]
    };
  }, g.extent = function(m) {
    return arguments.length ? g.extentMajor(m).extentMinor(m) : g.extentMinor();
  }, g.extentMajor = function(m) {
    return arguments.length ? (i = +m[0][0], n = +m[1][0], s = +m[0][1], o = +m[1][1], i > n && (m = i, i = n, n = m), s > o && (m = s, s = o, o = m), g.precision(b)) : [[i, s], [n, o]];
  }, g.extentMinor = function(m) {
    return arguments.length ? (t = +m[0][0], e = +m[1][0], a = +m[0][1], r = +m[1][1], t > e && (m = t, t = e, e = m), a > r && (m = a, a = r, r = m), g.precision(b)) : [[t, a], [e, r]];
  }, g.step = function(m) {
    return arguments.length ? g.stepMajor(m).stepMinor(m) : g.stepMinor();
  }, g.stepMajor = function(m) {
    return arguments.length ? (l = +m[0], f = +m[1], g) : [l, f];
  }, g.stepMinor = function(m) {
    return arguments.length ? (h = +m[0], c = +m[1], g) : [h, c];
  }, g.precision = function(m) {
    return arguments.length ? (b = +m, u = ni(a, r, 90), p = ii(t, e, b), d = ni(s, o, 90), E = ii(i, n, b), g) : b;
  }, g.extentMajor([[-180, -90 + C], [180, 90 - C]]).extentMinor([[-180, -80 - C], [180, 80 + C]]);
}
const cn = (e) => e;
var qe = new _t(), ln = new _t(), Ui, Ci, fn, hn, Nt = {
  point: ft,
  lineStart: ft,
  lineEnd: ft,
  polygonStart: function() {
    Nt.lineStart = eo, Nt.lineEnd = io;
  },
  polygonEnd: function() {
    Nt.lineStart = Nt.lineEnd = Nt.point = ft, qe.add(A(ln)), ln = new _t();
  },
  result: function() {
    var e = qe / 2;
    return qe = new _t(), e;
  }
};
function eo() {
  Nt.point = no;
}
function no(e, t) {
  Nt.point = _i, Ui = fn = e, Ci = hn = t;
}
function _i(e, t) {
  ln.add(hn * e - fn * t), fn = e, hn = t;
}
function io() {
  _i(Ui, Ci);
}
var Kt = 1 / 0, Fe = Kt, ie = -Kt, ve = ie, Ne = {
  point: ro,
  lineStart: ft,
  lineEnd: ft,
  polygonStart: ft,
  polygonEnd: ft,
  result: function() {
    var e = [[Kt, Fe], [ie, ve]];
    return ie = ve = -(Fe = Kt = 1 / 0), e;
  }
};
function ro(e, t) {
  e < Kt && (Kt = e), e > ie && (ie = e), t < Fe && (Fe = t), t > ve && (ve = t);
}
var un = 0, dn = 0, Xt = 0, Pe = 0, je = 0, Ht = 0, pn = 0, bn = 0, Bt = 0, Ji, Zi, Et, xt, lt = {
  point: Jt,
  lineStart: ai,
  lineEnd: oi,
  polygonStart: function() {
    lt.lineStart = so, lt.lineEnd = co;
  },
  polygonEnd: function() {
    lt.point = Jt, lt.lineStart = ai, lt.lineEnd = oi;
  },
  result: function() {
    var e = Bt ? [pn / Bt, bn / Bt] : Ht ? [Pe / Ht, je / Ht] : Xt ? [un / Xt, dn / Xt] : [NaN, NaN];
    return un = dn = Xt = Pe = je = Ht = pn = bn = Bt = 0, e;
  }
};
function Jt(e, t) {
  un += e, dn += t, ++Xt;
}
function ai() {
  lt.point = ao;
}
function ao(e, t) {
  lt.point = oo, Jt(Et = e, xt = t);
}
function oo(e, t) {
  var n = e - Et, i = t - xt, r = ht(n * n + i * i);
  Pe += r * (Et + e) / 2, je += r * (xt + t) / 2, Ht += r, Jt(Et = e, xt = t);
}
function oi() {
  lt.point = Jt;
}
function so() {
  lt.point = lo;
}
function co() {
  Oi(Ji, Zi);
}
function lo(e, t) {
  lt.point = Oi, Jt(Ji = Et = e, Zi = xt = t);
}
function Oi(e, t) {
  var n = e - Et, i = t - xt, r = ht(n * n + i * i);
  Pe += r * (Et + e) / 2, je += r * (xt + t) / 2, Ht += r, r = xt * e - Et * t, pn += r * (Et + e), bn += r * (xt + t), Bt += r * 3, Jt(Et = e, xt = t);
}
function Di(e) {
  this._context = e;
}
Di.prototype = {
  _radius: 4.5,
  pointRadius: function(e) {
    return this._radius = e, this;
  },
  polygonStart: function() {
    this._line = 0;
  },
  polygonEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    this._line === 0 && this._context.closePath(), this._point = NaN;
  },
  point: function(e, t) {
    switch (this._point) {
      case 0: {
        this._context.moveTo(e, t), this._point = 1;
        break;
      }
      case 1: {
        this._context.lineTo(e, t);
        break;
      }
      default: {
        this._context.moveTo(e + this._radius, t), this._context.arc(e, t, this._radius, 0, st);
        break;
      }
    }
  },
  result: ft
};
var mn = new _t(), Qe, Yi, Hi, $t, te, re = {
  point: ft,
  lineStart: function() {
    re.point = fo;
  },
  lineEnd: function() {
    Qe && Ai(Yi, Hi), re.point = ft;
  },
  polygonStart: function() {
    Qe = !0;
  },
  polygonEnd: function() {
    Qe = null;
  },
  result: function() {
    var e = +mn;
    return mn = new _t(), e;
  }
};
function fo(e, t) {
  re.point = Ai, Yi = $t = e, Hi = te = t;
}
function Ai(e, t) {
  $t -= e, te -= t, mn.add(ht($t * $t + te * te)), $t = e, te = t;
}
let si, Re, ci, li;
class fi {
  constructor(t) {
    this._append = t == null ? Vi : ho(t), this._radius = 4.5, this._ = "";
  }
  pointRadius(t) {
    return this._radius = +t, this;
  }
  polygonStart() {
    this._line = 0;
  }
  polygonEnd() {
    this._line = NaN;
  }
  lineStart() {
    this._point = 0;
  }
  lineEnd() {
    this._line === 0 && (this._ += "Z"), this._point = NaN;
  }
  point(t, n) {
    switch (this._point) {
      case 0: {
        this._append`M${t},${n}`, this._point = 1;
        break;
      }
      case 1: {
        this._append`L${t},${n}`;
        break;
      }
      default: {
        if (this._append`M${t},${n}`, this._radius !== ci || this._append !== Re) {
          const i = this._radius, r = this._;
          this._ = "", this._append`m0,${i}a${i},${i} 0 1,1 0,${-2 * i}a${i},${i} 0 1,1 0,${2 * i}z`, ci = i, Re = this._append, li = this._, this._ = r;
        }
        this._ += li;
        break;
      }
    }
  }
  result() {
    const t = this._;
    return this._ = "", t.length ? t : null;
  }
}
function Vi(e) {
  let t = 1;
  this._ += e[0];
  for (const n = e.length; t < n; ++t)
    this._ += arguments[t] + e[t];
}
function ho(e) {
  const t = Math.floor(e);
  if (!(t >= 0)) throw new RangeError(`invalid digits: ${e}`);
  if (t > 15) return Vi;
  if (t !== si) {
    const n = 10 ** t;
    si = t, Re = function(r) {
      let a = 1;
      this._ += r[0];
      for (const o = r.length; a < o; ++a)
        this._ += Math.round(arguments[a] * n) / n + r[a];
    };
  }
  return Re;
}
function me(e, t) {
  let n = 3, i = 4.5, r, a;
  function o(s) {
    return s && (typeof i == "function" && a.pointRadius(+i.apply(this, arguments)), Ot(s, r(a))), a.result();
  }
  return o.area = function(s) {
    return Ot(s, r(Nt)), Nt.result();
  }, o.measure = function(s) {
    return Ot(s, r(re)), re.result();
  }, o.bounds = function(s) {
    return Ot(s, r(Ne)), Ne.result();
  }, o.centroid = function(s) {
    return Ot(s, r(lt)), lt.result();
  }, o.projection = function(s) {
    return arguments.length ? (r = s == null ? (e = null, cn) : (e = s).stream, o) : e;
  }, o.context = function(s) {
    return arguments.length ? (a = s == null ? (t = null, new fi(n)) : new Di(t = s), typeof i != "function" && a.pointRadius(i), o) : t;
  }, o.pointRadius = function(s) {
    return arguments.length ? (i = typeof s == "function" ? s : (a.pointRadius(+s), +s), o) : i;
  }, o.digits = function(s) {
    if (!arguments.length) return n;
    if (s == null) n = null;
    else {
      const h = Math.floor(s);
      if (!(h >= 0)) throw new RangeError(`invalid digits: ${s}`);
      n = h;
    }
    return t === null && (a = new fi(n)), o;
  }, o.projection(e).digits(n).context(t);
}
function kn(e) {
  return function(t) {
    var n = new gn();
    for (var i in e) n[i] = e[i];
    return n.stream = t, n;
  };
}
function gn() {
}
gn.prototype = {
  constructor: gn,
  point: function(e, t) {
    this.stream.point(e, t);
  },
  sphere: function() {
    this.stream.sphere();
  },
  lineStart: function() {
    this.stream.lineStart();
  },
  lineEnd: function() {
    this.stream.lineEnd();
  },
  polygonStart: function() {
    this.stream.polygonStart();
  },
  polygonEnd: function() {
    this.stream.polygonEnd();
  }
};
function Mn(e, t, n) {
  var i = e.clipExtent && e.clipExtent();
  return e.scale(150).translate([0, 0]), i != null && e.clipExtent(null), Ot(n, e.stream(Ne)), t(Ne.result()), i != null && e.clipExtent(i), e;
}
function Wi(e, t, n) {
  return Mn(e, function(i) {
    var r = t[1][0] - t[0][0], a = t[1][1] - t[0][1], o = Math.min(r / (i[1][0] - i[0][0]), a / (i[1][1] - i[0][1])), s = +t[0][0] + (r - o * (i[1][0] + i[0][0])) / 2, h = +t[0][1] + (a - o * (i[1][1] + i[0][1])) / 2;
    e.scale(150 * o).translate([s, h]);
  }, n);
}
function uo(e, t, n) {
  return Wi(e, [[0, 0], t], n);
}
function po(e, t, n) {
  return Mn(e, function(i) {
    var r = +t, a = r / (i[1][0] - i[0][0]), o = (r - a * (i[1][0] + i[0][0])) / 2, s = -a * i[0][1];
    e.scale(150 * a).translate([o, s]);
  }, n);
}
function bo(e, t, n) {
  return Mn(e, function(i) {
    var r = +t, a = r / (i[1][1] - i[0][1]), o = -a * i[0][0], s = (r - a * (i[1][1] + i[0][1])) / 2;
    e.scale(150 * a).translate([o, s]);
  }, n);
}
var hi = 16, mo = O(30 * L);
function ui(e, t) {
  return +t ? yo(e, t) : go(e);
}
function go(e) {
  return kn({
    point: function(t, n) {
      t = e(t, n), this.stream.point(t[0], t[1]);
    }
  });
}
function yo(e, t) {
  function n(i, r, a, o, s, h, c, l, f, u, p, d, E, b) {
    var g = c - i, x = l - r, m = g * g + x * x;
    if (m > 4 * t && E--) {
      var w = o + u, G = s + p, S = h + d, F = ht(w * w + G * G + S * S), v = Gt(S /= F), P = A(A(S) - 1) < C || A(a - f) < C ? (a + f) / 2 : Rt(G, w), M = e(P, v), k = M[0], D = M[1], U = k - i, j = D - r, y = x * U - g * j;
      (y * y / m > t || A((g * U + x * j) / m - 0.5) > 0.3 || o * u + s * p + h * d < mo) && (n(i, r, a, o, s, h, k, D, P, w /= F, G /= F, S, E, b), b.point(k, D), n(k, D, P, w, G, S, c, l, f, u, p, d, E, b));
    }
  }
  return function(i) {
    var r, a, o, s, h, c, l, f, u, p, d, E, b = {
      point: g,
      lineStart: x,
      lineEnd: w,
      polygonStart: function() {
        i.polygonStart(), b.lineStart = G;
      },
      polygonEnd: function() {
        i.polygonEnd(), b.lineStart = x;
      }
    };
    function g(v, P) {
      v = e(v, P), i.point(v[0], v[1]);
    }
    function x() {
      f = NaN, b.point = m, i.lineStart();
    }
    function m(v, P) {
      var M = Wt([v, P]), k = e(v, P);
      n(f, u, l, p, d, E, f = k[0], u = k[1], l = v, p = M[0], d = M[1], E = M[2], hi, i), i.point(f, u);
    }
    function w() {
      b.point = g, i.lineEnd();
    }
    function G() {
      x(), b.point = S, b.lineEnd = F;
    }
    function S(v, P) {
      m(r = v, P), a = f, o = u, s = p, h = d, c = E, b.point = m;
    }
    function F() {
      n(f, u, l, p, d, E, a, o, r, s, h, c, hi, i), b.lineEnd = w, w();
    }
    return b;
  };
}
var Eo = kn({
  point: function(e, t) {
    this.stream.point(e * L, t * L);
  }
});
function xo(e) {
  return kn({
    point: function(t, n) {
      var i = e(t, n);
      return this.stream.point(i[0], i[1]);
    }
  });
}
function wo(e, t, n, i, r) {
  function a(o, s) {
    return o *= i, s *= r, [t + e * o, n - e * s];
  }
  return a.invert = function(o, s) {
    return [(o - t) / e * i, (n - s) / e * r];
  }, a;
}
function di(e, t, n, i, r, a) {
  if (!a) return wo(e, t, n, i, r);
  var o = O(a), s = J(a), h = o * e, c = s * e, l = o / e, f = s / e, u = (s * n - o * t) / e, p = (s * t + o * n) / e;
  function d(E, b) {
    return E *= i, b *= r, [h * E - c * b + t, n - c * E - h * b];
  }
  return d.invert = function(E, b) {
    return [i * (l * E - f * b + u), r * (p - f * E - l * b)];
  }, d;
}
function Zt(e) {
  return Ki(function() {
    return e;
  })();
}
function Ki(e) {
  var t, n = 150, i = 480, r = 250, a = 0, o = 0, s = 0, h = 0, c = 0, l, f = 0, u = 1, p = 1, d = null, E = ei, b = null, g, x, m, w = cn, G = 0.5, S, F, v, P, M;
  function k(y) {
    return v(y[0] * L, y[1] * L);
  }
  function D(y) {
    return y = v.invert(y[0], y[1]), y && [y[0] * nt, y[1] * nt];
  }
  k.stream = function(y) {
    return P && M === y ? P : P = Eo(xo(l)(E(S(w(M = y)))));
  }, k.preclip = function(y) {
    return arguments.length ? (E = y, d = void 0, j()) : E;
  }, k.postclip = function(y) {
    return arguments.length ? (w = y, b = g = x = m = null, j()) : w;
  }, k.clipAngle = function(y) {
    return arguments.length ? (E = +y ? Ba(d = y * L) : (d = null, ei), j()) : d * nt;
  }, k.clipExtent = function(y) {
    return arguments.length ? (w = y == null ? (b = g = x = m = null, cn) : to(b = +y[0][0], g = +y[0][1], x = +y[1][0], m = +y[1][1]), j()) : b == null ? null : [[b, g], [x, m]];
  }, k.scale = function(y) {
    return arguments.length ? (n = +y, U()) : n;
  }, k.translate = function(y) {
    return arguments.length ? (i = +y[0], r = +y[1], U()) : [i, r];
  }, k.center = function(y) {
    return arguments.length ? (a = y[0] % 360 * L, o = y[1] % 360 * L, U()) : [a * nt, o * nt];
  }, k.rotate = function(y) {
    return arguments.length ? (s = y[0] % 360 * L, h = y[1] % 360 * L, c = y.length > 2 ? y[2] % 360 * L : 0, U()) : [s * nt, h * nt, c * nt];
  }, k.angle = function(y) {
    return arguments.length ? (f = y % 360 * L, U()) : f * nt;
  }, k.reflectX = function(y) {
    return arguments.length ? (u = y ? -1 : 1, U()) : u < 0;
  }, k.reflectY = function(y) {
    return arguments.length ? (p = y ? -1 : 1, U()) : p < 0;
  }, k.precision = function(y) {
    return arguments.length ? (S = ui(F, G = y * y), j()) : ht(G);
  }, k.fitExtent = function(y, N) {
    return Wi(k, y, N);
  }, k.fitSize = function(y, N) {
    return uo(k, y, N);
  }, k.fitWidth = function(y, N) {
    return po(k, y, N);
  }, k.fitHeight = function(y, N) {
    return bo(k, y, N);
  };
  function U() {
    var y = di(n, 0, 0, u, p, f).apply(null, t(a, o)), N = di(n, i - y[0], r - y[1], u, p, f);
    return l = ji(s, h, c), F = on(t, N), v = on(l, F), S = ui(F, G), j();
  }
  function j() {
    return P = M = null, k;
  }
  return function() {
    return t = e.apply(this, arguments), k.invert = t.invert && D, U();
  };
}
function zi(e) {
  var t = 0, n = _ / 3, i = Ki(e), r = i(t, n);
  return r.parallels = function(a) {
    return arguments.length ? i(t = a[0] * L, n = a[1] * L) : [t * nt, n * nt];
  }, r;
}
function Go(e) {
  var t = O(e);
  function n(i, r) {
    return [i * t, J(r) / t];
  }
  return n.invert = function(i, r) {
    return [i / t, Gt(r * t)];
  }, n;
}
function So(e, t) {
  var n = J(e), i = (n + J(t)) / 2;
  if (A(i) < C) return Go(e);
  var r = 1 + n * (2 * i - n), a = ht(r) / i;
  function o(s, h) {
    var c = ht(r - 2 * i * J(h)) / i;
    return [c * J(s *= i), a - c * O(s)];
  }
  return o.invert = function(s, h) {
    var c = a - h, l = Rt(s, A(c)) * jt(c);
    return c * i < 0 && (l -= _ * jt(s) * jt(c)), [l / i, Gt((r - (s * s + c * c) * i * i) / (2 * i))];
  }, o;
}
function pi() {
  return zi(So).scale(155.424).center([0, 33.6442]);
}
function ko(e) {
  return function(t, n) {
    var i = O(t), r = O(n), a = e(i * r);
    return a === 1 / 0 ? [2, 0] : [
      a * r * J(t),
      a * J(n)
    ];
  };
}
function Ue(e) {
  return function(t, n) {
    var i = ht(t * t + n * n), r = e(i), a = J(r), o = O(r);
    return [
      Rt(t * a, i * o),
      Gt(i && n * a / i)
    ];
  };
}
var Li = ko(function(e) {
  return ht(2 / (1 + e));
});
Li.invert = Ue(function(e) {
  return 2 * Gt(e / 2);
});
function bi() {
  return Zt(Li).scale(124.75).clipAngle(180 - 1e-3);
}
function Ce(e, t) {
  return [e, en(Pi((Q + t) / 2))];
}
Ce.invert = function(e, t) {
  return [e, 2 * se(Ha(t)) - Q];
};
function Mo() {
  return Fo(Ce).scale(961 / st);
}
function Fo(e) {
  var t = Zt(e), n = t.center, i = t.scale, r = t.translate, a = t.clipExtent, o = null, s, h, c;
  t.scale = function(f) {
    return arguments.length ? (i(f), l()) : i();
  }, t.translate = function(f) {
    return arguments.length ? (r(f), l()) : r();
  }, t.center = function(f) {
    return arguments.length ? (n(f), l()) : n();
  }, t.clipExtent = function(f) {
    return arguments.length ? (f == null ? o = s = h = c = null : (o = +f[0][0], s = +f[0][1], h = +f[1][0], c = +f[1][1]), l()) : o == null ? null : [[o, s], [h, c]];
  };
  function l() {
    var f = _ * i(), u = t(Va(t.rotate()).invert([0, 0]));
    return a(o == null ? [[u[0] - f, u[1] - f], [u[0] + f, u[1] + f]] : e === Ce ? [[Math.max(u[0] - f, o), s], [Math.min(u[0] + f, h), c]] : [[o, Math.max(u[1] - f, s)], [h, Math.min(u[1] + f, c)]]);
  }
  return l();
}
function ge(e) {
  return Pi((Q + e) / 2);
}
function vo(e, t) {
  var n = O(e), i = e === t ? J(e) : en(n / O(t)) / en(ge(t) / ge(e)), r = n * Ke(ge(e), i) / i;
  if (!i) return Ce;
  function a(o, s) {
    r > 0 ? s < -Q + C && (s = -Q + C) : s > Q - C && (s = Q - C);
    var h = r / Ke(ge(s), i);
    return [h * J(i * o), r - h * O(i * o)];
  }
  return a.invert = function(o, s) {
    var h = r - s, c = jt(i) * ht(o * o + h * h), l = Rt(o, A(h)) * jt(h);
    return h * i < 0 && (l -= _ * jt(o) * jt(h)), [l / i, 2 * se(Ke(r / c, 1 / i)) - Q];
  }, a;
}
function No() {
  return zi(vo).scale(109.5).parallels([30, 30]);
}
function yn(e, t) {
  return [e, t];
}
yn.invert = yn;
function En() {
  return Zt(yn).scale(152.63);
}
function qi(e, t) {
  var n = O(t), i = O(e) * n;
  return [n * J(e) / i, J(t) / i];
}
qi.invert = Ue(se);
function Po() {
  return Zt(qi).scale(144.049).clipAngle(60);
}
function Qi(e, t) {
  var n = t * t, i = n * n;
  return [
    e * (0.8707 - 0.131979 * n + i * (-0.013791 + i * (3971e-6 * n - 1529e-6 * i))),
    t * (1.007226 + n * (0.015085 + i * (-0.044475 + 0.028874 * n - 5916e-6 * i)))
  ];
}
Qi.invert = function(e, t) {
  var n = t, i = 25, r;
  do {
    var a = n * n, o = a * a;
    n -= r = (n * (1.007226 + a * (0.015085 + o * (-0.044475 + 0.028874 * a - 5916e-6 * o))) - t) / (1.007226 + a * (0.015085 * 3 + o * (-0.044475 * 7 + 0.028874 * 9 * a - 5916e-6 * 11 * o)));
  } while (A(r) > C && --i > 0);
  return [
    e / (0.8707 + (a = n * n) * (-0.131979 + a * (-0.013791 + a * a * a * (3971e-6 - 1529e-6 * a)))),
    n
  ];
};
function mi() {
  return Zt(Qi).scale(175.295);
}
function Xi(e, t) {
  return [O(t) * J(e), J(t)];
}
Xi.invert = Ue(Gt);
function jo() {
  return Zt(Xi).scale(249.5).clipAngle(90 + C);
}
function Bi(e, t) {
  var n = O(t), i = 1 + O(e) * n;
  return [n * J(e) / i, J(t) / i];
}
Bi.invert = Ue(function(e) {
  return 2 * se(e);
});
function Ro() {
  return Zt(Bi).scale(250).clipAngle(142);
}
const To = {
  density: null,
  // null = auto from canvas width
  scale: 18,
  // px max-arrow length
  color: "rgba(255,255,255,0.85)",
  cmap: null,
  // if set, color by magnitude
  linewidth: 1,
  headSize: 3,
  // px
  vmin: null,
  vmax: null
};
class Io {
  constructor(t, n, i, r, a = {}) {
    this._lons = t, this._lats = n, this._opts = { ...To, ...a };
    const o = t.length, s = n.length;
    this._nlon = o, this._nlat = s, this._u = gi(i, s, o), this._v = gi(r, s, o);
    let h = 1 / 0, c = -1 / 0;
    for (let l = 0; l < this._u.length; l++) {
      const f = Math.hypot(this._u[l], this._v[l]);
      isFinite(f) && (f < h && (h = f), f > c && (c = f));
    }
    this._minM = a.vmin ?? h, this._maxM = a.vmax ?? c;
  }
  /**
   * Render arrows as SVG path elements into an existing <g> group.
   * @param {SVGGElement} group        SVG group element to render into
   * @param {Function}    projectFn    [lon, lat] → [x, y] in pixels
   * @param {number}      canvasWidth  used for density auto-tuning
   */
  render(t, n, i) {
    const r = this._opts, a = this._nlon, o = this._nlat, s = "http://www.w3.org/2000/svg", h = r.density ?? Math.max(1, Math.round(a / 30)), c = r.cmap ? vt(r.cmap) : null, l = this._maxM - this._minM || 1;
    for (; t.firstChild; ) t.removeChild(t.firstChild);
    for (let f = 0; f < o; f += h)
      for (let u = 0; u < a; u += h) {
        const p = f * a + u, d = this._u[p], E = this._v[p];
        if (!isFinite(d) || !isFinite(E)) continue;
        const b = Math.hypot(d, E);
        if (b === 0) continue;
        const g = n([this._lons[u], this._lats[f]]);
        if (!g) continue;
        const x = 0.5, m = n([this._lons[u] + x, this._lats[f]]), w = n([this._lons[u], this._lats[f] + x]);
        if (!m || !w) continue;
        const G = (m[0] - g[0]) / x, S = (m[1] - g[1]) / x, F = (w[0] - g[0]) / x, v = (w[1] - g[1]) / x, P = Math.min(b, this._maxM) / this._maxM * r.scale, M = d / b, k = E / b, D = (G * M + F * k) * P / Math.hypot(G, S), U = (S * M + v * k) * P / Math.hypot(G, S), j = c ? `rgb(${c(Math.max(0, Math.min(1, (b - this._minM) / l))).join(",")})` : r.color, y = g[0] - D / 2, N = g[1] - U / 2, Z = g[0] + D / 2, Y = g[1] + U / 2, H = document.createElementNS(s, "line");
        H.setAttribute("x1", y), H.setAttribute("y1", N), H.setAttribute("x2", Z), H.setAttribute("y2", Y), H.setAttribute("stroke", j), H.setAttribute("stroke-width", r.linewidth), H.setAttribute("stroke-linecap", "round"), t.appendChild(H);
        const K = Math.atan2(U, D), V = r.headSize, X = Z - V * Math.cos(K - Math.PI / 7), q = Y - V * Math.sin(K - Math.PI / 7), mt = Z - V * Math.cos(K + Math.PI / 7), $ = Y - V * Math.sin(K + Math.PI / 7), gt = document.createElementNS(s, "polygon");
        gt.setAttribute("points", `${Z},${Y} ${X},${q} ${mt},${$}`), gt.setAttribute("fill", j), t.appendChild(gt);
      }
  }
}
function gi(e, t, n) {
  if (e instanceof Float32Array || e instanceof Float64Array || !Array.isArray(e[0])) return e;
  const r = new Float32Array(t * n);
  for (let a = 0; a < t; a++)
    for (let o = 0; o < n; o++)
      r[a * n + o] = e[a][o];
  return r;
}
const Uo = {
  equirectangular: En,
  platecarree: En,
  mercator: Mo,
  orthographic: jo,
  naturalearth: mi,
  naturalearth1: mi,
  stereographic: Ro,
  azimuthalequalarea: bi,
  equalarea: bi,
  coniquequalarea: pi,
  albers: pi,
  lambertconformal: No,
  gnomonic: Po
};
function Co(e) {
  const t = (e || "equirectangular").toLowerCase().replace(/[\s_-]/g, "");
  return Uo[t] ?? En;
}
const _o = 960;
class Vo {
  /**
   * @param {string|Element} container  CSS selector or DOM element
   * @param {object} options
   * @param {string}   options.projection   Projection name (default 'equirectangular')
   * @param {string}   options.background   Background color (default '#090912')
   * @param {boolean}  options.graticule    Draw lat/lon grid (default true)
   * @param {string}   options.graticuleColor
   * @param {number[]} options.center       [lon, lat] map center (default [0,0])
   * @param {number[]} options.rotate       [λ,φ,γ] explicit d3 rotation (overrides center)
   * @param {boolean}  options.tooltip      Enable hover tooltip (default true)
   */
  constructor(t, n = {}) {
    this._el = typeof t == "string" ? document.querySelector(t) : t;
    const {
      projection: i = "equirectangular",
      background: r = "#090912",
      graticule: a = !0,
      graticuleColor: o = "rgba(255,255,255,0.09)",
      center: s = [0, 0],
      rotate: h = null,
      tooltip: c = !0,
      interactive: l = !0,
      // extent: [lon0, lon1, lat0, lat1] — zoom to a region (like cartopy set_extent)
      extent: f = null
    } = n;
    this._background = r, this._layers = [], this._featureGroups = [], this._markers = [], this._titleEl = null, this._clickHandlers = [], this._nextId = 0, this._fieldData = null, this._gratEl = null, this._activeAnims = [], this._extent = f || null, this._projName = i, this._bgImageData = null;
    const u = this._el.getBoundingClientRect();
    this._w = u.width || 900, this._h = u.height || 500, Object.assign(this._el.style, {
      position: "relative",
      overflow: "hidden",
      background: r
    }), this._canvas = document.createElement("canvas"), this._canvas.width = this._w, this._canvas.height = this._h, Object.assign(this._canvas.style, { position: "absolute", top: "0", left: "0" }), this._el.appendChild(this._canvas), this._ctx = this._canvas.getContext("2d");
    const p = "http://www.w3.org/2000/svg";
    if (this._NS = p, this._svg = document.createElementNS(p, "svg"), this._svg.setAttribute("width", this._w), this._svg.setAttribute("height", this._h), Object.assign(this._svg.style, {
      position: "absolute",
      top: "0",
      left: "0",
      pointerEvents: "none"
    }), this._el.appendChild(this._svg), c && (this._tip = document.createElement("div"), Object.assign(this._tip.style, {
      position: "absolute",
      pointerEvents: "none",
      display: "none",
      background: "rgba(8,8,20,0.88)",
      color: "#e2e8f0",
      font: '12px/1.6 ui-monospace,"Cascadia Code",monospace',
      padding: "6px 10px",
      borderRadius: "5px",
      whiteSpace: "pre",
      border: "1px solid rgba(255,255,255,0.18)",
      boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
      zIndex: "10"
    }), this._el.appendChild(this._tip), this._canvas.addEventListener("mousemove", this._onMove.bind(this)), this._canvas.addEventListener("mouseleave", () => {
      this._tip.style.display = "none";
    })), this._canvas.style.pointerEvents = "auto", this._canvas.addEventListener("click", this._onClick.bind(this)), l && this._setupInteraction(), this._resizeObs = new ResizeObserver(() => this._handleResize()), this._resizeObs.observe(this._el), this._proj = Co(i)().fitSize([this._w, this._h], { type: "Sphere" }), h ? this._proj.rotate(h) : (s[0] !== 0 || s[1] !== 0) && this._proj.rotate([-s[0], -s[1], 0]), f) {
      const [d, E, b, g] = f, x = Math.min(this._w, this._h) * 0.04, m = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[[d, b], [d, g], [E, g], [E, b], [d, b]]]
        }
      };
      this._proj.fitExtent([[x, x], [this._w - x, this._h - x]], m);
    }
    this._path = me().projection(this._proj), this._sphereEl = document.createElementNS(p, "path"), this._sphereEl.setAttribute("d", this._path({ type: "Sphere" })), this._sphereEl.setAttribute("fill", r), this._sphereEl.setAttribute("stroke", "rgba(255,255,255,0.25)"), this._sphereEl.setAttribute("stroke-width", "1"), this._svg.appendChild(this._sphereEl), a && (this._gratEl = document.createElementNS(p, "path"), this._gratEl.setAttribute("d", this._path(ri()())), this._gratEl.setAttribute("fill", "none"), this._gratEl.setAttribute("stroke", o), this._gratEl.setAttribute("stroke-width", "0.5"), this._svg.appendChild(this._gratEl));
    if (n.earthSurface === "satellite") {
      this.addBackgroundImage("https://unpkg.com/three-globe/example/img/earth-night.jpg");
    } else if (n.earthSurface === "shaded_relief" || n.earthSurface === "stock") {
      this.addBackgroundImage("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg");
    }
  }
  // ── Public field API (matches GeoSphere) ──────────────────────────────────
  /**
   * Smooth colour-filled field.  Equivalent to ax.pcolormesh() in cartopy.
   * @param {number[]} lons   1D lon array, ascending
   * @param {number[]} lats   1D lat array, ascending or descending
   * @param {Array}    field  2D array field[j][i] or flat TypedArray
   * @param {object}   opts   { cmap, alpha, vmin, vmax, name, units }
   * @returns {number} layer id
   */
  pcolormesh(t, n, i, r = {}) {
    const a = ++this._nextId, { cmap: o = "viridis", alpha: s = 0.85, vmin: h = null, vmax: c = null } = r, l = Ee(t, n, i, h, c);
    return this._rasterize(l, t, n, vt(o), s, null), this._storeField(t, n, l, r), this._layers.push({ id: a, type: "pcolormesh", lons: t, lats: n, field: i, opts: r }), a;
  }
  /**
   * Banded colour-filled field.  Equivalent to ax.contourf() in cartopy.
   * @param {number} opts.levels   Number of discrete bands (default 12)
   */
  contourf(t, n, i, r = {}) {
    const a = ++this._nextId, { cmap: o = "viridis", alpha: s = 0.85, levels: h = 12, vmin: c = null, vmax: l = null } = r, f = Ee(t, n, i, c, l);
    return this._rasterize(f, t, n, vt(o), s, h), this._storeField(t, n, f, r), this._layers.push({ id: a, type: "contourf", lons: t, lats: n, field: i, opts: r }), a;
  }
  /**
   * Contour isolines rendered as SVG paths projected through the map.
   * Equivalent to ax.contour() in cartopy.
   */
  contour(t, n, i, r = {}) {
    const a = ++this._nextId, {
      levels: o = 8,
      cmap: s = null,
      color: h = "rgba(255,255,255,0.75)",
      alpha: c = 0.9,
      vmin: l = null,
      vmax: f = null,
      linewidth: u = 1.2,
      smoothFactor: p = 4,
      chaikin: d = 2
    } = r, { flat: E, nlon: b, nlat: g, minV: x, maxV: m } = yi(t, n, i, l, f), w = m - x || 1, G = s ? vt(s) : null;
    let S = E, F = b, v = g;
    p > 1 && ({ field: S, nlon: F, nlat: v } = Ei(E, g, b, p));
    const P = Array.isArray(o) ? o : Array.from({ length: o }, (y, N) => x + (N + 0.5) / o * w), M = Be().size([F, v]).thresholds(P)(S), k = t[t.length - 1] - t[0], D = n[n.length - 1] - n[0], U = this._NS, j = document.createElementNS(U, "g");
    j.setAttribute("class", `tp-contour-${a}`), j.setAttribute("opacity", String(c));
    for (const y of M) {
      const N = Math.max(0, Math.min(1, (y.value - x) / w)), Z = G ? `rgb(${G(N).join(",")})` : h;
      for (const Y of y.coordinates)
        for (let H of Y) {
          d > 0 && (H = xi(H, d));
          const K = H.map(([X, q]) => [
            t[0] + X / (F - 1) * k,
            n[0] + q / (v - 1) * D
          ]);
          const segments = [];
          let currentSegment = [K[0]];
          const threshold = Math.max(100, this._w * 0.25);
          for (let m = 0; m < K.length - 1; m++) {
            const p1 = K[m];
            const p2 = K[m + 1];
            const [X1, q1] = H[m];
            const [X2, q2] = H[m + 1];
            if ((X1 < 0.01 && X2 < 0.01) ||
                (X1 > F - 1.01 && X2 > F - 1.01) ||
                (q1 < 0.01 && q2 < 0.01) ||
                (q1 > v - 1.01 && q2 > v - 1.01)) {
              segments.push(currentSegment);
              currentSegment = [p2];
              continue;
            }
            const proj1 = this._proj(p1);
            const proj2 = this._proj(p2);
            let split = false;
            if (proj1 && proj2 && isFinite(proj1[0]) && isFinite(proj1[1]) && isFinite(proj2[0]) && isFinite(proj2[1])) {
              const dx = proj1[0] - proj2[0];
              const dy = proj1[1] - proj2[1];
              if (dx * dx + dy * dy > threshold * threshold) {
                split = true;
              }
            } else {
              split = true;
            }
            if (split) {
              segments.push(currentSegment);
              currentSegment = [p2];
            } else {
              currentSegment.push(p2);
            }
          }
          if (currentSegment.length > 0) {
            segments.push(currentSegment);
          }
          for (const seg of segments) {
            if (seg.length < 2) continue;
            const V = document.createElementNS(U, "path");
            V.setAttribute("d", this._path({ type: "LineString", coordinates: seg }));
            V.setAttribute("fill", "none");
            V.setAttribute("stroke", Z);
            V.setAttribute("stroke-width", String(u));
            j.appendChild(V);
          }
        }
    }
    return this._svg.appendChild(j), this._layers.push({ id: a, type: "contour", lons: t, lats: n, field: i, opts: r, svgGroup: j }), a;
  }
  /**
   * Add a geographic feature (coastlines, borders) as SVG paths.
   * GeoJSON is fetched once and cached for reprojection on setExtent().
   * @param {string} type   'coastlines' | 'borders'
   * @param {object} opts   { color, linewidth, opacity, url }
   */
  addFeature(t, n = {}) {
    const i = t === "coastlines" ? "rgba(200,220,255,0.85)" : "rgba(180,180,200,0.5)", { color: r = i, linewidth: a = 0.8, opacity: o = 1, url: s = null, fill: h = "none" } = n, c = this._featureGroups.find((d) => d.type === t);
    if (c)
      return c.opts = { color: r, linewidth: a, opacity: o }, c.svgGroup.setAttribute("opacity", String(o)), c.geojson && this._renderFeature(c), this;
    const l = s || Ni[t];
    if (!l)
      return console.warn(`[GeoMap] No URL for feature: ${t}`), this;
    const f = this._NS, u = document.createElementNS(f, "g");
    u.setAttribute("class", `tp-feature-${t}`), u.setAttribute("opacity", String(o)), this._svg.appendChild(u);
    const p = { type: t, opts: { color: r, linewidth: a, opacity: o, fill: h }, svgGroup: u, geojson: null };
    return this._featureGroups.push(p), fetch(l).then((d) => d.json()).then((d) => {
      p.geojson = d, this._renderFeature(p);
    }).catch((d) => console.warn(`[GeoMap] Feature fetch failed for ${t}:`, d)), this;
  }
  /**
   * Vector field arrows — equivalent to ax.quiver() in cartopy.
   * @param {number[]} lons   1D lon array
   * @param {number[]} lats   1D lat array
   * @param {Array}    u      east-west wind component (2D or flat)
   * @param {Array}    v      north-south wind component (2D or flat)
   * @param {object}   opts   { density, scale, color, cmap, linewidth, headSize, vmin, vmax }
   * @returns {number} layer id
   */
  quiver(t, n, i, r, a = {}) {
    const o = ++this._nextId, s = this._NS, h = document.createElementNS(s, "g");
    h.setAttribute("class", `tp-quiver-${o}`), this._svg.appendChild(h);
    const c = new Io(t, n, i, r, a);
    return c.render(h, (l) => this._proj(l), this._w), this._layers.push({ id: o, type: "quiver", lons: t, lats: n, u: i, v: r, opts: a, svgGroup: h, qLayer: c }), o;
  }
  /**
   * Drop a labelled marker at a geographic point.
   * Equivalent to ax.plot(lon, lat, marker='*') in cartopy.
   * @returns {number} marker id (use clearMarker(id) to remove)
   */
  marker(t, n, i = {}) {
    const {
      label: r = null,
      color: a = "#fbbf24",
      size: o = 6,
      ringColor: s = "rgba(0,0,0,0.85)"
    } = i, h = this._NS, c = document.createElementNS(h, "g");
    c.setAttribute("class", "tp-marker");
    const l = document.createElementNS(h, "circle"), f = document.createElementNS(h, "circle");
    c.appendChild(f), c.appendChild(l);
    let u = null;
    r && (u = document.createElementNS(h, "text"), u.setAttribute("font-size", "11"), u.setAttribute("font-family", "system-ui, sans-serif"), u.setAttribute("fill", "#e2e8f0"), u.setAttribute("paint-order", "stroke"), u.setAttribute("stroke", "rgba(0,0,0,0.85)"), u.setAttribute("stroke-width", "3"), u.textContent = r, c.appendChild(u));
    const p = { lat: t, lon: n, color: a, size: o, ringColor: s, label: r, svgEl: c, circleEl: l, ringEl: f, labelEl: u, id: ++this._nextId };
    return this._markers.push(p), this._svg.appendChild(c), this._renderMarker(p), p.id;
  }
  clearMarker(t) {
    const n = this._markers.findIndex((i) => i.id === t);
    n < 0 || (this._markers[n].svgEl.remove(), this._markers.splice(n, 1));
  }
  clearMarkers() {
    this._markers.forEach((t) => t.svgEl.remove()), this._markers = [];
  }
  _renderMarker(t) {
    const n = this._proj([t.lon, t.lat]);
    if (!n) {
      t.svgEl.style.display = "none";
      return;
    }
    t.svgEl.style.display = "", t.circleEl.setAttribute("cx", n[0]), t.circleEl.setAttribute("cy", n[1]), t.circleEl.setAttribute("r", t.size), t.circleEl.setAttribute("fill", t.color), t.ringEl.setAttribute("cx", n[0]), t.ringEl.setAttribute("cy", n[1]), t.ringEl.setAttribute("r", t.size + 2), t.ringEl.setAttribute("fill", "none"), t.ringEl.setAttribute("stroke", t.ringColor), t.ringEl.setAttribute("stroke-width", "2"), t.labelEl && (t.labelEl.setAttribute("x", n[0] + t.size + 4), t.labelEl.setAttribute("y", n[1] + 4));
  }
  /**
   * Register a click handler.  Receives { lat, lon, value, x, y } on every map click.
   * @returns {Function} unsubscribe function
   */
  onClick(t) {
    return this._clickHandlers.push(t), () => {
      const n = this._clickHandlers.indexOf(t);
      n >= 0 && this._clickHandlers.splice(n, 1);
    };
  }
  _onClick(t) {
    if (!this._clickHandlers.length) return;
    const n = this._canvas.getBoundingClientRect(), i = t.clientX - n.left, r = t.clientY - n.top, a = this._proj.invert([i, r]);
    if (!a) return;
    const [o, s] = a;
    if (!isFinite(o) || !isFinite(s)) return;
    let h = NaN;
    if (this._fieldData) {
      const c = this._fieldData;
      h = Xe(o, s, c.lons, c.lats, c.get, c.nlon, c.nlat);
    }
    for (const c of this._clickHandlers) c({ lat: s, lon: o, value: h, x: i, y: r });
  }
  _setupInteraction() {
    let t = !1, n = !1, i, r, a, o;
    this._canvas.style.cursor = "grab", this._canvas.addEventListener("mousedown", (c) => {
      t = !0, n = !1, i = c.clientX, r = c.clientY;
      const l = this._proj.translate();
      a = l[0], o = l[1], this._canvas.style.cursor = "grabbing", c.preventDefault();
    });
    const s = (c) => {
      if (!t) return;
      const l = c.clientX - i, f = c.clientY - r;
      (Math.abs(l) > 3 || Math.abs(f) > 3) && (n = !0), this._proj.translate([a + l, o + f]), this._redrawAll();
    }, h = () => {
      t && (t = !1, this._canvas.style.cursor = "grab");
    };
    window.addEventListener("mousemove", s), window.addEventListener("mouseup", h), this._canvas.addEventListener("click", (c) => {
      n && (c.stopImmediatePropagation(), n = !1);
    }, !0), this._el.addEventListener("wheel", (c) => {
      c.preventDefault();
      const l = c.deltaY < 0 ? 1.12 : 1 / 1.12, f = this._canvas.getBoundingClientRect(), u = c.clientX - f.left, p = c.clientY - f.top, d = this._proj.scale(), E = this._proj.translate(), b = d * l, g = u - (u - E[0]) * (b / d), x = p - (p - E[1]) * (b / d);
      this._proj.scale(b).translate([g, x]), this._redrawAll();
    }, { passive: !1 });
  }
  _renderFeature(t) {
    t.svgGroup.innerHTML = "";
    const n = document.createElementNS(this._NS, "path");
    n.setAttribute("d", this._path(t.geojson)), n.setAttribute("fill", t.opts.fill || "none"), n.setAttribute("stroke", t.opts.color), n.setAttribute("stroke-width", String(t.opts.linewidth)), t.svgGroup.appendChild(n);
  }
  // ── Animation ─────────────────────────────────────────────────────────────
  /**
   * Animate through an array of field frames.  Same API as GeoSphere.animate().
   *
   * frames: array of { lons, lats, field } objects
   *         OR compact format { lons, lats, frames: [{ field, coord_value }] }
   *         (compact is what pyterraplot.binary.pack_frames() / frames_compact() produces)
   *
   * options.type:         'pcolormesh' | 'contourf'  (default 'pcolormesh')
   * options.interval:     ms between frames  (default 600)
   * options.loop:         loop back to start (default true)
   * options.layerOptions: passed to pcolormesh / contourf
   * options.onFrame:      callback(frameIndex, frameData)
   *
   * Returns { play(), pause(), stop(), seek(i), frame }
   */
  animate(t, n = {}) {
    const {
      type: i = "pcolormesh",
      interval: r = 600,
      loop: a = !0,
      layerOptions: o = {},
      onFrame: s = null
    } = n;
    let h, c, l;
    !Array.isArray(t) && t.frames ? (c = t.lons, l = t.lats, h = t.frames) : h = t;
    let f = 0, u = !1, p = null;
    const d = (G) => {
      const S = h[G], F = c ?? S.lons, v = l ?? S.lats;
      this.clear(i), this[i](F, v, S.field, o), s == null || s(G, S);
    }, E = () => {
      d(f), f = (f + 1) % h.length, !a && f === 0 && g();
    }, b = () => {
      u || (u = !0, E(), p = setInterval(E, r));
    }, g = () => {
      u = !1, clearInterval(p);
    }, x = () => {
      g(), f = 0, this.clear(i);
    }, m = (G) => {
      f = Math.max(0, Math.min(h.length - 1, G)), d(f);
    };
    b();
    const w = { play: b, pause: g, stop: x, seek: m, get frame() {
      return f;
    } };
    return this._activeAnims.push(w), w;
  }
  // ── Layer management ──────────────────────────────────────────────────────
  clear(t) {
    if (typeof t == "number") {
      const n = this._layers.findIndex((i) => i.id === t);
      n >= 0 && (this._drop(this._layers[n]), this._layers.splice(n, 1));
    } else
      this._layers = this._layers.filter((n) => n.type === t ? (this._drop(n), !1) : !0);
    this._layers.some((n) => n.type === "pcolormesh" || n.type === "contourf") || (this._ctx.clearRect(0, 0, this._w, this._h), this._fieldData = null);
  }
  clearAll() {
    this._ctx.clearRect(0, 0, this._w, this._h), this._layers.forEach((t) => {
      var n;
      return (n = t.svgGroup) == null ? void 0 : n.remove();
    }), this._layers = [], this._fieldData = null;
  }
  /**
   * Add a text title to the map.
   * @param {string} text
   * @param {object} opts  { x, y, color, fontSize, anchor }
   */
  title(t, n = {}) {
    const {
      x: i = this._w / 2,
      y: r = 18,
      color: a = "rgba(226,232,240,0.92)",
      fontSize: o = 14,
      anchor: s = "middle"
    } = n, h = this._NS;
    return this._titleEl || (this._titleEl = document.createElementNS(h, "text"), this._titleEl.setAttribute("class", "tp-title"), this._titleEl.setAttribute("font-family", "system-ui, sans-serif"), this._svg.appendChild(this._titleEl)), this._titleEl.setAttribute("x", i), this._titleEl.setAttribute("y", r), this._titleEl.setAttribute("fill", a), this._titleEl.setAttribute("font-size", o), this._titleEl.setAttribute("text-anchor", s), this._titleEl.textContent = t, this;
  }
  /**
   * Tear down: stop animations, remove DOM, disconnect observers.
   */
  dispose() {
    var t, n;
    this._activeAnims.forEach((i) => {
      var r;
      return (r = i.pause) == null ? void 0 : r.call(i);
    }), this._activeAnims = [], (t = this._resizeObs) == null || t.disconnect(), this._clickHandlers = [], this._layers.forEach((i) => {
      var r;
      return (r = i.svgGroup) == null ? void 0 : r.remove();
    }), this._layers = [], this._featureGroups.forEach((i) => i.svgGroup.remove()), this._featureGroups = [], this._markers.forEach((i) => i.svgEl.remove()), this._markers = [], this._svg.remove(), this._canvas.remove(), (n = this._tip) == null || n.remove();
  }
  _handleResize() {
    const t = this._el.getBoundingClientRect(), n = Math.round(t.width || this._w), i = Math.round(t.height || this._h);
    if (n === this._w && i === this._h || n < 10 || i < 10) return;
    this._w = n, this._h = i, this._canvas.width = n, this._canvas.height = i, this._svg.setAttribute("width", n), this._svg.setAttribute("height", i);
    const r = this._proj.rotate();
    if (this._extent) {
      const [a, o, s, h] = this._extent, c = Math.min(n, i) * 0.04;
      this._proj.fitExtent(
        [[c, c], [n - c, i - c]],
        { type: "Feature", geometry: {
          type: "Polygon",
          coordinates: [[[a, s], [a, h], [o, h], [o, s], [a, s]]]
        } }
      );
    } else
      this._proj.fitSize([n, i], { type: "Sphere" }), this._proj.rotate(r);
    this._path = me().projection(this._proj), this._redrawAll(), this._titleEl && this._titleEl.setAttribute("x", n / 2);
  }
  /**
   * Refit the projection to a geographic bounding box.
   * Equivalent to cartopy ax.set_extent([lon0, lon1, lat0, lat1]).
   * Triggers a full re-render of all field layers.
   * @param {[number, number, number, number]} extent  [lon0, lon1, lat0, lat1]
   */
  /**
   * Refit the projection to a geographic bounding box and re-render all layers.
   * Equivalent to cartopy ax.set_extent([lon0, lon1, lat0, lat1]).
   * @param {[number, number, number, number]} extent  [lon0, lon1, lat0, lat1]
   */
  setExtent([t, n, i, r]) {
    this._extent = [t, n, i, r];
    const a = Math.min(this._w, this._h) * 0.04;
    return this._proj.fitExtent(
      [[a, a], [this._w - a, this._h - a]],
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[[t, i], [t, r], [n, r], [n, i], [t, i]]]
        }
      }
    ), this._path = me().projection(this._proj), this._redrawAll(), this;
  }
  addBackgroundImage(url) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      this._bgImageData = ctx.getImageData(0, 0, img.width, img.height);
      this._redrawAll();
    };
    img.src = url;
    return this;
  }
  _drawBackgroundOnly() {
    if (!this._bgImageData) return;
    const d = Math.min(this._w, _o), E = Math.round(d * (this._h / this._w)), b = this._w / d, g = this._h / E, x = document.createElement("canvas");
    x.width = d, x.height = E;
    const m = x.getContext("2d"), w = m.createImageData(d, E), G = w.data;
    const W_img = this._bgImageData.width, H_img = this._bgImageData.height, G_img = this._bgImageData.data;
    for (let S = 0; S < E; S++) {
      for (let F = 0; F < d; F++) {
        const px = (F + 0.5) * b, py = (S + 0.5) * g;
        if (this._projName && this._projName.toLowerCase().includes("orthographic")) {
          const [tx, ty] = this._proj.translate();
          const sc = this._proj.scale();
          const dx = px - tx, dy = py - ty;
          if (dx * dx + dy * dy > sc * sc) continue;
        }
        const v = this._proj.invert([px, py]);
        if (!v) continue;
        const [P, M] = v;
        if (!isFinite(P) || !isFinite(M)) continue;
        const projected = this._proj([P, M]);
        if (projected && (Math.abs(projected[0] - px) > 1.0 || Math.abs(projected[1] - py) > 1.0)) continue;
        
        const imgX = Math.round(((P + 180) / 360) * (W_img - 1));
        const imgY = Math.round(((90 - M) / 180) * (H_img - 1));
        if (imgX >= 0 && imgX < W_img && imgY >= 0 && imgY < H_img) {
          const idx = (imgY * W_img + imgX) * 4;
          const N = (S * d + F) * 4;
          G[N] = G_img[idx];
          G[N + 1] = G_img[idx + 1];
          G[N + 2] = G_img[idx + 2];
          G[N + 3] = 255;
        }
      }
    }
    m.putImageData(w, 0, 0), this._ctx.clearRect(0, 0, this._w, this._h), this._ctx.drawImage(x, 0, 0, this._w, this._h);
  }
  _redrawAll() {
    this._path = me().projection(this._proj), this._sphereEl.setAttribute("d", this._path({ type: "Sphere" })), this._gratEl && this._gratEl.setAttribute("d", this._path(ri()())), this._ctx.clearRect(0, 0, this._w, this._h);
    if (this._bgImageData && this._layers.length === 0) {
      this._drawBackgroundOnly();
    }
    for (const t of this._layers)
      if (t.type === "pcolormesh" || t.type === "contourf") {
        const { lons: n, lats: i, field: r, opts: a } = t, o = Ee(n, i, r, a.vmin ?? null, a.vmax ?? null), s = t.type === "contourf" ? a.levels ?? 12 : null;
        this._rasterize(
          o,
          n,
          i,
          vt(a.cmap ?? "viridis"),
          a.alpha ?? 0.85,
          s
        ), this._storeField(n, i, o, a);
      }
    for (const t of this._layers)
      if (t.type === "contour" && t.svgGroup) {
        t.svgGroup.remove();
        const n = this._renderContourSvg(t.lons, t.lats, t.field, t.opts);
        t.svgGroup = n, this._svg.appendChild(n);
      }
    for (const t of this._featureGroups)
      t.geojson && this._renderFeature(t);
    for (const t of this._layers)
      t.type === "quiver" && t.qLayer && t.svgGroup && t.qLayer.render(t.svgGroup, (n) => this._proj(n), this._w);
    for (const t of this._markers) this._renderMarker(t);
  }
  // Re-runs the SVG contour rendering; returns the new <g> element
  _renderContourSvg(t, n, i, r) {
    const {
      levels: a = 8,
      cmap: o = null,
      color: s = "rgba(255,255,255,0.75)",
      alpha: h = 0.9,
      vmin: c = null,
      vmax: l = null,
      linewidth: f = 1.2,
      smoothFactor: u = 4,
      chaikin: p = 2
    } = r, { flat: d, nlon: E, nlat: b, minV: g, maxV: x } = yi(t, n, i, c, l), m = x - g || 1, w = o ? vt(o) : null;
    let G = d, S = E, F = b;
    u > 1 && ({ field: G, nlon: S, nlat: F } = Ei(d, b, E, u));
    const v = Array.isArray(a) ? a : Array.from({ length: a }, (j, y) => g + (y + 0.5) / a * m), P = Be().size([S, F]).thresholds(v)(G), M = t[t.length - 1] - t[0], k = n[n.length - 1] - n[0], D = this._NS, U = document.createElementNS(D, "g");
    U.setAttribute("opacity", String(h));
    for (const j of P) {
      const y = Math.max(0, Math.min(1, (j.value - g) / m)), N = w ? `rgb(${w(y).join(",")})` : s;
      for (const Z of j.coordinates)
        for (let Y of Z) {
          p > 0 && (Y = xi(Y, p));
          const H = Y.map(([V, X]) => [
            t[0] + V / (S - 1) * M,
            n[0] + X / (F - 1) * k
          ]);
          const segments = [];
          let currentSegment = [H[0]];
          const threshold = Math.max(100, this._w * 0.25);
          for (let m = 0; m < H.length - 1; m++) {
            const p1 = H[m];
            const p2 = H[m + 1];
            const [V1, X1] = Y[m];
            const [V2, X2] = Y[m + 1];
            if ((V1 < 0.01 && V2 < 0.01) ||
                (V1 > S - 1.01 && V2 > S - 1.01) ||
                (X1 < 0.01 && X2 < 0.01) ||
                (X1 > F - 1.01 && X2 > F - 1.01)) {
              segments.push(currentSegment);
              currentSegment = [p2];
              continue;
            }
            const proj1 = this._proj(p1);
            const proj2 = this._proj(p2);
            let split = false;
            if (proj1 && proj2 && isFinite(proj1[0]) && isFinite(proj1[1]) && isFinite(proj2[0]) && isFinite(proj2[1])) {
              const dx = proj1[0] - proj2[0];
              const dy = proj1[1] - proj2[1];
              if (dx * dx + dy * dy > threshold * threshold) {
                split = true;
              }
            } else {
              split = true;
            }
            if (split) {
              segments.push(currentSegment);
              currentSegment = [p2];
            } else {
              currentSegment.push(p2);
            }
          }
          if (currentSegment.length > 0) {
            segments.push(currentSegment);
          }
          for (const seg of segments) {
            if (seg.length < 2) continue;
            const K = document.createElementNS(D, "path");
            K.setAttribute("d", this._path({ type: "LineString", coordinates: seg }));
            K.setAttribute("fill", "none");
            K.setAttribute("stroke", N);
            K.setAttribute("stroke-width", String(f));
            U.appendChild(K);
          }
        }
    }
    return U;
  }
  // ── Internals ─────────────────────────────────────────────────────────────
  /**
   * Rasterise a field to the canvas by inverting the projection pixel-by-pixel.
   * Uses an offscreen canvas at RASTER_CAP resolution, then upscales — so
   * rasterisation cost is bounded regardless of display size.
   */
  _rasterize(t, n, i, r, a, o) {
    const { get: s, nlon: h, nlat: c, minV: l, maxV: f } = t, u = f - l || 1, p = Math.round(Math.max(0, Math.min(1, a)) * 255), d = Math.min(this._w, _o), E = Math.round(d * (this._h / this._w)), b = this._w / d, g = this._h / E, x = document.createElement("canvas");
    x.width = d, x.height = E;
    const m = x.getContext("2d"), w = m.createImageData(d, E), G = w.data;
    for (let S = 0; S < E; S++)
      for (let F = 0; F < d; F++) {
        const px = (F + 0.5) * b, py = (S + 0.5) * g;
        if (this._projName && this._projName.toLowerCase().includes("orthographic")) {
          const [tx, ty] = this._proj.translate();
          const sc = this._proj.scale();
          const dx = px - tx, dy = py - ty;
          if (dx * dx + dy * dy > sc * sc) continue;
        }
        const v = this._proj.invert([px, py]);
        if (!v) continue;
        const [P, M] = v;
        if (!isFinite(P) || !isFinite(M)) continue;
        const projected = this._proj([P, M]);
        if (projected && (Math.abs(projected[0] - px) > 1.0 || Math.abs(projected[1] - py) > 1.0)) continue;
        const W_img = this._bgImageData ? this._bgImageData.width : 0;
        const H_img = this._bgImageData ? this._bgImageData.height : 0;
        const G_img = this._bgImageData ? this._bgImageData.data : null;
        let bgR = 15, bgG = 23, bgB = 42;
        if (G_img) {
          const imgX = Math.round(((P + 180) / 360) * (W_img - 1));
          const imgY = Math.round(((90 - M) / 180) * (H_img - 1));
          if (imgX >= 0 && imgX < W_img && imgY >= 0 && imgY < H_img) {
            const idx = (imgY * W_img + imgX) * 4;
            bgR = G_img[idx];
            bgG = G_img[idx + 1];
            bgB = G_img[idx + 2];
          }
        }
        const k = Xe(P, M, n, i, s, h, c);
        const N = (S * d + F) * 4;
        if (isNaN(k)) {
          G[N] = bgR, G[N + 1] = bgG, G[N + 2] = bgB, G[N + 3] = G_img ? 255 : 0;
          continue;
        }
        let D = (k - l) / u;
        if (o != null) {
          if (Array.isArray(o)) {
            if (k < o[0]) {
              D = 0;
            } else if (k >= o[o.length - 1]) {
              D = 1;
            } else {
              let idx = 0;
              for (let idx2 = 0; idx2 < o.length - 1; idx2++) {
                if (k >= o[idx2] && k < o[idx2 + 1]) {
                  idx = idx2;
                  break;
                }
              }
              D = (idx + 0.5) / (o.length - 1);
            }
          } else if (o > 1) {
            D = Math.floor(D * o) / o;
          }
        }
        const [U, j, y] = r(Math.max(0, Math.min(1, D)));
        const alpha_f = p / 255.0;
        G[N] = Math.round(U * alpha_f + bgR * (1 - alpha_f));
        G[N + 1] = Math.round(j * alpha_f + bgG * (1 - alpha_f));
        G[N + 2] = Math.round(y * alpha_f + bgB * (1 - alpha_f));
        G[N + 3] = G_img ? 255 : p;
      }
    m.putImageData(w, 0, 0), this._ctx.clearRect(0, 0, this._w, this._h), this._ctx.drawImage(x, 0, 0, this._w, this._h);
  }
  _storeField(t, n, i, r) {
    this._fieldData = {
      lons: t,
      lats: n,
      get: i.get,
      nlon: i.nlon,
      nlat: i.nlat,
      minV: i.minV,
      maxV: i.maxV,
      name: r.name ?? null,
      units: r.units ?? null
    };
  }
  _drop(t) {
    var n;
    (n = t.svgGroup) == null || n.remove();
  }
  _onMove(t) {
    if (!this._tip || !this._fieldData) return;
    const n = this._canvas.getBoundingClientRect(), i = t.clientX - n.left, r = t.clientY - n.top;
    if (this._projName && this._projName.toLowerCase().includes("orthographic")) {
      const [tx, ty] = this._proj.translate();
      const sc = this._proj.scale();
      const dx = i - tx, dy = r - ty;
      if (dx * dx + dy * dy > sc * sc) {
        this._tip.style.display = "none";
        return;
      }
    }
    const a = this._proj.invert([i, r]);
    if (!a) {
      this._tip.style.display = "none";
      return;
    }
    const [o, s] = a;
    if (!isFinite(o) || !isFinite(s)) {
      this._tip.style.display = "none";
      return;
    }
    const projected = this._proj([o, s]);
    if (projected && (Math.abs(projected[0] - i) > 1.0 || Math.abs(projected[1] - r) > 1.0)) {
      this._tip.style.display = "none";
      return;
    }
    const h = this._fieldData, c = Xe(o, s, h.lons, h.lats, h.get, h.nlon, h.nlat);
    if (isNaN(c)) {
      this._tip.style.display = "none";
      return;
    }
    const l = Math.abs(h.maxV - h.minV) < 2 ? 3 : 2, f = c.toFixed(l) + (h.units ? ` ${h.units}` : ""), u = h.name ? `${h.name}: ${f}` : f;
    this._tip.textContent = `${u}
Lat ${s.toFixed(2)}°  Lon ${o.toFixed(2)}°`, this._tip.style.display = "block";
    let p = i + 14, d = r - 8;
    const E = this._tip.offsetWidth, b = this._tip.offsetHeight;
    p + E > this._w && (p = i - E - 8), d + b > this._h && (d = r - b), d < 0 && (d = 4), this._tip.style.left = `${p}px`, this._tip.style.top = `${d}px`;
  }
}
function Xe(e, t, n, i, r, a, o) {
  const s = (e - n[0]) / (n[a - 1] - n[0]), h = (t - i[0]) / (i[o - 1] - i[0]);
  if (s < 0 || s > 1 || h < 0 || h > 1) return NaN;
  const c = s * (a - 1), l = h * (o - 1), f = Math.max(0, Math.floor(c)), u = Math.min(f + 1, a - 1), p = Math.max(0, Math.floor(l)), d = Math.min(p + 1, o - 1), E = c - f, b = l - p, g = r(p, f), x = r(p, u), m = r(d, f), w = r(d, u);
  return isNaN(g) || isNaN(x) || isNaN(m) || isNaN(w) ? NaN : g * (1 - E) * (1 - b) + x * E * (1 - b) + m * (1 - E) * b + w * E * b;
}
function Ee(e, t, n, i, r) {
  const a = e.length, o = t.length, h = !Array.isArray(n[0]) && !(n[0] instanceof Float32Array) && !(n[0] instanceof Float64Array) ? (f, u) => n[f * a + u] : (f, u) => n[f][u];
  let c = i, l = r;
  if (c == null || l == null) {
    c = 1 / 0, l = -1 / 0;
    for (let f = 0; f < o; f++)
      for (let u = 0; u < a; u++) {
        const p = h(f, u);
        isNaN(p) || (p < c && (c = p), p > l && (l = p));
      }
  }
  return { get: h, nlon: a, nlat: o, minV: c ?? 0, maxV: l ?? 1 };
}
function yi(e, t, n, i, r) {
  const { get: a, nlon: o, nlat: s, minV: h, maxV: c } = Ee(e, t, n, i, r), l = new Float32Array(s * o);
  for (let f = 0; f < s; f++)
    for (let u = 0; u < o; u++)
      l[f * o + u] = a(f, u);
  return { flat: l, nlon: o, nlat: s, minV: h, maxV: c };
}
function Ei(e, t, n, i) {
  const r = (t - 1) * i + 1, a = (n - 1) * i + 1, o = new Float32Array(r * a);
  for (let s = 0; s < r; s++) {
    const h = s / i, c = Math.min(Math.floor(h), t - 2), l = h - c;
    for (let f = 0; f < a; f++) {
      const u = f / i, p = Math.min(Math.floor(u), n - 2), d = u - p;
      o[s * a + f] = e[c * n + p] * (1 - d) * (1 - l) + e[c * n + (p + 1)] * d * (1 - l) + e[(c + 1) * n + p] * (1 - d) * l + e[(c + 1) * n + (p + 1)] * d * l;
    }
  }
  return { field: o, nlat: r, nlon: a };
}
function xi(e, t) {
  let n = e;
  const i = n[0][0] === n[n.length - 1][0] && n[0][1] === n[n.length - 1][1];
  for (let r = 0; r < t; r++) {
    const a = [], o = n.length - 1;
    for (let s = 0; s < o; s++) {
      const [h, c] = n[s], [l, f] = n[s + 1];
      a.push([0.75 * h + 0.25 * l, 0.75 * c + 0.25 * f]), a.push([0.25 * h + 0.75 * l, 0.25 * c + 0.75 * f]);
    }
    i && a.push(a[0]), n = a;
  }
  return n;
}
const Jo = 1145851988, Zo = 1179406420;
async function Wo(e) {
  const t = await $i(e), n = new DataView(t);
  let i = 0;
  const r = n.getUint32(i, !0);
  i += 4, n.getUint32(i, !0), i += 4;
  const a = n.getUint32(i, !0);
  i += 4;
  const o = n.getUint32(i, !0);
  if (i += 4, r !== Jo)
    throw new Error(`unpackField: unexpected magic 0x${r.toString(16)} (expected TPLD)`);
  const s = Array.from(new Float32Array(t.slice(i, i + a * 4)));
  i += a * 4;
  const h = Array.from(new Float32Array(t.slice(i, i + o * 4)));
  i += o * 4;
  const c = new Float32Array(t.slice(i, i + o * a * 4));
  i += o * a * 4;
  const l = n.getUint32(i, !0);
  i += 4;
  const f = JSON.parse(xn(new Uint8Array(t, i, l)));
  return { lons: s, lats: h, field: c, nlon: a, nlat: o, ...f };
}
async function Ko(e) {
  const t = await $i(e), n = new DataView(t);
  let i = 0;
  const r = n.getUint32(i, !0);
  i += 4, n.getUint32(i, !0), i += 4;
  const a = n.getUint32(i, !0);
  i += 4;
  const o = n.getUint32(i, !0);
  i += 4;
  const s = n.getUint32(i, !0);
  if (i += 4, r !== Zo)
    throw new Error(`unpackFrames: unexpected magic 0x${r.toString(16)} (expected TPLF)`);
  const h = Array.from(new Float32Array(t.slice(i, i + a * 4)));
  i += a * 4;
  const c = Array.from(new Float32Array(t.slice(i, i + o * 4)));
  i += o * 4;
  const l = n.getUint32(i, !0);
  i += 4;
  const f = new Uint8Array(t, i, l), u = [];
  let p = 0;
  for (let m = 0; m < s; m++) {
    const w = f[p] | f[p + 1] << 8;
    p += 2, u.push(xn(f.slice(p, p + w))), p += w;
  }
  i += l;
  const d = o * a, E = new Float32Array(t.slice(i, i + s * d * 4));
  i += s * d * 4;
  const b = n.getUint32(i, !0);
  i += 4;
  const g = JSON.parse(xn(new Uint8Array(t, i, b))), x = Array.from({ length: s }, (m, w) => ({
    field: E.subarray(w * d, (w + 1) * d),
    coord_value: u[w],
    frame: w
  }));
  return { lons: h, lats: c, nlon: a, nlat: o, frames: x, ...g };
}
async function $i(e) {
  const t = atob(e), n = new Uint8Array(t.length);
  for (let a = 0; a < t.length; a++) n[a] = t.charCodeAt(a);
  const i = new DecompressionStream("gzip"), r = i.writable.getWriter();
  return r.write(n), r.close(), new Response(i.readable).arrayBuffer();
}
const xn = (e) => new TextDecoder().decode(e);
async function zo(e, t = {}) {
  const { fromArrayBuffer: n } = await import("geotiff");
  let i;
  if (typeof e == "string") {
    const w = await fetch(e);
    if (!w.ok) throw new Error(`unpackGeoTiff: HTTP ${w.status} fetching ${e}`);
    i = await w.arrayBuffer();
  } else e instanceof Uint8Array ? i = e.buffer.slice(e.byteOffset, e.byteOffset + e.byteLength) : i = e;
  const a = await (await n(i)).getImage(), o = a.getWidth(), s = a.getHeight(), [h, c, l, f] = a.getBoundingBox(), p = (await a.readRasters({ interleave: !1 }))[0], d = a.getGDALNoData(), E = (l - h) / o, b = (f - c) / s, g = Array.from({ length: o }, (w, G) => h + (G + 0.5) * E), x = Array.from({ length: s }, (w, G) => f - (G + 0.5) * b), m = new Float32Array(s * o);
  for (let w = 0; w < m.length; w++) {
    const G = p[w];
    m[w] = d !== null && G === d ? NaN : G;
  }
  return {
    lons: g,
    lats: x,
    field: m,
    nlon: o,
    nlat: s,
    name: t.name || "geotiff",
    units: t.units || "",
    long_name: t.long_name || t.name || "GeoTIFF"
  };
}
function Lo(e) {
  let t = 1 / 0, n = -1 / 0;
  const i = (r) => {
    r == null || Number.isNaN(r) || (r < t && (t = r), r > n && (n = r));
  };
  if (Array.isArray(e) && Array.isArray(e[0]))
    for (const r of e) for (const a of r) i(a);
  else
    for (let r = 0; r < e.length; r++) i(e[r]);
  return !Number.isFinite(t) || !Number.isFinite(n) ? [0, 1] : t === n ? [t - 1, n + 1] : [t, n];
}
const Oo = {
  width: 220,
  height: 12,
  ticks: 5,
  orientation: "horizontal",
  // 'horizontal' | 'vertical'
  background: "rgba(0,0,0,0.55)",
  textColor: "#cbd5e1",
  fontSize: 11
};
class qo {
  constructor(t, n = {}) {
    if (this._el = typeof t == "string" ? document.querySelector(t) : t, !this._el) throw new Error("Colorbar: container element not found");
    this._opts = { ...Oo, ...n }, this._build(), this.update(n);
  }
  _build() {
    const t = this._opts;
    this._el.namespaceURI, this._el.classList.add("tp-colorbar"), Object.assign(this._el.style, {
      display: "inline-flex",
      flexDirection: t.orientation === "vertical" ? "row" : "column",
      alignItems: "center",
      gap: "4px",
      pointerEvents: "none",
      background: t.background,
      padding: "6px 10px",
      borderRadius: "6px",
      border: "1px solid rgba(255,255,255,0.12)",
      font: `${t.fontSize}px/1.4 system-ui, sans-serif`,
      color: t.textColor
    }), this._canvas = document.createElement("canvas"), this._canvas.width = t.orientation === "vertical" ? t.height : t.width, this._canvas.height = t.orientation === "vertical" ? t.width : t.height, Object.assign(this._canvas.style, {
      borderRadius: "3px",
      border: "1px solid rgba(255,255,255,0.18)"
    }), this._el.appendChild(this._canvas), this._ticksEl = document.createElement("div"), Object.assign(this._ticksEl.style, {
      display: "flex",
      justifyContent: "space-between",
      width: t.orientation === "vertical" ? "auto" : `${t.width}px`,
      flexDirection: t.orientation === "vertical" ? "column-reverse" : "row",
      height: t.orientation === "vertical" ? `${t.width}px` : "auto",
      fontSize: `${t.fontSize - 1}px`
    }), this._el.appendChild(this._ticksEl), this._labelEl = document.createElement("div"), Object.assign(this._labelEl.style, {
      fontSize: `${t.fontSize}px`,
      letterSpacing: "0.02em",
      color: t.textColor,
      whiteSpace: "nowrap"
    }), this._el.appendChild(this._labelEl);
  }
  /**
   * Re-render the colorbar with new options.
   * @param {object} opts  any subset of constructor options
   */
  update(t = {}) {
    Object.assign(this._opts, t);
    const { cmap: n, vmin: i, vmax: r, label: a = "", ticks: o } = this._opts;
    if (n == null || i == null || r == null) return;
    const s = vt(n), h = this._canvas.getContext("2d"), c = this._canvas.width, l = this._canvas.height;
    h.clearRect(0, 0, c, l);
    const f = this._opts.orientation !== "vertical", u = f ? c : l;
    for (let d = 0; d < u; d++) {
      const E = f ? d / (u - 1) : 1 - d / (u - 1), [b, g, x] = s(E);
      h.fillStyle = `rgb(${b},${g},${x})`, f ? h.fillRect(d, 0, 1, l) : h.fillRect(0, d, c, 1);
    }
    this._ticksEl.replaceChildren();
    const p = Math.abs(r - i) < 2 ? 2 : 1;
    for (let d = 0; d < o; d++) {
      const E = i + d / (o - 1) * (r - i), b = document.createElement("span");
      b.textContent = E.toFixed(p), this._ticksEl.appendChild(b);
    }
    this._labelEl.textContent = a, this._labelEl.style.display = a ? "block" : "none";
  }
  dispose() {
    this._el.replaceChildren(), this._el.classList.remove("tp-colorbar");
  }
}
export {
  qo as Colorbar,
  Ae as Colormaps,
  Ca as ContourLayer,
  Ho as Features,
  ua as FieldLayer,
  Vo as GeoMap,
  Ao as GeoSphere,
  Io as QuiverLayer,
  Lo as fieldExtent,
  vt as resolveColormap,
  Wo as unpackField,
  Ko as unpackFrames,
  zo as unpackGeoTiff
};
