import { Group, Mesh, CylinderGeometry } from "three";
import { buildLatheGeometry, buildPrismGeometry } from "./carGeometry.js";
import { smoothProfile } from "./carMath.js";
/* ---------------------------------------------------------------- wheel */
export function buildWheel(mats, o) {
  const g = new Group();
  const R = o.R;
  const tw = o.tw;
  const hw_ = tw / 2;
  const rimR = R * 0.66;
  // tyre
  const tp = smoothProfile(
    [
      [-hw_ * 0.86, rimR - 0.004],
      [-hw_ * 0.98, rimR + 0.035],
      [-hw_ * 1, R * 0.84],
      [-hw_ * 0.93, R * 0.955],
      [-hw_ * 0.78, R * 0.993],
      [-hw_ * 0.5, R],
      [-hw_ * 0.17, R * 0.995],
      [-hw_ * 0.1, R * 0.985],
      [hw_ * 0.1, R * 0.985],
      [hw_ * 0.17, R * 0.995],
      [hw_ * 0.5, R],
      [hw_ * 0.78, R * 0.993],
      [hw_ * 0.93, R * 0.955],
      [hw_ * 1, R * 0.84],
      [hw_ * 0.98, rimR + 0.035],
      [hw_ * 0.86, rimR - 0.004],
    ],
    1,
  );
  const tyre = new Mesh(buildLatheGeometry(tp, o.seg), mats.rubber);
  tyre.castShadow = true;
  g.add(tyre);
  // rim barrel + lip
  const xo = hw_ * 0.9;
  // outside lip surface + face (dish)
  const face = smoothProfile(
    [
      [xo * 0.98, rimR + 0.002],
      [xo * 0.93, rimR - 0.012],
      [xo * 0.78, rimR - 0.035],
      [xo * 0.5, rimR * 0.72],
      [xo * 0.42, rimR * 0.5],
      [xo * 0.5, rimR * 0.26],
      [xo * 0.62, rimR * 0.13],
      [xo * 0.66, 0],
    ],
    1,
  );
  const rim = new Mesh(buildLatheGeometry(face, o.seg), mats.rim);
  g.add(rim);
  // inner barrel (dark, seen through the spokes)
  const barrel = new Mesh(
    buildLatheGeometry(
      [
        [xo * 0.93, rimR - 0.012],
        [xo * 0.1, rimR - 0.052],
        [-xo * 0.85, rimR - 0.05],
        [-xo * 0.95, rimR - 0.01],
      ],
      o.seg,
    ),
    mats.dark,
  );
  g.add(barrel);
  // spokes (double spokes)
  const n = o.spokes;
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2;
    for (const side of [-1, 1]) {
      const ph = a0 + side * 0.105 * (6 / n);
      const poly = [
        [rimR * 0.17, -0.021],
        [rimR * 0.17, 0.021],
        [rimR * 0.93, 0.014 * 1],
        [rimR * 0.93, -0.014],
      ];
      g.add(new Mesh(buildPrismGeometry(poly, xo * 0.56, xo * 0.78, ph), mats.rim));
    }
  }
  // centre cap and lugs
  const cap = new Mesh(
    buildLatheGeometry(
      [
        [xo * 0.6, 0],
        [xo * 0.74, rimR * 0.06],
        [xo * 0.76, rimR * 0.15],
        [xo * 0.68, rimR * 0.2],
        [xo * 0.6, rimR * 0.2],
      ],
      20,
    ),
    mats.chrome,
  );
  g.add(cap);
  for (let k = 0; k < 5; k++) {
    const th = (k / 5) * Math.PI * 2;
    const lug = new Mesh(new CylinderGeometry(0.011, 0.011, 0.02, 6), mats.dark);
    lug.rotation.z = Math.PI / 2;
    lug.position.set(xo * 0.66, Math.sin(th) * rimR * 0.27, Math.cos(th) * rimR * 0.27);
    g.add(lug);
  }
  // brake disc + caliper behind the spokes
  const disc = new Mesh(
    buildLatheGeometry(
      [
        [xo * 0.12, rimR * 0.84],
        [xo * 0.16, rimR * 0.86],
        [xo * 0.16, rimR * 0.5],
        [xo * 0.12, rimR * 0.5],
      ],
      o.seg,
    ),
    mats.rotor,
  );
  g.add(disc);
  const cal = [
    [rimR * 0.5, -0.075],
    [rimR * 0.84, -0.07],
    [rimR * 0.84, 0.07],
    [rimR * 0.5, 0.075],
  ];
  g.add(new Mesh(buildPrismGeometry(cal, xo * 0.08, xo * 0.4, o.calAng), mats.caliper));
  return g;
}
