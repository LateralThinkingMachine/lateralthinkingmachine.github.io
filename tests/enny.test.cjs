"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "..", "enny.js"), "utf8");

class Events {
  listeners = new Map();
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
  }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  emit(type, event = {}) {
    for (const callback of [...(this.listeners.get(type) || [])]) callback(event);
  }
  listenerCount() {
    return [...this.listeners.values()].reduce((sum, listeners) => sum + listeners.size, 0);
  }
}

function setup({ fine = true, reduced = false, missingElement = false, missingObserver = false } = {}) {
  const window = new Events();
  const document = new Events();
  const pointerMedia = Object.assign(new Events(), { matches: fine });
  const motionMedia = Object.assign(new Events(), { matches: reduced });
  const attributes = new Map();
  const gazeAttributes = new Map();
  const writes = [];
  let rect = { left: 100, top: 100, width: 200, height: 200 };
  let rectReads = 0;
  let observer;
  let clock = 0;
  let nextFrameId = 0;
  const frames = new Map();
  const gaze = {
    isConnected: true,
    setAttribute(name, value) { gazeAttributes.set(name, value); writes.push([name, value]); }
  };
  const enny = {
    isConnected: true,
    querySelector(selector) {
      assert.equal(selector, "[data-enny-gaze]");
      return gaze;
    },
    getBoundingClientRect() { rectReads++; return { ...rect }; },
    setAttribute(name, value) { attributes.set(name, value); },
    removeAttribute(name) { attributes.delete(name); }
  };
  document.hidden = false;
  document.visibilityState = "visible";
  document.hasFocus = () => true;
  document.querySelector = selector => {
    assert.equal(selector, "[data-enny]");
    return missingElement ? null : enny;
  };
  window.matchMedia = query => query.includes("reduced-motion") ? motionMedia : pointerMedia;
  window.requestAnimationFrame = callback => {
    const id = ++nextFrameId;
    frames.set(id, callback);
    return id;
  };
  window.cancelAnimationFrame = id => frames.delete(id);
  if (!missingObserver) {
    window.IntersectionObserver = class {
      constructor(callback) { this.callback = callback; this.disconnected = false; observer = this; }
      observe(target) { assert.equal(target, enny); }
      disconnect() { this.disconnected = true; }
      show(visible) {
        this.callback([{ target: enny, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }]);
      }
    };
  }
  vm.runInNewContext(source, { window, document });

  const frame = (elapsed = 20) => {
    clock += elapsed;
    const callbacks = [...frames.values()];
    frames.clear();
    for (const callback of callbacks) callback(clock);
  };
  const settle = () => {
    let count = 0;
    while (frames.size && count++ < 20) frame();
    assert.equal(frames.size, 0, "animation must stop after settling");
    return count;
  };
  const position = () => {
    const value = gazeAttributes.get("transform") || "translate(0 0)";
    const match = /^translate\((-?[\d.]+) (-?[\d.]+)\)$/.exec(value);
    assert.ok(match, "only a translation is applied to the shared gaze group");
    return match.slice(1).map(Number);
  };
  const move = (x, y, pointerType = "mouse") =>
    document.emit("pointermove", { clientX: x, clientY: y, pointerType });
  const show = visible => observer.show(visible);
  return {
    window, document, pointerMedia, motionMedia, enny, gaze, observer, attributes, writes,
    frames, frame, settle, position, move, show,
    rectReads: () => rectReads,
    setRect: next => { rect = { ...rect, ...next }; }
  };
}

test("points toward the pointer, clamps to the ellipse, and moves one shared group", () => {
  const h = setup();
  h.show(true);
  h.move(10000, 209.2);
  h.settle();
  assert.deepEqual(h.position(), [5, 0]);
  assert.ok(h.attributes.has("data-enny-tracking"));
  assert.deepEqual([...h.attributes.keys()], ["data-enny-tracking"]);
  assert.ok(h.writes.every(([name]) => name === "transform"));

  h.move(-10000, -10000);
  h.settle();
  const [x, y] = h.position();
  assert.ok(x < 0 && y < 0);
  assert.ok((x / 5) ** 2 + (y / 3) ** 2 <= 1.001);
  assert.ok(Math.abs(x) < 5 && Math.abs(y) < 3);
});

test("uses the face center and eases to the target in about 100 ms", () => {
  const h = setup();
  h.show(true);
  h.move(203.8, 209.2);
  h.frame();
  assert.deepEqual(h.position(), [0, 0]);
  assert.equal(h.frames.size, 0);
  h.move(10000, 209.2);
  h.frame();
  assert.deepEqual(h.position(), [0, 0]);
  h.frame(50);
  const midpoint = h.position()[0];
  assert.ok(midpoint > 0 && midpoint < 5);
  h.frame(50);
  assert.deepEqual(h.position(), [5, 0]);
  assert.equal(h.frames.size, 0);
});

test("coalesces pointer events and never runs an idle RAF loop", () => {
  const h = setup();
  h.show(true);
  for (let i = 0; i < 50; i++) h.move(400 + i, 210);
  assert.equal(h.frames.size, 1);
  assert.equal(h.rectReads(), 0);
  h.settle();
  assert.equal(h.rectReads(), 1);
  const writes = h.writes.length;
  h.frame(10000);
  assert.equal(h.writes.length, writes);
  h.move(449, 210);
  h.frame();
  assert.equal(h.frames.size, 0);
});

