import React from "react";
import { startCarPreview } from "../session/carPreview.js";
export function CarPreview({ car }) {
  const containerRef = React.useRef(null);
  React.useEffect(() => startCarPreview(containerRef.current, car), [car.id]);
  return <div ref={containerRef} className="absolute inset-0" aria-label={`Aperçu 3D de ${car.name}`} />;
}
