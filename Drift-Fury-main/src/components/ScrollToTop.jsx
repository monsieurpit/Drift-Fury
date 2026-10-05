import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const decodeHashTarget = (hash) => {
  const id = hash.slice(1);
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
};

/** On navigation, scrolls to the #hash target if there is one, otherwise to the top. */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Back/forward navigation keeps the browser's own scroll restoration.
    if (navigationType === "POP") return;
    if (hash) {
      const targetId = decodeHashTarget(hash);
      const timer = window.setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, navigationType]);

  return null;
}
