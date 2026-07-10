(() => {
  const rail = document.querySelector("[data-portal-rail]");
  const doors = Array.from(document.querySelectorAll("[data-portal-index]"));
  const dots = Array.from(document.querySelectorAll("[data-portal-dot]"));
  const currentNumber = document.querySelector("[data-portal-current]");
  const currentName = document.querySelector("[data-portal-current-name]");
  const nextName = document.querySelector("[data-portal-next]");
  const progress = document.querySelector("[data-portal-progress]");
  const year = document.querySelector("[data-portal-year]");
  const labels = doors.map((door) => door.querySelector(".portal-door-copy strong")?.textContent.trim() || "");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = 0;
  let frame = 0;

  if (year) year.textContent = String(new Date().getFullYear());
  if (!rail || !doors.length) return;

  function setActive(index) {
    const nextIndex = Math.max(0, Math.min(doors.length - 1, index));
    activeIndex = nextIndex;
    if (currentNumber) currentNumber.textContent = String(nextIndex + 1).padStart(2, "0");
    if (currentName) currentName.textContent = labels[nextIndex];
    if (nextName) nextName.textContent = labels[(nextIndex + 1) % labels.length];
    if (progress) progress.style.width = `${((nextIndex + 1) / doors.length) * 100}%`;
    dots.forEach((dot, dotIndex) => {
      const selected = dotIndex === nextIndex;
      dot.classList.toggle("is-active", selected);
      dot.setAttribute("aria-current", selected ? "true" : "false");
    });
  }

  function nearestDoor() {
    const railLeft = rail.getBoundingClientRect().left;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    doors.forEach((door, index) => {
      const distance = Math.abs(door.getBoundingClientRect().left - railLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    setActive(nearestIndex);
  }

  function scheduleMeasure() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(nearestDoor);
  }

  function scrollToDoor(index) {
    const door = doors[Math.max(0, Math.min(doors.length - 1, index))];
    const padding = Number.parseFloat(getComputedStyle(rail).paddingLeft) || 0;
    rail.scrollTo({
      left: Math.max(0, door.offsetLeft - padding),
      behavior: reducedMotion.matches ? "auto" : "smooth"
    });
    setActive(index);
  }

  rail.addEventListener("scroll", scheduleMeasure, { passive: true });
  rail.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") scrollToDoor(0);
    else if (event.key === "End") scrollToDoor(doors.length - 1);
    else scrollToDoor(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
  });

  dots.forEach((dot, index) => dot.addEventListener("click", () => scrollToDoor(index)));

  doors.forEach((door) => {
    door.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const bounds = door.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      door.style.setProperty("--portal-x", x.toFixed(3));
      door.style.setProperty("--portal-y", y.toFixed(3));
    });
    door.addEventListener("pointerleave", () => {
      door.style.removeProperty("--portal-x");
      door.style.removeProperty("--portal-y");
    });
  });

  window.addEventListener("resize", scheduleMeasure, { passive: true });
  setActive(0);
})();
