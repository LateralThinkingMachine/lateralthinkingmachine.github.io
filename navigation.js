(() => {
  "use strict";

  const header = document.querySelector("[data-site-header]");
  if (!header) return;

  const panels = [...header.querySelectorAll("details[data-header-panel]")].map(details => ({
    details,
    trigger: details.querySelector("summary[data-panel-trigger]"),
    label: details.querySelector("[data-trigger-label]")
  })).filter(panel => panel.trigger);
  const menu = panels.find(panel => panel.details.dataset.headerPanel === "menu");
  const hoverMedia = window.matchMedia?.("(hover: hover) and (pointer: fine)");
  let enterTimer;
  let leaveTimer;
  let pointerInMenu = false;
  let suppressHover = false;

  const cancelTimers = () => {
    window.clearTimeout(enterTimer);
    window.clearTimeout(leaveTimer);
  };

  const sync = panel => {
    panel.trigger.setAttribute("aria-expanded", String(panel.details.open));
    const label = panel.label;
    if (label) {
      const value = panel.details.open ? label.dataset.closeLabel : label.dataset.openLabel;
      if (value) label.textContent = value;
    }
  };

  const close = panel => {
    panel.details.open = false;
    sync(panel);
  };

  const closeAll = () => {
    cancelTimers();
    panels.forEach(close);
  };

  const open = panel => {
    cancelTimers();
    panels.forEach(other => { if (other !== panel) close(other); });
    panel.details.open = true;
    sync(panel);
  };

  panels.forEach(panel => {
    sync(panel);

    // Keep the native summary activation and no-JavaScript fallback intact.
    // Close siblings before the default action; delayed toggle events then read
    // the current open state, rather than replaying an obsolete event state.
    panel.trigger.addEventListener("click", () => {
      cancelTimers();
      if (panel === menu && panel.details.open) suppressHover = pointerInMenu;
      panels.forEach(other => { if (other !== panel) close(other); });
    });
    panel.details.addEventListener("toggle", () => {
      if (panel.details.open) {
        panels.forEach(other => { if (other !== panel) close(other); });
      }
      sync(panel);
    });

    panel.details.addEventListener("click", event => {
      const target = event.target;
      const closeButton = target.closest?.("[data-panel-close]");
      if (closeButton) {
        closeAll();
        suppressHover = pointerInMenu;
        panel.trigger.focus();
        return;
      }
      const link = target.closest?.("a[href]");
      if (link && panel.details.contains(link)) closeAll();
    });
  });

  if (menu) {
    menu.trigger.addEventListener("pointerenter", event => {
      if (!hoverMedia?.matches || event.pointerType === "touch" || suppressHover || menu.details.open) return;
      window.clearTimeout(enterTimer);
      enterTimer = window.setTimeout(() => {
        if (document.hidden || suppressHover) return;
        // Do not hide a different panel while someone is using its links.
        if (panels.some(panel => panel !== menu && panel.details.open && panel.details.contains(document.activeElement))) return;
        open(menu);
      }, 140);
    });
    menu.details.addEventListener("pointerenter", event => {
      pointerInMenu = Boolean(hoverMedia?.matches && event.pointerType !== "touch");
      window.clearTimeout(leaveTimer);
    });
    menu.details.addEventListener("pointerleave", event => {
      window.clearTimeout(enterTimer);
      pointerInMenu = false;
      suppressHover = false;
      if (event.pointerType === "touch" || !hoverMedia?.matches) return;
      window.clearTimeout(leaveTimer);
      leaveTimer = window.setTimeout(() => {
        if (!menu.details.contains(document.activeElement)) close(menu);
      }, 220);
    });
    menu.details.addEventListener("pointercancel", () => {
      cancelTimers();
      pointerInMenu = false;
      suppressHover = false;
    });
  }

  document.addEventListener("pointerdown", event => {
    if (!header.contains(event.target)) closeAll();
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    const active = panels.find(panel => panel.details.open);
    if (!active) return;
    event.preventDefault();
    closeAll();
    suppressHover = pointerInMenu;
    active.trigger.focus();
  });
  header.addEventListener("focusout", event => {
    if (event.relatedTarget) {
      if (!header.contains(event.relatedTarget)) closeAll();
      return;
    }
    window.queueMicrotask(() => {
      if (!header.contains(document.activeElement)) closeAll();
    });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) closeAll();
  });
})();
