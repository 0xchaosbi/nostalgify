# Changelog

All notable changes to Nostalgify are listed here. Versions follow [Semantic Versioning](https://semver.org/).

## [0.1.0] - Unreleased

First public version.

### Added

- Classic Winamp 2 skins (`.wsz`) as a remote control for the Spotify desktop app on macOS.
- Skins folder at `~/Music/Nostalgify/Skins` that updates the Skins menu live, plus Cmd+R for a random skin.
- Three starter skins downloaded on first launch.
- Play, pause, stop, previous, next, seek, volume, shuffle and repeat, all mirrored from Spotify.
- Spotify launches hidden and stays hidden.
- Eject opens Spotify to pick music, then hides it and returns to Nostalgify once the song changes.
- Play starts your Liked Songs when Spotify has nothing loaded.
- Proportional resizing by dragging, and Cmd+1, 2 and 3 for fixed sizes.
- Decorative equalizer, shown only for skins that include equalizer artwork.
- Winamp keyboard shortcuts: Z, X, C, V, B and arrow keys.
- A shelf in Winamp's playlist window: drag, paste or ADD → URL Spotify playlists, albums, artists and songs, then
  double-click to play. Liked Songs is always on it. Names come from Spotify's public link lookup, with no login.
- `npm run install-app` builds Nostalgify and installs it into Applications.
- Log file at `~/Library/Application Support/Nostalgify/nostalgify.log`.
