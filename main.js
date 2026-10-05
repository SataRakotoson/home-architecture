const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const nav = document.querySelector(".site-nav");
const toggle = document.querySelector(".nav-toggle");
const menu = document.querySelector("#menu");
const hero = document.querySelector(".hero");
const heroLogo = document.querySelector(".hero-logo");
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
  toggle.textContent = open ? "Fermer" : "Menu";
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

document.querySelectorAll(".facts article, .lead p, .project, .section-kicker p, .steps article p, .footer-grid > div").forEach((el, index) => {
  el.classList.add("rise");
  el.style.transitionDelay = `${(index % 5) * 0.07}s`;
  watch(el);
});

document.querySelectorAll(".hero-media, .media, .project-preview").forEach((el) => watch(el));

requestAnimationFrame(() => heroLogo.classList.add("is-shown"));

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
