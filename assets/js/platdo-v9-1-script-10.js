
/* PLATDO V2.1 — even frame pacing.
 * A frame-rate cap that is not a whole fraction of the display's refresh rate makes frames land at
 * uneven intervals: 60 on a 144 Hz screen alternates between two and three refreshes, which reads as
 * random frame drops even when the game has time to spare. A game asks due(key, now, cap) once per
 * animation frame and gets true on every n-th refresh, where n is the whole number of refreshes
 * closest to the cap, so every drawn frame stays on screen for the same time. */
(function (root) {
  'use strict';
  if (root.PlatdoPacing) return;
  const loops = new Map(), samples = [], common = [30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 180, 200, 240, 360];
  let lastTick = 0, refresh = 0;
  function observe(now) {
    if (now === lastTick) return;
    const d = now - lastTick; lastTick = now;
    if (!(d > 2.5 && d < 50)) return;
    samples.push(d); if (samples.length > 120) samples.shift();
    if (samples.length < 24 || (refresh && samples.length % 12)) return;
    // The quicker quarter of recent frames is the display's own rhythm; slow frames are the game's.
    const sorted = samples.slice().sort((a, b) => a - b), measured = 1000 / sorted[Math.floor(sorted.length * .25)];
    let best = measured, error = Infinity;
    for (const hz of common) { const e = Math.abs(hz - measured) / hz; if (e < .045 && e < error) { best = hz; error = e; } }
    refresh = 1000 / best;
  }
  const interval = () => refresh || 1000 / 60;
  const every = cap => Math.max(1, Math.round(1000 / Math.max(1, Number(cap) || 60) / interval()));
  function due(key, now, cap) {
    observe(now);
    let s = loops.get(key); if (!s) { s = { last: -1e9 }; loops.set(key, s); }
    if ((now - s.last) / interval() + .35 >= every(cap)) { s.last = now; return true; }
    return false;
  }
  root.PlatdoPacing = { due, every, interval, frameTime: cap => every(cap) * interval(), refreshRate: () => Math.round(1000 / interval()), measured: () => !!refresh };
})(typeof globalThis !== 'undefined' ? globalThis : this);
