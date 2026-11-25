"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "..", "navigation.js"), "utf8");

class Events {
  listeners = new Map();
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(callback);
  }
  emit(type, values = {}) {
    const event = { target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...values };
    for (const callback of this.listeners.get(type) || []) callback(event);
    return event;
  }
}

function setup({ fine = true, missingHeader = false } = {}) {
  const document = new Events();
  const window = new Events();
  const toggles = new Set();
  const timers = new Map();
  const microtasks = [];
  let clock = 0;
  let nextTimer = 0;

  class Element extends Events {
    constructor(kind, parent = null) {
      super();
      this.kind = kind;
      this.parent = parent;
      this.attributes = new Map();
      this.dataset = {};
      this.textContent = "";
    }
    contains(target) {
      for (let element = target; element; element = element.parent) if (element === this) return true;
      return false;
    }
    focus() { document.activeElement = this; }
    setAttribute(name, value) { this.attributes.set(name, value); }
    closest(selector) {
      for (let element = this; element; element = element.parent) {
        if (selector === "a[href]" && element.kind === "link") return element;
        if (selector === "[data-panel-close]" && element.kind === "close") return element;
      }
      return null;
    }
  }
  class Details extends Element {
    constructor(name, parent) {
      super("details", parent);
      this.dataset.headerPanel = name;
      this.value = false;
      this.trigger = new Element("summary", this);
      this.label = new Element("label", this.trigger);
      this.label.dataset = { openLabel: `Open ${name}`, closeLabel: `Close ${name}` };
      this.link = new Element("link", this);
      this.link.href = name === "languages" ? "/ja/" : "#work";
      this.closeButton = new Element("close", this);
    }
    get open() { return this.value; }
    set open(value) {
      if (this.value === value) return;
      this.value = value;
      toggles.add(this);
    }
    querySelector(selector) {
      if (selector === "summary[data-panel-trigger]") return this.trigger;
      if (selector === "[data-trigger-label]") return this.label;
      throw new Error(`Unexpected selector ${selector}`);
    }
  }

  const header = new Element("header");
  const menu = new Details("menu", header);
  const languages = new Details("languages", header);
  const outside = new Element("outside");
  const panels = [menu, languages];
  header.querySelectorAll = selector => {
    assert.equal(selector, "details[data-header-panel]");
    return panels;
  };
  document.querySelector = selector => {
    assert.equal(selector, "[data-site-header]");
    return missingHeader ? null : header;
  };
  document.activeElement = outside;
  document.hidden = false;
  window.matchMedia = () => ({ matches: fine });
  window.setTimeout = (callback, delay) => {
    const id = ++nextTimer;
    timers.set(id, { callback, due: clock + delay });
    return id;
  };
  window.clearTimeout = id => timers.delete(id);
  window.queueMicrotask = callback => microtasks.push(callback);

  vm.runInNewContext(source, { window, document });
  const flush = () => {
    for (let turn = 0; toggles.size || microtasks.length; turn++) {
      assert.ok(turn < 20, "toggle handling must settle without a loop");
      const pending = [...toggles];
      toggles.clear();
      pending.forEach(panel => panel.emit("toggle"));
      while (microtasks.length) microtasks.shift()();
    }
  };
  const advance = milliseconds => {
    clock += milliseconds;
    const ready = [...timers].filter(([, timer]) => timer.due <= clock);
    ready.forEach(([id, timer]) => {
      if (!timers.has(id)) return;
      timers.delete(id);
      timer.callback();
    });
    flush();
  };
  // The browser's default summary activation happens after the click handler;
  // details toggle events may be coalesced and delivered on a later turn.
  const activate = (panel, { flushEvents = true } = {}) => {
    const event = panel.trigger.emit("click");
    if (!event.defaultPrevented) panel.open = !panel.open;
    if (flushEvents) flush();
    return event;
  };
  const enter = pointerType => {
    menu.emit("pointerenter", { pointerType });
    menu.trigger.emit("pointerenter", { pointerType });
  };
  const leave = pointerType => menu.emit("pointerleave", { pointerType });
  return { header, menu, languages, outside, panels, document, window, flush, advance, activate, enter, leave };
}

test("native summary activation stays available and localized state labels follow open state", () => {
  const h = setup();
  assert.equal(h.menu.trigger.attributes.get("aria-expanded"), "false");
  assert.equal(h.menu.label.textContent, "Open menu");
  assert.equal(h.activate(h.menu).defaultPrevented, false);
  assert.equal(h.menu.open, true);
  assert.equal(h.menu.trigger.attributes.get("aria-expanded"), "true");
  assert.equal(h.menu.label.textContent, "Close menu");
  h.activate(h.menu);
  assert.equal(h.menu.open, false);
  assert.equal(h.menu.label.textContent, "Open menu");
});

test("only the last activated panel remains open despite queued toggle events", () => {
  const h = setup();
  h.activate(h.menu, { flushEvents: false });
  h.activate(h.languages, { flushEvents: false });
  h.flush();
  assert.equal(h.menu.open, false);
  assert.equal(h.languages.open, true);
  h.activate(h.menu);
  assert.equal(h.menu.open, true);
  assert.equal(h.languages.open, false);
});

