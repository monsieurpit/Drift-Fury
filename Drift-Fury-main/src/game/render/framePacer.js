// Adaptive frame pacing.
//
// A frame rate that jumps between 35 and 60 feels worse than a steady 40: every uneven frame is a visible
// hitch in the motion. The pacer measures the screen's refresh rate and how long this device really takes
// per frame (average, worst frames and how much they vary), then picks the highest frame rate it can hold
// steadily, from the rates that divide the refresh rate evenly so every frame stays on screen for the same
// time: 60 or 30 on a 60 Hz screen; 120, 60 or 40 on a 120 Hz Mac; 144, 72, 48 or 36 at 144 Hz. It keeps
// measuring: if frames start missing (a heavier part of the map), it steps down; when there has been
// headroom for a while, it tries the next rate up, and backs off for longer each time a try fails.

const COMMON_RATES = [30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 170, 180, 200, 240];
const WINDOW_MS = 1500;

export function createFramePacer({ minFps = 30 } = {}) {
  let refreshMs = 1000 / 60;
  let divisor = 1; // render every `divisor`-th screen refresh
  let lastTick = -1;
  let lastRender = -1;
  let skippedLast = false;
  const refreshSamples = [];
  // The current measuring window.
  let windowStart = -1;
  const intervals = [];
  // Stepping up: windows with headroom needed before trying a faster rate, and the probe in progress.
  let calmWindows = 0;
  let calmNeeded = 2;
  let stableWindows = 0;
  let probing = false;
  let probeFrom = 1;
  let overloaded = false;
  let measuredFps = 0;
  let jitter = 0;

  const targetMs = () => refreshMs * divisor;
  const maxDivisor = () => Math.max(1, Math.floor(1000 / minFps / refreshMs + 0.01));

  function noteRefresh(delta) {
    // Intervals between callbacks right after a skipped (free) one are the screen's refresh interval.
    refreshSamples.push(delta);
    if (refreshSamples.length > 90) refreshSamples.shift();
    if (refreshSamples.length < 20) return;
    const sorted = [...refreshSamples].sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    let hz = 1000 / median;
    const snapped = COMMON_RATES.find((rate) => Math.abs(rate - hz) / rate < 0.04);
    if (snapped) hz = snapped;
    const next = 1000 / hz;
    if (Math.abs(next - refreshMs) / refreshMs > 0.03) {
      // Keep the same frame rate as close as possible on the new refresh rate.
      const fps = 1000 / targetMs();
      refreshMs = next;
      divisor = Math.min(maxDivisor(), Math.max(1, Math.round(1000 / fps / refreshMs)));
    }
  }

  function closeWindow() {
    if (intervals.length < 8) return;
    const sorted = [...intervals].sort((a, b) => a - b);
    const mean = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
    const variance = intervals.reduce((sum, value) => sum + (value - mean) ** 2, 0) / intervals.length;
    jitter = Math.sqrt(variance) / mean;
    measuredFps = 1000 / mean;
    const budget = targetMs();
    // A frame "misses" when it stays up for at least one extra refresh beyond its slot.
    const missed = intervals.filter((value) => value > budget + refreshMs * 0.5).length / intervals.length;
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    const struggling = missed > 0.08 || jitter > 0.22 || p90 > budget * 1.45;
    const comfortable = missed < 0.02 && jitter < 0.1;
    if (probing) {
      probing = false;
      // A faster rate is only kept if it holds nearly cleanly; borderline is worse than steady-slower.
      if (struggling || missed > 0.04 || jitter > 0.15) {
        // The faster rate did not hold: go back, and wait longer before the next try.
        divisor = probeFrom;
        calmNeeded = Math.min(40, calmNeeded * 2);
        calmWindows = 0;
        return;
      }
      stableWindows = 0;
    }
    if (struggling) {
      calmWindows = 0;
      stableWindows = 0;
      if (divisor < maxDivisor()) {
        divisor++;
        // Each drop makes the next try at a faster rate wait longer (no flip-flopping between two rates).
        calmNeeded = Math.min(40, calmNeeded * 2);
        overloaded = false;
      } else {
        overloaded = true; // even the slowest steady rate is missed: the renderer should do less
      }
      return;
    }
    overloaded = false;
    // Long stable stretches earn back quicker retries.
    if (++stableWindows >= 10) {
      stableWindows = 0;
      calmNeeded = Math.max(2, calmNeeded / 2);
    }
    if (comfortable && divisor > 1) {
      calmWindows++;
      if (calmWindows >= calmNeeded) {
        calmWindows = 0;
        probing = true;
        probeFrom = divisor;
        divisor--;
      }
    } else {
      calmWindows = 0;
    }
  }

  return {
    /**
     * Call at the top of every requestAnimationFrame callback: true when this refresh should be rendered,
     * false to skip it (keep the frame on screen one more refresh).
     */
    tick(time) {
      if (lastTick >= 0) {
        const delta = time - lastTick;
        if (skippedLast && delta > 2 && delta < 60) noteRefresh(delta);
      }
      lastTick = time;
      if (lastRender >= 0) {
        const since = time - lastRender;
        // Half a refresh of slack: rAF timestamps wobble around the vsync.
        if (since < targetMs() - refreshMs * 0.5) {
          skippedLast = true;
          return false;
        }
        if (since < 1000) {
          intervals.push(since);
          if (windowStart < 0) windowStart = time;
        }
      }
      skippedLast = false;
      lastRender = time;
      if (windowStart >= 0 && time - windowStart >= WINDOW_MS) {
        closeWindow();
        intervals.length = 0;
        windowStart = time;
      }
      return true;
    },
    /** Starts over (after a pause, a hidden tab or a quality change, when old timings mean nothing). */
    reset() {
      lastRender = -1;
      windowStart = -1;
      intervals.length = 0;
      probing = false;
      calmWindows = 0;
    },
    /** Measures the refresh rate from a few idle callbacks (before the session starts rendering). */
    calibrate(deltas) {
      for (const delta of deltas) if (delta > 2 && delta < 60) noteRefresh(delta);
    },
    get targetFps() {
      return 1000 / targetMs();
    },
    get refreshHz() {
      return 1000 / refreshMs;
    },
    get fps() {
      return measuredFps;
    },
    get jitter() {
      return jitter;
    },
    /** True while even the slowest steady rate is missed (time to lower the resolution). */
    get overloaded() {
      return overloaded;
    },
  };
}
