(() => {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (typeof document.querySelector !== "function") return;

  const enny = document.querySelector("[data-enny]");
  const gaze = enny?.querySelector("[data-enny-gaze]");
  if (!enny || !gaze || typeof enny.getBoundingClientRect !== "function") return;
  if (typeof window.matchMedia !== "function" ||
      typeof window.requestAnimationFrame !== "function" ||
      typeof window.cancelAnimationFrame !== "function" ||
      typeof window.IntersectionObserver !== "function") return;

  const pointerMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
  const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (![pointerMedia, motionMedia, window, document].every(target =>
    typeof target.addEventListener === "function" &&
    typeof target.removeEventListener === "function")) return;

  const EASING_MS = 100;
  const MAX_X = 5;
  const MAX_Y = 3;
  const listeners = [];
  let observer;
  let disposed = false;
  let inView = false;
  let focused = typeof document.hasFocus === "function" ? document.hasFocus() : true;
  let pointer = null;
  let bounds = null;
  let frameId = null;
  let tween = null;
  let x = 0;
  let y = 0;
  let lastTransform = null;

  const listen = (target, event, handler, options) => {
    target.addEventListener(event, handler, options);
    listeners.push([target, event, handler, options]);
  };

  const render = () => {
    const format = value => Math.abs(value) < 0.0005 ? 0 : Number(value.toFixed(3));
    const transform = `translate(${format(x)} ${format(y)})`;
    if (transform !== lastTransform) {
      gaze.setAttribute("transform", transform);
      lastTransform = transform;
    }
  };

  const reset = () => {
    if (frameId !== null) window.cancelAnimationFrame(frameId);
    frameId = null;
    tween = null;
    pointer = null;
    bounds = null;
    x = 0;
    y = 0;
    enny.removeAttribute("data-enny-tracking");
    render();
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    reset();
    observer?.disconnect();
    for (const [target, event, handler, options] of listeners) {
      target.removeEventListener(event, handler, options);
    }
    listeners.length = 0;
  };

  const eligible = () => {
    if (disposed) return false;
    if (enny.isConnected === false || gaze.isConnected === false) {
      dispose();
      return false;
    }
    return pointerMedia.matches && !motionMedia.matches && inView && focused &&
      !document.hidden && document.visibilityState !== "hidden";
  };

  const schedule = () => {
    if (frameId === null) frameId = window.requestAnimationFrame(animate);
  };

  function animate(timestamp) {
    frameId = null;
    if (!eligible() || !pointer) {
      reset();
      return;
    }

    // Advance the previous tween before retargeting, so continuous pointer
    // movement cannot keep restarting an animation at its initial position.
    if (tween) {
      const progress = Math.max(0, Math.min(1, (timestamp - tween.started) / EASING_MS));
      const eased = 1 - (1 - progress) ** 3;
      x = tween.fromX + (tween.toX - tween.fromX) * eased;
      y = tween.fromY + (tween.toY - tween.fromY) * eased;
      if (progress === 1) tween = null;
    }

    bounds ||= enny.getBoundingClientRect();
    if (!(bounds.width > 0 && bounds.height > 0)) {
      reset();
      return;
    }

    // Normalize around the face, rather than the image's geometric center.
    const dx = (pointer.x - bounds.left - bounds.width * 0.519) / bounds.width;
    const dy = (pointer.y - bounds.top - bounds.height * 0.546) / bounds.height;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const toX = MAX_X * dx / distance;
    const toY = MAX_Y * dy / distance;
    const changed = !tween || Math.abs(toX - tween.toX) > 0.0001 ||
      Math.abs(toY - tween.toY) > 0.0001;

    if (changed) {
      if (Math.abs(toX - x) > 0.0001 || Math.abs(toY - y) > 0.0001) {
        tween = { fromX: x, fromY: y, toX, toY, started: timestamp };
      } else {
        x = toX;
        y = toY;
        tween = null;
      }
    }

    render();
    if (tween) schedule();
  }

  const onPointer = event => {
    if (event.pointerType === "touch" || !Number.isFinite(event.clientX) ||
        !Number.isFinite(event.clientY) || !eligible()) return;
    pointer = { x: event.clientX, y: event.clientY };
    enny.setAttribute("data-enny-tracking", "");
    schedule();
  };

  const onGeometry = () => {
    bounds = null;
    if (pointer && eligible()) schedule();
  };

  const onLeave = event => {
    if (event.pointerType !== "touch" && event.relatedTarget == null) reset();
  };

  const onEligibilityChange = () => {
    if (!eligible()) reset();
  };

  try {
    observer = new window.IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target === enny) inView = entry.isIntersecting && entry.intersectionRatio > 0;
      }
      onEligibilityChange();
    }, { threshold: 0 });
    observer.observe(enny);
  } catch {
    observer?.disconnect();
    return;
  }

  listen(document, "pointermove", onPointer, { passive: true });
  listen(document, "pointerout", onLeave, { passive: true });
  listen(document, "pointerleave", onLeave, { passive: true });
  listen(window, "scroll", onGeometry, { passive: true, capture: true });
  listen(window, "resize", onGeometry, { passive: true });
  listen(window, "blur", () => { focused = false; reset(); });
  listen(window, "focus", () => { focused = true; });
  listen(document, "visibilitychange", onEligibilityChange);
  listen(pointerMedia, "change", onEligibilityChange);
  listen(motionMedia, "change", onEligibilityChange);
  listen(window, "pagehide", event => {
    reset();
    if (!event.persisted) dispose();
  });
  listen(window, "pageshow", () => {
    focused = typeof document.hasFocus === "function" ? document.hasFocus() : true;
    onEligibilityChange();
  });
})();
