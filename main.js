const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const nav = document.querySelector(".site-nav");
const toggle = document.querySelector(".nav-toggle");
const menu = document.querySelector("#menu");
const hero = document.querySelector(".hero");
const heroLogo = document.querySelector(".hero-title");
const started = performance.now();

const heroWatcher = new IntersectionObserver(
  ([entry]) => {
    nav.classList.toggle("on-hero", entry.isIntersecting);
  },
  { threshold: 0.15 }
);
heroWatcher.observe(hero);

function setMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Fermer" : "Menu");
  document.body.classList.toggle("nav-open", open);
}

function closeMenu() {
  setMenu(false);
}

toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  setMenu(!open);
});

menu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

let lastScrollY = window.scrollY;
const navRevealTop = 12;

function updateNavVisibility() {
  const y = window.scrollY;
  const delta = y - lastScrollY;
  const menuOpen = document.body.classList.contains("nav-open");

  if (y <= navRevealTop || menuOpen) {
    nav.classList.remove("is-hidden");
    lastScrollY = y;
    return;
  }

  if (Math.abs(delta) < 6) return;

  nav.classList.toggle("is-hidden", delta > 0);
  lastScrollY = y;
}

window.addEventListener("scroll", updateNavVisibility, { passive: true });

const projects = [...document.querySelectorAll(".project")];
const preview = document.querySelector(".project-preview img");
let swapTimer = 0;

function activate(project) {
  projects.forEach((item) => {
    const on = item === project;
    item.classList.toggle("is-active", on);
    item.querySelector("button").setAttribute("aria-pressed", String(on));
  });
  const button = project.querySelector("button");
  const nextSrc = button.dataset.image;
  if (preview.getAttribute("src") === nextSrc) return;

  const apply = () => {
    preview.src = nextSrc;
    preview.alt = button.dataset.alt;
    preview.classList.remove("is-fading");
  };

  if (reduceMotion) {
    apply();
    return;
  }

  preview.classList.add("is-fading");
  window.clearTimeout(swapTimer);
  swapTimer = window.setTimeout(apply, 280);
}

projects.forEach((project) => {
  const button = project.querySelector("button");
  button.addEventListener("mouseenter", () => activate(project));
  button.addEventListener("focus", () => activate(project));
  button.addEventListener("click", () => activate(project));
});

