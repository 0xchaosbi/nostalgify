# Nostalgify website

This branch holds the website for [Nostalgify](https://github.com/0xchaosbi/nostalgify), served by GitHub Pages at
https://0xchaosbi.github.io/nostalgify/. The app itself lives on the `main` branch.

## Preview locally

```sh
python3 -m http.server 8080
```

Then open http://localhost:8080.

## The demo song

"Dial-Up Dreams" is an original chiptune made from scratch by `scripts/make-demo-track.py`, using numpy and
macOS's `afconvert`. It's released under the same MIT License as Nostalgify. To regenerate it:

```sh
python3 scripts/make-demo-track.py
```

## Skins

The page doesn't host any skins. It streams them from the Winamp Skin Museum, falling back to the Internet
Archive. Credits are in the app's [THIRD_PARTY_NOTICES.md](https://github.com/0xchaosbi/nostalgify/blob/main/THIRD_PARTY_NOTICES.md).
