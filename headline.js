(() => {
  "use strict";

  const headline = document.querySelector("[data-headline]");
  const toggle = document.querySelector("[data-headline-toggle]");
  if (!headline || !toggle || !window.matchMedia || !window.IntersectionObserver) return;

  const messages = [...headline.querySelectorAll(".headline-message")];
  if (messages.length < 2) return;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const DWELL_MS = 6000;
  const FADE_MS = 240;
  let current = 0;
  let paused = false;
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
    if (paused || motion.matches || !inView || document.hidden || !pageActive) return;
    timer = window.setTimeout(() => {
      headline.setAttribute("data-fading", "");
      fadeTimer = window.setTimeout(() => {
        show((current + 1) % messages.length);
        schedule();
      }, FADE_MS);
    }, DWELL_MS);
  };

  const updateMotion = () => {
    toggle.hidden = motion.matches;
    if (motion.matches) show(0);
    schedule();
  };

  toggle.addEventListener("click", () => {
    paused = !paused;
    const label = paused ? "Resume headline rotation" : "Pause headline rotation";
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("title", label);
    toggle.toggleAttribute("data-paused", paused);
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
