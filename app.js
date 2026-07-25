const CHAPTERS = [
  {
    id: "1",
    title: "Chapter 1 — Day Zero",
    file: "./chapters/chapter_01.md",
    image: "./images/chapter_01.png",
    blurb: "The bus dies. The world expands. Templates rejected.",
  },
  {
    id: "2",
    title: "Chapter 2 — Pack Math",
    file: "./chapters/chapter_02.md",
    image: "./images/chapter_03.png",
    blurb: "Carrion beetles, a Weaver’s scream, and the first overdraw that almost ate a core.",
  },
];

const ART = [
  {
    id: "mariusz",
    title: "Mariusz the Scholar",
    file: "./images/mariusz.png",
    caption:
      "Guardian. Fate-bound. Horns, gold skin, silver eyes — demon was the first word that arrived.",
  },
];

const content = document.getElementById("content");
const chapterNav = document.getElementById("chapter-nav");
const homeList = document.getElementById("home-list");
const pager = document.getElementById("pager");
const prevLink = document.getElementById("prev");
const nextLink = document.getElementById("next");

marked.setOptions({
  gfm: true,
  breaks: false,
});

function routeId() {
  const hash = location.hash.replace(/^#\/?/, "");
  return hash || "home";
}

function renderNav(activeId) {
  const chapterLinks = CHAPTERS.map(
    (ch) =>
      `<a href="#/${ch.id}" class="${ch.id === activeId ? "active" : ""}">Ch. ${ch.id}</a>`
  ).join("");
  const artActive = activeId === "art" ? "active" : "";
  chapterNav.innerHTML = `${chapterLinks}<a href="#/art" class="${artActive}">Art</a>`;
}

function renderHome() {
  renderNav(null);
  pager.hidden = true;
  homeList.innerHTML = CHAPTERS.map(
    (ch) =>
      `<li><a href="#/${ch.id}"><strong>${ch.title}</strong><span>${ch.blurb}</span></a></li>`
  ).join("");

  content.innerHTML = `
    <section class="home">
      <p class="kicker">LitRPG · Cultivation</p>
      <h1>Aeric Ryder</h1>
      <p class="lede">Day Zero. Read in bed. Don’t trust the templates.</p>
      <ul class="home-list">${homeList.innerHTML}</ul>
      <p class="home-art-link"><a href="#/art">Art →</a></p>
    </section>
  `;
}

function updatePager(index) {
  pager.hidden = false;
  const prev = CHAPTERS[index - 1];
  const next = CHAPTERS[index + 1];

  if (prev) {
    prevLink.href = `#/${prev.id}`;
    prevLink.setAttribute("aria-disabled", "false");
    prevLink.textContent = `← Ch. ${prev.id}`;
  } else {
    prevLink.href = "#/";
    prevLink.setAttribute("aria-disabled", "true");
    prevLink.textContent = "← Prev";
  }

  if (next) {
    nextLink.href = `#/${next.id}`;
    nextLink.setAttribute("aria-disabled", "false");
    nextLink.textContent = `Ch. ${next.id} →`;
  } else {
    nextLink.href = "#/";
    nextLink.setAttribute("aria-disabled", "true");
    nextLink.textContent = "Next →";
  }
}

function renderArt() {
  renderNav("art");
  pager.hidden = true;
  const pieces = ART.map(
    (piece) => `
      <figure class="art-piece">
        <img src="${piece.file}" alt="${piece.title}" width="1024" height="1365" loading="eager" decoding="async" />
        <figcaption>
          <strong>${piece.title}</strong>
          <span>${piece.caption}</span>
        </figcaption>
      </figure>
    `
  ).join("");

  content.innerHTML = `
    <section class="art">
      <p class="kicker">Gallery</p>
      <h1>Art</h1>
      <p class="lede">Faces from the void. More as the climb goes on.</p>
      <div class="art-grid">${pieces}</div>
    </section>
  `;
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

async function renderChapter(id) {
  const index = CHAPTERS.findIndex((ch) => ch.id === id);
  if (index < 0) {
    renderHome();
    return;
  }

  const chapter = CHAPTERS[index];
  renderNav(chapter.id);
  updatePager(index);
  content.innerHTML = `<p class="loading">Loading…</p>`;

  try {
    const res = await fetch(chapter.file);
    if (!res.ok) throw new Error(`Failed to load ${chapter.file}`);
    const markdown = await res.text();
    const imageHtml = chapter.image
      ? `<figure class="chapter-art"><img src="${chapter.image}" alt="${chapter.title}" width="1600" height="900" loading="eager" decoding="async" /></figure>`
      : "";
    content.innerHTML = `<article class="chapter">${imageHtml}${marked.parse(markdown)}</article>`;
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  } catch (err) {
    content.innerHTML = `<p class="error">Couldn’t load this chapter. Pull to refresh, or open Contents.</p>`;
    console.error(err);
  }
}

function render() {
  const id = routeId();
  if (id === "home") renderHome();
  else if (id === "art") renderArt();
  else renderChapter(id);
}

window.addEventListener("hashchange", render);
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  });
}
