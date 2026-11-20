
/* PLATDO V3 — Forge: the shared procedural modelling toolkit.
 * Everything in the game is built in code, so better models need better building blocks:
 * smooth lofted surfaces with anatomical cross-sections, details that follow a surface instead of
 * floating in front of it, swept tubes, rounded solids, per-vertex colour and shading, and
 * materials that add fabric weave, leather grain, skin pores and hair strands in the shader.
 * One copy is created per embedded THREE (Drive and City each carry their own). */
(function (root) {
  'use strict';
  const T = root.THREE;
  if (!T || (root.PlatdoForge && root.PlatdoForge.THREE === T)) return;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const TAU = Math.PI * 2;

  // ---- deterministic noise (used for displacement and colour variation at build time) ----
  function hash3(x, y, z) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function noise3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z); let xf = x - xi, yf = y - yi, zf = z - zi;
    xf = xf * xf * (3 - 2 * xf); yf = yf * yf * (3 - 2 * yf); zf = zf * zf * (3 - 2 * zf);
    const a = hash3(xi, yi, zi), b = hash3(xi + 1, yi, zi), c = hash3(xi, yi + 1, zi), d = hash3(xi + 1, yi + 1, zi), e = hash3(xi, yi, zi + 1), f = hash3(xi + 1, yi, zi + 1), g = hash3(xi, yi + 1, zi + 1), h = hash3(xi + 1, yi + 1, zi + 1);
    return mix(mix(mix(a, b, xf), mix(c, d, xf), yf), mix(mix(e, f, xf), mix(g, h, xf), yf), zf);
  }
  function fbm3(x, y, z, octaves = 3) { let v = 0, a = .5, total = 0; for (let i = 0; i < octaves; i++) { v += a * noise3(x, y, z); total += a; x = x * 2.03 + 17.1; y = y * 2.03 + 9.2; z = z * 2.03 + 3.7; a *= .5; } return v / total; }
  function rng(seed) { let s = (typeof seed === 'number' ? seed : [...String(seed)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261)) >>> 0; return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---- colour ----
  const colourCache = new Map(), scratchColour = new T.Color();
  // Linear-light [r,g,b] for a CSS colour, an existing triple, or a THREE.Color.
  function rgb(value) {
    if (Array.isArray(value)) return value; if (value && value.isColor) return [value.r, value.g, value.b];
    let c = colourCache.get(value); if (!c) { scratchColour.set(value); c = [scratchColour.r, scratchColour.g, scratchColour.b]; colourCache.set(value, c); } return c;
  }
  const tint = (c, k) => { c = rgb(c); return [c[0] * k, c[1] * k, c[2] * k]; };
  const blend = (a, b, t) => { a = rgb(a); b = rgb(b); return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]; };

  // ---- Shape: an indexed mesh under construction, with colour and uv on every vertex ----
  class Shape {
    constructor() { this.p = []; this.c = []; this.uv = []; this.i = []; }
    get count() { return this.p.length / 3; }
    vertex(x, y, z, col, u = 0, v = 0) { this.p.push(x, y, z); if (col) this.c.push(col[0], col[1], col[2]); else this.c.push(1, 1, 1); this.uv.push(u, v); return this.p.length / 3 - 1; }
    tri(a, b, c) { this.i.push(a, b, c); }
    quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
    // Flip every triangle added since `fromIndex` when they face away from `outward(cx,cy,cz)`-style reference:
    // by default the reference is the centroid of the added vertices (closed, roughly convex pieces).
    orient(fromVertex, fromIndex, reference) {
      const p = this.p, idx = this.i; let cx = 0, cy = 0, cz = 0; const n = this.count - fromVertex; if (n <= 0) return this;
      for (let k = fromVertex; k < this.count; k++) { cx += p[k * 3]; cy += p[k * 3 + 1]; cz += p[k * 3 + 2]; } cx /= n; cy /= n; cz /= n;
      let sum = 0;
      for (let k = fromIndex; k < idx.length; k += 3) {
        const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3, ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, mx = (p[a] + p[b] + p[c]) / 3, my = (p[a + 1] + p[b + 1] + p[c + 1]) / 3, mz = (p[a + 2] + p[b + 2] + p[c + 2]) / 3;
        if (reference) { const r = reference(mx, my, mz); sum += nx * r[0] + ny * r[1] + nz * r[2]; } else sum += nx * (mx - cx) + ny * (my - cy) + nz * (mz - cz);
      }
      if (sum < 0) for (let k = fromIndex; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
      return this;
    }
    // Multiply the colour of vertices [from, count) by fn(x,y,z,index) -> scalar or [r,g,b].
    shade(from, fn) { const p = this.p, c = this.c; for (let k = from; k < this.count; k++) { const f = fn(p[k * 3], p[k * 3 + 1], p[k * 3 + 2], k); if (typeof f === 'number') { c[k * 3] *= f; c[k * 3 + 1] *= f; c[k * 3 + 2] *= f; } else if (f) { c[k * 3] *= f[0]; c[k * 3 + 1] *= f[1]; c[k * 3 + 2] *= f[2]; } } return this; }
    // Replace colour of vertices [from, count) with fn(x,y,z,index,current) -> [r,g,b] (or undefined to keep).
    paint(from, fn) { const p = this.p, c = this.c, current = [0, 0, 0]; for (let k = from; k < this.count; k++) { current[0] = c[k * 3]; current[1] = c[k * 3 + 1]; current[2] = c[k * 3 + 2]; const f = fn(p[k * 3], p[k * 3 + 1], p[k * 3 + 2], k, current); if (f) { c[k * 3] = f[0]; c[k * 3 + 1] = f[1]; c[k * 3 + 2] = f[2]; } } return this; }
    // Move vertices [from, count) with fn(x,y,z,out) writing out[0..2].
    warp(from, fn) { const p = this.p, out = [0, 0, 0]; for (let k = from; k < this.count; k++) { out[0] = p[k * 3]; out[1] = p[k * 3 + 1]; out[2] = p[k * 3 + 2]; fn(out[0], out[1], out[2], out, k); p[k * 3] = out[0]; p[k * 3 + 1] = out[1]; p[k * 3 + 2] = out[2]; } return this; }
    transform(from, matrix) { const e = matrix.elements, p = this.p; for (let k = from; k < this.count; k++) { const x = p[k * 3], y = p[k * 3 + 1], z = p[k * 3 + 2]; p[k * 3] = e[0] * x + e[4] * y + e[8] * z + e[12]; p[k * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; p[k * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14]; } if (matrix.determinant() < 0) for (let k = this._flipFrom || 0; k < 0; k++); return this; }
    append(other) { const base = this.count; for (const v of other.p) this.p.push(v); for (const v of other.c) this.c.push(v); for (const v of other.uv) this.uv.push(v); for (const v of other.i) this.i.push(v + base); return this; }
    get triangles() { return this.i.length / 3; }
    geometry() {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new T.Float32BufferAttribute(this.c, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(this.uv, 2));
      g.setIndex(this.count > 65535 ? new T.Uint32BufferAttribute(this.i, 1) : new T.Uint16BufferAttribute(this.i, 1)); g.computeVertexNormals(); return g;
    }
  }

  // ---- parametric grid ----
  // fn(u, v, out) writes out.x/y/z and may set out.col = [r,g,b]. With closeU the first column is reused, so
  // normals are continuous across the seam. poleStart / poleEnd close the v=0 / v=1 edge to a single vertex.
  function grid(shape, nu, nv, fn, o = {}) {
    const closeU = !!o.closeU, cols = closeU ? nu : nu + 1, start = shape.count, firstIndex = shape.i.length, out = { x: 0, y: 0, z: 0, col: null };
    const j0 = o.poleStart ? 1 : 0, j1 = o.poleEnd ? nv - 1 : nv; let poleA = -1, poleB = -1;
    if (o.poleStart) { out.col = null; fn(0, 0, out); poleA = shape.vertex(out.x, out.y, out.z, out.col || o.col, .5, 0); }
    for (let j = j0; j <= j1; j++) { const v = j / nv; for (let i = 0; i < cols; i++) { const u = i / nu; out.col = null; fn(u, v, out); shape.vertex(out.x, out.y, out.z, out.col || o.col, u, v); } }
    if (o.poleEnd) { out.col = null; fn(0, 1, out); poleB = shape.vertex(out.x, out.y, out.z, out.col || o.col, .5, 1); }
    const row = j => start + (o.poleStart ? 1 : 0) + (j - j0) * cols, next = i => closeU ? (i + 1) % nu : i + 1;
    for (let j = j0; j < j1; j++) for (let i = 0; i < nu; i++) { const a = row(j) + i, b = row(j) + next(i), c = row(j + 1) + i, d = row(j + 1) + next(i); shape.i.push(a, b, c, b, d, c); }
    if (o.poleStart) for (let i = 0; i < nu; i++) shape.i.push(poleA, row(j0) + next(i), row(j0) + i);
    if (o.poleEnd) for (let i = 0; i < nu; i++) shape.i.push(poleB, row(j1) + i, row(j1) + next(i));
    if (o.orient !== false) shape.orient(start, firstIndex, o.reference);
    else if (o.flip) for (let k = firstIndex; k < shape.i.length; k += 3) { const t = shape.i[k + 1]; shape.i[k + 1] = shape.i[k + 2]; shape.i[k + 2] = t; }
    return start;
  }

  // ---- lofted surfaces ----
  // A section is {y, x, z, a, b, f, k, n}: centre offset (x,z), half-width toward +x (a) and -x (b),
  // depth toward +z (f) and -z (k), and the superellipse power n (2 = ellipse, larger = squarer).
  const FIELDS = ['x', 'z', 'a', 'b', 'f', 'k', 'n'];
  function normalise(sections) { return sections.map(s => { const a = s.a ?? s.w ?? .05, f = s.f ?? s.d ?? a; return { y: s.y, x: s.x || 0, z: s.z || 0, a, b: s.b ?? a, f, k: s.k ?? f, n: s.n || 2 }; }).sort((p, q) => p.y - q.y); }
  // Surface built from sections, sampled anywhere: at(theta, y, out) and normal(theta, y, out). theta 0 faces +z, pi/2 faces +x.
  function surface(sections, modifier) {
    const S = normalise(sections), n = S.length, y0 = S[0].y, y1 = S[n - 1].y, sec = { y: 0, x: 0, z: 0, a: 0, b: 0, f: 0, k: 0, n: 2 };
    // Meshing walks a surface row by row and measures normals just above and below each row, so the last three
    // heights asked for are remembered: most lookups are then answered without interpolating again.
    const recent = [{ y: NaN }, { y: NaN }, { y: NaN }]; let turn = 0;
    function section(y, out) {
      y = clamp(y, y0, y1);
      if (!out) { for (let k = 0; k < 3; k++) if (recent[k].y === y) return recent[k]; out = recent[turn]; turn = (turn + 1) % 3; out.y = NaN; }
      let i = 0; while (i < n - 2 && y > S[i + 1].y) i++;
      const p1 = S[i], p2 = S[i + 1], p0 = S[Math.max(0, i - 1)], p3 = S[Math.min(n - 1, i + 2)], span = (p2.y - p1.y) || 1e-6, t = (y - p1.y) / span, t2 = t * t, t3 = t2 * t;
      for (const key of FIELDS) {
        // Catmull-Rom with tangents scaled for uneven spacing, clamped so a section never overshoots into a negative radius.
        const m1 = (p2[key] - p0[key]) / ((p2.y - p0.y) || 1e-6) * span, m2 = (p3[key] - p1[key]) / ((p3.y - p1.y) || 1e-6) * span;
        let value = (2 * t3 - 3 * t2 + 1) * p1[key] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[key] + (t3 - t2) * m2;
        if (key !== 'x' && key !== 'z') value = Math.max(value, Math.min(p1[key], p2[key]) * .6);
        out[key] = value;
      }
      out.y = y; return out;
    }
    const tmp = { x: 0, y: 0, z: 0 }, pa = { x: 0, y: 0, z: 0 }, pb = { x: 0, y: 0, z: 0 }, pc = { x: 0, y: 0, z: 0 };
    function at(theta, y, out) {
      const q = section(y), s = Math.sin(theta), c = Math.cos(theta), e = 2 / q.n, sx = Math.sign(s) * Math.pow(Math.abs(s), e), cz = Math.sign(c) * Math.pow(Math.abs(c), e);
      out.x = q.x + sx * (s >= 0 ? q.a : q.b); out.y = y; out.z = q.z + cz * (c >= 0 ? q.f : q.k);
      if (modifier) modifier(theta, y, out, q); return out;
    }
    function normal(theta, y, out) {
      const dy = Math.max(1e-4, (y1 - y0) * .004), ya = clamp(y - dy, y0, y1), yb = clamp(y + dy, y0, y1);
      at(theta - .01, y, pa); at(theta + .01, y, pb); const tx = pb.x - pa.x, ty = pb.y - pa.y, tz = pb.z - pa.z;
      at(theta, ya, pa); at(theta, yb, pc); const ux = pc.x - pa.x, uy = pc.y - pa.y, uz = pc.z - pa.z;
      let nx = ty * uz - tz * uy, ny = tz * ux - tx * uz, nz = tx * uy - ty * ux; const len = Math.hypot(nx, ny, nz) || 1; nx /= len; ny /= len; nz /= len;
      // Point away from the axis.
      const q = section(y), s = Math.sin(theta), c = Math.cos(theta); if (nx * s + nz * c < 0) { nx = -nx; ny = -ny; nz = -nz; }
      out.x = nx; out.y = ny; out.z = nz; return out;
    }
    // A copy pushed outward by `ease` metres (number or fn(theta,y)) and optionally re-shaped by `also`.
    function offset(ease, also) {
      const nrm = { x: 0, y: 0, z: 0 }, base = { at, normal };
      // A surface pushed out along its normals keeps those normals, so they are reused rather than measured again.
      return surfaceFrom((theta, y, out) => { base.at(theta, y, out); base.normal(theta, y, nrm); const e = typeof ease === 'function' ? ease(theta, y) : ease; out.x += nrm.x * e; out.z += nrm.z * e; out.y += nrm.y * e * .25; if (also) also(theta, y, out); return out; }, y0, y1, also ? null : normal);
    }
    return { at, normal, section, offset, y0, y1 };
  }
  // Wrap any at(theta,y,out) function as a surface with finite-difference normals.
  function surfaceFrom(atFn, y0, y1, knownNormal) {
    const pa = { x: 0, y: 0, z: 0 }, pb = { x: 0, y: 0, z: 0 }, pc = { x: 0, y: 0, z: 0 }, nrm = { x: 0, y: 0, z: 0 };
    function normal(theta, y, out) {
      if (knownNormal) return knownNormal(theta, y, out);
      const dy = Math.max(1e-4, (y1 - y0) * .004), ya = clamp(y - dy, y0, y1), yb = clamp(y + dy, y0, y1);
      atFn(theta - .01, y, pa); atFn(theta + .01, y, pb); const tx = pb.x - pa.x, ty = pb.y - pa.y, tz = pb.z - pa.z;
      atFn(theta, ya, pa); atFn(theta, yb, pc); const ux = pc.x - pa.x, uy = pc.y - pa.y, uz = pc.z - pa.z;
      let nx = ty * uz - tz * uy, ny = tz * ux - tx * uz, nz = tx * uy - ty * ux; const len = Math.hypot(nx, ny, nz) || 1; nx /= len; ny /= len; nz /= len;
      if (nx * Math.sin(theta) + nz * Math.cos(theta) < 0) { nx = -nx; ny = -ny; nz = -nz; }
      out.x = nx; out.y = ny; out.z = nz; return out;
    }
    const self = { at: atFn, normal, y0, y1, offset(ease, also) { return surfaceFrom((theta, y, out) => { atFn(theta, y, out); normal(theta, y, nrm); const e = typeof ease === 'function' ? ease(theta, y) : ease; out.x += nrm.x * e; out.z += nrm.z * e; out.y += nrm.y * e * .25; if (also) also(theta, y, out); return out; }, y0, y1, also ? null : normal); } };
    return self;
  }
  // Mesh a surface between y = from and y = to. caps: 'round' closes the end with a dome, 'flat' with a disc.
  // o.col is a colour or fn(theta, y, point) -> [r,g,b]. o.rowsAt can give explicit y stations.
  function loft(shape, surf, o = {}) {
    const sides = Math.max(5, o.sides || 16), from = o.from ?? surf.y0, to = o.to ?? surf.y1, rows = Math.max(1, o.rows || 8), col = o.col;
    const stations = []; // [y, scale, yShift]
    const domeRows = Math.max(2, o.capRows || Math.round(sides / 4));
    const dome = (y, sign, height) => { const list = []; for (let k = 1; k <= domeRows; k++) { const t = k / domeRows * Math.PI / 2; list.push([y, Math.cos(t), sign * height * Math.sin(t)]); } return list; };
    const capHeight = y => { const q = surf.section ? surf.section(y, {}) : null; return o.capHeight ?? (q ? Math.min(q.a, q.b, q.f, q.k) * .85 : .03); };
    if (o.capStart === 'round') stations.push(...dome(from, from < to ? -1 : 1, o.capStartHeight ?? capHeight(from)).reverse());
    for (let j = 0; j <= rows; j++) { const t = j / rows, e = o.bias ? Math.pow(t, o.bias) : t; stations.push([o.rowsAt ? o.rowsAt[j] : mix(from, to, e), 1, 0]); }
    if (o.capEnd === 'round') stations.push(...dome(to, from < to ? 1 : -1, o.capEndHeight ?? capHeight(to)));
    const centre = { x: 0, y: 0, z: 0 }, tmp = { x: 0, y: 0, z: 0 }, last = stations.length - 1;
    const poleStart = o.capStart === 'round' || o.capStart === 'flat', poleEnd = o.capEnd === 'round' || o.capEnd === 'flat';
    const all = poleStart && o.capStart === 'flat' ? [[from, 0, 0], ...stations] : stations, list = poleEnd && o.capEnd === 'flat' ? [...all, [to, 0, 0]] : all, count = list.length - 1;
    const axis = (y, out) => { surf.at(0, y, tmp); const fx = tmp.x, fz = tmp.z; surf.at(Math.PI, y, tmp); const bx = tmp.x, bz = tmp.z; surf.at(Math.PI / 2, y, tmp); const rx = tmp.x; surf.at(-Math.PI / 2, y, tmp); out.x = (rx + tmp.x) / 2; out.z = (fz + bz) / 2; return out; };
    return grid(shape, sides, count, (u, v, out) => {
      const j = Math.round(v * count), st = list[j], theta = u * TAU + (o.phase || 0); surf.at(theta, st[0], out);
      if (st[1] !== 1) { axis(st[0], centre); out.x = centre.x + (out.x - centre.x) * st[1]; out.z = centre.z + (out.z - centre.z) * st[1]; }
      out.y += st[2]; out.col = typeof col === 'function' ? col(theta, st[0], out) : col;
    }, { closeU: true, poleStart, poleEnd, reference: o.reference });
  }
  // A raised panel that follows a surface: pockets, plackets, cuffs, stripes, straps, belts, badges.
  // t0..t1 is the angular span (radians, may wrap past 2*pi for a full band), y0..y1 the height span.
  function patch(shape, surf, o) {
    const nu = Math.max(2, o.nu || 8), nv = Math.max(2, o.nv || 6), lift = o.lift ?? .001, thick = o.thick ?? .004, bevel = o.bevel ?? .25, full = Math.abs(o.t1 - o.t0) >= TAU - 1e-4, nrm = { x: 0, y: 0, z: 0 };
    return grid(shape, nu, nv, (u, v, out) => {
      const theta = mix(o.t0, o.t1, u), y = mix(o.y0, o.y1, v); surf.at(theta, y, out); surf.normal(theta, y, nrm);
      const edge = Math.min(full ? 1 : Math.min(u, 1 - u) * (o.nuEdge || 1), Math.min(v, 1 - v)) / bevel, rise = o.sink !== false ? lift - (1 - Math.min(1, edge)) * (thick + lift + .002) + thick : lift + thick;
      const h = o.height ? rise + o.height(u, v) : rise; out.x += nrm.x * h; out.y += nrm.y * h; out.z += nrm.z * h; out.col = typeof o.col === 'function' ? o.col(u, v, out) : o.col;
    }, { closeU: full, orient: true, reference: (x, y, z) => { const a = Math.atan2(x, z); return [Math.sin(a), 0, Math.cos(a)]; } });
  }

  // ---- swept tube ----
  // points: [[x,y,z],...] smoothed with a Catmull-Rom spline. radius: number, [rx, ry] or fn(t) -> number | [rx, ry].
  function tube(shape, points, radius, o = {}) {
    const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(p[0], p[1], p[2])), !!o.closed, 'centripetal'), segments = Math.max(2, o.segments || points.length * 4), sides = Math.max(3, o.sides || 8);
    const frames = curve.computeFrenetFrames(segments, !!o.closed), pos = new T.Vector3(), col = o.col, capRows = o.caps === false || o.closed ? 0 : (o.capRows || 2), total = segments + capRows * 2;
    const radiusAt = t => { const r = typeof radius === 'function' ? radius(t) : radius; return Array.isArray(r) ? r : [r, r]; };
    const start = grid(shape, sides, total, (u, v, out) => {
      let j = Math.round(v * total) - capRows, shrink = 1, push = 0, t;
      if (j < 0) { const a = -j / capRows * Math.PI / 2; shrink = Math.cos(a); push = -Math.sin(a); j = 0; } else if (j > segments) { const a = (j - segments) / capRows * Math.PI / 2; shrink = Math.cos(a); push = Math.sin(a); j = segments; }
      t = j / segments; curve.getPointAt(t, pos); const N = frames.normals[j], B = frames.binormals[j], Tn = frames.tangents[j], r = radiusAt(t), a = u * TAU + (o.twist ? o.twist * t : 0), cx = Math.cos(a) * r[0] * shrink, cy = Math.sin(a) * r[1] * shrink, cap = push * Math.min(r[0], r[1]) * (o.capScale ?? 1);
      out.x = pos.x + N.x * cx + B.x * cy + Tn.x * cap; out.y = pos.y + N.y * cx + B.y * cy + Tn.y * cap; out.z = pos.z + N.z * cx + B.z * cy + Tn.z * cap; out.col = typeof col === 'function' ? col(t, u, out) : col;
    }, { closeU: true, poleStart: capRows > 0, poleEnd: capRows > 0 });
    return start;
  }

  // ---- solids ----
  // Ellipsoid, optionally reshaped by warp(x,y,z,out) in unit-sphere space before scaling.
  function ellipsoid(shape, cx, cy, cz, rx, ry, rz, o = {}) {
    const nu = Math.max(6, o.nu || 16), nv = Math.max(4, o.nv || 10), col = o.col, w = [0, 0, 0];
    return grid(shape, nu, nv, (u, v, out) => {
      const phi = v * Math.PI, theta = u * TAU; let x = Math.sin(phi) * Math.sin(theta), y = Math.cos(phi), z = Math.sin(phi) * Math.cos(theta);
      if (o.warp) { w[0] = x; w[1] = y; w[2] = z; o.warp(x, y, z, w); x = w[0]; y = w[1]; z = w[2]; }
      out.x = cx + x * rx; out.y = cy + y * ry; out.z = cz + z * rz; out.col = typeof col === 'function' ? col(x, y, z, out) : col;
    }, { closeU: true, poleStart: true, poleEnd: true });
  }
  // Box with rounded edges and corners (a superellipsoid-like blend, so it stays one smooth watertight piece).
  function roundBox(shape, cx, cy, cz, sx, sy, sz, radius, o = {}) {
    const r = Math.min(radius ?? Math.min(sx, sy, sz) * .18, sx / 2, sy / 2, sz / 2), seg = Math.max(1, o.segments || 3), col = o.col, start = shape.count, firstIndex = shape.i.length;
    const hx = sx / 2 - r, hy = sy / 2 - r, hz = sz / 2 - r, n = seg * 2 + 1, index = new Map();
    // Six faces of a cube grid whose points are pushed out from the inner box along the rounded direction.
    const add = (ax, ay, az) => { const key = ax + ',' + ay + ',' + az; let id = index.get(key); if (id !== undefined) return id; const x = ax / n * 2 - 1, y = ay / n * 2 - 1, z = az / n * 2 - 1; const ix = clamp(x * (sx / 2), -hx, hx), iy = clamp(y * (sy / 2), -hy, hy), iz = clamp(z * (sz / 2), -hz, hz); let dx = x * (sx / 2) - ix, dy = y * (sy / 2) - iy, dz = z * (sz / 2) - iz; const len = Math.hypot(dx, dy, dz); if (len > 1e-9) { dx = dx / len * r; dy = dy / len * r; dz = dz / len * r; } const px = cx + ix + dx, py = cy + iy + dy, pz = cz + iz + dz; id = shape.vertex(px, py, pz, typeof col === 'function' ? col(px, py, pz) : col, ax / n, ay / n); index.set(key, id); return id; };
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      shape.quad(add(i, j, n), add(i + 1, j, n), add(i + 1, j + 1, n), add(i, j + 1, n)); shape.quad(add(i, j, 0), add(i, j + 1, 0), add(i + 1, j + 1, 0), add(i + 1, j, 0));
      shape.quad(add(n, i, j), add(n, i + 1, j), add(n, i + 1, j + 1), add(n, i, j + 1)); shape.quad(add(0, i, j), add(0, i, j + 1), add(0, i + 1, j + 1), add(0, i + 1, j));
      shape.quad(add(i, n, j), add(i, n, j + 1), add(i + 1, n, j + 1), add(i + 1, n, j)); shape.quad(add(i, 0, j), add(i + 1, 0, j), add(i + 1, 0, j + 1), add(i, 0, j + 1));
    }
    shape.orient(start, firstIndex); return start;
  }
  // Surface of revolution around Y from a profile [[radius, y], ...]. Smooth unless o.smooth === false.
  function lathe(shape, profile, o = {}) {
    const sides = Math.max(5, o.sides || 20), col = o.col, pts = o.smooth === false ? profile : new T.SplineCurve(profile.map(p => new T.Vector2(p[0], p[1]))).getPoints(Math.max(profile.length, o.rows || profile.length * 3)).map(p => [Math.max(0, p.x), p.y]);
    const n = pts.length - 1, closedStart = pts[0][0] < 1e-6, closedEnd = pts[n][0] < 1e-6, sx = o.scaleX ?? 1, sz = o.scaleZ ?? 1, ox = o.x || 0, oy = o.y || 0, oz = o.z || 0;
    return grid(shape, sides, n, (u, v, out) => { const p = pts[Math.round(v * n)], a = u * TAU; out.x = ox + Math.sin(a) * p[0] * sx; out.y = oy + p[1]; out.z = oz + Math.cos(a) * p[0] * sz; out.col = typeof col === 'function' ? col(a, p[1], out) : col; }, { closeU: true, poleStart: closedStart, poleEnd: closedEnd });
  }
  // Flat outline [[x,y],...] extruded along z with rounded front and back edges.
  function slab(shape, outline, depth, o = {}) {
    const n = outline.length, bevel = Math.min(o.bevel ?? depth * .3, depth / 2), col = o.col, rows = [[-depth / 2, -bevel], [-depth / 2 + bevel, 0], [depth / 2 - bevel, 0], [depth / 2, -bevel]], start = shape.count, firstIndex = shape.i.length;
    let cx = 0, cy = 0; for (const p of outline) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n; const z0 = o.z || 0;
    const inset = (p, d) => { const dx = p[0] - cx, dy = p[1] - cy, len = Math.hypot(dx, dy) || 1; return [p[0] + dx / len * d, p[1] + dy / len * d]; };
    grid(shape, n, rows.length - 1, (u, v, out) => { const i = Math.round(u * n) % n, r = rows[Math.round(v * (rows.length - 1))], p = inset(outline[i], r[1]); out.x = p[0]; out.y = p[1]; out.z = z0 + r[0]; out.col = col; }, { closeU: true, orient: false });
    const back = shape.vertex(cx, cy, z0 - depth / 2, col), front = shape.vertex(cx, cy, z0 + depth / 2, col), base = start, lastRow = start + (rows.length - 1) * n;
    for (let i = 0; i < n; i++) { shape.tri(back, base + (i + 1) % n, base + i); shape.tri(front, lastRow + i, lastRow + (i + 1) % n); }
    shape.orient(start, firstIndex); return start;
  }

  // ---- materials ----
  // Every Forge material multiplies its colour by the vertex colour, so one material serves any palette.
  // `detail` adds a procedural surface in object space (no textures or UV unwrapping needed).
  const quality = { micro: true };
  const SHADER_NOISE = `
float forgeHash(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}
float forgeNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(forgeHash(i),forgeHash(i+vec3(1,0,0)),f.x),mix(forgeHash(i+vec3(0,1,0)),forgeHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(forgeHash(i+vec3(0,0,1)),forgeHash(i+vec3(1,0,1)),f.x),mix(forgeHash(i+vec3(0,1,1)),forgeHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float forgeFbm(vec3 p){return forgeNoise(p)*.55+forgeNoise(p*2.07+3.1)*.3+forgeNoise(p*4.3+7.7)*.15;}
// Screen-space fade so a pattern finer than a pixel turns itself off instead of shimmering.
float forgeFade(vec3 p,float feature){float px=max(length(dFdx(p)),length(dFdy(p)));return 1.-smoothstep(.1,.42,px/feature);}
vec3 forgeBump(vec3 viewPos,vec3 n,float h,float scale){vec3 dpx=dFdx(viewPos),dpy=dFdy(viewPos);float hx=dFdx(h),hy=dFdy(h);vec3 r1=cross(dpy,n),r2=cross(n,dpx);float det=dot(dpx,r1);vec3 g=sign(det)*(hx*r1+hy*r2);return normalize(abs(det)*n-scale*g);}
`;
  // Each detail returns (height 0..1, colour multiplier, roughness offset) from the object-space position p (metres).
  const DETAILS = {
    cotton: { bump: .0009, body: `float fine=forgeFade(p,.0016);float w=(sin(p.x*3900.)*sin(p.y*3900.+p.z*900.)*.5+.5)*fine;float soft=forgeFbm(p*38.);h=w*.6+soft*.4;tone=1.+(soft-.5)*.10+(w-.5)*.05*fine;rough=(soft-.5)*.10;` },
    jersey: { bump: .0007, body: `float fine=forgeFade(p,.0014);float w=(sin((p.x+p.z)*4300.)*.5+.5)*fine;float soft=forgeFbm(p*30.);h=w*.5+soft*.5;tone=1.+(soft-.5)*.08;rough=(soft-.5)*.08;` },
    denim: { bump: .0012, body: `float fine=forgeFade(p,.0020);float tw=(sin((p.x+p.z)*2600.+p.y*2600.)*.5+.5)*fine;float worn=forgeFbm(p*vec3(26.,9.,26.));float speck=forgeNoise(p*900.)*forgeFade(p,.003);h=tw*.55+worn*.45;tone=.86+worn*.26+(tw-.5)*.10+(speck-.5)*.10;rough=(worn-.5)*.16;` },
    knit: { bump: .0022, body: `float fine=forgeFade(p,.006);float rib=pow(abs(sin((p.x+p.z*.6)*520.)),.6)*fine;float loop=(sin(p.y*1300.)*.5+.5)*forgeFade(p,.003);float soft=forgeFbm(p*24.);h=rib*.7+loop*.15+soft*.15;tone=.92+rib*.10+(soft-.5)*.08;rough=.04;` },
    wool: { bump: .0016, body: `float soft=forgeFbm(p*55.);float fuzz=forgeNoise(p*1400.)*forgeFade(p,.002);h=soft*.7+fuzz*.3;tone=.93+soft*.12+(fuzz-.5)*.08;rough=.05;` },
    leather: { bump: .0011, body: `float grain=forgeFbm(p*420.)*forgeFade(p,.006);float crease=forgeFbm(p*46.);h=grain*.6+crease*.4;tone=.9+crease*.18+(grain-.5)*.06;rough=(crease-.5)*.22-.03;` },
    nylon: { bump: .0005, body: `float fine=forgeFade(p,.0018);float rip=(max(step(.94,fract(p.x*260.)),step(.94,fract(p.y*260.))))*forgeFade(p,.008);float w=(sin(p.x*5200.)*sin(p.y*5200.)*.5+.5)*fine;h=w*.4+rip*.6;tone=1.-rip*.05;rough=-rip*.06;` },
    canvas: { bump: .0012, body: `float fine=forgeFade(p,.0028);float w=(sin(p.x*2200.)*sin(p.y*2200.+p.z*400.)*.5+.5)*fine;float soft=forgeFbm(p*40.);h=w*.7+soft*.3;tone=.95+soft*.1+(w-.5)*.08*fine;rough=.03;` },
    rubber: { bump: .0006, body: `float soft=forgeFbm(p*160.)*forgeFade(p,.01);h=soft;tone=.96+soft*.08;rough=(soft-.5)*.1;` },
    skin: { bump: .00018, body: `float pore=forgeFbm(p*820.)*forgeFade(p,.0040);float mottle=forgeFbm(p*46.);h=pore;tone=.985+mottle*.03;rough=(mottle-.5)*.08+(pore-.5)*.04;` },
    hair: { bump: .0011, uv: true, body: `float fine=forgeFade(p,.006);float st=forgeNoise(vec3(vForgeUv.x*230.,vForgeUv.y*4.,p.y*2.))*fine;float clump=forgeNoise(vec3(vForgeUv.x*38.,vForgeUv.y*2.,3.));h=st*.55+clump*.45;tone=.80+(st-.5)*.3*fine+clump*.22;rough=(st-.5)*.2*fine+(clump-.5)*.12;` },
    fur: { bump: .003, body: `float st=forgeNoise(p*vec3(260.,60.,260.));float clump=forgeFbm(p*40.);h=st*.6+clump*.4;tone=.8+st*.25+clump*.15;rough=.05;` },
    paint: { bump: .00012, body: `float peel=forgeFbm(p*240.)*forgeFade(p,.012);h=peel;tone=1.;rough=0.;` },
    metal: { bump: .0003, body: `float brush=forgeNoise(p*vec3(40.,1800.,40.))*forgeFade(p,.002);float wear=forgeFbm(p*30.);h=brush;tone=.94+wear*.12;rough=(brush-.5)*.2+(wear-.5)*.15;` },
    plastic: { bump: .0003, body: `float grain=forgeFbm(p*900.)*forgeFade(p,.003);h=grain;tone=1.;rough=(grain-.5)*.12;` },
    concrete: { bump: .003, body: `float big=forgeFbm(p*3.);float mid=forgeFbm(p*26.);float fine=forgeNoise(p*300.)*forgeFade(p,.01);h=mid*.6+fine*.4;tone=.86+big*.2+(mid-.5)*.14;rough=(mid-.5)*.2;` },
    stone: { bump: .012, body: `float big=forgeFbm(p*1.6);float mid=forgeFbm(p*9.);float fine=forgeFbm(p*70.)*forgeFade(p,.03);h=mid*.65+fine*.35;tone=.78+big*.28+(mid-.5)*.2;rough=(mid-.5)*.25;` },
    bark: { bump: .014, body: `float ridge=forgeNoise(p*vec3(34.,5.,34.));float crack=pow(abs(ridge-.5)*2.,.6);float fine=forgeFbm(p*vec3(120.,30.,120.))*forgeFade(p,.02);h=crack*.7+fine*.3;tone=.7+crack*.36+(fine-.5)*.12;rough=.08;` },
    leaf: { bump: .004, body: `float big=forgeFbm(p*5.);float mid=forgeFbm(p*31.);h=mid;tone=.8+big*.26+(mid-.5)*.18;rough=(mid-.5)*.2;` },
    asphalt: { bump: .004, body: `float big=forgeFbm(p*.7);float stone=forgeNoise(p*130.)*forgeFade(p,.02);float mid=forgeFbm(p*11.);h=stone*.7+mid*.3;tone=.86+big*.14+(stone-.5)*.22+(mid-.5)*.1;rough=(stone-.5)*.2;` },
    soil: { bump: .008, body: `float big=forgeFbm(p*1.3);float mid=forgeFbm(p*14.);float fine=forgeFbm(p*90.)*forgeFade(p,.03);h=mid*.6+fine*.4;tone=.8+big*.24+(mid-.5)*.18;rough=.06;` }
  };
  const materialCache = new Map();
  // material('cotton'), material('leather', {roughness:.45}), material('plain', {metalness:.9, roughness:.25}) ...
  function material(detail = 'plain', o = {}) {
    const micro = quality.micro && DETAILS[detail] && o.micro !== false, key = [detail, micro ? 1 : 0, o.roughness, o.metalness, o.sheen, o.clearcoat, o.transparent ? o.opacity : '', o.side, o.emissive, o.flat ? 1 : 0, o.tag].join('|');
    let m = materialCache.get(key); if (m) return m;
    const base = { vertexColors: true, color: 0xffffff, roughness: o.roughness ?? DEFAULT_ROUGHNESS[detail] ?? .8, metalness: o.metalness ?? (detail === 'metal' ? .85 : 0), flatShading: !!o.flat };
    if (o.transparent) { base.transparent = true; base.opacity = o.opacity ?? .5; base.depthWrite = false; }
    if (o.side !== undefined) base.side = o.side;
    if (o.emissive) { base.emissive = new T.Color(o.emissive); base.emissiveIntensity = o.emissiveIntensity ?? 1; }
    const physical = quality.micro && (o.sheen || o.clearcoat);
    if (physical) { if (o.sheen) { base.sheen = o.sheen; base.sheenRoughness = o.sheenRoughness ?? .5; base.sheenColor = new T.Color(o.sheenColor || '#ffffff'); } if (o.clearcoat) { base.clearcoat = o.clearcoat; base.clearcoatRoughness = o.clearcoatRoughness ?? .1; } }
    m = physical ? new T.MeshPhysicalMaterial(base) : new T.MeshStandardMaterial(base); m.name = 'forge:' + detail; m.userData.forge = detail;
    if (micro) {
      const d = DETAILS[detail], bump = (o.bump ?? 1) * d.bump;
      m.onBeforeCompile = shader => {
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vForgePos;' + (d.uv ? '\nvarying vec2 vForgeUv;' : '')).replace('#include <begin_vertex>', '#include <begin_vertex>\nvForgePos=position;' + (d.uv ? '\nvForgeUv=uv;' : ''));
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vForgePos;' + (d.uv ? '\nvarying vec2 vForgeUv;' : '') + SHADER_NOISE)
          .replace('#include <color_fragment>', '#include <color_fragment>\nfloat forgeH=0.,forgeTone=1.,forgeRough=0.;{vec3 p=vForgePos;float h=0.,tone=1.,rough=0.;' + d.body + 'forgeH=h;forgeTone=tone;forgeRough=rough;}\ndiffuseColor.rgb*=forgeTone;')
          .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+forgeRough,.05,1.);')
          .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal=forgeBump(-vViewPosition,normal,forgeH,' + bump.toFixed(6) + ');');
      };
      m.customProgramCacheKey = () => 'forge-' + detail + '-' + bump.toFixed(6);
    }
    materialCache.set(key, m); return m;
  }
  const DEFAULT_ROUGHNESS = { cotton: .9, jersey: .88, denim: .86, knit: .95, wool: .96, leather: .5, nylon: .55, canvas: .92, rubber: .78, skin: .56, hair: .5, fur: .9, paint: .32, metal: .34, plastic: .45, concrete: .92, stone: .93, bark: .95, leaf: .7, asphalt: .93, soil: .97, plain: .8 };
  // Build a Mesh from a Shape with the usual shadow flags.
  function mesh(shape, mat, parent, name) { const m = new T.Mesh(shape.geometry(), mat); m.castShadow = true; m.receiveShadow = true; if (name) m.name = name; if (parent) parent.add(m); return m; }
  // Merge Forge geometries (position, normal, color, uv) into one BufferGeometry.
  function mergeGeometries(list) {
    let vertices = 0, indices = 0; for (const g of list) { vertices += g.attributes.position.count; indices += g.index ? g.index.count : g.attributes.position.count; }
    const p = new Float32Array(vertices * 3), n = new Float32Array(vertices * 3), c = new Float32Array(vertices * 3).fill(1), uv = new Float32Array(vertices * 2), idx = vertices > 65535 ? new Uint32Array(indices) : new Uint16Array(indices); let vo = 0, io = 0;
    for (const g of list) {
      const count = g.attributes.position.count; p.set(g.attributes.position.array.subarray(0, count * 3), vo * 3); if (g.attributes.normal) n.set(g.attributes.normal.array.subarray(0, count * 3), vo * 3);
      if (g.attributes.color) c.set(g.attributes.color.array.subarray(0, count * 3), vo * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array.subarray(0, count * 2), vo * 2);
      if (g.index) { const a = g.index.array; for (let k = 0; k < g.index.count; k++) idx[io++] = a[k] + vo; } else for (let k = 0; k < count; k++) idx[io++] = k + vo;
      vo += count;
    }
    const out = new T.BufferGeometry(); out.setAttribute('position', new T.BufferAttribute(p, 3)); out.setAttribute('normal', new T.BufferAttribute(n, 3)); out.setAttribute('color', new T.BufferAttribute(c, 3)); out.setAttribute('uv', new T.BufferAttribute(uv, 2)); out.setIndex(new T.BufferAttribute(idx, 1)); return out;
  }

  root.PlatdoForge = { THREE: T, Shape, grid, surface, surfaceFrom, loft, patch, tube, ellipsoid, roundBox, lathe, slab, material, mesh, mergeGeometries, rgb, tint, blend, noise3, fbm3, hash3, rng, clamp, mix, smooth, TAU, quality, DETAILS,
    setQuality(level) { const micro = level !== 'low' && level !== false; if (quality.micro !== micro) { quality.micro = micro; materialCache.clear(); } }, materials: materialCache };
})(typeof globalThis !== 'undefined' ? globalThis : this);
