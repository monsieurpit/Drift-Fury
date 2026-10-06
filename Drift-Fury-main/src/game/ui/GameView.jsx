import React from "react";
import { startGameSession } from "../session/startGameSession.js";
export function GameView({
  car,
  engine,
  controls,
  onHud,
  onFinish,
  onStation,
  onPause,
  onLoading,
  onReady,
  onLoadError,
  onGraphicsFailure,
  noPolice,
}) {
  const containerRef = React.useRef(null);
  const sessionRef = React.useRef(null);
  const callbacksRef = React.useRef({
    onHud,
    onFinish,
    onStation,
    onPause,
    onLoading,
    onReady,
    onLoadError,
    onGraphicsFailure,
  });
  callbacksRef.current = {
    onHud,
    onFinish,
    onStation,
    onPause,
    onLoading,
    onReady,
    onLoadError,
    onGraphicsFailure,
  };
  React.useEffect(() => {
    sessionRef.current = startGameSession(
      containerRef.current,
      car,
      engine,
      controls,
      callbacksRef,
      noPolice,
    );
    return () => sessionRef.current.dispose();
  }, []);
  React.useEffect(() => {
    sessionRef.current?.setCar(car);
  }, [car.id]);
  return <div ref={containerRef} className="absolute inset-0" />;
}