test("fine-pointer hover opens after a short intent delay without moving focus", () => {
  const h = setup();
  h.enter("mouse");
  h.advance(139);
  assert.equal(h.menu.open, false);
  h.advance(1);
  assert.equal(h.menu.open, true);
  assert.equal(h.document.activeElement, h.outside);
});

test("touch and non-hover devices never open a panel from pointer enter", () => {
  for (const options of [{ fine: false }, { fine: true }]) {
    const h = setup(options);
    h.enter(options.fine ? "touch" : "mouse");
    h.advance(500);
    assert.equal(h.menu.open, false);
    h.activate(h.menu);
    assert.equal(h.menu.open, true, "native tap activation still works");
  }
});

test("pointer transit can return before closing, and focused panel links stay available", () => {
  const h = setup();
  h.enter("mouse");
  h.advance(140);
  h.leave("mouse");
  h.advance(100);
  h.menu.emit("pointerenter", { pointerType: "mouse" });
  h.advance(200);
  assert.equal(h.menu.open, true);
  h.menu.link.focus();
  h.leave("mouse");
  h.advance(220);
  assert.equal(h.menu.open, true);
  h.outside.focus();
  h.leave("mouse");
  h.advance(220);
  assert.equal(h.menu.open, false);
});

test("Escape restores focus and requires leaving the menu before hover can reopen it", () => {
  const h = setup();
  h.enter("mouse");
  h.advance(140);
  const event = h.document.emit("keydown", { key: "Escape" });
  h.flush();
  assert.equal(event.defaultPrevented, true);
  assert.equal(h.menu.open, false);
  assert.equal(h.document.activeElement, h.menu.trigger);
  h.enter("mouse");
  h.advance(500);
  assert.equal(h.menu.open, false);
  h.leave("mouse");
  h.enter("mouse");
  h.advance(140);
  assert.equal(h.menu.open, true);
});

test("dismissing the language panel outside the menu does not consume the next logo hover", () => {
  for (const dismissal of ["escape", "close-button"]) {
    const h = setup();
    h.activate(h.languages);
    h.languages.link.focus();
    if (dismissal === "escape") h.document.emit("keydown", { key: "Escape" });
    else h.languages.emit("click", { target: h.languages.closeButton });
    h.flush();
    assert.equal(h.languages.open, false);
    assert.equal(h.document.activeElement, h.languages.trigger);
    h.enter("mouse");
    h.advance(140);
    assert.equal(h.menu.open, true, `${dismissal} must not suppress a new pointer entry`);
  }
});

test("closing a menu from keyboard focus outside pointer hover allows the next hover", () => {
  const h = setup();
  h.activate(h.menu);
  h.menu.trigger.focus();
  h.activate(h.menu);
  assert.equal(h.menu.open, false);
  h.enter("mouse");
  h.advance(140);
  assert.equal(h.menu.open, true);
});

test("outside activation closes panels without cancelling the action or stealing focus", () => {
  const h = setup();
  h.activate(h.languages);
  h.languages.link.focus();
  const event = h.document.emit("pointerdown", { target: h.outside });
  h.flush();
  assert.equal(h.languages.open, false);
  assert.equal(event.defaultPrevented, false);
  assert.equal(h.document.activeElement, h.languages.link);
});

test("focus can traverse the header and closes panels only when it exits", () => {
  const h = setup();
  h.activate(h.menu);
  h.header.emit("focusout", { relatedTarget: h.menu.link });
  assert.equal(h.menu.open, true);
  h.outside.focus();
  h.header.emit("focusout", { relatedTarget: null });
  h.flush();
  assert.equal(h.menu.open, false);
  assert.equal(h.document.activeElement, h.outside);
});

test("hover does not hide another panel's focused links", () => {
  const h = setup();
  h.activate(h.languages);
  h.languages.link.focus();
  h.enter("mouse");
  h.advance(140);
  assert.equal(h.languages.open, true);
  assert.equal(h.menu.open, false);
});

test("links retain native destinations and explicit close restores trigger focus", () => {
  const h = setup();
  h.activate(h.languages);
  const event = h.languages.emit("click", { target: h.languages.link, ctrlKey: true });
  assert.equal(event.defaultPrevented, false);
  assert.equal(h.languages.link.href, "/ja/");
  assert.equal(h.languages.open, false);
  h.activate(h.menu);
  h.menu.emit("click", { target: h.menu.closeButton });
  assert.equal(h.menu.open, false);
  assert.equal(h.document.activeElement, h.menu.trigger);
});

test("hiding the page closes panels and cancels pending hover intent", () => {
  const h = setup();
  h.enter("mouse");
  h.document.hidden = true;
  h.document.emit("visibilitychange");
  h.advance(1000);
  assert.equal(h.menu.open, false);
  h.document.hidden = false;
  h.activate(h.languages);
  h.document.hidden = true;
  h.document.emit("visibilitychange");
  h.flush();
  assert.equal(h.languages.open, false);
});

test("pages without the new header require no navigation enhancement", () => {
  assert.doesNotThrow(() => setup({ missingHeader: true }));
});
