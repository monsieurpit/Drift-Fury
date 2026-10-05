import { useLocation, useNavigationType } from "react-router-dom";
import React from "react";
const decodeHashTarget = (e) => {
  const t = e.slice(1);
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
};
export function ScrollToTop() {
  const { pathname: e, hash: t } = useLocation();
  const n = useNavigationType();
  React.useEffect(() => {
    if (n !== "POP") {
      if (t) {
        const e = decodeHashTarget(t);
        const n = window.setTimeout(() => {
          document.getElementById(e)?.scrollIntoView({
            behavior: "smooth",
          });
        }, 50);
        return () => {
          return window.clearTimeout(n);
        };
      }
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    }
  }, [e, t, n]);
  return null;
}
