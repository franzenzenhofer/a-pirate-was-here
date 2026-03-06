/** Generate 2D noise map using value noise with octaves */
export function makeNoise(
  rng: () => number,
  w: number,
  h: number,
  octaves: number,
): Float32Array {
  const grids: Array<{ g: Float32Array; gw: number; sc: number }> = [];

  for (let o = 0; o < octaves; o++) {
    const sc = Math.pow(2, o + 2);
    const gw = Math.ceil(w / sc) + 2;
    const gh = Math.ceil(h / sc) + 2;
    const g = new Float32Array(gw * gh);
    for (let i = 0; i < g.length; i++) g[i] = rng();
    grids.push({ g, gw, sc });
  }

  const out = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      let amp = 1;
      let tot = 0;

      for (let o = 0; o < octaves; o++) {
        const { g, gw, sc } = grids[o]!;
        const fx = x / sc;
        const fy = y / sc;
        const ix = ~~fx;
        const iy = ~~fy;
        const tx = fx - ix;
        const ty = fy - iy;
        const sx = tx * tx * (3 - 2 * tx);
        const sy = ty * ty * (3 - 2 * ty);
        const a00 = g[iy * gw + ix] ?? 0;
        const a10 = g[iy * gw + ix + 1] ?? 0;
        const a01 = g[(iy + 1) * gw + ix] ?? 0;
        const a11 = g[(iy + 1) * gw + ix + 1] ?? 0;
        v += (a00 + (a10 - a00) * sx + (a01 - a00 + (a00 - a10 + a11 - a01) * sx) * sy) * amp;
        tot += amp;
        amp *= 0.5;
      }

      out[y * w + x] = v / tot;
    }
  }

  return out;
}
