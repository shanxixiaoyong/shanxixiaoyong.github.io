(() => {
  const year = document.querySelector("[data-portal-year]");
  const doors = Array.from(document.querySelectorAll(".portal-door"));
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (year) year.textContent = String(new Date().getFullYear());
  if (!canHover.matches || reducedMotion.matches) return;

  doors.forEach((door) => {
    let frame = 0;

    door.addEventListener("pointermove", (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = door.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * -10;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -10;
        door.style.setProperty("--portal-media-x", `${x.toFixed(2)}px`);
        door.style.setProperty("--portal-media-y", `${y.toFixed(2)}px`);
      });
    }, { passive: true });

    door.addEventListener("pointerleave", () => {
      cancelAnimationFrame(frame);
      door.style.removeProperty("--portal-media-x");
      door.style.removeProperty("--portal-media-y");
    }, { passive: true });
  });
})();
