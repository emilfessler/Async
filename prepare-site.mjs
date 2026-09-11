import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

const pages = [
  {
    source: "Async IT - Accueil v2.dc.html",
    output: "index.html",
    title: "Async IT — Partenaire informatique à Morges",
    description: "Informatique, réseau, téléphonie et cybersécurité pour PME et particuliers en Suisse romande."
  },
  {
    source: "Services.dc.html",
    output: "services.html",
    title: "Services informatiques — Async IT",
    description: "Postes, serveurs, réseau, téléphonie et accompagnement informatique pour PME."
  },
  {
    source: "Cybersecurite.dc.html",
    output: "cybersecurite.html",
    title: "Cybersécurité — Async IT",
    description: "Protection, sauvegardes, supervision et sensibilisation pour les entreprises de Suisse romande."
  },
  {
    source: "Nouvelles.dc.html",
    output: "nouvelles.html",
    title: "Nouvelles et références — Async IT",
    description: "Actualités, conseils et références d’Async IT."
  },
  {
    source: "Support-a-distance.dc.html",
    output: "support.html",
    title: "Support à distance — Async IT",
    description: "Accédez au support informatique à distance d’Async IT."
  },
  {
    source: "Contact.dc.html",
    output: "contact.html",
    title: "Contact — Async IT",
    description: "Contactez Async IT à Lully, près de Morges."
  }
];

const links = new Map([
  ["./Async%20IT%20-%20Accueil%20v2.dc.html", "./index.html"],
  ["./Async IT - Accueil v2.dc.html", "./index.html"],
  ["./Services.dc.html", "./services.html"],
  ["./Cybersecurite.dc.html", "./cybersecurite.html"],
  ["./Nouvelles.dc.html", "./nouvelles.html"],
  ["./Support-a-distance.dc.html", "./support.html"],
  ["./Contact.dc.html", "./contact.html"]
]);

const sharedHead = `
<meta name="theme-color" content="#04060C">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%238FBAFF'/%3E%3Cstop offset='1' stop-color='%231E62E0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' rx='8' fill='url(%23g)'/%3E%3Cpath d='M10 23 15.2 8h2L22 23h-3.2l-1-3.5h-4L12.8 23Zm4.6-6.2h2.6L16 12.2Z' fill='%2304060C'/%3E%3C/svg%3E">
<script src="./arcs.js" defer></script>
<script type="module" src="./glass-logo.js"></script>
<script src="./interactions.js" defer></script>
<style>
  html { scroll-behavior: smooth; background: #04060C; }
  body { min-width: 320px; }
  async-arcs { display: block; }
  a { transition: color .2s ease, opacity .2s ease, transform .2s ease; }
  a:focus-visible { outline: 2px solid #8FBAFF; outline-offset: 4px; }
  @media (hover: hover) { a:hover { opacity: .82; } }
  .scroll-progress { position: fixed; inset: 0 0 auto; height: 3px; z-index: 1000; transform: scaleX(0); transform-origin: 0 50%; pointer-events: none; background: linear-gradient(90deg, #8FBAFF, #2E7BFF 56%, #F4F7FB); box-shadow: 0 0 16px rgba(91,155,255,.62); }
  .motion-intro { opacity: 0; will-change: transform, opacity, filter; }
  .motion-ready .motion-intro-bar { animation: introBar .65s cubic-bezier(.2,.8,.2,1) both; }
  .motion-ready .motion-intro-nav { animation: introNav .8s .08s cubic-bezier(.16,1,.3,1) both; }
  .motion-ready .motion-intro-copy { animation: introCopy .9s var(--intro-delay, 0ms) cubic-bezier(.16,1,.3,1) both; }
  .motion-ready .motion-intro-stat { animation: introStat .7s var(--intro-delay, 0ms) cubic-bezier(.16,1,.3,1) both; }
  .motion-reveal { opacity: 0; transform: translate3d(0, 42px, 0); filter: blur(7px); transition: opacity .8s var(--motion-delay, 0ms) ease, transform 1s var(--motion-delay, 0ms) cubic-bezier(.16,1,.3,1), filter .9s var(--motion-delay, 0ms) ease; will-change: transform, opacity, filter; }
  .motion-reveal.motion-left { transform: translate3d(-42px, 20px, 0); }
  .motion-reveal.motion-right { transform: translate3d(42px, 20px, 0); }
  .motion-reveal.is-visible { opacity: 1; transform: translate3d(0, 0, 0); filter: blur(0); }
  .motion-reveal-child { opacity: 0; transform: translate3d(0, 22px, 0); transition: opacity .65s calc(var(--child-delay, 0ms) + 140ms) ease, transform .8s calc(var(--child-delay, 0ms) + 140ms) cubic-bezier(.16,1,.3,1); }
  .motion-reveal.is-visible > .motion-reveal-child { opacity: 1; transform: translate3d(0, 0, 0); }
  .motion-arcs { transform-origin: 72% 42%; will-change: transform; }
  .motion-static-surface { transform: none !important; opacity: 1 !important; filter: none !important; }
  .location-ticker { width: 100%; overflow: hidden; color: #10141A; }
  .location-ticker-track { display: flex; width: max-content; transform: translateX(-50%); animation: tickerRight 38s linear infinite; will-change: transform; }
  .location-ticker-item { flex: 0 0 auto; font-size: clamp(38px, 7.8vw, 92px); line-height: 1; letter-spacing: -0.045em; font-weight: 600; white-space: nowrap; }
  .location-ticker-item span { color: #C3C8C0; }
  .motion-card { transition: transform .45s cubic-bezier(.16,1,.3,1), border-color .35s ease, box-shadow .45s ease; }
  .motion-button { position: relative; overflow: hidden; transform: translateZ(0); }
  .motion-button::after { content: ''; position: absolute; inset: -1px; pointer-events: none; background: linear-gradient(110deg, transparent 28%, rgba(255,255,255,.34) 48%, transparent 68%); transform: translateX(-130%); transition: transform .65s cubic-bezier(.16,1,.3,1); }
  @media (hover: hover) {
    .motion-card:hover, .motion-reveal.is-visible > .motion-card:hover { transform: translate3d(0, -6px, 0); border-color: rgba(143,180,238,.5) !important; box-shadow: 0 20px 50px rgba(0,0,0,.16); }
    .motion-button:hover { transform: translate3d(0, -2px, 0); }
    .motion-button:hover::after { transform: translateX(130%); }
  }
  @keyframes introBar { from { opacity: 0; transform: translateY(-100%); } to { opacity: 1; transform: translateY(0); } }
  @keyframes introNav { from { opacity: 0; transform: translateY(-18px) scale(.985); filter: blur(8px); } to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
  @keyframes introCopy { from { opacity: 0; transform: translateY(34px); filter: blur(8px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
  @keyframes introStat { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes tickerRight { from { transform: translateX(-50%); } to { transform: translateX(0); } }
  @media (max-width: 720px) {
    nav { width: 100%; }
  }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    * { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
    .motion-intro, .motion-reveal, .motion-reveal-child { opacity: 1 !important; transform: none !important; filter: none !important; }
    .scroll-progress { display: none; }
    .location-ticker-track { animation: none; transform: translateX(0); }
  }
</style>`;

