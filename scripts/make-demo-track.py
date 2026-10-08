"""Composes the website's demo song, "Dial-Up Dreams": an original 8-bit loop.

Writes audio/dial-up-dreams.m4a using numpy and macOS's afconvert.
Run: python3 scripts/make-demo-track.py
"""
import os
import subprocess
import tempfile
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 44100
BPM = 128
BEAT = 60 / BPM
STEP = BEAT / 4  # sixteenth notes


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def pulse(freq, dur, duty=0.25):
    t = np.arange(int(dur * SR)) / SR
    return np.where((t * freq) % 1 < duty, 1.0, -1.0)


def triangle(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    return 2 * np.abs(2 * ((t * freq) % 1) - 1) - 1


def env(n, attack=0.005, release=0.06):
    e = np.ones(n)
    a = max(1, int(attack * SR))
    r = max(1, min(n, int(release * SR)))
    e[:a] = np.linspace(0, 1, a)
    e[-r:] *= np.linspace(1, 0, r)
    return e


def kick():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    f = 150 * np.exp(-t * 18) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def noise(dur, decay):
    n = int(dur * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(7)
    # 8-bit style noise: hold each random value for a few samples.
    raw = np.repeat(rng.uniform(-1, 1, n // 4 + 1), 4)[:n]
    return raw * np.exp(-t * decay)


def place(buf, sound, at, gain):
    i = int(at * SR)
    j = min(len(buf), i + len(sound))
    buf[i:j] += sound[: j - i] * gain


def main():
    # Am - F - C - G, twice, then a variation with the lead an octave up.
    chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
    bars = 16
    total = bars * 4 * BEAT
    mix = np.zeros(int(total * SR) + SR)

    melody = [76, None, 72, 74, 76, None, 79, None, 77, 76, 74, None, 72, None, 74, 76]
    for bar in range(bars):
        chord = chords[bar % 4]
        t0 = bar * 4 * BEAT
        # Arpeggio on every sixteenth.
        for s in range(16):
            note = chord[s % 3] + (12 if s % 6 >= 3 else 0)
            sound = pulse(midi(note), STEP * 0.9, duty=0.125)
            place(mix, sound * env(len(sound), release=0.03), t0 + s * STEP, 0.06)
        # Bass on eighths, root and octave.
        for s in range(8):
            note = chord[0] - 24 + (12 if s % 2 else 0)
            sound = triangle(midi(note), BEAT / 2 * 0.95)
            place(mix, sound * env(len(sound)), t0 + s * BEAT / 2, 0.22)
        # Drums: kick on 1 and 3, snare on 2 and 4, hats on offbeats.
        for b in range(4):
            if b % 2 == 0:
                place(mix, kick(), t0 + b * BEAT, 0.5)
            else:
                place(mix, noise(0.18, 22), t0 + b * BEAT, 0.22)
            place(mix, noise(0.05, 80), t0 + b * BEAT + BEAT / 2, 0.08)
        # Lead melody from bar 5: eight eighth-notes per bar, a two-bar phrase.
        if bar >= 4:
            up = 12 if bar >= 12 else 0
            half = melody[(bar % 2) * 8 : (bar % 2) * 8 + 8]
            for i, note in enumerate(half):
                if note is None:
                    continue
                dur = BEAT / 2 * 0.9
                sound = pulse(midi(note + up - 12), dur, duty=0.5)
                place(mix, sound * env(len(sound), release=0.05), t0 + i * BEAT / 2, 0.07)

    mix = mix[: int(total * SR)]
    fade = int(1.5 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix /= max(1e-9, np.max(np.abs(mix))) / 0.85
    pcm = (mix * 32767).astype("<i2")

    out_dir = os.path.join(ROOT, "audio")
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, "dial-up-dreams.m4a")
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "track.wav")
        with wave.open(wav, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "128000", wav, out], check=True)
    print(f"wrote {os.path.relpath(out, ROOT)} ({total:.1f}s)")


if __name__ == "__main__":
    main()
