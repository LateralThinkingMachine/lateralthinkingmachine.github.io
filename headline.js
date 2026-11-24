(() => {
  "use strict";

  const headline = document.querySelector("[data-headline]");
  if (!headline || !window.matchMedia || !window.IntersectionObserver) return;
  const copy = headline.closest(".hero-copy") || headline;

  const messages = [...headline.querySelectorAll(".headline-message")];
  if (messages.length < 2) return;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const DWELL_MS = 6000;
  const FADE_MS = 240;
  let current = 0;
  let hovered = window.matchMedia("(hover: hover)").matches && headline.matches(":hover");
  let focused = copy.contains(document.activeElement);
  let inView = false;
  let pageActive = true;
  let timer;
  let fadeTimer;

  const show = index => {
    current = index;
    messages.forEach((message, i) => message.toggleAttribute("data-active", i === current));
  };

  const schedule = () => {
    window.clearTimeout(timer);
    window.clearTimeout(fadeTimer);
    headline.removeAttribute("data-fading");
    if (hovered || focused || motion.matches || !inView || document.hidden || !pageActive) return;
    timer = window.setTimeout(() => {
      headline.setAttribute("data-fading", "");
      fadeTimer = window.setTimeout(() => {
        show((current + 1) % messages.length);
        schedule();
      }, FADE_MS);
    }, DWELL_MS);
  };

  const updateMotion = () => {
    if (motion.matches) show(0);
    schedule();
  };

  headline.addEventListener("pointerenter", event => {
    if (event.pointerType === "touch") return;
    hovered = true;
    schedule();
  });
  headline.addEventListener("pointerleave", () => { hovered = false; schedule(); });
  headline.addEventListener("pointercancel", () => { hovered = false; schedule(); });
  copy.addEventListener("focusin", () => { focused = true; schedule(); });
  copy.addEventListener("focusout", event => {
    focused = copy.contains(event.relatedTarget);
    schedule();
  });

  const observer = new window.IntersectionObserver(entries => {
    inView = entries.some(entry => entry.target === headline && entry.isIntersecting);
    schedule();
  }, { threshold: 0 });
  observer.observe(headline);

  motion.addEventListener("change", updateMotion);
  document.addEventListener("visibilitychange", schedule);
  window.addEventListener("pagehide", () => { pageActive = false; schedule(); });
  window.addEventListener("pageshow", () => { pageActive = true; schedule(); });
  updateMotion();
})();