function clean(source, page) {
  let html = source
    .replace("<html>", '<html lang="fr">')
    .replace('<script src="./support.js"></script>', "")
    .replaceAll("<x-dc>", "")
    .replaceAll("</x-dc>", "")
    .replaceAll("<helmet>", "")
    .replaceAll("</helmet>", "")
    .replace(/<sc-if[^>]*>/g, "")
    .replaceAll("</sc-if>", "")
    .replace(/<x-import component-from-global-scope="async-arcs" from="\.\/arcs\.js"([^>]*)><\/x-import>/g, "<async-arcs$1></async-arcs>")
    .replace(/\n<script type="text\/x-dc" data-dc-script[\s\S]*?<\/script>\n/, "\n");

  for (const [from, to] of links) html = html.replaceAll(from, to);

  html = html.replace(
    /<div style="width: 26px; height: 26px; border-radius: 7px; background: linear-gradient\(150deg, #8FBAFF, #1E62E0\); color: #04060C; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px;">A<\/div>\s*<span style="font-weight: 600; font-size: 14\.5px; letter-spacing: -0\.01em;">Async IT<\/span>/g,
    '<img src="./assets/async-blanc.png" alt="Async IT" style="display: block; width: clamp(96px, 8vw, 118px); height: auto; max-height: 26px; object-fit: contain;">'
  );

  if (page.output === "contact.html") {
    html = html.replace('<a href="./services.html" style="color: #EEF2F8;">Contact</a>', '<a href="./services.html">Services</a>');
  }
  if (page.output === "cybersecurite.html") {
    html = html.replace('<a href="./services.html" style="color: #EEF2F8;">Cybersécurité</a>', '<a href="./cybersecurite.html" style="color: #EEF2F8;">Cybersécurité</a>');
  }
  if (page.output === "nouvelles.html") {
    html = html.replace('<a href="./services.html" style="color: #EEF2F8;">Nouvelles</a>', '<a href="./services.html">Services</a>');
  }
  if (page.output === "support.html") {
    html = html.replace('<a href="./services.html" style="color: #EEF2F8;">Support à distance</a>', '<a href="./services.html">Services</a>');
    html = html.replace('<a href="./support.html">Support</a>', '<a href="./support.html" style="color: #EEF2F8;">Support</a>');
  }

  html = html.replace(
    "</head>",
    `<title>${page.title}</title>\n<meta name="description" content="${page.description}">\n${sharedHead}\n</head>`
  );

  if (page.output === "contact.html") {
    html = html.replaceAll('href="./contact.html" style="background: #F4F7FB; color: #04060C; text-align: center; border-radius: 100px; padding: 14px; font-weight: 600; font-size: 15px;">Envoyer la demande</a>', 'href="mailto:hello@async-it.ch?subject=Demande%20depuis%20le%20site" style="background: #F4F7FB; color: #04060C; text-align: center; border-radius: 100px; padding: 14px; font-weight: 600; font-size: 15px;">Envoyer la demande</a>');
  }

  return html;
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const page of pages) {
  const source = await readFile(path.join(root, page.source), "utf8");
  await writeFile(path.join(dist, page.output), clean(source, page));
}

await cp(path.join(root, "arcs.js"), path.join(dist, "arcs.js"));
await cp(path.join(root, "glass-logo.js"), path.join(dist, "glass-logo.js"));
await cp(path.join(root, "interactions.js"), path.join(dist, "interactions.js"));
await cp(path.join(root, "assets"), path.join(dist, "assets"), { recursive: true });
await cp(path.join(root, "uploads"), path.join(dist, "uploads"), { recursive: true });
