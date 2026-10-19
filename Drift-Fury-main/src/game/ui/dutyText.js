import { t } from "../../i18n.js";

const NESTED = /^(charge|rank|strike|flag|call|cite)\./;

/** A police job message (policeDuty.js): its key, with the keys among its values translated too. */
export function dutyText(key, vars = {}) {
  const resolved = {};
  for (const [name, value] of Object.entries(vars || {})) {
    if (Array.isArray(value)) resolved[name] = value.map((v) => (typeof v === "string" && NESTED.test(v) ? t(v) : v)).join(", ");
    else resolved[name] = typeof value === "string" && NESTED.test(value) ? t(value) : value;
  }
  return t(key, resolved);
}
