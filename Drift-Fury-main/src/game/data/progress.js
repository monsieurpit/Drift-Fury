export function loadProgress() {
  const defaults = {
    credits: 0,
    best: 0,
    car: "sakura",
    engine: "V6",
    cars: ["sakura", "outlaw", "spectre", "titan"],
    engines: ["V6", "V8", "V12", "W16"],
  };
  try {
    const saved = JSON.parse(localStorage.getItem("nightshift-progress") || "{}");
    const progress = {
      ...defaults,
      ...saved,
    };
    progress.cars = Array.from(new Set([...defaults.cars, ...(progress.cars || [])]));
    progress.engines = Array.from(new Set([...defaults.engines, ...(progress.engines || [])]));
    return progress;
  } catch {
    return defaults;
  }
}
export function saveProgress(progress) {
  localStorage.setItem("nightshift-progress", JSON.stringify(progress));
}
