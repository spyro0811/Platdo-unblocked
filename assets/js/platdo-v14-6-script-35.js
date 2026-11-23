
/* PlatdoCarBody: sculpted car bodies shared by Platdo City and Platdo Drive. Metres, +Z forward, ground at y = 0.
 *
 * A body is one continuous surface. `s` runs round half a cross-section: 0 is the top centre, .30 the roof rail
 * (or the fender edge where there is no roof), .48 the window sill and 1 the underside of the rocker; it is
 * negative on the left. `q` runs along the car: 0..1 through the straight part, 1..2 round the front fillet and
 * -1..0 round the rear one. Each end is closed by a face whose own (u, v) grid follows the same outline.
 *
 * build(spec) returns pieces {part, role, shape}: the caller decides which material each role gets and which
 * parts are separate objects (doors, hood, bumpers ...). Nothing here knows about game state. */
(function (root) {
  'use strict';
  const T = root.THREE, F = root.PlatdoForge; if (!T || !F) return;
  const clamp = F.clamp, mix = F.mix, smooth = F.smooth, TAU = F.TAU;
  const KNOTS = [0, .10, .20, .27, .30, .36, .42, .48, .53, .62, .74, .86, .94, 1];
  const ROWS = [0, .05, .10, .15, .20, .24, .27, .30, .33, .36, .39, .42, .45, .48, .505, .53, .575, .62, .68, .74, .80, .86, .90, .94, .97, 1];
  const RAIL = .30, SILL = .48, KEEP = new Set([0, .10, .20, .27, .30, .36, .42, .48, .53, .62, .74, .86, .94, 1]);

  // Smooth curve through (s, value) pairs with uneven spacing.
  function hermite(S, V, s) {
    const n = S.length; let i = 0; while (i < n - 2 && s > S[i + 1]) i++;
    const s1 = S[i], s2 = S[i + 1], h = s2 - s1, t = clamp((s - s1) / h, 0, 1), t2 = t * t, t3 = t2 * t;
    const m1 = i > 0 ? (V[i + 1] - V[i - 1]) / (S[i + 1] - S[i - 1]) * h : (V[i + 1] - V[i]);
    const m2 = i < n - 2 ? (V[i + 2] - V[i]) / (S[i + 2] - S[i]) * h : (V[i + 1] - V[i]);
    return (2 * t3 - 3 * t2 + 1) * V[i] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * V[i + 1] + (t3 - t2) * m2;
  }

  const DEFAULTS = {
    taperF: .93, taperR: .95, flare: .022, roofCrown: .05, hoodCrown: .035, hoodCurve: 1.5, wsBow: .02, roofBow: .018, blBow: .012,
    noseDepth: .30, tailDepth: .24, faceWF: .84, faceWR: .88, sweepF: .10, sweepR: .06, bulgeF: .03, bulgeR: .02, wedge: 0,
    sill: .955, glassBow: .012, open: false, bay: .11, doors: true, detail: 5
  };

  function build(input) {
    const d = { ...DEFAULTS, ...input }, L = d.L, W = d.W, zF1 = L / 2 - d.noseDepth, zR0 = -L / 2 + d.tailDepth;
    const zCowl = Math.min(d.zCowl, zF1 - .35), zRoofF = Math.min(d.zRoofF, zCowl - .12), zRoofR = Math.min(Math.max(d.zRoofR, zR0), zRoofF - .03), zDeck = Math.min(d.zDeck, zRoofR - .03);
    const pieces = new Map(), shapeOf = (part, role) => { const key = part + '|' + role; let e = pieces.get(key); if (!e) pieces.set(key, e = { part, role, shape: new F.Shape() }); return e.shape; };
    const detail = clamp(Math.round(d.detail), 1, 5), dens = [0, .34, .5, .66, .82, 1][detail], seg = (n, min = 3) => Math.max(min, Math.round(n * dens));

    // ---- the frame at a station: every height and width the section is drawn through ----
    const beltAt = z => d.belt - d.wedge * z / L;
    const g = z => z >= zCowl || z <= zDeck ? 0 : z >= zRoofF ? (zCowl - z) / (zCowl - zRoofF) : z >= zRoofR ? 1 : (z - zDeck) / (zRoofR - zDeck);
    const roofYF = d.roofY - (d.roofDropF || 0), roofYR = d.roofY - (d.roofDropR || 0);
    function topY(z) {
      if (z >= zCowl) { const t = clamp((z - zCowl) / (zF1 - zCowl), 0, 1); return mix(d.cowlY, d.noseY, Math.pow(t, d.hoodCurve)); }
      if (z >= zRoofF) { const t = (zCowl - z) / (zCowl - zRoofF); return mix(d.cowlY, roofYF, t) + d.wsBow * Math.sin(t * Math.PI); }
      if (z >= zRoofR) { const t = (z - zRoofR) / Math.max(1e-6, zRoofF - zRoofR); return mix(roofYR, roofYF, t) + d.roofBow * Math.sin(t * Math.PI); }
      if (z >= zDeck) { const t = (z - zDeck) / (zRoofR - zDeck); return mix(d.deckY, roofYR, t) + d.blBow * Math.sin(t * Math.PI); }
      const t = clamp((zDeck - z) / Math.max(1e-6, zDeck - zR0), 0, 1); return mix(d.deckY, d.tailY, Math.pow(t, 1.2));
    }
    const flareAt = z => d.flare * Math.max(...d.axles.map(a => Math.exp(-Math.pow((z - a) / .46, 2))));
    // d.plan(f) is an optional extra width factor along the car (f = z / L), for a waist behind the doors.
    const halfW = z => W / 2 * (1 - (1 - d.taperR) * smooth(.10, .5, -z / L) - (1 - d.taperF) * smooth(.10, .5, z / L)) * (d.plan ? d.plan(z / L) : 1);
    const roofHalf = z => d.roofHalf * (1 - .07 * smooth(zRoofF - .5, zRoofF, z) - .05 * smooth(zRoofR + .5, zRoofR, z));
    const shoulder0 = z => z >= zCowl ? Math.min(beltAt(z), topY(z) - d.hoodCrown - .012) : z <= zDeck ? Math.min(beltAt(z), topY(z) - .034) : beltAt(z);
    // Low cars (d.haunch): the fender rises over each wheel so the arch never cuts through its top.
    const haunch = d.haunch ? d.axles.map(a => Math.max(0, 2 * d.R + .16 - shoulder0(a))) : null;
    const liftAt = z => { let lift = 0; if (haunch) for (let k = 0; k < haunch.length; k++) lift = Math.max(lift, haunch[k] * Math.exp(-Math.pow((z - d.axles[k]) / .5, 2))); return lift; };
    const shoulder = z => shoulder0(z) + liftAt(z);
    const X = new Array(KNOTS.length), Y = new Array(KNOTS.length); let frameZ = NaN;
    function frame(z) {
      if (z === frameZ) return; frameZ = z;
      const gg = g(z), top = topY(z), sh0 = shoulder0(z), lift = liftAt(z), sh = sh0 + lift, w = halfW(z), sillX = w * d.sill, cr = mix(d.hoodCrown, d.roofCrown, gg), rY = mix(sh0 + .022, top - cr, gg), wide = smooth(0, .03, lift), rX = mix(sillX - .05 - .22 * wide - 1.2 * lift, roofHalf(z), gg), bs = d.base, hs = sh - bs, fl = 1 + flareAt(z), drop = top - rY, bow = d.glassBow * gg;
      X[0] = 0; Y[0] = top; X[1] = .42 * rX; Y[1] = top - .10 * drop; X[2] = .80 * rX; Y[2] = top - .42 * drop; X[3] = .965 * rX; Y[3] = top - .80 * drop; X[4] = rX; Y[4] = rY;
      X[5] = mix(rX, sillX, 1 / 3) + bow; Y[5] = mix(rY, sh, mix(1 / 3, .85, wide)); X[6] = mix(rX, sillX, 2 / 3) + bow; Y[6] = mix(rY, sh, mix(2 / 3, 1, wide)); X[7] = sillX; Y[7] = sh; // a raised fender is a broad crown over the tyre
      X[8] = w * .992 * fl; Y[8] = sh - .07 * hs; X[9] = w * fl; Y[9] = bs + .62 * hs; X[10] = w * .997 * fl; Y[10] = bs + .36 * hs; X[11] = w * .985 * fl; Y[11] = bs + .15 * hs; X[12] = w * .95; Y[12] = bs + .035; X[13] = w * .80; Y[13] = bs;
    }
    // ---- the surface ----
    const ends = { front: { z: zF1, sign: 1, D: d.noseDepth, faceW: d.faceWF, sweep: d.sweepF, bulge: d.bulgeF, y0: d.faceF ? d.faceF[0] : d.base + .05, y1: d.faceF ? d.faceF[1] : d.noseY - .05 }, rear: { z: zR0, sign: -1, D: d.tailDepth, faceW: d.faceWR, sweep: d.sweepR, bulge: d.bulgeR, y0: d.faceR ? d.faceR[0] : d.base + .07, y1: d.faceR ? d.faceR[1] : topY(zR0) - .04 } };
    function at(s, q, out) {
      const a = Math.abs(s), sign = s < 0 ? -1 : 1, end = q > 1 ? ends.front : q < 0 ? ends.rear : null, z = end ? end.z : mix(zR0, zF1, q);
      frame(z); let x = hermite(KNOTS, X, a), y = hermite(KNOTS, Y, a), zz = z;
      if (end) {
        const e = Math.min(1, q > 1 ? q - 1 : -q), b = 1 - Math.cos(e * Math.PI / 2), w = halfW(z), top = Y[0], xT = x * end.faceW, yT = mix(end.y0, end.y1, clamp((y - d.base) / (top - d.base), 0, 1));
        zz = z + end.sign * (end.D * Math.sin(e * Math.PI / 2) - end.sweep * Math.pow(x / w, 2) * b); x = mix(x, xT, b); y = mix(y, yT, b);
      }
      out.x = sign * x; out.y = y; out.z = zz; return out;
    }
    const pa = { x: 0, y: 0, z: 0 }, pb = { x: 0, y: 0, z: 0 }, pc = { x: 0, y: 0, z: 0 }, pd = { x: 0, y: 0, z: 0 };
    function normal(s, q, out) {
      const ds = .006, dq = .004; at(s - ds, q, pa); at(s + ds, q, pb); at(s, q - dq, pc); at(s, q + dq, pd);
      const ux = pb.x - pa.x, uy = pb.y - pa.y, uz = pb.z - pa.z, vx = pd.x - pc.x, vy = pd.y - pc.y, vz = pd.z - pc.z;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const len = Math.hypot(nx, ny, nz) || 1; nx /= len; ny /= len; nz /= len;
      // Outward is up on the top, sideways on the flanks.
      at(s, q, pa); const ref = Math.abs(s) < .3 ? ny : nx * (s < 0 ? -1 : 1) + ny * .2; if (ref < 0) { nx = -nx; ny = -ny; nz = -nz; }
      out.x = nx; out.y = ny; out.z = nz; return out;
    }
    const qOf = z => (z - zR0) / (zF1 - zR0);
    // The s at which the flank reaches a given height at station q.
    function sAtHeight(q, y) { let lo = SILL, hi = 1; for (let i = 0; i < 16; i++) { const mid = (lo + hi) / 2; at(mid, q, pa); if (pa.y > y) lo = mid; else hi = mid; } return (lo + hi) / 2; }

    // Adds a triangle facing away from the car's axis (or toward it when inward), whatever order it was given in.
    const yMid = (d.base + d.belt) / 2;
    function tri(shape, a, b, c, inward) { const P = shape.p, ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2], ux = P[b * 3] - ax, uy = P[b * 3 + 1] - ay, uz = P[b * 3 + 2] - az, vx = P[c * 3] - ax, vy = P[c * 3 + 1] - ay, vz = P[c * 3 + 2] - az, nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, cx = ax + (ux + vx) / 3, cy = ay + (uy + vy) / 3, cz = az + (uz + vz) / 3, dot = nx * cx + ny * (cy - yMid) + nz * (cz - clamp(cz, zR0 + .35, zF1 - .35)); if ((dot < 0) !== !!inward) shape.i.push(a, c, b); else shape.i.push(a, b, c); }

    // ---- stations and rows of the base shell ----
    const zDoorF = d.doors ? d.doorF ?? zCowl - .05 : null, zDoorR = d.doors ? d.doorR ?? Math.max(zDeck + .05, zDoorF - 1.22) : null, archR = d.R + .055;
    const marks = [zR0, zF1, zCowl, zRoofF, zRoofR, zDeck, zCowl + .03, zDeck - .03];
    if (d.doors) marks.push(zDoorF, zDoorR, zDoorR - .07, zDoorF + .012, zDoorR - .012);
    for (const a of d.axles) for (const k of [-1, -.72, -.38, 0, .38, .72, 1]) marks.push(a + k * archR);
    const spacing = .075 / dens, zs = [...new Set(marks.filter(z => z >= zR0 && z <= zF1).map(z => +z.toFixed(4)))].sort((p, r) => p - r), stations = [];
    for (let i = 0; i < zs.length - 1; i++) { const span = zs[i + 1] - zs[i], n = Math.max(1, Math.round(span / spacing)); for (let k = 0; k < n; k++) stations.push(qOf(zs[i] + span * k / n)); } stations.push(1);
    const filletN = seg(9, 4), qs = []; for (let k = filletN; k >= 1; k--) qs.push(-k / filletN); qs.push(...stations); for (let k = 1; k <= filletN; k++) qs.push(1 + k / filletN);
    const rows = ROWS.filter((s, i) => detail >= 4 || KEEP.has(s) || (detail === 3 && i % 2 === 0)), cols = []; for (let j = rows.length - 1; j > 0; j--) cols.push(-rows[j]); for (const s of rows) cols.push(s);

    // ---- what each cell of the shell is ----
    const bayF = d.bayF ?? d.bay, bayR = d.bayR ?? d.bay;
    const zone = z => z >= zCowl ? 'hood' : z >= zRoofF ? 'screen' : z >= zRoofR ? 'roof' : z > zDeck ? 'back' : 'deck';
    const inArch = (y, z) => d.axles.some(a => Math.hypot(z - a, y - d.R) < archR);
    const glassHeight = z => { frame(z); return Y[4] - Y[7]; };
    function cell(sc, zc, q) {
      const a = Math.abs(sc);
      if (q < 0 || q > 1) return a > .955 ? ['body', 'dark'] : ['body', 'paint'];
      // d.frameRole (Platdo Drive): the painted frame round the screens and along the roof rail is its own role, so
      // the caller can give it an inner face; without it these cells are plain paint, as before.
      const zn = zone(zc), fr = d.frameRole ? 'frame' : 'paint';
      if (a < .27) {
        if (zn === 'hood') return zc > zCowl + .03 && bayF ? ['body', 'bay'] : ['body', 'paint'];
        if (zn === 'deck' && d.open && zc > (d.openRear ?? zDeck - 1)) return null;
        if (zn === 'deck') return zc < zDeck - .03 && bayR ? ['body', d.bed ? 'bed' : 'bay'] : ['body', 'paint'];
        if (zn === 'screen') return a < .245 && zc < zCowl - .035 && zc > zRoofF + .04 ? ['windshield', 'glass'] : ['body', a < .245 ? 'frit' : fr];
        if (zn === 'back') return d.open ? null : a < .245 && zc > zDeck + .04 && zc < zRoofR - .04 && !d.solidBack ? ['body', 'glass'] : ['body', fr];
        return d.open && zc < zRoofF - .04 ? null : ['body', d.glassRoof && a < .2 && zc < zRoofF - .12 && zc > zRoofR + .12 ? 'glass' : 'paint'];
      }
      if (a < RAIL) return d.open && zn !== 'hood' && zn !== 'deck' && zn !== 'screen' && zc < zRoofF - .04 ? null : ['body', zn === 'hood' || zn === 'deck' ? 'paint' : fr];
      const door = d.doors && zc > zDoorR && zc < zDoorF;
      if (a < SILL) {
        if (zn === 'hood' || zn === 'deck') return ['body', 'paint'];
        if (door) return null;
        if (d.open && zn !== 'screen') return null;
        if (d.solidFront && d.doors && zc >= zDoorF) return ['body', 'pillar']; // no sliver of glass between the door and the screen
        const tall = glassHeight(zc) > .13, pillar = d.doors && zc <= zDoorR && zc > zDoorR - .07;
        return ['body', !tall || d.blindSides && zc < (d.blindFrom ?? zDoorR) ? 'paint' : pillar ? 'pillar' : a > RAIL + .025 && a < SILL - .02 ? 'glass' : 'pillar'];
      }
      if (door && a < .94) return null;
      return ['body', a > .955 ? 'dark' : d.cladding && a > d.cladding ? 'trim' : 'paint'];
    }

    // ---- base shell ----
    const p = { x: 0, y: 0, z: 0 }, nrm = { x: 0, y: 0, z: 0 }, grid = [], inside = [];
    for (let i = 0; i < qs.length; i++) { const line = []; for (let j = 0; j < cols.length; j++) { at(cols[j], qs[i], p); line.push([p.x, p.y, p.z]); } grid.push(line); }
    // Wheel arches: points near an arch move onto its circle so the opening has a clean edge; the engine bay and
    // boot are sunk so a missing lid shows a real recess.
    for (let i = 0; i < qs.length; i++) { const q = qs[i], z = mix(zR0, zF1, clamp(q, 0, 1)), flags = new Uint8Array(cols.length); inside.push(flags); if (q < 0 || q > 1) continue;
      for (let j = 0; j < cols.length; j++) { const a = Math.abs(cols[j]), v = grid[i][j];
        if (a > .5) for (const axle of d.axles) { const dz = v[2] - axle, dy = v[1] - d.R, dist = Math.hypot(dz, dy); if (dist < archR) flags[j] = 1; if (dist < archR + .045 && dist > 1e-4) { const k = archR / dist; v[2] = axle + dz * k; v[1] = Math.max(d.base, d.R + dy * k); } }
        if (a < .255) { if (bayF && z > zCowl + .05 && z < zF1 - .02) v[1] -= bayF; else if (bayR && z < zDeck - .05 && z > zR0 + .02) v[1] -= bayR; }
      } }
    const ids = new Map(), vertexOf = (shape, key, i, j) => { let m = ids.get(key); if (!m) ids.set(key, m = new Map()); const k = i * 1000 + j; let id = m.get(k); if (id === undefined) { const v = grid[i][j]; id = shape.vertex(v[0], v[1], v[2]); m.set(k, id); } return id; };
    for (let i = 0; i < qs.length - 1; i++) for (let j = 0; j < cols.length - 1; j++) {
      const q = (qs[i] + qs[i + 1]) / 2, sc = (cols[j] + cols[j + 1]) / 2, a = grid[i][j], b = grid[i + 1][j + 1], yc = (a[1] + b[1]) / 2, zc = (a[2] + b[2]) / 2;
      if (inside[i][j] && inside[i][j + 1] && inside[i + 1][j] && inside[i + 1][j + 1]) continue;
      const kind = cell(sc, q < 0 || q > 1 ? zc : mix(zR0, zF1, q), q); if (!kind) continue;
      const key = kind[0] + '|' + kind[1], shape = shapeOf(kind[0], kind[1]), v00 = vertexOf(shape, key, i, j), v01 = vertexOf(shape, key, i, j + 1), v10 = vertexOf(shape, key, i + 1, j), v11 = vertexOf(shape, key, i + 1, j + 1);
      // The grid runs the same way everywhere, so its winding is known; this also holds in hollows such as a hood set between raised fenders.
      shape.i.push(v00, v10, v01, v01, v10, v11);
    }
    // Floor between the two rockers.
    { const floor = shapeOf('body', 'dark'), last = cols.length - 1; for (let i = 0; i < qs.length; i++) { const l = grid[i][0], r = grid[i][last]; floor.vertex(l[0], l[1], l[2]); floor.vertex(r[0], r[1], r[2]); if (i) { const k = floor.count - 4; tri(floor, k, k + 2, k + 1); tri(floor, k + 1, k + 2, k + 3); } } }

    // ---- end faces: a (u, v) grid blended from the outline of the last ring ----
    const topCols = cols.map((s, j) => j).filter(j => Math.abs(cols[j]) <= RAIL + 1e-9), sideR = cols.map((s, j) => j).filter(j => cols[j] >= RAIL - 1e-9), sideL = cols.map((s, j) => j).filter(j => cols[j] <= -RAIL + 1e-9).reverse();
    const faces = {};
    for (const name of ['front', 'rear']) {
      const end = ends[name], ring = grid[name === 'front' ? qs.length - 1 : 0], nu = topCols.length - 1, nv = sideR.length - 1, pts = [];
      const TL = ring[topCols[0]], TR = ring[topCols[nu]], BL = ring[sideL[nv]], BR = ring[sideR[nv]];
      for (let iv = 0; iv <= nv; iv++) { const line = [], v = 1 - iv / nv, left = ring[sideL[iv]], right = ring[sideR[iv]];
        for (let iu = 0; iu <= nu; iu++) { const u = iu / nu, topP = ring[topCols[iu]], out = [0, 0, 0];
          for (let k = 0; k < 3; k++) { const bottom = mix(BL[k], BR[k], u); out[k] = (1 - v) * bottom + v * topP[k] + (1 - u) * left[k] + u * right[k] - ((1 - u) * (1 - v) * BL[k] + u * (1 - v) * BR[k] + (1 - u) * v * TL[k] + u * v * TR[k]); }
          out[2] += end.sign * end.bulge * (1 - Math.pow(2 * u - 1, 2)) * 4 * v * (1 - v); line.push(out); }
        pts.push(line); }
      const mid = Math.round(nu / 2), heights = pts.map(line => line[mid][1]), rowOf = v => { const y = mix(heights[nv], heights[0], v); let k = 0; while (k < nv - 1 && heights[k + 1] > y) k++; return k + clamp((heights[k] - y) / Math.max(1e-6, heights[k] - heights[k + 1]), 0, 1); };
      faces[name] = { pts, nu, nv, end,
        // Point on the face at u (0 left .. 1 right) and v (0 bottom .. 1 top).
        at(u, v, out) { const fu = clamp(u, 0, 1) * nu, fv = rowOf(clamp(v, 0, 1)), iu = Math.min(nu - 1, Math.floor(fu)), iv = Math.min(nv - 1, Math.floor(fv)), tu = fu - iu, tv = fv - iv, a = pts[iv][iu], b = pts[iv][iu + 1], c = pts[iv + 1][iu], e = pts[iv + 1][iu + 1];
          out.x = mix(mix(a[0], b[0], tu), mix(c[0], e[0], tu), tv); out.y = mix(mix(a[1], b[1], tu), mix(c[1], e[1], tu), tv); out.z = mix(mix(a[2], b[2], tu), mix(c[2], e[2], tu), tv); return out; } };
      const face = d.faceRole ? d.faceRole(name) : null;
      for (let iv = 0; iv < nv; iv++) for (let iu = 0; iu < nu; iu++) {
        const a = pts[iv][iu], b = pts[iv][iu + 1], c = pts[iv + 1][iu], e = pts[iv + 1][iu + 1], u = (iu + .5) / nu, v = ((a[1] + e[1]) / 2 - heights[nv]) / Math.max(1e-6, heights[0] - heights[nv]), kind = face ? face(u, v, (a[0] + e[0]) / 2, (a[1] + e[1]) / 2) || ['body', 'paint'] : ['body', 'paint'];
        const shape = shapeOf(kind[0], kind[1]), i0 = shape.vertex(a[0], a[1], a[2]), i1 = shape.vertex(b[0], b[1], b[2]), i2 = shape.vertex(c[0], c[1], c[2]), i3 = shape.vertex(e[0], e[1], e[2]);
        tri(shape, i0, i2, i1); tri(shape, i1, i2, i3);
      }
    }

    // ---- panels: a skin lying on the surface with its edge tucked under, which draws the shut line ----
    // o: {part, role | role(sc, zc), s0, s1, q0, q1, lift, inner}. s is signed; panels may cross the centre.
    function panel(o) {
      const flip = (o.s1 - o.s0) * (o.q1 - o.q0) < 0, lift = o.lift ?? .004, edge = o.edge ?? .012, ns = Math.max(4, o.ns || seg(Math.abs(o.s1 - o.s0) * 42, 4)), nq = Math.max(4, o.nq || seg(Math.abs(o.q1 - o.q0) * (zF1 - zR0) / .07, 4));
      at(o.s0, o.q0, pa); at(o.s1, o.q0, pb); at(o.s0, o.q1, pc); const ws = Math.hypot(pb.x - pa.x, pb.y - pa.y, pb.z - pa.z) || 1, wq = Math.hypot(pc.x - pa.x, pc.y - pa.y, pc.z - pa.z) || 1, es = Math.min(.2, edge / ws), eq = Math.min(.2, edge / wq);
      const line = (n, e) => { const list = [0, e]; for (let k = 1; k < n; k++) list.push(mix(e, 1 - e, k / n)); list.push(1 - e, 1); return list; }, us = line(ns, es), vs = line(nq, eq), verts = [];
      for (let iv = 0; iv < vs.length; iv++) { const row = []; for (let iu = 0; iu < us.length; iu++) { const s = mix(o.s0, o.s1, us[iu]), q = mix(o.q0, o.q1, vs[iv]), rim = iu === 0 || iv === 0 || iu === us.length - 1 || iv === vs.length - 1; at(s, q, p); normal(s, q, nrm); const h = rim ? -(o.sink ?? .012) : lift; row.push([p.x + nrm.x * h, p.y + nrm.y * h, p.z + nrm.z * h, s, q]); } verts.push(row); }
      const made = new Map();
      for (let iv = 0; iv < vs.length - 1; iv++) for (let iu = 0; iu < us.length - 1; iu++) {
        const a = verts[iv][iu], e = verts[iv + 1][iu + 1], sc = (a[3] + e[3]) / 2, qc = (a[4] + e[4]) / 2, role = typeof o.role === 'function' ? o.role(sc, mix(zR0, zF1, clamp(qc, 0, 1)), iu === 0 || iv === 0 || iu === us.length - 2 || iv === vs.length - 2) : o.role; if (!role) continue;
        const shape = shapeOf(o.part, role), key = o.part + '|' + role; let m = made.get(key); if (!m) made.set(key, m = new Map());
        const id = (r, c2) => { const k = r * 1000 + c2; let v = m.get(k); if (v === undefined) { const w = verts[r][c2]; v = shape.vertex(w[0], w[1], w[2]); m.set(k, v); } return v; }, i0 = id(iv, iu), i1 = id(iv, iu + 1), i2 = id(iv + 1, iu), i3 = id(iv + 1, iu + 1);
        if (flip) shape.i.push(i0, i1, i2, i1, i3, i2); else shape.i.push(i0, i2, i1, i1, i2, i3);
        if (o.inner && Math.abs(sc) >= SILL) { const inside = shapeOf(o.part, o.inner), base = inside.count; for (const w of [a, verts[iv][iu + 1], verts[iv + 1][iu], e]) { normal(w[3], w[4], nrm); inside.vertex(w[0] - nrm.x * .05, w[1] - nrm.y * .05, w[2] - nrm.z * .05); } tri(inside, base, base + 1, base + 2, true); tri(inside, base + 1, base + 3, base + 2, true); }
      }
    }
    // A patch on an end face in its (u, v) frame; used for grilles, plates and lamps that sit on the face.
    function facePatch(name, o) {
      const f = faces[name], nu = Math.max(2, o.nu || seg(10, 3)), nv = Math.max(2, o.nv || seg(6, 2)), shape = shapeOf(o.part, o.role), lift = (o.lift ?? .006) * f.end.sign, start = shape.count;
      for (let iv = 0; iv <= nv; iv++) for (let iu = 0; iu <= nu; iu++) { const rim = o.tuck ? iu === 0 || iv === 0 || iu === nu || iv === nv : false; f.at(mix(o.u0, o.u1, iu / nu), mix(o.v0, o.v1, iv / nv), p); shape.vertex(p.x, p.y, p.z + (rim ? -lift * .6 : lift)); }
      for (let iv = 0; iv < nv; iv++) for (let iu = 0; iu < nu; iu++) { const a = start + iv * (nu + 1) + iu, b = a + 1, c = a + nu + 1, e = c + 1; tri(shape, a, b, c); tri(shape, b, e, c); }
    }
    // A bar swept round an end at a given height (bumpers, splitters, light bars).
    function sweep(name, o) {
      const front = name === 'front', end = ends[name], n = seg(12, 5), reach = o.reach ?? .02, qa = o.qa ?? (front ? qOf(d.axles[d.axles.length - 1] + archR + .05) : qOf(d.axles[0] - archR - .05)), qb = front ? 2 : -1, right = [], left = [];
      for (let k = 0; k <= n; k++) { const q = mix(qa, qb, k / n); for (const side of [1, -1]) { const s = sAtHeight(q, o.y) * side; at(s, q, p); normal(s, q, nrm); (side > 0 ? right : left).push([p.x + nrm.x * reach, o.y, p.z + nrm.z * reach]); } }
      const a = right[n], b = left[n], across = []; for (let k = 1; k < 6; k++) { const t = k / 6; across.push([mix(a[0], b[0], t), o.y, mix(a[2], b[2], t) + end.sign * (end.bulge + reach * .5) * 4 * t * (1 - t)]); }
      // The path is level, so the tube's first radius is its height and the second its depth.
      F.tube(shapeOf(o.part, o.role), [...right, ...across, ...left.reverse()], [o.height ?? .09, o.depth ?? .04], { sides: seg(10, 5), segments: seg(48, 16) });
    }

    const api = { spec: d, at, normal, qOf, sAtHeight, panel, facePatch, sweep, faces, shapeOf, seg, tri, ends, glassHeight, zCowl, zRoofF, zRoofR, zDeck, zF1, zR0, zDoorF, zDoorR, topY, beltAt, halfW, shoulder, archR,
      result: () => ({ pieces: [...pieces.values()].filter(e => e.shape.triangles > 0), anchors: api.anchors, surface: api }),
      // Drops the mesh data once the caller has taken it; at(), normal() and the faces keep working.
      release: () => { pieces.clear(); ids.clear(); } };
    api.anchors = { doorHinge: d.doors ? { z: zDoorF, x: halfW(zDoorF) * d.sill } : null, door: d.doors ? [zDoorR, zDoorF] : null, cowl: zCowl, roofF: zRoofF, roofR: zRoofR, deck: zDeck };
    return api;
  }

  root.PlatdoCarBody = { build, hermite, KNOTS, ROWS, RAIL, SILL };
})(typeof globalThis !== 'undefined' ? globalThis : this);
