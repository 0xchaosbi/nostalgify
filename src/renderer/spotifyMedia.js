// Webamp normally owns audio playback through its Media class. This replacement
// plays nothing. It relays Webamp's transport and volume to Spotify and reports
// Spotify's position back so the time display and seek bar stay correct.
import { createFakeVis } from "./fakeVis.js";

export const bridge = {
  media: null,
  quiet: 0, // while > 0, Webamp state changes come from Spotify and must not echo back
};

export function quietly(fn) {
  bridge.quiet++;
  try {
    return fn();
  } finally {
    bridge.quiet--;
  }
}

export class SpotifyMedia {
  constructor() {
    this._handlers = {};
    this._elapsed = 0;
    this._duration = 0;
    this._volumeReady = false; // ignore Webamp's default volume until we've read Spotify's
    this.lastUserVolumeAt = 0;
    this._vis = createFakeVis();
    bridge.media = this;
  }

  on(event, cb) {
    (this._handlers[event] ||= []).push(cb);
  }
  emit(event) {
    (this._handlers[event] || []).forEach((cb) => cb());
  }

  // Called by the sync loop.
  setTiming(elapsed, duration) {
    this._elapsed = elapsed;
    this._duration = duration;
    this.emit("timeupdate");
  }
  setVisPlaying(on) {
    this._vis.setPlaying(on);
  }
  markVolumeReady() {
    this._volumeReady = true;
  }

  timeElapsed() {
    return this._elapsed;
  }
  duration() {
    return this._duration;
  }
  timeRemaining() {
    return Math.max(0, this._duration - this._elapsed);
  }
  percentComplete() {
    return this._duration ? (this._elapsed / this._duration) * 100 : 0;
  }

  async play() {
    this._vis.setPlaying(true);
    if (!bridge.quiet) window.nostalgify.command("play");
  }
  pause() {
    this._vis.setPlaying(false);
    if (!bridge.quiet) window.nostalgify.command("pause");
  }
  stop() {
    // Spotify has no "stop", so pause and rewind like Winamp does.
    this._vis.setPlaying(false);
    if (!bridge.quiet) {
      window.nostalgify.command("pause");
      window.nostalgify.command("seek", 0);
      this.setTiming(0, this._duration);
    }
  }
  seekToPercentComplete(percent) {
    this.seekToTime((percent / 100) * this._duration);
  }
  seekToTime(seconds) {
    this.setTiming(seconds, this._duration);
    if (!bridge.quiet) window.nostalgify.command("seek", seconds);
  }
  setVolume(volume) {
    if (!this._volumeReady || bridge.quiet) return;
    this.lastUserVolumeAt = performance.now();
    window.nostalgify.command("volume", volume);
  }

  // Track changes always originate from Spotify, so loading just tells Webamp
  // the "file" is ready. Duration was set beforehand by the sync loop.
  async loadFromUrl(url, autoPlay) {
    // Shelf entries aren't songs. Playing one is handled by the shelf.
    if (String(url).startsWith("shelf:")) return;
    this.emit("fileLoaded");
    if (autoPlay) this.emit("playing");
  }

  // Balance, preamp and EQ can't affect Spotify's audio. They stay cosmetic.
  setBalance() {}
  setPreamp() {}
  setEqBand() {}
  disableEq() {}
  enableEq() {}

  getAnalyser() {
    return this._vis.analyser;
  }
  dispose() {}
}
