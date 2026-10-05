export function loadProgress() {
  const e = {
    credits: 0,
    best: 0,
    car: "sakura",
    engine: "V6",
    cars: ["sakura", "outlaw", "spectre", "titan"],
    engines: ["V6", "V8", "V12", "W16"],
  };
  try {
    const t = JSON.parse(localStorage.getItem("nightshift-progress") || "{}");
    const n = {
      ...e,
      ...t,
    };
    n.cars = Array.from(new Set([...e.cars, ...(n.cars || [])]));
    n.engines = Array.from(new Set([...e.engines, ...(n.engines || [])]));
    return n;
  } catch {
    return e;
  }
}
export function saveProgress(e) {
  localStorage.setItem("nightshift-progress", JSON.stringify(e));
}