test("continuous pointer movement advances rather than restarting at zero", () => {
  const h = setup();
  h.show(true);
  h.move(500, 209.2);
  h.frame();
  h.move(600, 209.2);
  h.frame();
  assert.ok(h.position()[0] > 0);
  h.settle();
});

test("stops the old tween when a new target matches the currently eased position", () => {
  const h = setup();
  h.show(true);
  h.move(10000, 209.2);
  h.frame();
  h.frame();
  // At 40 ms of the 100 ms cubic easing, the old tween reaches 3.92.
  h.move(360.6, 209.2);
  h.frame();
  assert.deepEqual(h.position(), [3.92, 0]);
  assert.equal(h.frames.size, 0);
});

test("ignores touch, coarse pointers, and reduced-motion preferences", () => {
  for (const options of [{}, { fine: false }, { reduced: true }]) {
    const h = setup(options);
    h.show(true);
    h.move(500, 200, Object.keys(options).length ? "mouse" : "touch");
    assert.equal(h.frames.size, 0);
    assert.equal(h.attributes.has("data-enny-tracking"), false);
  }
});

test("resets immediately when media preferences disable tracking", () => {
  for (const kind of ["pointer", "motion"]) {
    const h = setup();
    h.show(true);
    h.move(500, 200);
    h.frame();
    const media = kind === "pointer" ? h.pointerMedia : h.motionMedia;
    media.matches = kind === "motion";
    media.emit("change");
    assert.deepEqual(h.position(), [0, 0]);
    assert.equal(h.frames.size, 0);
    assert.equal(h.attributes.has("data-enny-tracking"), false);
  }
});

test("offscreen, hidden, blurred, and document-exit states reset tracking", () => {
  const resetters = [
    h => h.show(false),
    h => { h.document.hidden = true; h.document.visibilityState = "hidden"; h.document.emit("visibilitychange"); },
    h => h.window.emit("blur"),
    h => h.document.emit("pointerout", { relatedTarget: null, pointerType: "mouse" }),
    h => h.document.emit("pointerleave", { relatedTarget: null, pointerType: "mouse" })
  ];
  for (const disable of resetters) {
    const h = setup();
    h.show(true);
    h.move(800, 300);
    h.frame();
    h.frame();
    assert.notDeepEqual(h.position(), [0, 0]);
    disable(h);
    assert.deepEqual(h.position(), [0, 0]);
    assert.equal(h.frames.size, 0);
    assert.equal(h.attributes.has("data-enny-tracking"), false);
  }
  const h = setup();
  h.show(true);
  h.move(800, 300);
  h.document.emit("pointerout", { relatedTarget: {}, pointerType: "mouse" });
  assert.equal(h.frames.size, 1, "moving between document elements must not reset tracking");
});

test("scroll and resize recompute bounds while retaining the stationary pointer", () => {
  const h = setup();
  h.show(true);
  h.move(303.8, 209.2);
  h.settle();
  assert.deepEqual(h.position(), [2.5, 0]);
  h.setRect({ left: 300 });
  h.window.emit("scroll");
  h.window.emit("scroll");
  assert.equal(h.frames.size, 1);
  h.settle();
  assert.deepEqual(h.position(), [-2.5, 0]);
  assert.equal(h.rectReads(), 2);
  h.setRect({ left: 100, width: 400 });
  h.window.emit("resize");
  h.settle();
  assert.deepEqual(h.position(), [-0.047, 0]);
  assert.equal(h.rectReads(), 3);
});

test("only resumes from disabled states after a new eligible pointer event", () => {
  const h = setup();
  h.show(true);
  h.move(500, 300);
  h.settle();
  h.show(false);
  h.move(500, 300);
  h.show(true);
  assert.equal(h.frames.size, 0);
  assert.equal(h.attributes.has("data-enny-tracking"), false);
  h.window.emit("blur");
  h.move(500, 300);
  assert.equal(h.frames.size, 0);
  h.window.emit("focus");
  h.move(500, 300);
  h.settle();
  assert.ok(h.attributes.has("data-enny-tracking"));
});

test("cleans up listeners, observation, and scheduled work when leaving the page", () => {
  const h = setup();
  h.show(true);
  h.move(500, 300);
  h.window.emit("pagehide", { persisted: false });
  assert.equal(h.frames.size, 0);
  assert.equal(h.observer.disconnected, true);
  for (const target of [h.window, h.document, h.pointerMedia, h.motionMedia]) {
    assert.equal(target.listenerCount(), 0);
  }
  assert.equal(h.attributes.has("data-enny-tracking"), false);
});

test("keeps a static fallback when the element or required browser API is absent", () => {
  for (const options of [{ missingElement: true }, { missingObserver: true }]) {
    const h = setup(options);
    assert.equal(h.document.listenerCount(), 0);
    assert.equal(h.window.listenerCount(), 0);
    assert.equal(h.frames.size, 0);
    assert.equal(h.attributes.size, 0);
    assert.equal(h.writes.length, 0);
  }
});