function maskWords(el, step = 0.07) {
  const text = el.textContent.replace(/\s+/g, " ").trim();
  if (!text) return;
  const words = text.split(" ");
  el.setAttribute("aria-label", text);
  el.textContent = "";
  words.forEach((word, index) => {
    const mask = document.createElement("span");
    mask.className = "mask";
    const inner = document.createElement("span");
    inner.className = "mask-inner";
    inner.style.transitionDelay = `${index * step}s`;
    inner.textContent = word;
    mask.appendChild(inner);
    el.appendChild(mask);
    if (index < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
}

function maskLine(el, delay) {
  const text = el.textContent.replace(/\s+/g, " ").trim();
  el.textContent = "";
  const mask = document.createElement("span");
  mask.className = "mask";
  const inner = document.createElement("span");
  inner.className = "mask-inner";
  inner.style.transitionDelay = delay;
  inner.textContent = text;
  mask.appendChild(inner);
  el.appendChild(mask);
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-shown");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
);

function watch(el) {
  if (reduceMotion) {
    el.classList.add("is-shown");
    return;
  }
  revealObserver.observe(el);
}

document.querySelectorAll(".manifesto h1, .section-kicker h2, .steps h3, .footer-name").forEach((el) => {
  maskWords(el, 0.08);
  watch(el);
});

document.querySelectorAll(".capabilities li").forEach((el, index) => {
  maskLine(el, `${index * 0.09}s`);
  watch(el.parentElement);
});

document.querySelectorAll(".zones li").forEach((el, index) => {
  maskLine(el, `${index * 0.07}s`);
  watch(el);
});

document.querySelectorAll(".facts article, .lead p, .compare, .project, .section-kicker p, .steps article p, .footer-grid > div").forEach((el, index) => {
  el.classList.add("rise");
  el.style.transitionDelay = `${(index % 5) * 0.07}s`;
  watch(el);
});

document.querySelectorAll(".hero-media, .media, .project-preview, .compare-frame").forEach((el) => watch(el));

document.querySelectorAll(".compare-frame").forEach((frame, index) => {
  const range = frame.querySelector(".compare-range");
  const minPos = 8;
  const maxPos = 92;
  const goMs = 5600;
  const holdMs = 1200;
  const cycleMs = (goMs + holdMs) * 2;
  const staggerMs = index * 1400;
  let auto = false;
  let raf = 0;
  let origin = 0;
  let resumeTimer = 0;
  let inView = false;
  let held = false;

  const setPos = (value) => {
    const next = Math.min(100, Math.max(0, Number(value)));
    frame.style.setProperty("--pos", `${next}%`);
    const rounded = String(Math.round(next));
    if (range.value !== rounded) range.value = rounded;
  };

  const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));

  const autoPos = (now) => {
    const t = ((now - origin + staggerMs) % cycleMs + cycleMs) % cycleMs;
    if (t < goMs) return minPos + (maxPos - minPos) * ease(t / goMs);
    if (t < goMs + holdMs) return maxPos;
    if (t < goMs + holdMs + goMs) return maxPos - (maxPos - minPos) * ease((t - goMs - holdMs) / goMs);
    return minPos;
  };

  const tick = (now) => {
    if (!auto) return;
    setPos(autoPos(now));
    raf = requestAnimationFrame(tick);
  };

  const stopAuto = () => {
    auto = false;
    cancelAnimationFrame(raf);
  };

  const play = () => {
    if (reduceMotion || !inView || auto || held) return;
    auto = true;
    origin = performance.now();
    raf = requestAnimationFrame(tick);
  };

  const hold = () => {
    held = true;
    stopAuto();
    window.clearTimeout(resumeTimer);
  };

  const scheduleResume = () => {
    held = true;
    stopAuto();
    window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(() => {
      held = false;
      play();
    }, 3800);
  };

  setPos(reduceMotion ? range.value : minPos);

  range.addEventListener("input", () => {
    hold();
    setPos(range.value);
    scheduleResume();
  });

  const posFromPointer = (event) => {
    const rect = frame.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * 100;
  };

  frame.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    hold();
    frame.setPointerCapture(event.pointerId);
    setPos(posFromPointer(event));
  });

  frame.addEventListener("pointermove", (event) => {
    if (!frame.hasPointerCapture(event.pointerId)) return;
    setPos(posFromPointer(event));
  });

  frame.addEventListener("pointerup", scheduleResume);
  frame.addEventListener("pointercancel", scheduleResume);

  const updateView = () => {
    const rect = frame.getBoundingClientRect();
    const viewH = window.innerHeight || 1;
    inView = rect.bottom > viewH * 0.12 && rect.top < viewH * 0.88;
    if (inView) play();
    else stopAuto();
  };

  if (!reduceMotion) {
    new IntersectionObserver(updateView, { threshold: [0, 0.15, 0.4] }).observe(frame);
    window.addEventListener("scroll", updateView, { passive: true });
    window.addEventListener("resize", updateView);
    requestAnimationFrame(updateView);
  }
});

if (heroLogo) requestAnimationFrame(() => heroLogo.classList.add("is-shown"));

function heroScale() {
  if (reduceMotion) return 1;
  const progress = Math.min(1, (performance.now() - started) / 1700);
  const eased = 1 - Math.pow(1 - progress, 3);
  return 1.08 - 0.08 * eased;
}

