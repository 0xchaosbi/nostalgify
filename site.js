// Nostalgify website: a live Webamp with three classic skins, and a page theme
// that follows the current skin. Skins are not hosted here. They load from the
// Winamp Skin Museum's CDN, falling back to the Internet Archive.

const SKINS = [
  {
    key: "green",
    name: "Green Dimension V2",
    author: "El Argento (2004)",
    sources: [
      "https://r2.webampskins.org/skins/4308a2fc648033bf5fe7c4d56a5c8823.wsz",
      "https://archive.org/download/winampskin_Green-Dimension-V2/Green-Dimension-V2.wsz",
    ],
    page: "https://archive.org/details/winampskin_Green-Dimension-V2",
  },
  {
    key: "necro",
    name: "Necromech",
    author: "Peacemaker (2003)",
    sources: [
      "https://r2.webampskins.org/skins/3b3b8b07fb7d268f6092d4321f0a9b9c.wsz",
      "https://archive.org/download/winampskin_Necromech/Necromech.wsz",
    ],
    page: "https://archive.org/details/winampskin_Necromech",
  },
  {
    key: "kari",
    name: "Kari",
    author: "artist unknown",
    sources: [
      "https://r2.webampskins.org/skins/2bf05305e98a37e8640535a49691b6c5.wsz",
      "https://archive.org/download/winampskin_Kari/Kari.wsz",
    ],
    page: "https://archive.org/details/winampskin_Kari",
  },
];

const STORAGE_KEY = "nostalgify-site-skin";
const stage = document.getElementById("stage");
const note = document.querySelector(".js-stage-note");
const picker = document.querySelector(".skin-picker");

function savedSkinKey() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function saveSkinKey(key) {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {}
}

// ---------- theme ----------
function showSkin(skin) {
  document.documentElement.dataset.skin = skin.key;
  document.querySelectorAll(".js-skin-name").forEach((el) => (el.textContent = skin.name));
  document.querySelectorAll(".js-skin-author").forEach((el) => {
    el.innerHTML = "";
    const a = document.createElement("a");
    a.href = skin.page;
    a.textContent = skin.author;
    el.appendChild(a);
  });
  picker.querySelectorAll(".skin-btn").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.key === skin.key)));
  saveSkinKey(skin.key);
}

// ---------- skin buttons ----------
let webamp = null;
for (const skin of SKINS) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "skin-btn";
  b.dataset.key = skin.key;
  b.setAttribute("role", "radio");
  b.setAttribute("aria-checked", "false");
  b.innerHTML = `<span></span><small></small>`;
  b.querySelector("span").textContent = skin.name;
  b.querySelector("small").textContent = "by " + skin.author;
  b.addEventListener("click", () => switchTo(skin));
  picker.appendChild(b);
}

// ---------- skin loading ----------
// Webamp shows a blocking alert if a skin URL fails, so we download skins
// ourselves, trying each source in turn, and hand Webamp a local blob URL.
const blobCache = new Map();
async function fetchSkin(skin) {
  if (blobCache.has(skin.key)) return blobCache.get(skin.key);
  for (const url of skin.sources) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const blob = await res.blob();
      const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
      if (head[0] !== 0x50 || head[1] !== 0x4b) continue; // not a zip
      const blobUrl = URL.createObjectURL(blob);
      blobCache.set(skin.key, blobUrl);
      return blobUrl;
    } catch {}
  }
  return null;
}

let switching = 0;
async function switchTo(skin) {
  showSkin(skin);
  const mine = ++switching;
  const url = await fetchSkin(skin);
  if (mine !== switching || !webamp) return;
  if (url) webamp.setSkinFromUrl(url);
  else flash("Couldn't download that skin right now. Try again in a bit.");
}

function flash(text) {
  const el = document.createElement("p");
  el.className = "toast";
  el.textContent = text;
  stage.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

const initial = SKINS.find((s) => s.key === savedSkinKey()) || SKINS[0];
showSkin(initial);

// ---------- the player ----------
function showNote(text, buttonLabel, onClick) {
  note.hidden = false;
  note.textContent = text;
  if (buttonLabel) {
    const btn = document.createElement("button");
    btn.className = "skin-btn";
    btn.style.display = "block";
    btn.style.margin = "14px auto 0";
    btn.textContent = buttonLabel;
    btn.addEventListener("click", onClick);
    note.appendChild(btn);
  }
}

async function startPlayer() {
  if (!window.Webamp) {
    showNote("The player couldn't load. Check your connection and refresh.");
    return;
  }
  if (!Webamp.browserIsSupported()) {
    showNote("Your browser can't run the live demo, but the app will still work on your Mac.");
    return;
  }

  // Double size when there's room, like Winamp's Ctrl+D.
  const doubled = stage.clientWidth >= 570;
  const unit = doubled ? 2 : 1;
  stage.style.height = 232 * unit + 24 + "px";

  // Load the first skin before showing the player, so the default skin never flashes.
  const firstSkin = await fetchSkin(initial);
  if (!firstSkin) flash("Couldn't download the skin, so here's the default one.");

  webamp = new Webamp({
    initialSkin: firstSkin ? { url: firstSkin } : undefined,
    initialTracks: [
      {
        url: "audio/dial-up-dreams.m4a",
        duration: 30,
        metaData: { artist: "Nostalgify", title: "Dial-Up Dreams (original chiptune)" },
      },
    ],
    enableDoubleSizeMode: doubled,
    windowLayout: {
      main: { position: { top: 0, left: 0 } },
      equalizer: { position: { top: 116 * unit, left: 0 } },
      playlist: { position: { top: 232 * unit, left: 0 }, closed: true },
    },
  });

  webamp.onClose(() => {
    showNote("You closed it. Very 2001 of you.", "Reopen the player", () => {
      note.hidden = true;
      webamp.reopen();
    });
  });

  try {
    await webamp.renderInto(stage);
  } catch (e) {
    console.error(e);
    showNote("The player hit a snag. Refresh to try again.");
  }
}

startPlayer();

// ---------- copy install commands ----------
const copyBtn = document.querySelector(".js-copy");
copyBtn?.addEventListener("click", async () => {
  const text = document.querySelector(".js-commands").textContent;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied!";
  } catch {
    copyBtn.textContent = "Select and copy";
  }
  setTimeout(() => (copyBtn.textContent = "Copy"), 2000);
});
