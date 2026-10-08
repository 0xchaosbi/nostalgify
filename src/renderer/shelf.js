// The shelf: Spotify playlists, albums, artists and songs kept in Winamp's
// playlist window. No login needed. Links come from drag and drop, paste, or
// the playlist's ADD > URL button, which reads the clipboard. Double-clicking an
// entry plays it in Spotify through AppleScript.

const KIND_LABEL = { album: "album", playlist: "playlist", artist: "artist", track: "song" };
const LIKED = { kind: "liked", uri: "liked", title: "Liked Songs" };

// Webamp gives tracks small numeric ids. Ours start far above them.
let nextId = 9_000_000;

// Actions that change the playlist's contents or order.
const CHANGES = new Set([
  "REMOVE_TRACKS",
  "REMOVE_ALL_TRACKS",
  "DRAG_SELECTED",
  "REVERSE_LIST",
  "RANDOMIZE_LIST",
  "SET_TRACK_ORDER",
]);

export function shelfLabel(item) {
  if (item.kind === "liked") return "♥ Liked Songs";
  const name = item.artist ? `${item.artist} - ${item.title}` : item.title;
  return `${name} (${KIND_LABEL[item.kind] || item.kind})`;
}

export function createShelf(webamp, { quietly, flash, onPlay }) {
  const store = webamp.store;
  const byId = new Map(); // Webamp track id -> shelf item

  function addItem(item) {
    const id = nextId++;
    byId.set(id, item);
    const name = shelfLabel(item);
    quietly(() => {
      store.dispatch({ type: "ADD_TRACK_FROM_URL", id, url: "shelf:" + item.uri, defaultName: name, duration: null });
      // Marking the tags as known stops Webamp trying to read them from the "file".
      store.dispatch({ type: "SET_MEDIA_TAGS", id, title: name, artist: null, album: null });
    });
  }

  function items() {
    return store
      .getState()
      .playlist.trackOrder.map((id) => byId.get(id))
      .filter(Boolean);
  }

  function save() {
    window.nostalgify.saveShelf(items());
  }

  async function load() {
    let saved = [];
    try {
      saved = (await window.nostalgify.loadShelf()) || [];
    } catch {}
    // Liked Songs is always first.
    const rest = saved.filter((i) => i && i.kind !== "liked" && i.uri);
    [LIKED, ...rest].forEach(addItem);
  }

  // Turn any text containing Spotify links into shelf entries.
  async function addFromText(text) {
    const found = await window.nostalgify.resolveLinks(String(text || ""));
    if (!found.length) {
      flash("That isn't a Spotify link. Copy one with Share > Copy link");
      return;
    }
    const have = new Set(items().map((i) => i.uri));
    const fresh = found.filter((i) => !have.has(i.uri));
    fresh.forEach(addItem);
    save();
    if (fresh.length === 1) flash("Added " + shelfLabel(fresh[0]));
    else if (fresh.length > 1) flash(`Added ${fresh.length} items`);
    else flash("Already on your shelf");
  }

  // We take every drop ourselves, before Webamp sees it. Webamp would otherwise
  // clear the playlist on a drop onto the main window, and try to play dropped
  // files. It also stops the page navigating to a dropped link.
  window.addEventListener("dragover", (e) => e.preventDefault(), true);
  window.addEventListener(
    "drop",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dt = e.dataTransfer;
      const text = [dt.getData("text/uri-list"), dt.getData("text/plain")].filter(Boolean).join("\n");
      if (text) addFromText(text);
      else flash("Drag a playlist or album from Spotify");
    },
    true
  );

  // The playlist's ADD > URL button reads a link from the clipboard.
  async function handleAddUrl() {
    await addFromText(await window.nostalgify.readClipboard());
    return [];
  }

  // Called by the Redux middleware for every action.
  function onAction(action, quiet) {
    if (quiet) return;
    if (CHANGES.has(action.type)) {
      save();
      return;
    }
    if (action.type === "PLAY_TRACK" && byId.has(action.id)) {
      const item = byId.get(action.id);
      flash("Playing " + shelfLabel(item));
      window.nostalgify.command("playShelf", item.uri).then(onPlay);
    }
  }

  // Cmd+V anywhere in the window adds whatever Spotify link is on the clipboard.
  document.addEventListener("paste", (e) => {
    const text = e.clipboardData && e.clipboardData.getData("text");
    if (text) {
      e.preventDefault();
      addFromText(text);
    }
  });

  return { load, onAction, handleAddUrl, addFromText, isShelfTrack: (id) => byId.has(id) };
}
