import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";
export function cn(...e) {
  return twMerge(clsx(e));
}
