import React from "react";
import { startCarPreview } from "../session/carPreview.js";
export function CarPreview({ car: e }) {
  const t = React.useRef(null);
  React.useEffect(() => {
    return startCarPreview(t.current, e);
  }, [e.id]);
  return (
    <div
      ref={t}
      className="absolute inset-0"
      aria-label={`Aperçu 3D de ${e.name}`}
    />
  );
}
