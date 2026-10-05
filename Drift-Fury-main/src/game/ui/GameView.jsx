import React from "react";
import { startGameSession } from "../session/startGameSession.js";
export function GameView({
  car: e,
  engine: t,
  controls: n,
  onHud: r,
  onFinish: i,
  onStation: a,
  onPause: o,
  noPolice: s,
}) {
  const c = React.useRef(null);
  const l = React.useRef(null);
  const u = React.useRef({
    onHud: r,
    onFinish: i,
    onStation: a,
    onPause: o,
  });
  u.current = {
    onHud: r,
    onFinish: i,
    onStation: a,
    onPause: o,
  };
  React.useEffect(() => {
    l.current = startGameSession(c.current, e, t, n, u, s);
    return () => {
      return l.current.dispose();
    };
  }, []);
  React.useEffect(() => {
    l.current?.setCar(e);
  }, [e.id]);
  return <div ref={c} className="absolute inset-0" />;
}
