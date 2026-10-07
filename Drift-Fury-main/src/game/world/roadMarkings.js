import { useWorldVarying } from "../render/worldVarying.js";
// Road markings painted in the road's own shader instead of modelled as thin strips of geometry.
//
// A 15 cm line a few centimetres above the asphalt is thinner than a pixel a few dozen metres away: from one
// frame to the next it is either hit by a pixel or missed, so distant lines blink and break up as the
// camera moves, and their tops fight the road for depth. Here each marking is a rectangle in world
// coordinates, and every pixel of the road computes how much of its own footprint each rectangle covers
// (an exact box filter, from the pixel's size on the ground). Close up the edges are crisp; far away a
// line fades smoothly into the asphalt instead of blinking, exactly like a mipmapped texture would. And
// there is nothing to fight over depth, or to draw separately.
//
// The layout is the city's: yellow centre dashes between intersections, zebra crossings and stop lines on
// every approach (the same positions the geometry used to have).

const PAINT_WHITE = "vec3(0.776, 0.765, 0.69)"; // #e4e2d6 in linear
const PAINT_YELLOW = "vec3(0.69, 0.456, 0.045)"; // #d9b43c in linear

function glslArray(values) {
  return values.map((value) => value.toFixed(2)).join(", ");
}

/**
 * Adds the markings to the city road material (after makeWet: the paint sheds most of the wetness).
 * `roadXs` / `roadZs` are the avenue and street centre lines.
 */
export function addRoadMarkings(material, { roadXs, roadZs }) {
  const nx = roadXs.length;
  const nz = roadZs.length;
  const declarations = /* glsl */ `
const float ROAD_XS[${nx}] = float[${nx}](${glslArray(roadXs)});
const float ROAD_ZS[${nz}] = float[${nz}](${glslArray(roadZs)});
float roadPaint;
vec3 roadPaintColor;
// Fraction of the pixel footprint [x - w/2, x + w/2] inside [a, b].
float paintCover(float x, float a, float b, float w) {
  return clamp((min(b, x + 0.5 * w) - max(a, x - 0.5 * w)) / w, 0.0, 1.0);
}
// Dashes of length 'len' every 'period' from 'start' to 'end', along a coordinate with footprint w.
float paintDashes(float x, float start, float end, float len, float period, float w) {
  float local = x - start;
  float phase = local - period * floor(local / period);
  float dash = paintCover(phase, 0.0, len, w) + paintCover(phase, period, period + len, w);
  // Seen from far enough away the dashes average out to their duty cycle.
  dash = mix(dash, len / period, smoothstep(1.5, 4.0, w));
  return dash * paintCover(x, start, end, w);
}
// Markings of a road running along 'along' (centre line at 'across' == centre), with the cross roads at
// 'crossings'. Writes white and yellow coverage.
void paintRoad(float across, float along, float centre, float wAcross, float wAlong, float crossings[${nz > nx ? nz : nx}], int count, inout float white, inout float yellow) {
  float offset = across - centre;
  if (abs(offset) > 9.5) return;
  for (int k = 0; k < count; k++) {
    float c = crossings[k];
    // Centre dashes up to the next crossing: 5 m dashes every 9 m, 17 m clear of each intersection.
    if (k + 1 < count) {
      float start = c + 17.0;
      float last = start + floor((crossings[k + 1] - 17.0 - start - 5.0) / 9.0) * 9.0 + 5.0;
      yellow += paintCover(offset, -0.075, 0.075, wAcross) * paintDashes(along, start, last, 5.0, 9.0, wAlong);
    }
    for (int side = -1; side <= 1; side += 2) {
      int neighbour = k + side;
      if (neighbour < 0 || neighbour >= count) continue;
      float s = float(side);
      // Zebra crossing: seven 0.75 m stripes, 2.1 m apart, 2.6 m deep, 11.5 m from the intersection centre.
      float crossing = c + s * 11.5;
      float band = paintCover(along, crossing - 1.3, crossing + 1.3, wAlong);
      if (band > 0.0) {
        float stripes = 0.0;
        for (int stripe = -3; stripe <= 3; stripe++) {
          float centreOfStripe = float(stripe) * 2.1;
          stripes += paintCover(offset, centreOfStripe - 0.375, centreOfStripe + 0.375, wAcross);
        }
        white += band * stripes;
      }
      // Stop line, 15.5 m from the centre, across the whole road.
      float stop = c + s * 15.5;
      white += paintCover(along, stop - 0.1, stop + 0.1, wAlong) * paintCover(offset, -4.5, 4.5, wAcross);
    }
  }
}
`;
  const crossingsLength = nz > nx ? nz : nx;
  const pad = (values) => {
    const padded = [...values];
    while (padded.length < crossingsLength) padded.push(0);
    return padded;
  };
  const paint = /* glsl */ `
{
  vec2 p = vMarkWorld.xz;
  // The pixel's footprint on the ground along each axis (grows with distance and grazing angle).
  float wx = max(fwidth(p.x), 1e-3);
  float wz = max(fwidth(p.y), 1e-3);
  float white = 0.0;
  float yellow = 0.0;
  float zs[${crossingsLength}] = float[${crossingsLength}](${glslArray(pad(roadZs))});
  float xs[${crossingsLength}] = float[${crossingsLength}](${glslArray(pad(roadXs))});
  // Avenues (running along z) and streets (running along x); intersections themselves stay unpainted.
  for (int i = 0; i < ${nx}; i++) paintRoad(p.x, p.y, ROAD_XS[i], wx, wz, zs, ${nz}, white, yellow);
  for (int j = 0; j < ${nz}; j++) paintRoad(p.y, p.x, ROAD_ZS[j], wz, wx, xs, ${nx}, white, yellow);
  white = clamp(white, 0.0, 1.0);
  yellow = clamp(yellow, 0.0, 1.0 - white);
  roadPaint = white + yellow;
  roadPaintColor = (white * ${PAINT_WHITE} + yellow * ${PAINT_YELLOW}) / max(roadPaint, 1e-4);
  // Paint sits on top of the water film's pores: only a light sheen of wetness on it.
  diffuseColor.rgb = mix(diffuseColor.rgb, roadPaintColor * 0.9, roadPaint);
  wetness *= 1.0 - 0.6 * roadPaint;
  wetPuddle *= 1.0 - roadPaint;
}
#include <roughnessmap_fragment>
`;
  const previous = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    previous?.call(material, shader, renderer);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\n" + declarations)
      .replace("#include <roughnessmap_fragment>", paint)
      .replace(
        "#include <emissivemap_fragment>",
        // A little self-lighting so markings stay readable in the dark between lamps, as before.
        "#include <emissivemap_fragment>\ntotalEmissiveRadiance += roadPaintColor * roadPaint * 0.05;",
      );
    useWorldVarying(shader, "vMarkWorld");
  };
  const key = material.customProgramCacheKey?.() ?? "";
  material.customProgramCacheKey = () => key + "|road-markings";
  material.needsUpdate = true;
  return material;
}