function updateParallax() {
  if (reduceMotion) return;
  const viewH = window.innerHeight;
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const speed = parseFloat(el.dataset.speed) || 0;
    if (el.dataset.parallax === "scroll") {
      const max = hero.offsetHeight * 0.12;
      const y = Math.min(window.scrollY * speed, max);
      el.style.transform = `translate3d(0, ${y}px, 0) scale(${heroScale()})`;
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.height < 2) return;
    const raw = (rect.top + rect.height / 2 - viewH / 2) * speed;
    const y = Math.max(-46, Math.min(46, raw));
    el.style.transform = `translate3d(0, ${y}px, 0)`;
  });
}

let ticking = false;
function requestTick() {
  if (ticking || reduceMotion) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateParallax();
    ticking = false;
  });
}

window.addEventListener("scroll", requestTick, { passive: true });
window.addEventListener("resize", requestTick);
updateParallax();
if (!reduceMotion && heroScale() > 1.001) {
  const intro = () => {
    updateParallax();
    if (heroScale() > 1.001) requestAnimationFrame(intro);
  };
  requestAnimationFrame(intro);
}

const heroCanvas = document.querySelector(".hero-sequence");
const heroMedia = document.querySelector(".hero-media");
const heroScroll = document.querySelector(".hero-scroll");
const heroPin = document.querySelector(".hero-pin");
const mobileHero = window.matchMedia("(max-width: 900px)");
if (heroCanvas && hero && heroMedia) {
  const FRAME_COUNT = 151;
  const frames = new Array(FRAME_COUNT);
  const ctx = heroCanvas.getContext("2d", { alpha: false });
  let current = 0;
  let drawn = -1;
  let lastTime = 0;

  const frameSrc = (index) =>
    `images/hero-image/ezgif-frame-${String(index + 1).padStart(3, "0")}.jpg`;

  const loadFrame = (index) => {
    if (frames[index]) return frames[index];
    const img = new Image();
    img.decoding = "async";
    img.src = frameSrc(index);
    frames[index] = img;
    return img;
  };

  const isReady = (img) => img && img.complete && img.naturalWidth > 0;

  const nearestReady = (index) => {
    const img = frames[index];
    if (isReady(img)) return index;
    for (let step = 1; step < FRAME_COUNT; step++) {
      if (index - step >= 0 && isReady(frames[index - step])) return index - step;
      if (index + step < FRAME_COUNT && isReady(frames[index + step])) return index + step;
    }
    return -1;
  };

  const sequenceProgress = () => {
    const locked = mobileHero.matches && heroScroll && heroPin;
    const track = locked ? heroScroll : hero;
    const frame = locked ? heroPin : heroMedia;
    const distance = track.offsetHeight - frame.offsetHeight;
    if (distance <= 1) return 0;
    const scrolled = window.scrollY - track.offsetTop;
    return Math.min(1, Math.max(0, scrolled / distance));
  };

  const fitCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = heroCanvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (heroCanvas.width !== width || heroCanvas.height !== height) {
      heroCanvas.width = width;
      heroCanvas.height = height;
      drawn = -1;
    }
  };

  const paint = (index) => {
    const img = frames[index];
    if (!isReady(img) || !ctx) return;
    const width = heroCanvas.width;
    const height = heroCanvas.height;
    const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
    drawn = index;
  };

  for (let i = 0; i < FRAME_COUNT; i++) loadFrame(i);

  const playSequence = (now) => {
    const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0.016;
    lastTime = now;
    const target = reduceMotion ? 0 : sequenceProgress() * (FRAME_COUNT - 1);
    const ease = 1 - Math.exp(-dt * 14);
    current += (target - current) * ease;
    if (Math.abs(target - current) < 0.04) current = target;

    fitCanvas();
    const index = nearestReady(Math.round(current));
    if (index !== -1 && index !== drawn) paint(index);
    requestAnimationFrame(playSequence);
  };

  requestAnimationFrame(playSequence);
}
