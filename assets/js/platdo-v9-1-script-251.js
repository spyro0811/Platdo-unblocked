
/* PLATDO CITY - the look of the ground (V6.2). Client only: nothing here is part of the shared world, so the
 * multiplayer host needs no copy of it.
 *   tone()          wide patches of lush and dry grass, drier on high ground (multiplies the land's vertex colour)
 *   dressTerrain()  the ground's own shader gains mottling at three sizes, straw-coloured and bare-soil patches,
 *                   and rock and soil where the land is steep
 *   dressMaterial() asphalt with aggregate, worn patches and hairline cracks; concrete for the pavements
 *   Grass           tufts of blades on open land round the camera, swaying a little
 *   scatter()       drifts of shrubs and stones on open land
 * Everything keeps off roads, pavements, floors, sand, bare earth and water by reading one mask of the island. */
(function (root) {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), mix = (a, b, t) => a + (b - a) * t, smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hash = (x, z, s = 0) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263) ^ Math.imul((s | 0) + 1, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function value(x, z, s) { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz); return mix(mix(hash(ix, iz, s), hash(ix + 1, iz, s), ux), mix(hash(ix, iz + 1, s), hash(ix + 1, iz + 1, s), ux), uz); }
  // 0 lush .. 1 dry, in patches a few hundred metres across.
  const dryness = (x, z) => clamp(value(x / 310, z / 310, 11) * .62 + value(x / 97, z / 97, 12) * .38, 0, 1);
  function tone(x, z, y) {
    const dry = clamp(smooth(.44, .72, dryness(x, z)) * .8 + smooth(30, 100, y) * .25, 0, 1), v = 1 + (value(x / 43, z / 43, 13) - .5) * .12;
    return [v * mix(.93, 1.22, dry), v * mix(.99, 1.05, dry), v * mix(1, .7, dry)];
  }

  // ---- one tiling texture of noise: R fine, G middle-sized blotches, B wide blotches, A thin veins ----
  let texture = null;
  function groundTexture(T) {
    if (texture) return texture;
    const N = 256, data = new Uint8Array(N * N * 4);
    const tile = (x, z, cells, s) => { const fx = x / N * cells, fz = z / N * cells, ix = Math.floor(fx), iz = Math.floor(fz), tx = fx - ix, tz = fz - iz, ux = tx * tx * (3 - 2 * tx), uz = tz * tz * (3 - 2 * tz), h = (a, b) => hash(((a % cells) + cells) % cells, ((b % cells) + cells) % cells, s); return mix(mix(h(ix, iz), h(ix + 1, iz), ux), mix(h(ix, iz + 1), h(ix + 1, iz + 1), ux), uz); };
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      const i = (z * N + x) * 4, fine = tile(x, z, 128, 1) * .55 + tile(x, z, 64, 2) * .45, mid = tile(x, z, 8, 3) * .5 + tile(x, z, 16, 4) * .3 + tile(x, z, 32, 5) * .2, big = tile(x, z, 4, 6) * .6 + tile(x, z, 8, 7) * .4, ridge = 1 - Math.abs(2 * (tile(x, z, 6, 8) * .6 + tile(x, z, 12, 9) * .4) - 1);
      data[i] = fine * 255; data[i + 1] = clamp((mid - .5) * 1.5 + .5, 0, 1) * 255; data[i + 2] = clamp((big - .5) * 1.6 + .5, 0, 1) * 255; data[i + 3] = Math.pow(ridge, 7) * 255;
    }
    texture = new T.DataTexture(data, N, N, T.RGBAFormat); texture.wrapS = texture.wrapT = T.RepeatWrapping; texture.magFilter = T.LinearFilter; texture.minFilter = T.LinearMipmapLinearFilter; texture.generateMipmaps = true; texture.needsUpdate = true;
    return texture;
  }

  // ---- the land ----
  const GROUND = [
    'vec2 gp=vGroundPos.xz;',
    'vec4 gA=texture2D(cityGround,gp*.31);vec4 gB=texture2D(cityGround,gp*.043+vec2(.31,.17));vec4 gC=texture2D(cityGround,gp*.0067+vec2(.57,.83));',
    'float gGrass=smoothstep(1.05,1.30,vColor.g/max(vColor.r,.001));',
    'float gMottle=(gA.r-.5)*.24+(gA.g-.5)*.22+(gB.g-.5)*.30+(gC.b-.5)*.20;',
    'diffuseColor.rgb*=1.0+gMottle*mix(.35,1.0,gGrass);',
    'float gDry=smoothstep(.50,.72,gC.g*.55+gB.b*.45)*gGrass;',
    'diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.30,1.12,.66),gDry*.6);',
    'float gSoil=smoothstep(.66,.84,gB.g*.55+gA.g*.45)*smoothstep(.40,.60,gC.b)*gGrass;',
    'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.23,.18,.11),gSoil*.55);',
    'float gSteep=smoothstep(.95,.80,vGroundUp)*gGrass*smoothstep(.30,.62,gB.b*.42+gA.g*.24+gC.r*.34)*smoothstep(.32,.58,gC.a);',
    'vec3 gRock=mix(vec3(.30,.26,.20),vec3(.17,.145,.115),gB.g)*(.78+.3*gA.a+.34*gA.r);',
    'diffuseColor.rgb=mix(diffuseColor.rgb,gRock,gSteep*.9);'
  ].join('\n');
  function dressTerrain(scene, material) {
    const tex = groundTexture(scene.T), before = material.onBeforeCompile, key = material.customProgramCacheKey;
    material.onBeforeCompile = (shader, renderer) => {
      if (before) before.call(material, shader, renderer);
      shader.uniforms.cityGround = { value: tex };
      shader.vertexShader = 'varying vec3 vGroundPos;\nvarying float vGroundUp;\n' + shader.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvGroundPos=(modelMatrix*vec4(transformed,1.0)).xyz;\nvGroundUp=normalize(mat3(modelMatrix)*objectNormal).y;');
      shader.fragmentShader = 'uniform sampler2D cityGround;\nvarying vec3 vGroundPos;\nvarying float vGroundUp;\n' + shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + GROUND);
    };
    material.customProgramCacheKey = () => (key ? key.call(material) : '') + '|city-ground-v1';
    material.needsUpdate = true;
  }

  // ---- roads and pavements ----
  const WORLD_VERTEX = ['#include <worldpos_vertex>', 'vec4 cityPosition = vec4(transformed,1.0);', '#ifdef USE_INSTANCING', 'cityPosition=instanceMatrix*cityPosition;', '#endif', 'vCityWorld=(modelMatrix*cityPosition).xyz;'].join('\n');
  const ASPHALT = [
    'vec2 ap=vCityWorld.xz;float aw=fwidth(ap.x)+fwidth(ap.y),aNear=1.0-smoothstep(.015,.07,aw);',
    'float aGrain=fract(sin(dot(floor(ap*36.0),vec2(12.9898,78.233)))*43758.5453);',
    'float aStone=step(.93,fract(sin(dot(floor(ap*21.0),vec2(41.17,7.31)))*15731.743));',
    'vec4 aM=texture2D(cityGround,ap*.19+vec2(.2,.6));vec4 aL=texture2D(cityGround,ap*.037);vec4 aC=texture2D(cityGround,ap*.41+vec2(.7,.3));',
    'float aPatch=(aL.g-.5)*.30+(aM.g-.5)*.14+(aL.b-.5)*.12;',
    'float aCrack=smoothstep(.82,.99,aC.a)*smoothstep(.55,.72,aL.b)*(1.0-smoothstep(.03,.16,aw));',
    'diffuseColor.rgb*=(1.0+((aGrain-.5)*.16+aStone*.18)*aNear)*(1.0+aPatch)*(1.0-aCrack*.3);'
  ].join('\n');
  const PAVE = [
    'vec2 pp=vCityWorld.xz;float pw=fwidth(pp.x)+fwidth(pp.y);',
    'vec4 pM=texture2D(cityGround,pp*.23);vec4 pL=texture2D(cityGround,pp*.031+vec2(.4,.1));',
    'float pGrain=(fract(sin(dot(floor(pp*30.0),vec2(12.9898,78.233)))*43758.5453)-.5)*(1.0-smoothstep(.02,.09,pw));',
    'diffuseColor.rgb*=(1.0+pGrain*.08)*(1.0+(pL.g-.5)*.18+(pM.b-.5)*.09)*(1.0-smoothstep(.7,.97,pM.a)*.09);'
  ].join('\n');
  const TARMAC = new Set(['#414e54', '#4d5558']), CONCRETE = new Set(['#7c8386', '#8b9391', '#8f9698', '#939b96', '#adb7ad', '#b3b8b0', '#b9bdb0', '#c3c6ba']);
  function dressMaterial(scene, material, color, kind) {
    const asphalt = TARMAC.has(color) && kind === 'matte'; if (!asphalt && kind !== 'pave' && !(CONCRETE.has(color) && kind === 'matte')) return;
    const tex = groundTexture(scene.T), pattern = asphalt ? ASPHALT : PAVE;
    if (asphalt) { material.color.set('#55524e'); material.roughness = .94; material.userData.dryColor = '#55524e'; material.userData.dryRoughness = .94; }
    material.onBeforeCompile = shader => {
      shader.uniforms.cityGround = { value: tex };
      shader.vertexShader = 'varying vec3 vCityWorld;\n' + shader.vertexShader.replace('#include <worldpos_vertex>', WORLD_VERTEX);
      shader.fragmentShader = 'uniform sampler2D cityGround;\nvarying vec3 vCityWorld;\n' + shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + pattern);
    };
    material.customProgramCacheKey = () => asphalt ? 'city-asphalt-v2' : 'city-pave-v1';
  }

  // ---- where plants may grow ----
  // One bit for every half-metre square of the island, set where something is built, paved or drawn. Roads, paved
  // surfaces, buildings and solid things are stamped from the world's own lists. Then every object the scene draws
  // is stamped too (V6.21): floors, driveways, paths and porches are often drawn without being solid, and grass
  // must come up through bare ground only.
  const CELL = .5, SIZE = 8000, HALF = 2000, STEP_STAMP = .33;
  function makeMask() {
    const bits = new Uint8Array((SIZE * SIZE) >> 3);
    const put = (x, z) => { const ix = Math.floor((x + HALF) / CELL), iz = Math.floor((z + HALF) / CELL); if (ix >= 0 && iz >= 0 && ix < SIZE && iz < SIZE) { const k = iz * SIZE + ix; bits[k >> 3] |= 1 << (k & 7); } };
    const get = (x, z) => { const ix = Math.floor((x + HALF) / CELL), iz = Math.floor((z + HALF) / CELL); if (ix < 0 || iz < 0 || ix >= SIZE || iz >= SIZE) return true; const k = iz * SIZE + ix; return (bits[k >> 3] & (1 << (k & 7))) !== 0; };
    // A slanted rectangle: its centre and its two half-sides. A large one whose corners and middle are all taken
    // already (a road's own surface inside the road's band) is not walked again.
    const quad = (cx, cz, ax, az, bx, bz) => {
      const la = Math.hypot(ax, az), lb = Math.hypot(bx, bz); if (!(la < 1500) || !(lb < 1500)) return;
      if (la + lb > 2 && get(cx, cz) && get(cx + ax + bx, cz + az + bz) && get(cx + ax - bx, cz + az - bz) && get(cx - ax + bx, cz - az + bz) && get(cx - ax - bx, cz - az - bz) && get(cx + ax * .5, cz + az * .5) && get(cx - ax * .5, cz - az * .5)) return;
      const na = Math.max(1, Math.ceil(la * 2 / STEP_STAMP)), nb = Math.max(1, Math.ceil(lb * 2 / STEP_STAMP));
      for (let i = 0; i <= na; i++) { const u = i / na * 2 - 1; for (let j = 0; j <= nb; j++) { const v = j / nb * 2 - 1; put(cx + ax * u + bx * v, cz + az * u + bz * v); } }
    };
    const triangle = (ax, az, bx, bz, cx, cz) => {
      const edge = Math.max(Math.hypot(bx - ax, bz - az), Math.hypot(cx - ax, cz - az), Math.hypot(cx - bx, cz - bz)); if (!(edge < 1500)) return;
      if (edge > 2 && get(ax, az) && get(bx, bz) && get(cx, cz) && get((ax + bx + cx) / 3, (az + bz + cz) / 3)) return;
      const n = Math.max(1, Math.ceil(edge / STEP_STAMP));
      for (let i = 0; i <= n; i++) for (let j = 0; j <= n - i; j++) put(ax + (bx - ax) * i / n + (cx - ax) * j / n, az + (bz - az) * i / n + (cz - az) * j / n);
    };
    return { bits, put, get, quad, triangle };
  }
  function stampWorld(mask, world) {
    const band = (ax, az, bx, bz, half) => { const len = Math.hypot(bx - ax, bz - az) || 1, tx = (bx - ax) / len, tz = (bz - az) / len; mask.quad((ax + bx) / 2, (az + bz) / 2, tx * (len / 2 + half * .5), tz * (len / 2 + half * .5), -tz * half, tx * half); };
    const rect = (x, z, w, d, pad) => { if (Number.isFinite(x) && Number.isFinite(z) && w > 0 && d > 0) mask.quad(x, z, w / 2 + pad, 0, 0, d / 2 + pad); };
    for (const r of world.roads || []) band(r.a.x, r.a.z, r.b.x, r.b.z, r.width / 2 + 3.3);
    for (const s of world.facilitySurfaces || []) for (let i = 1; i < s.points.length; i++) band(s.points[i - 1].x, s.points[i - 1].z, s.points[i].x, s.points[i].z, (s.width || 4) / 2 + .4);
    for (const b of world.buildings || []) rect(b.x, b.z, b.w, b.d, .4);
    for (const s of world.services || []) rect(s.x, s.z, s.w, s.d, .4);
    for (const s of world.interiors || []) rect(s.x, s.z, s.w, s.d, .3);
    for (const c of world.colliders || []) {
      if (!(c.maxX - c.minX < 420) || !(c.maxZ - c.minZ < 420)) continue;
      const cx = (c.minX + c.maxX) / 2, cz = (c.minZ + c.maxZ) / 2; if (c.minY > world.terrainHeight(cx, cz) + .7) continue;
      mask.quad(cx, cz, (c.maxX - c.minX) / 2 + .25, 0, 0, (c.maxZ - c.minZ) / 2 + .25);
    }
  }
  // Stamps what one drawn object covers, seen from above. Leaves and fronds are left out (grass grows under
  // trees); so are the land itself, the sea, and this file's own grass and shrubs.
  function stampObject(mask, scene, o, T) {
    if (o.userData.groundStamped) return 0; o.userData.groundStamped = true;
    if (!o.isMesh || o.isSkinnedMesh || o === scene.water) return 0;
    const g = o.geometry, material = Array.isArray(o.material) ? o.material[0] : o.material; if (!g || !g.attributes || !g.attributes.position || !material) return 0;
    const shape = g.userData && g.userData.citySharedShape; if (shape === 'flora-leaf' || shape === 'frond') return 0;
    const key = typeof material.customProgramCacheKey === 'function' ? String(material.customProgramCacheKey()) : ''; if (key.startsWith('foliage') || key === 'city-grass-v1') return 0;
    if (material.transparent && material.opacity < .97) return 0;
    if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox, sx = (bb.max.x - bb.min.x) / 2, sy = (bb.max.y - bb.min.y) / 2, sz = (bb.max.z - bb.min.z) / 2, mx = (bb.max.x + bb.min.x) / 2, my = (bb.max.y + bb.min.y) / 2, mz = (bb.max.z + bb.min.z) / 2;
    o.updateWorldMatrix(true, false); const W = o.matrixWorld;
    // One box: where its middle lands and how its three half-sides lie on the ground.
    const box = e => {
      const px = e[0] * mx + e[4] * my + e[8] * mz + e[12], pz = e[2] * mx + e[6] * my + e[10] * mz + e[14], ax = e[0] * sx, az = e[2] * sx, bx = e[8] * sz, bz = e[10] * sz, tx = e[4] * sy, tz = e[6] * sy;
      mask.quad(px, pz, ax, az, bx, bz);
      if (Math.hypot(tx, tz) > .3) { mask.quad(px, pz, ax, az, tx, tz); mask.quad(px, pz, bx, bz, tx, tz); mask.quad(px + tx, pz + tz, ax, az, bx, bz); mask.quad(px - tx, pz - tz, ax, az, bx, bz); }
    };
    if (o.isInstancedMesh) {
      const m = o.instanceMatrix.array, e = W.elements, plain = Math.abs(e[0] - 1) + Math.abs(e[5] - 1) + Math.abs(e[10] - 1) + Math.abs(e[12]) + Math.abs(e[13]) + Math.abs(e[14]) + Math.abs(e[4]) + Math.abs(e[8]) < 1e-6, a = new T.Matrix4(), b = new T.Matrix4();
      for (let i = 0; i < o.count; i++) { if (plain) box(m.subarray(i * 16, i * 16 + 16)); else { b.fromArray(m, i * 16); a.multiplyMatrices(W, b); box(a.elements); } }
      return o.count;
    }
    if (Math.max(sx, sz) <= 7) { box(W.elements); return 1; }
    // A large single mesh (a curved road, a whole building): each of its triangles.
    const p = g.attributes.position, index = g.index, e = W.elements, count = index ? index.count : p.count; if (count > 900000) return 0;
    const X = i => e[0] * p.getX(i) + e[4] * p.getY(i) + e[8] * p.getZ(i) + e[12], Z = i => e[2] * p.getX(i) + e[6] * p.getY(i) + e[10] * p.getZ(i) + e[14];
    for (let k = 0; k + 2 < count; k += 3) { const i0 = index ? index.getX(k) : k, i1 = index ? index.getX(k + 1) : k + 1, i2 = index ? index.getX(k + 2) : k + 2; mask.triangle(X(i0), Z(i0), X(i1), Z(i1), X(i2), Z(i2)); }
    return 1;
  }
  // Everything the scene draws now, and the district detail it keeps ready to show.
  function stampScene(scene) {
    const f = field(scene), T = scene.T; let stamped = 0;
    const walk = top => top.traverse(o => { if (o.name === 'terrain-graded' || o.name === 'ground-grass' || o.name === 'ground-scatter') { o.traverse(c => { c.userData.groundStamped = true; }); return; } if (o.isMesh) stamped += stampObject(f.mask, scene, o, T); });
    walk(scene.environment);
    for (const variants of (scene.preparedDistricts && scene.preparedDistricts.values()) || []) for (const group of new Set(Object.values(variants))) if (group && group.traverse) walk(group);
    return stamped;
  }
  function field(scene) {
    if (scene.groundField) return scene.groundField;
    const world = scene.world, mask = makeMask(), Beach = root.CityBeach, Park = root.CityRecreation, Island = root.CityIsland, airport = world.airport, runway = world.runway;
    stampWorld(mask, world);
    const paved = (x, z) => mask.get(x, z);
    // Open grass: nothing built, paved or drawn there or within a blade's reach, and not sand, bare earth,
    // airfield or shore.
    const open = (x, z) => {
      if (mask.get(x, z) || mask.get(x + .32, z) || mask.get(x - .32, z) || mask.get(x, z + .32) || mask.get(x, z - .32)) return false;
      if (root.CityWorld.landHeight(x, z) < 2.45) return false;
      if (Beach && Beach.weight(x, z) > .1) return false;
      if (Park) { const tint = Park.groundTint(x, z); if (tint && tint.w > .15) return false; }
      if (airport && runway && Island && x < -700) { const q = Island.runwayCoordinates(world, x, z), ap = airport.apron, pk = airport.parking; if (Math.abs(q.along) < runway.length / 2 + 22 && Math.abs(q.cross) < runway.width / 2 + 22 || Math.abs(q.along) < 382 && Math.abs(q.cross - 85) < 30 || Math.abs(x - ap.x) < ap.w / 2 + 22 && Math.abs(z - ap.z) < ap.d / 2 + 22 || Math.abs(x - pk.x) < pk.w / 2 + 22 && Math.abs(z - pk.z) < pk.d / 2 + 22) return false; }
      return true;
    };
    return scene.groundField = { mask, paved, open };
  }
  // The height of the ground as it is drawn (the mesh is coarser than the true terrain away from roads).
  function drawnHeight(grid, x, z) {
    const step = grid.step, ix = Math.floor((x + HALF) / step), iz = Math.floor((z + HALF) / step); if (ix < 0 || iz < 0 || ix >= grid.n || iz >= grid.n) return null;
    const H = (px, pz) => { const id = grid.vertices.get(px + ',' + pz); return id === undefined ? null : grid.positions[id * 3 + 1]; }, x0 = -HALF + ix * step, z0 = -HALF + iz * step;
    if (grid.fine.has(ix + ',' + iz)) {
      const a = Math.min(4, Math.floor((x - x0) / 4)), b = Math.min(4, Math.floor((z - z0) / 4)), px = x0 + a * 4, pz = z0 + b * 4, u = (x - px) / 4, v = (z - pz) / 4, h00 = H(px, pz), h10 = H(px + 4, pz), h11 = H(px + 4, pz + 4), h01 = H(px, pz + 4);
      if (h00 === null || h10 === null || h11 === null || h01 === null) return null;
      return u >= v ? h00 + (h10 - h00) * u + (h11 - h10) * v : h00 + (h01 - h00) * v + (h11 - h01) * u;
    }
    // A coarse square is a fan of triangles from its centre; an edge shared with a fine square has five parts.
    const cx = x0 + 10, cz = z0 + 10, lx = x - cx, lz = z - cz, edges = [[0, 0, 1, 0, ix, iz - 1], [20, 0, 0, 1, ix + 1, iz], [20, 20, -1, 0, ix, iz + 1], [0, 20, 0, -1, ix - 1, iz]];
    const e = -lz >= Math.abs(lx) ? 0 : lx >= Math.abs(lz) ? 1 : lz >= Math.abs(lx) ? 2 : 3, [ox, oz, dx, dz, nx, nz] = edges[e], count = grid.fine.has(nx + ',' + nz) ? 5 : 1;
    const reach = e === 0 ? -lz : e === 1 ? lx : e === 2 ? lz : -lx, k = reach > 1e-6 ? 10 / reach : 1, hx = cx + lx * k, hz = cz + lz * k, t = clamp(((hx - (x0 + ox)) * dx + (hz - (z0 + oz)) * dz) / 20, 0, .9999), j = Math.floor(t * count);
    const ax = x0 + ox + dx * j * 20 / count, az = z0 + oz + dz * j * 20 / count, bx = x0 + ox + dx * (j + 1) * 20 / count, bz = z0 + oz + dz * (j + 1) * 20 / count, hc = H(cx, cz), ha = H(ax, az), hb = H(bx, bz);
    if (hc === null || ha === null || hb === null) return null;
    const det = (ax - cx) * (bz - cz) - (bx - cx) * (az - cz); if (Math.abs(det) < 1e-9) return hc;
    const wa = (lx * (bz - cz) - (bx - cx) * lz) / det, wb = ((ax - cx) * lz - lx * (az - cz)) / det;
    return hc + (ha - hc) * wa + (hb - hc) * wb;
  }
  // The colour of grass at a place, as [r, g, b] in the 0..1 values of the colour picker.
  /* V7.2: where the hills begin on the smaller map (the line was z -450) */
  const HILL_LINE = globalThis.CityCompact ? globalThis.CityCompact.Z(-450) : -450;
  function grassColour(x, z, y, seed) {
    const base = z < HILL_LINE ? (y > 48 ? [.42, .52, .38] : [.45, .58, .35]) : x > 800 ? [.49, .61, .38] : [.51, .64, .38], k = tone(x, z, y), v = .82 + hash(seed, 3, 41) * .3, straw = y > 5 && hash(seed, 5, 42) < smooth(.5, .8, dryness(x, z)) * .5;
    if (straw) return [.72 * v, .66 * v, .40 * v];
    return [base[0] * k[0] * v * .92, base[1] * k[1] * v * .98, base[2] * k[2] * v * .82];
  }

  // ---- grass round the camera ----
  const RANGE = { potato: 0, low: 22, medium: 30, high: 38, epic: 44, ultra: 48, insane: 52 }, STEP = 1.05, KEEP = [1, .8, .6, .42], PER = 4;
  function tuftGeometry(T) {
    const pos = [], col = [], nrm = [], blades = 9;
    for (let i = 0; i < blades; i++) {
      const a = i / blades * Math.PI * 2 + hash(i, 3, 21) * 1.3, r = .03 + hash(i, 5, 22) * .12, h = .2 + hash(i, 7, 23) * .26, lean = .04 + hash(i, 9, 24) * .13, w = .03 + hash(i, 2, 25) * .02, cx = Math.cos(a) * r, cz = Math.sin(a) * r, dx = Math.cos(a + 1.7), dz = Math.sin(a + 1.7), shade = .68 + hash(i, 4, 26) * .2, tip = 1.0 + hash(i, 6, 27) * .2;
      pos.push(cx - dx * w, 0, cz - dz * w, cx + dx * w, 0, cz + dz * w, cx + Math.cos(a) * lean, h, cz + Math.sin(a) * lean);
      col.push(shade, shade, shade, shade, shade, shade, tip, tip, tip * .92); nrm.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3)); return g;
  }
  class Grass {
    constructor(scene) {
      const T = scene.T; this.scene = scene; this.cells = new Map(); this.centre = null; this.range = 0; this.limit = 14000;
      this.material = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide });
      this.material.onBeforeCompile = shader => { shader.uniforms.cityGrassTime = this.time = { value: 0 }; shader.vertexShader = 'uniform float cityGrassTime;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat grassPhase=cityGrassTime*1.6+instanceMatrix[3].x*.83+instanceMatrix[3].z*.61;transformed.x+=sin(grassPhase)*position.y*.11;transformed.z+=cos(grassPhase*.77)*position.y*.08;\n#endif'); shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal=normalize(vNormal);'); };
      this.material.customProgramCacheKey = () => 'city-grass-v1';
      this.mesh = new T.InstancedMesh(tuftGeometry(T), this.material, this.limit); this.mesh.name = 'ground-grass'; this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.receiveShadow = true; this.mesh.castShadow = false; this.mesh.matrixAutoUpdate = false;
      this.mesh.instanceColor = new T.InstancedBufferAttribute(new Float32Array(this.limit * 3), 3); this.colour = new T.Color();
      scene.environment.add(this.mesh);
    }
    // The tufts of one square: [x, y, z, turn, size, r, g, b] for each, worked out once and kept.
    cell(ix, iz) {
      const key = ix * 65536 + iz; let list = this.cells.get(key); if (list) return list;
      const f = field(this.scene), grid = this.scene.groundGrid; list = [];
      for (let k = 0; k < PER; k++) {
        const seed = (ix * 7919 + iz * 104729 + k * 31) | 0, x = (ix + hash(ix, iz, 50 + k)) * STEP, z = (iz + hash(ix, iz, 60 + k)) * STEP;
        if (!f.open(x, z) || hash(ix, iz, 70 + k) > .93) { list.push(null); continue; }
        const y = drawnHeight(grid, x, z); if (y === null) { list.push(null); continue; }
        const c = grassColour(x, z, y, seed); this.colour.setRGB(c[0], c[1], c[2], this.scene.T.SRGBColorSpace);
        list.push([x, y - .015, z, hash(ix, iz, 80 + k) * 6.283, (.75 + hash(ix, iz, 90 + k) * .7) * mix(.5, 1, smooth(3.2, 10, y)), this.colour.r, this.colour.g, this.colour.b]);
      }
      if (this.cells.size > 22000) this.cells.clear();
      this.cells.set(key, list); return list;
    }
    update(camera, time) {
      const scene = this.scene, range = RANGE[scene.graphics?.id] ?? 34; if (this.time) this.time.value = time;
      if (!range || !scene.groundGrid) { this.mesh.count = 0; return; }
      const focus = scene.groundFocus || camera.position, cx = focus.x, cz = focus.z;
      if (this.centre && this.range === range && Math.hypot(cx - this.centre.x, cz - this.centre.z) < .45) return;
      this.centre = { x: cx, z: cz }; this.range = range;
      const m = this.mesh.instanceMatrix.array, col = this.mesh.instanceColor.array, i0 = Math.floor((cx - range) / STEP), i1 = Math.floor((cx + range) / STEP), j0 = Math.floor((cz - range) / STEP), j1 = Math.floor((cz + range) / STEP); let n = 0;
      for (let ix = i0; ix <= i1; ix++) for (let iz = j0; iz <= j1; iz++) {
        const ddx = (ix + .5) * STEP - cx, ddz = (iz + .5) * STEP - cz; if (ddx * ddx + ddz * ddz > (range + 1) * (range + 1)) continue;
        const list = this.cell(ix, iz);
        for (let k = 0; k < PER; k++) {
          const t = list[k]; if (!t) continue; const d = Math.hypot(t[0] - cx, t[2] - cz), far = range * KEEP[k]; if (d >= far || n >= this.limit) continue;
          const s = t[4] * (1 - smooth(far * .62, far, d)), c = Math.cos(t[3]) * s, sn = Math.sin(t[3]) * s, o = n * 16;
          m[o] = c; m[o + 1] = 0; m[o + 2] = -sn; m[o + 3] = 0; m[o + 4] = 0; m[o + 5] = s; m[o + 6] = 0; m[o + 7] = 0; m[o + 8] = sn; m[o + 9] = 0; m[o + 10] = c; m[o + 11] = 0; m[o + 12] = t[0]; m[o + 13] = t[1]; m[o + 14] = t[2]; m[o + 15] = 1;
          col[n * 3] = t[5]; col[n * 3 + 1] = t[6]; col[n * 3 + 2] = t[7]; n++;
        }
      }
      this.mesh.count = n; this.mesh.instanceMatrix.needsUpdate = true; this.mesh.instanceColor.needsUpdate = true;
    }
  }
  // Stamps what the scene draws: all of it the first time, and after that whatever has been added since (district
  // detail comes and goes as you move). The shrubs and stones are laid out once, after the first stamping, and the
  // grass near you is laid out again whenever the stamping found something new.
  function settle(scene) {
    const first = !scene.groundSettled, stamped = stampScene(scene); scene.groundSettled = true;
    if (first) scatterNow(scene);
    if (stamped && scene.groundGrass) { scene.groundGrass.cells.clear(); scene.groundGrass.centre = null; }
  }
  function update(scene, dt) {
    if (scene.disposed || !scene.groundGrid) return;
    scene.groundTick = (scene.groundTick || 0) + 1; if (!scene.groundSettled || scene.groundTick % 20 === 0) settle(scene);
    // The lowest graphics setting lays out no shrubs; if the setting is raised later, they are laid out then.
    if (!scene.groundScatter && scene.graphics?.id && scene.graphics.id !== 'potato') scatterNow(scene);
    // The lowest graphics setting shows neither the shrubs and stones nor (through its range of 0) the grass.
    if (scene.groundScatter) scene.groundScatter.group.visible = scene.graphics?.id !== 'potato';
    (scene.groundGrass ||= new Grass(scene)).update(scene.camera, scene.time || 0);
  }

  // ---- shrubs and stones on open land, in drifts ----
  function lump(T, detail, squash, rough, seed) {
    // The corners of the faces are separate points, so each is moved by a rule of its place alone (the faces stay
    // joined) and takes a normal that points away from the middle (the lump shades as one rounded shape).
    const g = new T.IcosahedronGeometry(.5, detail), p = g.attributes.position, nrm = g.attributes.normal, v = new T.Vector3(), o = new T.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = value(v.x * 3.1 + seed, v.z * 3.1 + v.y * 2.3, 30 + seed) - .5; o.copy(v).normalize(); v.multiplyScalar(1 + n * rough); o.y /= squash; o.normalize(); nrm.setXYZ(i, o.x, o.y, o.z); p.setXYZ(i, v.x, v.y * squash + .5 * squash, v.z); }
    return g;
  }
  const SHRUBS = [[.46, .57, .33], [.52, .61, .36], [.43, .54, .34], [.57, .62, .37], [.49, .58, .30]], STONES = [[.56, .54, .50], [.48, .46, .42], [.63, .60, .54]];
  // The scene still calls this while it is being built; the shrubs are laid out by settle(), once everything that
  // is drawn has been stamped, so that none of them stands in a floor or a driveway.
  function scatter() { }
  function scatterNow(scene) {
    const T = scene.T, world = scene.world, f = field(scene), level = scene.graphics?.id || 'high'; if (level === 'potato') return;
    const spacing = level === 'low' ? 22 : level === 'medium' ? 17 : 13, tmp = new T.Object3D(), colour = new T.Color(), cells = new Map(), extent = Math.min(1990, world.extent || 1990);
    const add = (kind, x, y, z, sx, sy, sz, turn, rgb) => { const key = kind + '|' + Math.floor(x / 256) + ',' + Math.floor(z / 256); let list = cells.get(key); if (!list) cells.set(key, list = []); list.push([x, y, z, sx, sy, sz, turn, rgb]); };
    for (let x = -extent; x < extent; x += spacing) for (let z = -extent; z < extent; z += spacing) {
      const ix = Math.round(x / spacing), iz = Math.round(z / spacing), px = x + hash(ix, iz, 101) * spacing, pz = z + hash(ix, iz, 102) * spacing;
      // Drifts: plants gather where a slow noise is high, and thin out in between.
      const drift = smooth(.5, .78, value(px / 70, pz / 70, 103) * .65 + value(px / 23, pz / 23, 104) * .35); const rough = world.terrainHeight(px, pz); if (hash(ix, iz, 105) > (.05 + drift * .45) * (1 + smooth(8, 40, rough) * 1.2)) continue;
      if (!f.open(px, pz) || !f.open(px + 2.5, pz) || !f.open(px - 2.5, pz) || !f.open(px, pz + 2.5) || !f.open(px, pz - 2.5)) continue;
      const y = rough, pick = hash(ix, iz, 106), thicket = drift > .8 && y > 6 && hash(ix, iz, 130) < .6, size = thicket ? 1.5 + hash(ix, iz, 107) * 1.1 : .6 + hash(ix, iz, 107) * .9, dry = dryness(px, pz);
      if (pick < .27 && !thicket) { // stones, one large and sometimes a small one beside it
        const c = STONES[Math.floor(hash(ix, iz, 108) * STONES.length)]; add('stone', px, y - .06 * size, pz, .9 * size, .55 * size, .7 * size, hash(ix, iz, 109) * 6.283, c);
        if (hash(ix, iz, 110) < .5) add('stone', px + .7 * size, y - .04, pz + .35 * size, .4 * size, .28 * size, .34 * size, hash(ix, iz, 111) * 6.283, c);
      } else { // a shrub of two or three leafy lumps; straw-coloured ones where the land is dry
        const straw = hash(ix, iz, 112) < smooth(.55, .85, dry) * .6, c = straw ? [.62, .56, .34] : SHRUBS[Math.floor(hash(ix, iz, 113) * SHRUBS.length)], lumps = thicket ? 4 : 2 + (hash(ix, iz, 114) < .45 ? 1 : 0);
        for (let k = 0; k < lumps; k++) { const a = hash(ix, iz, 115 + k) * 6.283, r = k ? .42 * size : 0, s = size * (k ? .7 + hash(ix, iz, 120 + k) * .3 : 1.05), v = .88 + hash(ix, iz, 125 + k) * .24; add('shrub', px + Math.cos(a) * r, y - .08 * s, pz + Math.sin(a) * r, 1.25 * s, 1.0 * s, 1.25 * s, a, [c[0] * v, c[1] * v, c[2] * v]); }
      }
    }
    const shrub = lump(T, level === 'low' ? 0 : 1, .82, .38, 1), stone = lump(T, level === 'low' || level === 'medium' ? 0 : 1, .7, .5, 2), leaf = scene.material('#ffffff', 'foliage'), rock = scene.material('#ffffff', 'matte'), group = new T.Group(); group.name = 'ground-scatter'; let total = 0;
    for (const [key, list] of cells) {
      const kind = key.split('|')[0], mesh = new T.InstancedMesh(kind === 'shrub' ? shrub : stone, kind === 'shrub' ? leaf : rock, list.length), bounds = new T.Box3();
      list.forEach((p, i) => { tmp.position.set(p[0], p[1], p[2]); tmp.scale.set(p[3], p[4], p[5]); tmp.rotation.set(0, p[6], 0); tmp.updateMatrix(); mesh.setMatrixAt(i, tmp.matrix); mesh.setColorAt(i, colour.setRGB(p[7][0], p[7][1], p[7][2], T.SRGBColorSpace)); bounds.expandByPoint(tmp.position); });
      bounds.expandByScalar(2); mesh.instanceMatrix.needsUpdate = true; mesh.castShadow = kind === 'shrub'; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; mesh.computeBoundingSphere(); mesh.computeBoundingBox(); group.add(mesh); scene.trackStatic(mesh, bounds); total += list.length;
    }
    scene.environment.add(group); scene.groundScatter = { group, total };
  }
  root.CityGround = { tone, dryness, dressTerrain, dressMaterial, update, scatter, settle, stampScene, field, drawnHeight, grassColour, groundTexture, Grass };
})(typeof globalThis !== 'undefined' ? globalThis : this);
