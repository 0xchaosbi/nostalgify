// The equalizer can't change Spotify's sound. So it only appears when the skin
// ships its own equalizer artwork, and then it's a fixed, decorative curve
// that can't be clicked.

// A gentle "loudness" curve, 0-100 where 50 is flat, with a little unevenness
// so it looks hand-set.
const CURVE = {
  preamp: 54,
  60: 66,
  170: 61,
  310: 53,
  600: 47,
  1000: 45,
  3000: 49,
  6000: 57,
  12000: 63,
  14000: 66,
  16000: 62,
};

export function createEqPolicy(webamp, initialSkins) {
  const store = webamp.store;
  let hasEq = new Map(initialSkins.map((s) => [s.url, s.hasEq]));
  let allowed = true;
  let autoClosed = false;

  function setCurve() {
    store.dispatch({ type: "SET_EQ_ON" });
    for (const [band, value] of Object.entries(CURVE)) {
      const key = band === "preamp" ? "preamp" : Number(band);
      store.dispatch({ type: "SET_BAND_VALUE", band: key, value });
    }
  }

  function isOpen() {
    return store.getState().windows.genWindows.equalizer.open;
  }

  return {
    allowed: () => allowed,
    updateSkins(list) {
      hasEq = new Map(list.map((s) => [s.url, s.hasEq]));
    },
    // url is null for Webamp's built-in default skin, which has an equalizer.
    applyForSkin(url) {
      allowed = url == null ? true : hasEq.get(url) !== false;
      document.body.classList.toggle("no-eq", !allowed);
      if (!allowed && isOpen()) {
        store.dispatch({ type: "CLOSE_WINDOW", windowId: "equalizer" });
        autoClosed = true;
      } else if (allowed && autoClosed && !isOpen()) {
        store.dispatch({ type: "TOGGLE_WINDOW", windowId: "equalizer" });
        autoClosed = false;
      }
      setCurve();
    },
  };
}
