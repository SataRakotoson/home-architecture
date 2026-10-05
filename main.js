const nav = document.querySelector(".site-nav");
const toggle = document.querySelector(".nav-toggle");
const menu = document.querySelector("#menu");
const hero = document.querySelector(".hero");

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

function activate(project) {
  projects.forEach((item) => {
    const on = item === project;
    item.classList.toggle("is-active", on);
    const button = item.querySelector("button");
    button.setAttribute("aria-pressed", String(on));
  });
  const button = project.querySelector("button");
  preview.src = button.dataset.image;
  preview.alt = button.dataset.alt;
}

projects.forEach((project) => {
  const button = project.querySelector("button");
  button.addEventListener("mouseenter", () => activate(project));
  button.addEventListener("focus", () => activate(project));
  button.addEventListener("click", () => activate(project));
});
