/*
 * EcoQuest — Mundo explorável em pixel art (canvas 2D).
 * Cada região é gerada de forma determinística e se recupera visualmente
 * conforme as missões são concluídas.
 */
(function (global) {
  'use strict';

  var EQ = global.EQ;
  var D = EQ.DATA;
  var G = EQ.Game;
  var S = EQ.Storage;

  var TILE = 16;
  var W = 40;
  var H = 28;
  var T = { GRASS: 0, TREE: 1, WATER: 2, PATH: 3, FLOWER: 4, ROCK: 5, SAND: 6, TALL: 7, MANGROVE: 8, BRIDGE: 9, BUSH: 10, DEEP: 11 };
  var SOLID = {}; SOLID[T.TREE] = 1; SOLID[T.WATER] = 1; SOLID[T.ROCK] = 1; SOLID[T.MANGROVE] = 1; SOLID[T.BUSH] = 1; SOLID[T.DEEP] = 1;
  var WATERY = {}; WATERY[T.WATER] = 1; WATERY[T.DEEP] = 1;

  var base = {
    grass: ['#3e8e3a', '#2f7531', '#56a646'],
    dirt: ['#8b6a42', '#6e5233', '#a3825a'],
    leaf: ['#1d5a27', '#2b7a33', '#45a043'],
    trunk: '#5b3a1e',
    water: ['#2f7fb0', '#5aa3d1'],
    dirty: ['#6b6436', '#857c46'],
    deep: ['#1f5f8f', '#3c86b8'],
    sand: ['#d9c48a', '#c4ad72'],
    tall: ['#7aa83e', '#5e8a2e'],
    burned: ['#2b2723', '#3d3530'],
    flowers: ['#ff7aa8', '#ffd45a', '#ffffff'],
    path: ['#b99464', '#a07d50'],
    rock: ['#8a8f8c', '#6b706d', '#a9aeab'],
    treeStyle: 'round'
  };

  function theme(id, over) {
    var t = { id: id };
    Object.keys(base).forEach(function (k) { t[k] = base[k]; });
    Object.keys(over || {}).forEach(function (k) { t[k] = over[k]; });
    return t;
  }

  var THEMES = {
    amazonia: theme('amazonia', {
      critters: [
        { kind: 'butterfly', col: '#3fa9ff' }, { kind: 'bird', col: '#1d1d1d', beak: '#ff9a2e' },
        { kind: 'quad', col: '#e0a63a', spots: '#3b2a1a' }, { kind: 'frog', col: '#2f6dff' },
        { kind: 'swim', col: '#f2a0b4' }, { kind: 'butterfly', col: '#ffd45a' }, { kind: 'swim', col: '#9b6b3a' }
      ]
    }),
    pantanal: theme('pantanal', {
      grass: ['#6aa84a', '#558f3b', '#85bf5c'],
      water: ['#3f8fc0', '#6db3dd'],
      critters: [
        { kind: 'bird', col: '#2a4fd6', beak: '#ffd45a' }, { kind: 'bird', col: '#f2f2f2', beak: '#1d1d1d' },
        { kind: 'quad', col: '#8a5a32' }, { kind: 'swim', col: '#8a7a3a' },
        { kind: 'butterfly', col: '#ffd45a' }, { kind: 'quad', col: '#6e4a2a' }, { kind: 'bird', col: '#2a4fd6', beak: '#ffd45a' }
      ]
    }),
    cerrado: theme('cerrado', {
      grass: ['#b3a046', '#978637', '#cbb75c'],
      leaf: ['#5f7a2a', '#78933a', '#97ad4d'],
      trunk: '#4a2f1c',
      tall: ['#d8c25c', '#a8933a'],
      water: ['#3a8fb8', '#66b0d6'],
      treeStyle: 'twisted',
      critters: [
        { kind: 'quad', col: '#c8552a', legs: '#1d1d1d' }, { kind: 'quad', col: '#6b5f55', legs: '#1d1d1d' },
        { kind: 'bird', col: '#1d1d1d', beak: '#ff9a2e' }, { kind: 'butterfly', col: '#ff7a3d' },
        { kind: 'frog', col: '#8a6a3a' }, { kind: 'bird', col: '#f2f2f2', beak: '#1d1d1d' }, { kind: 'butterfly', col: '#ffffff' }
      ]
    }),
    mata: theme('mata', {
      grass: ['#3f9447', '#2e7a37', '#56ad5b'],
      leaf: ['#174f2a', '#226b36', '#36894a'],
      critters: [
        { kind: 'quad', col: '#f0a43a' }, { kind: 'frog', col: '#ff8a1e' },
        { kind: 'butterfly', col: '#3fa9ff' }, { kind: 'bird', col: '#e04b5a', beak: '#1d1d1d' },
        { kind: 'quad', col: '#f0a43a' }, { kind: 'butterfly', col: '#ffd45a' }, { kind: 'frog', col: '#ff8a1e' }
      ]
    }),
    litoral: theme('litoral', {
      grass: ['#7fb554', '#67993f', '#97c96a'],
      sand: ['#ead7a0', '#d6bf82'],
      water: ['#2f9cc4', '#69c3e3'],
      deep: ['#1d6f9c', '#3a93c2'],
      leaf: ['#2d7a3a', '#3f9a4a', '#62b85e'],
      treeStyle: 'palm',
      critters: [
        { kind: 'bird', col: '#e8333a', beak: '#3b2a1a' }, { kind: 'crab', col: '#c9452f' },
        { kind: 'swim', col: '#4f8a4a' }, { kind: 'bird', col: '#e8333a', beak: '#3b2a1a' },
        { kind: 'swim', col: '#8b9aa3' }, { kind: 'crab', col: '#7a5a3a' }, { kind: 'swim', col: '#4f8a4a' }
      ]
    })
  };

  var AVATARS = [
    { shirt: '#3fa34d', pants: '#4a3a2a', hat: '#d9b36b', skin: '#f1c27d', hair: '#3b2a1a' },
    { shirt: '#2f7fd1', pants: '#2b3346', hat: '#e8e0c8', skin: '#c68642', hair: '#1d1d1d' },
    { shirt: '#e0a63a', pants: '#3d4a2a', hat: '#7a9a4a', skin: '#8d5524', hair: '#1d1d1d' },
    { shirt: '#c74b5a', pants: '#3a2e3e', hat: '#f2d27a', skin: '#ffdbac', hair: '#a0522d' }
  ];
  var NPC_LOOK = { shirt: '#d8792f', pants: '#4a3a2a', hat: '#5b8a3a', skin: '#c68642', hair: '#1d1d1d' };

  /* ---------- Utilidades ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function makeNoise(rng, cell) {
    var gw = Math.ceil(W / cell) + 2;
    var gh = Math.ceil(H / cell) + 2;
    var g = [];
    for (var i = 0; i < gw * gh; i++) g.push(rng());
    function smooth(t) { return t * t * (3 - 2 * t); }
    return function (x, y) {
      var fx = x / cell, fy = y / cell;
      var ix = Math.floor(fx), iy = Math.floor(fy);
      var tx = smooth(fx - ix), ty = smooth(fy - iy);
      var a = g[iy * gw + ix], b = g[iy * gw + ix + 1], c = g[(iy + 1) * gw + ix], d = g[(iy + 1) * gw + ix + 1];
      return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
    };
  }

  function octave(rng, cell) {
    var n1 = makeNoise(rng, cell);
    var n2 = makeNoise(rng, Math.max(2, cell / 2));
    return function (x, y) { return n1(x, y) * 0.65 + n2(x, y) * 0.35; };
  }

  /* ---------- Geração do mapa ---------- */
  var mapCache = {};

  function generate(region) {
    var rng = mulberry32(region.seed);
    var dens = octave(rng, 7);
    var moist = octave(rng, 9);
    var heal = octave(rng, 6);
    var th = region.theme;
    var cells = new Array(W * H);

    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var d = dens(x, y), m = moist(x, y), type = T.GRASS;
        if (th === 'amazonia') {
          if (d > 0.52) type = T.TREE;
          else if (d > 0.47) type = T.BUSH;
        } else if (th === 'pantanal') {
          if (m > 0.63) type = T.WATER;
          else if (d > 0.66) type = T.TREE;
          else if (m < 0.36) type = T.TALL;
        } else if (th === 'cerrado') {
          if (d > 0.67) type = T.TREE;
          else if (m > 0.5) type = T.TALL;
          else if (d < 0.25 && rng() < 0.1) type = T.ROCK;
        } else if (th === 'mata') {
          if (d > 0.46) type = T.TREE;
          else if (d > 0.42) type = T.BUSH;
          else if (rng() < 0.03) type = T.ROCK;
        } else if (th === 'litoral') {
          if (y >= H - 7) type = T.DEEP;
          else if (y >= H - 9) type = T.SAND;
          else if (d > 0.62) type = T.TREE;
          else if (m > 0.6 && y > H - 15) type = T.SAND;
        }
        if (type === T.GRASS && rng() < 0.07) type = T.FLOWER;
        var threshold = Math.max(0, Math.min(0.999, (heal(x, y) - 0.2) * 1.4 * 0.75 + rng() * 0.25));
        cells[y * W + x] = { type: type, t: threshold, v: Math.floor(rng() * 4) };
      }
    }

    var order = cells.map(function (c, i) { return i; }).sort(function (a, b) { return cells[a].t - cells[b].t; });
    order.forEach(function (cellIndex, rank) { cells[cellIndex].t = rank / order.length; });

    function set(x, y, type) {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      cells[y * W + x].type = type;
    }
    function get(x, y) { return cells[y * W + x]; }

    if (th === 'amazonia') {
      for (var rx = 0; rx < W; rx++) {
        var cy = 17 + Math.round(Math.sin(rx * 0.22) * 2.5 + Math.sin(rx * 0.09 + 1) * 1.5);
        for (var k = -1; k <= 1; k++) set(rx, cy + k, T.WATER);
      }
    } else if (th === 'cerrado') {
      for (var py = -3; py <= 3; py++) for (var pxx = -4; pxx <= 4; pxx++) {
        if (pxx * pxx / 16 + py * py / 9 <= 1) set(33 + pxx, 9 + py, T.WATER);
      }
      for (var sy = 12; sy < H - 1; sy++) set(33 + Math.round(Math.sin(sy * 0.4)), sy, T.WATER);
    } else if (th === 'mata') {
      for (var my = 0; my < H; my++) {
        var mx = 16 + Math.round(Math.sin(my * 0.3) * 2);
        set(mx, my, T.WATER); set(mx + 1, my, T.WATER);
      }
    } else if (th === 'litoral') {
      for (var ly = 0; ly < H - 7; ly++) {
        var lx = 5 + Math.round(Math.sin(ly * 0.35) * 1.5);
        set(lx, ly, T.WATER); set(lx + 1, ly, T.WATER);
        for (var mk = -3; mk <= 4; mk++) {
          var c = get(Math.max(0, Math.min(W - 1, lx + mk)), ly);
          if (c && c.type !== T.WATER && ly > 8 && rng() < 0.55 && (mk < -1 || mk > 2)) c.type = T.MANGROVE;
        }
      }
    }

    for (var bx = 0; bx < W; bx++) {
      if (get(bx, 0).type !== T.WATER) set(bx, 0, T.TREE);
      if (get(bx, H - 1).type !== T.DEEP && get(bx, H - 1).type !== T.WATER) set(bx, H - 1, T.TREE);
    }
    for (var by = 0; by < H; by++) {
      var lt = get(0, by).type, rt = get(W - 1, by).type;
      if (lt !== T.DEEP) set(0, by, lt === T.WATER ? T.WATER : T.TREE);
      if (rt !== T.DEEP) set(W - 1, by, rt === T.WATER ? T.WATER : T.TREE);
    }

    var spawn = { x: 20, y: 13 };

    function clearArea(px, py, radius) {
      for (var yy = -radius; yy <= radius; yy++) for (var xx = -radius; xx <= radius; xx++) {
        var tx = px + xx, ty = py + yy;
        if (tx < 1 || ty < 1 || tx >= W - 1 || ty >= H - 1) continue;
        var cell = get(tx, ty);
        if (WATERY[cell.type] || cell.type === T.MANGROVE) cell.type = T.BRIDGE;
        else if (SOLID[cell.type]) cell.type = th === 'litoral' && ty > H - 10 ? T.SAND : T.GRASS;
      }
    }

    function carve(a, b) {
      var x0 = a.x, y0 = a.y;
      var stepX = b.x > x0 ? 1 : -1, stepY = b.y > y0 ? 1 : -1;
      function mark(x, y) {
        var cell = get(x, y);
        if (WATERY[cell.type] || cell.type === T.MANGROVE) cell.type = T.BRIDGE;
        else if (cell.type !== T.BRIDGE && cell.type !== T.SAND) cell.type = T.PATH;
      }
      while (x0 !== b.x) { mark(x0, y0); x0 += stepX; }
      while (y0 !== b.y) { mark(x0, y0); y0 += stepY; }
      mark(x0, y0);
    }

    clearArea(spawn.x, spawn.y, 1);
    var regionMissions = D.missionsOf(region.id);
    regionMissions.forEach(function (m) {
      carve(spawn, m.spot);
      clearArea(m.spot.x, m.spot.y, 1);
    });

    var reach = new Uint8Array(W * H);
    var queue = [spawn.y * W + spawn.x];
    reach[queue[0]] = 1;
    while (queue.length) {
      var idx = queue.shift();
      var qx = idx % W, qy = (idx / W) | 0;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dv) {
        var nx = qx + dv[0], ny = qy + dv[1];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
        var ni = ny * W + nx;
        if (reach[ni] || SOLID[cells[ni].type]) return;
        reach[ni] = 1;
        queue.push(ni);
      });
    }

    var reachable = [];
    for (var ri = 0; ri < W * H; ri++) if (reach[ri]) reachable.push(ri);

    var items = {};
    regionMissions.filter(function (m) { return m.type === 'explore'; }).forEach(function (m) {
      var irng = mulberry32(region.seed ^ hashStr(m.id));
      var chosen = [];
      var minDist = 6;
      var tries = 0;
      while (chosen.length < m.config.count && tries < 4000) {
        tries++;
        if (tries % 800 === 0) minDist = Math.max(2, minDist - 1);
        var pick = reachable[Math.floor(irng() * reachable.length)];
        var ix = pick % W, iy = (pick / W) | 0;
        if (Math.hypot(ix - spawn.x, iy - spawn.y) < 7) continue;
        if (cells[pick].type === T.PATH || cells[pick].type === T.BRIDGE) continue;
        var tooClose = chosen.some(function (c) { return Math.hypot(c.x - ix - 0.5, c.y - iy - 0.5) < minDist; });
        if (tooClose) continue;
        chosen.push({ x: ix + 0.5, y: iy + 0.5 });
      }
      items[m.id] = chosen;
    });

    var waterTiles = [];
    for (var wi = 0; wi < W * H; wi++) if (WATERY[cells[wi].type]) waterTiles.push(wi);

    return {
      cells: cells, spawn: spawn, reachable: reachable, waterTiles: waterTiles, items: items,
      theme: THEMES[th], region: region,
      npcs: regionMissions.map(function (m) { return { mission: m, x: m.spot.x + 0.5, y: m.spot.y + 0.5 }; })
    };
  }

  function getMap(regionId) {
    if (!mapCache[regionId]) mapCache[regionId] = generate(D.region(regionId));
    return mapCache[regionId];
  }

  function isHealthy(cell, r) {
    return cell.t < 0.1 + 0.9 * Math.pow(r, 1.3);
  }

  /* ---------- Pintura de tiles ---------- */
  var atlas = {};

  function paintTile(c, P, type, healthy, v, frame) {
    var r = mulberry32(v * 977 + type * 131 + 7);
    function px(col, x, y, w, h) { c.fillStyle = col; c.fillRect(x, y, w || 1, h || 1); }
    function ground(h) {
      if (h) {
        px(P.grass[0], 0, 0, 16, 16);
        for (var i = 0; i < 10; i++) px(r() < 0.5 ? P.grass[1] : P.grass[2], (r() * 16) | 0, (r() * 16) | 0, 1, r() < 0.4 ? 2 : 1);
      } else {
        px(P.dirt[0], 0, 0, 16, 16);
        for (var j = 0; j < 7; j++) px(P.dirt[2], (r() * 16) | 0, (r() * 16) | 0);
        px(P.dirt[1], 2 + v, 5, 5, 1); px(P.dirt[1], 6 + v, 6, 1, 3); px(P.dirt[1], 9, 11 - v, 4, 1);
      }
    }
    function water(cols, f) {
      px(cols[0], 0, 0, 16, 16);
      for (var i = 0; i < 4; i++) {
        var yy = (r() * 14) | 0, xx = (r() * 12) | 0;
        px(cols[1], (xx + f * 2) % 14, yy, 3, 1);
      }
    }
    function trash(dx, dy) {
      px('#e6eef2', 3 + dx, 4 + dy, 3, 1); px('#4fa3d9', 2 + dx, 4 + dy, 1, 1);
      px('#d94a3a', 10 - dx, 10 + dy, 2, 2); px('#cfd3d6', 10 - dx, 10 + dy, 2, 1);
    }

    switch (type) {
      case T.GRASS: ground(healthy); break;
      case T.FLOWER:
        ground(healthy);
        if (healthy) {
          for (var k = 0; k < 3; k++) {
            var fx = 2 + ((r() * 11) | 0), fy = 3 + ((r() * 10) | 0), col = P.flowers[k % 3];
            px(P.grass[1], fx, fy + 2, 1, 2); px(col, fx - 1, fy, 3, 1); px(col, fx, fy - 1, 1, 3); px('#ffe27a', fx, fy);
          }
        } else {
          px('#e6eef2', 3, 8, 5, 2); px('#4fa3d9', 2, 8, 1, 2);
          px('#d94a3a', 10, 4, 2, 3); px('#cfd3d6', 10, 4, 2, 1);
          px('#f4f4f4', 6, 12, 3, 2); px('#c9c9c9', 7, 13, 2, 1);
        }
        break;
      case T.TREE:
        ground(healthy);
        if (!healthy) {
          px('#3d2614', 5, 13, 7, 1); px(P.trunk, 5, 9, 6, 5); px('#a3825a', 5, 9, 6, 2); px('#6e5233', 7, 10, 2, 1);
          px(P.trunk, 11, 12, 3, 1);
        } else if (P.treeStyle === 'twisted') {
          px(P.trunk, 7, 9, 2, 7); px(P.trunk, 6, 8, 1, 2); px(P.trunk, 9, 6, 1, 4); px(P.trunk, 5, 7, 1, 1);
          px(P.leaf[0], 1, 3, 7, 5); px(P.leaf[1], 2, 3, 5, 4); px(P.leaf[2], 3, 3, 2, 1);
          px(P.leaf[0], 8, 1, 7, 6); px(P.leaf[1], 9, 1, 5, 4); px(P.leaf[2], 10, 2, 2, 1);
        } else if (P.treeStyle === 'palm') {
          px(P.trunk, 8, 6, 2, 10); px('#7a5530', 8, 8, 2, 1); px('#7a5530', 8, 11, 2, 1); px('#7a5530', 8, 14, 2, 1);
          px(P.leaf[1], 2, 4, 12, 2); px(P.leaf[0], 1, 5, 3, 2); px(P.leaf[0], 12, 5, 3, 2);
          px(P.leaf[2], 5, 2, 6, 2); px(P.leaf[1], 7, 1, 2, 2); px(P.leaf[0], 0, 6, 2, 1); px(P.leaf[0], 14, 6, 2, 1);
          px('#7a5a2a', 7, 6, 1, 1); px('#7a5a2a', 10, 6, 1, 1);
        } else {
          px(P.trunk, 7, 10, 3, 6); px('#3d2614', 7, 15, 3, 1);
          px(P.leaf[0], 2, 3, 12, 9); px(P.leaf[0], 4, 1, 8, 2);
          px(P.leaf[1], 3, 2, 10, 8); px(P.leaf[1], 5, 1, 6, 1);
          px(P.leaf[2], 5, 3, 3, 2); px(P.leaf[2], 9, 5, 2, 2); px(P.leaf[0], 3, 9, 10, 2);
        }
        break;
      case T.WATER:
        if (healthy) water(P.water, frame);
        else { water(P.dirty, frame); trash(v % 3, 0); px('#8f6aa8', 6, 12, 3, 1); }
        break;
      case T.DEEP:
        if (healthy) water(P.deep, frame);
        else { water(['#3a5560', '#55707a'], frame); trash(v % 3, 1); }
        break;
      case T.PATH:
        px(P.path[0], 0, 0, 16, 16);
        for (var p = 0; p < 6; p++) px(P.path[1], (r() * 15) | 0, (r() * 15) | 0, 2, 1);
        break;
      case T.ROCK:
        ground(healthy);
        px(P.rock[1], 3, 7, 10, 7); px(P.rock[0], 4, 6, 8, 7); px(P.rock[2], 5, 7, 3, 2); px(P.rock[1], 4, 12, 8, 1);
        break;
      case T.SAND:
        px(P.sand[0], 0, 0, 16, 16);
        for (var s = 0; s < 8; s++) px(P.sand[1], (r() * 16) | 0, (r() * 16) | 0);
        if (!healthy) trash(v % 2, 0);
        break;
      case T.TALL:
        if (healthy) {
          ground(true);
          for (var b = 0; b < 9; b++) {
            var bx = (r() * 15) | 0, byy = 6 + ((r() * 9) | 0);
            px(P.tall[0], bx, byy - 4, 1, 5); px(P.tall[1], bx + 1, byy - 2, 1, 3);
          }
        } else {
          px(P.burned[0], 0, 0, 16, 16);
          for (var e = 0; e < 10; e++) px(P.burned[1], (r() * 16) | 0, (r() * 16) | 0, 1, 2);
          px('#ff8a3d', (r() * 14) | 0, (r() * 14) | 0); px('#c9572a', (r() * 14) | 0, (r() * 14) | 0);
        }
        break;
      case T.MANGROVE:
        water(healthy ? P.water : P.dirty, frame);
        if (healthy) {
          px(P.trunk, 3, 10, 1, 5); px(P.trunk, 4, 9, 8, 1); px(P.trunk, 12, 10, 1, 5); px(P.trunk, 7, 9, 1, 6); px(P.trunk, 10, 10, 1, 4);
          px(P.leaf[0], 1, 2, 14, 7); px(P.leaf[1], 2, 1, 12, 6); px(P.leaf[2], 4, 2, 3, 2);
        } else {
          px('#7d7770', 3, 10, 1, 5); px('#7d7770', 4, 9, 8, 1); px('#7d7770', 12, 10, 1, 5);
          px('#8e8880', 7, 3, 1, 6); px('#8e8880', 8, 4, 3, 1); px('#8e8880', 10, 2, 1, 3); px('#8e8880', 5, 5, 2, 1);
        }
        break;
      case T.BRIDGE:
        water(healthy ? P.water : P.dirty, frame);
        px('#8b5a2b', 0, 1, 16, 14);
        for (var pl = 0; pl < 5; pl++) { px('#6b4220', 0, 1 + pl * 3, 16, 1); px('#a8743d', 0, 2 + pl * 3, 16, 1); }
        break;
      case T.BUSH:
        ground(healthy);
        if (healthy) {
          px(P.leaf[0], 2, 6, 12, 8); px(P.leaf[1], 3, 5, 10, 7); px(P.leaf[2], 5, 6, 3, 2);
          px('#e04b5a', 10, 8); px('#e04b5a', 6, 10);
        } else {
          px('#7a5c34', 3, 7, 10, 7); px('#9c7a48', 4, 6, 8, 5); px('#5d4426', 5, 9, 1, 4); px('#5d4426', 10, 8, 1, 5);
        }
        break;
    }
  }

  function tileCanvas(P, type, healthy, v, frame) {
    var animated = type === T.WATER || type === T.DEEP || type === T.MANGROVE || type === T.BRIDGE;
    var f = animated ? frame : 0;
    var key = P.id + '|' + type + '|' + (healthy ? 1 : 0) + '|' + v + '|' + f;
    if (atlas[key]) return atlas[key];
    var c = document.createElement('canvas');
    c.width = c.height = TILE;
    paintTile(c.getContext('2d'), P, type, healthy, v, f);
    atlas[key] = c;
    return c;
  }

  function tileColor(P, type, h) {
    switch (type) {
      case T.TREE: return h ? P.leaf[1] : P.dirt[1];
      case T.WATER: return h ? P.water[0] : P.dirty[0];
      case T.DEEP: return h ? P.deep[0] : '#3a5560';
      case T.PATH: return P.path[0];
      case T.FLOWER: return h ? P.flowers[0] : '#c9c2b0';
      case T.ROCK: return P.rock[0];
      case T.SAND: return P.sand[0];
      case T.TALL: return h ? P.tall[0] : P.burned[0];
      case T.MANGROVE: return h ? P.leaf[0] : '#7d7770';
      case T.BRIDGE: return '#8b5a2b';
      case T.BUSH: return h ? P.leaf[1] : '#7a5c34';
      default: return h ? P.grass[0] : P.dirt[0];
    }
  }

  /* ---------- Sprites ---------- */
  function personRects(look, dir, frame) {
    var R = [];
    R.push(['rgba(0,0,0,0.25)', 4, 15, 8, 1]);
    var legA = frame === 1 ? 2 : 3, legB = frame === 1 ? 3 : 2;
    if (frame === 0) { legA = 3; legB = 3; }
    R.push([look.pants, 5, 12, 2, legA], [look.pants, 9, 12, 2, legB]);
    R.push(['#2b1d12', 5, 12 + legA, 2, 1], ['#2b1d12', 9, 12 + legB, 2, 1]);
    R.push([look.shirt, 4, 8, 8, 4], ['#2b1d12', 4, 11, 8, 1]);
    R.push([look.skin, 3, 9, 1, 3], [look.skin, 12, 9, 1, 3]);
    if (dir === 'up') {
      R.push(['#6b4a2a', 5, 8, 6, 3]);
      R.push([look.hair, 5, 4, 6, 4]);
    } else {
      R.push([look.skin, 5, 4, 6, 4]);
      R.push([look.hair, 4, 4, 1, 2], [look.hair, 11, 4, 1, 2]);
      if (dir === 'down') R.push(['#1d1d1d', 6, 6, 1, 1], ['#1d1d1d', 9, 6, 1, 1]);
      else R.push(['#1d1d1d', 9, 6, 1, 1], [look.hair, 4, 4, 2, 3]);
    }
    R.push([look.hat, 4, 1, 8, 3], ['#2b1d12', 4, 3, 8, 1], [look.hat, 2, 4, 12, 1]);
    return R;
  }

  function critterRects(c, frame) {
    var R = [];
    switch (c.kind) {
      case 'quad':
        R.push(['rgba(0,0,0,0.2)', 3, 14, 11, 1]);
        R.push([c.col, 3, 8, 10, 4], [c.col, 12, 6, 3, 4], [c.col, 1, 8, 2, 1]);
        R.push([c.legs || '#3b2a1a', 4, 12, 1, frame ? 2 : 1], [c.legs || '#3b2a1a', 11, 12, 1, frame ? 1 : 2], [c.legs || '#3b2a1a', 6, 12, 1, frame ? 1 : 2], [c.legs || '#3b2a1a', 9, 12, 1, frame ? 2 : 1]);
        R.push(['#1d1d1d', 14, 7, 1, 1]);
        if (c.spots) R.push([c.spots, 5, 9, 1, 1], [c.spots, 8, 10, 1, 1], [c.spots, 10, 9, 1, 1], [c.spots, 6, 11, 1, 1]);
        break;
      case 'bird':
        R.push([c.col, 6, 6, 4, 3], [c.col, 9, 5, 2, 2], [c.beak, 11, 6, 2, 1], ['#1d1d1d', 10, 5, 1, 1]);
        if (frame) R.push([c.col, 3, 4, 3, 1], [c.col, 10, 4, 0, 0], [c.col, 4, 5, 2, 1]);
        else R.push([c.col, 3, 8, 3, 1], [c.col, 4, 7, 2, 1]);
        break;
      case 'butterfly':
        R.push(['#1d1d1d', 7, 6, 2, 4]);
        if (frame) R.push([c.col, 4, 5, 3, 3], [c.col, 9, 5, 3, 3], [c.col, 5, 8, 2, 2], [c.col, 9, 8, 2, 2]);
        else R.push([c.col, 6, 5, 1, 4], [c.col, 9, 5, 1, 4]);
        break;
      case 'frog':
        R.push(['rgba(0,0,0,0.2)', 4, 14, 8, 1]);
        R.push([c.col, 5, 10, 6, 3], [c.col, 4, 12, 2, 1], [c.col, 10, 12, 2, 1], ['#ffffff', 5, 9, 1, 1], ['#ffffff', 10, 9, 1, 1], ['#1d1d1d', 7, 11, 2, 1]);
        break;
      case 'crab':
        R.push([c.col, 5, 10, 6, 3], [c.col, 3, 9, 2, 1], [c.col, 11, 9, 2, 1], [c.col, 4, 13, 1, 1], [c.col, 11, 13, 1, 1], ['#1d1d1d', 6, 9, 1, 1], ['#1d1d1d', 9, 9, 1, 1]);
        break;
      case 'swim':
        R.push(['rgba(255,255,255,0.35)', 2, 12, 12, 1]);
        R.push([c.col, 4, 9, 8, 3], [c.col, 2, 10, 2, 1], [c.col, 12, 10, 2, 1], ['#1d1d1d', 10, 10, 1, 1]);
        break;
    }
    return R;
  }

  function itemRects(kind) {
    if (kind === 'pegada') {
      return [['#3b2a1a', 6, 8, 4, 3], ['#3b2a1a', 5, 6, 1, 1], ['#3b2a1a', 7, 5, 1, 1], ['#3b2a1a', 9, 5, 1, 1], ['#3b2a1a', 11, 6, 1, 1]];
    }
    if (kind === 'ninho') {
      return [['#7a5a2a', 3, 9, 10, 3], ['#5b3a1e', 4, 11, 8, 1], ['#f4f0e0', 6, 8, 2, 2], ['#f4f0e0', 9, 8, 2, 2]];
    }
    return [['#f7c35a', 5, 4, 6, 6], ['#f0a43a', 6, 10, 4, 3], ['#5a3b22', 7, 6, 2, 2], ['#f0a43a', 10, 11, 4, 1], ['#f0a43a', 13, 9, 1, 2]];
  }

  /* ---------- Estado do mundo ---------- */
  var canvas, ctx, dpr = 1, scale = 3, TS = 48;
  var state = {
    active: false, map: null, regionId: null, r: 0,
    player: { x: 0, y: 0, dir: 'down', moving: false, anim: 0 },
    keys: {}, critters: [], particles: [], nearNpc: null, raf: 0, last: 0,
    saveTimer: 0, stepTimer: 0, cam: { x: 0, y: 0 }
  };
  var callbacks = { onInteract: function () {}, onExploreItem: function () {}, onExploreComplete: function () {} };
  var dom = {};

  function reduced() { return EQ.UI && EQ.UI.reducedMotion(); }

  function cellAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return null;
    return state.map.cells[ty * W + tx];
  }

  function solidAt(x, y) {
    var c = cellAt(Math.floor(x), Math.floor(y));
    return !c || !!SOLID[c.type];
  }

  function canStand(x, y) {
    var hw = 0.28;
    return !solidAt(x - hw, y - 0.05) && !solidAt(x + hw, y - 0.05) && !solidAt(x - hw, y + 0.35) && !solidAt(x + hw, y + 0.35);
  }

  function missionStarted(id) {
    var rec = S.get().missions[id];
    return !!(rec && rec.attempts > 0 && !rec.completed);
  }

  function activeItems() {
    var list = [];
    state.map.npcs.forEach(function (n) {
      var m = n.mission;
      if (m.type !== 'explore' || !missionStarted(m.id)) return;
      var got = G.exploreProgress(m.id);
      (state.map.items[m.id] || []).forEach(function (it, i) {
        if (got.indexOf(i) < 0) list.push({ mission: m, index: i, x: it.x, y: it.y, kind: m.config.item });
      });
    });
    return list;
  }

  function spawnCritters() {
    var P = state.map.theme;
    var n = Math.round(state.r * 7);
    var list = [];
    var rng = mulberry32((Date.now() & 0xffff) + 3);
    for (var i = 0; i < n; i++) {
      var def = P.critters[i % P.critters.length];
      var c = { kind: def.kind, col: def.col, beak: def.beak, spots: def.spots, legs: def.legs, t: 0, dir: 1, frame: 0, ft: 0 };
      var pool = def.kind === 'swim' ? state.map.waterTiles : state.map.reachable;
      if (!pool.length) continue;
      var idx = pool[Math.floor(rng() * pool.length)];
      c.x = (idx % W) + 0.5; c.y = ((idx / W) | 0) + 0.5;
      c.tx = c.x; c.ty = c.y;
      c.fly = def.kind === 'bird' || def.kind === 'butterfly';
      c.speed = c.fly ? 1.6 : def.kind === 'swim' ? 0.9 : 1.1;
      list.push(c);
    }
    state.critters = list;
  }

  function critterCanBe(c, x, y) {
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return false;
    if (c.fly) return true;
    var cell = cellAt(Math.floor(x), Math.floor(y));
    if (!cell) return false;
    if (c.kind === 'swim') return !!WATERY[cell.type];
    return !SOLID[cell.type];
  }

  function updateCritters(dt) {
    state.critters.forEach(function (c) {
      c.t -= dt;
      c.ft += dt;
      if (c.ft > (c.fly ? 0.18 : 0.3)) { c.ft = 0; c.frame = 1 - c.frame; }
      var dx = c.tx - c.x, dy = c.ty - c.y, dist = Math.hypot(dx, dy);
      if (dist < 0.1 || c.t <= 0) {
        c.t = 2 + Math.random() * 3;
        var nx = c.x + (Math.random() - 0.5) * 8, ny = c.y + (Math.random() - 0.5) * 8;
        if (critterCanBe(c, nx, ny)) { c.tx = nx; c.ty = ny; }
        return;
      }
      if (!c.fly && c.kind !== 'swim' && c.t > 1.5 && Math.random() < 0.01) return;
      var step = Math.min(dist, c.speed * dt);
      var mx = c.x + (dx / dist) * step, my = c.y + (dy / dist) * step;
      if (critterCanBe(c, mx, my)) { c.x = mx; c.y = my; c.dir = dx >= 0 ? 1 : -1; }
      else c.t = 0;
    });
  }

  function addParticles(x, y, count, colors) {
    if (reduced()) return;
    for (var i = 0; i < count; i++) {
      state.particles.push({
        x: x + (Math.random() - 0.5) * 2, y: y + (Math.random() - 0.5) * 1.2,
        vx: (Math.random() - 0.5) * 1.5, vy: -1 - Math.random() * 2,
        life: 1 + Math.random() * 0.6, col: colors[i % colors.length]
      });
    }
  }

  function inputVector() {
    var k = state.keys;
    var x = 0, y = 0;
    if (k.left) x -= 1;
    if (k.right) x += 1;
    if (k.up) y -= 1;
    if (k.down) y += 1;
    if (x && y) { x *= 0.7071; y *= 0.7071; }
    return { x: x, y: y };
  }

  function dialogOpen() {
    return !!document.querySelector('dialog[open]');
  }

  function update(dt) {
    var p = state.player;
    var v = dialogOpen() ? { x: 0, y: 0 } : inputVector();
    var speed = 4.6;
    p.moving = !!(v.x || v.y);
    if (p.moving) {
      var nx = p.x + v.x * speed * dt;
      if (canStand(nx, p.y)) p.x = nx;
      var ny = p.y + v.y * speed * dt;
      if (canStand(p.x, ny)) p.y = ny;
      if (Math.abs(v.x) > Math.abs(v.y)) p.dir = v.x > 0 ? 'right' : 'left';
      else p.dir = v.y > 0 ? 'down' : 'up';
      p.anim += dt * 8;
      state.stepTimer += dt;
      if (state.stepTimer > 0.32) { state.stepTimer = 0; EQ.Audio.play('step'); }
      state.saveTimer += dt;
      if (state.saveTimer > 3) { state.saveTimer = 0; G.savePosition(state.regionId, p.x, p.y); }
    } else {
      p.anim = 0;
    }

    updateCritters(dt);

    state.particles = state.particles.filter(function (pt) {
      pt.life -= dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 1.5 * dt;
      return pt.life > 0;
    });

    var near = null, best = 1.5;
    state.map.npcs.forEach(function (n) {
      var d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < best) { best = d; near = n; }
    });
    if (near !== state.nearNpc) {
      state.nearNpc = near;
      if (near) {
        var done = G.isMissionDone(near.mission.id);
        dom.prompt.textContent = '';
        var keyEl = document.createElement('span');
        keyEl.className = 'key';
        keyEl.textContent = 'E';
        dom.prompt.appendChild(keyEl);
        dom.prompt.appendChild(document.createTextNode(' ' + D.region(near.mission.region).guide + ': “' + near.mission.title + '”' + (done ? ' ✓' : '')));
        dom.prompt.hidden = false;
        dom.action.disabled = false;
      } else {
        dom.prompt.hidden = true;
        dom.action.disabled = true;
      }
    }

    var items = activeItems();
    var nearest = Infinity;
    items.forEach(function (it) {
      var d = Math.hypot(it.x - p.x, it.y - p.y);
      if (d < nearest) nearest = d;
      if (d < 0.75) {
        var res = G.addExploreProgress(it.mission.id, it.index);
        EQ.Audio.play('collect');
        addParticles(it.x, it.y, 10, ['#ffcc4d', '#6fd36b', '#ffffff']);
        callbacks.onExploreItem(it.mission, res.count);
        if (res.done) callbacks.onExploreComplete(it.mission);
      }
    });
    updateTracker(items.length ? nearest : null);
  }

  function updateTracker(dist) {
    if (dist === null) {
      dom.tracker.hidden = true;
      return;
    }
    dom.tracker.hidden = false;
    var strength = dist < 3 ? 5 : dist < 6 ? 4 : dist < 10 ? 3 : dist < 15 ? 2 : 1;
    var bars = dom.tracker.querySelectorAll('.bar');
    for (var i = 0; i < bars.length; i++) bars[i].classList.toggle('on', i < strength);
    dom.tracker.setAttribute('aria-label', 'Rastreador: sinal ' + strength + ' de 5');
  }

  function drawRects(rects, ox, oy, flip) {
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (!r[3] || !r[4]) continue;
      ctx.fillStyle = r[0];
      var rx = flip ? 16 - r[1] - r[3] : r[1];
      ctx.fillRect(ox + rx * scale, oy + r[2] * scale, r[3] * scale, r[4] * scale);
    }
  }

  function screenPos(x, y) {
    return { x: Math.round(x * TS - state.cam.x - 8 * scale), y: Math.round(y * TS - state.cam.y - 14 * scale) };
  }

  function render(time) {
    var cw = canvas.width, ch = canvas.height;
    var P = state.map.theme;
    var p = state.player;
    var mapW = W * TS, mapH = H * TS;
    state.cam.x = mapW <= cw ? (mapW - cw) / 2 : Math.max(0, Math.min(mapW - cw, p.x * TS - cw / 2));
    state.cam.y = mapH <= ch ? (mapH - ch) / 2 : Math.max(0, Math.min(mapH - ch, p.y * TS - ch / 2));
    var cam = state.cam;

    ctx.fillStyle = '#0e1916';
    ctx.fillRect(0, 0, cw, ch);

    var frame = reduced() ? 0 : Math.floor(time * 1.6) % 2;
    var x0 = Math.max(0, Math.floor(cam.x / TS)), y0 = Math.max(0, Math.floor(cam.y / TS));
    var x1 = Math.min(W - 1, Math.ceil((cam.x + cw) / TS)), y1 = Math.min(H - 1, Math.ceil((cam.y + ch) / TS));
    for (var ty = y0; ty <= y1; ty++) {
      for (var tx = x0; tx <= x1; tx++) {
        var cell = state.map.cells[ty * W + tx];
        var img = tileCanvas(P, cell.type, isHealthy(cell, state.r), cell.v, (frame + tx + ty) % 2);
        ctx.drawImage(img, Math.round(tx * TS - cam.x), Math.round(ty * TS - cam.y), TS, TS);
      }
    }

    var bob = reduced() ? 0 : Math.round(Math.sin(time * 4) * 1.5);
    var drawables = [];

    activeItems().forEach(function (it) {
      drawables.push({ y: it.y - 0.3, draw: function () {
        var s = screenPos(it.x, it.y);
        drawRects(itemRects(it.kind), s.x, s.y + 4 * scale);
        if (Math.floor(time * 3) % 2 === 0 || reduced()) {
          ctx.fillStyle = '#ffcc4d';
          ctx.fillRect(s.x + 7 * scale, s.y + (1 + bob * 0.3) * scale, scale, 3 * scale);
          ctx.fillRect(s.x + 6 * scale, s.y + (2 + bob * 0.3) * scale, 3 * scale, scale);
        }
      } });
    });

    state.map.npcs.forEach(function (n) {
      drawables.push({ y: n.y, draw: function () {
        var s = screenPos(n.x, n.y);
        drawRects(personRects(NPC_LOOK, 'down', 0), s.x, s.y);
        var done = G.isMissionDone(n.mission.id);
        var started = n.mission.type === 'explore' && missionStarted(n.mission.id);
        var mx = s.x + 6 * scale, my = s.y - (8 - bob) * scale;
        ctx.fillStyle = '#0e1916';
        ctx.fillRect(mx - scale, my - scale, 6 * scale, 8 * scale);
        ctx.fillStyle = done ? '#6fd36b' : started ? '#5ab8e8' : '#ffcc4d';
        ctx.fillRect(mx, my, 4 * scale, 6 * scale);
        ctx.fillStyle = '#0e1916';
        if (done) {
          ctx.fillRect(mx + 0.5 * scale, my + 3 * scale, scale, scale);
          ctx.fillRect(mx + 1.5 * scale, my + 4 * scale, scale, scale);
          ctx.fillRect(mx + 2.5 * scale, my + 1 * scale, scale, 3 * scale);
        } else if (started) {
          ctx.fillRect(mx + 1 * scale, my + 1 * scale, 2 * scale, scale);
          ctx.fillRect(mx + 2 * scale, my + 2 * scale, scale, scale);
          ctx.fillRect(mx + 1.5 * scale, my + 4 * scale, scale, scale);
        } else {
          ctx.fillRect(mx + 1.5 * scale, my + 1 * scale, scale, 3 * scale);
          ctx.fillRect(mx + 1.5 * scale, my + 4.5 * scale, scale, scale);
        }
      } });
    });

    state.critters.forEach(function (c) {
      if (c.fly) return;
      drawables.push({ y: c.y, draw: function () {
        var s = screenPos(c.x, c.y);
        var hop = c.kind === 'frog' && c.frame && !reduced() ? -2 * scale : 0;
        drawRects(critterRects(c, c.frame), s.x, s.y + hop, c.dir < 0);
      } });
    });

    var walkFrame = p.moving ? (Math.floor(p.anim) % 2) + 1 : 0;
    drawables.push({ y: p.y, draw: function () {
      var s = screenPos(p.x, p.y);
      var avatar = AVATARS[(S.get().profile && S.get().profile.avatar) || 0];
      drawRects(personRects(avatar, p.dir, walkFrame), s.x, s.y, p.dir === 'left');
    } });

    drawables.sort(function (a, b) { return a.y - b.y; });
    drawables.forEach(function (d) { d.draw(); });

    state.critters.forEach(function (c) {
      if (!c.fly) return;
      var s = screenPos(c.x, c.y);
      var lift = reduced() ? 0 : Math.round(Math.sin(time * 3 + c.x) * 3);
      drawRects(critterRects(c, c.frame), s.x, s.y - (10 + lift) * scale, c.dir < 0);
    });

    state.particles.forEach(function (pt) {
      ctx.globalAlpha = Math.max(0, Math.min(1, pt.life));
      ctx.fillStyle = pt.col;
      ctx.fillRect(Math.round(pt.x * TS - cam.x), Math.round(pt.y * TS - cam.y), 2 * scale, 2 * scale);
    });
    ctx.globalAlpha = 1;

    drawGuideArrow();
  }

  function drawGuideArrow() {
    var p = state.player;
    var target = null, best = Infinity;
    state.map.npcs.forEach(function (n) {
      if (G.isMissionDone(n.mission.id)) return;
      var d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < best) { best = d; target = n; }
    });
    if (!target) return;
    var sx = target.x * TS - state.cam.x, sy = target.y * TS - state.cam.y;
    var cw = canvas.width, ch = canvas.height, margin = 28 * dpr;
    if (sx > margin && sx < cw - margin && sy > margin && sy < ch - margin) return;
    var cx = cw / 2, cy = ch / 2;
    var ang = Math.atan2(sy - cy, sx - cx);
    var ex = Math.max(margin, Math.min(cw - margin, cx + Math.cos(ang) * cw));
    var ey = Math.max(margin, Math.min(ch - margin, cy + Math.sin(ang) * ch));
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(ang);
    var s = 4 * dpr;
    ctx.fillStyle = '#0e1916';
    ctx.beginPath(); ctx.moveTo(4 * s, 0); ctx.lineTo(-3 * s, -3.4 * s); ctx.lineTo(-3 * s, 3.4 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffcc4d';
    ctx.beginPath(); ctx.moveTo(3 * s, 0); ctx.lineTo(-2 * s, -2.4 * s); ctx.lineTo(-2 * s, 2.4 * s); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function loop(ts) {
    if (!state.active) return;
    var dt = state.last ? Math.min(0.05, (ts - state.last) / 1000) : 0;
    state.last = ts;
    update(dt);
    render(ts / 1000);
    state.raf = requestAnimationFrame(loop);
  }

  function resize() {
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, global.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    scale = Math.max(2, Math.round((rect.width < 640 ? 2 : 3) * dpr));
    TS = TILE * scale;
    ctx.imageSmoothingEnabled = false;
  }

  function updateHud() {
    var region = D.region(state.regionId);
    var done = D.missionsOf(state.regionId).filter(function (m) { return G.isMissionDone(m.id); }).length;
    dom.name.textContent = region.name;
    dom.restoreFill.style.width = Math.round(state.r * 100) + '%';
    dom.restoreText.textContent = Math.round(state.r * 100) + '% restaurada · ' + done + '/3 missões';
  }

  var keyMap = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right'
  };

  function onKeyDown(e) {
    if (!state.active || dialogOpen()) return;
    var target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    if (keyMap[e.code]) { state.keys[keyMap[e.code]] = true; e.preventDefault(); }
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
      if (state.nearNpc) { e.preventDefault(); interact(); }
    }
  }

  function onKeyUp(e) {
    if (keyMap[e.code]) state.keys[keyMap[e.code]] = false;
  }

  function interact() {
    if (!state.nearNpc) return;
    state.keys = {};
    EQ.Audio.play('click');
    callbacks.onInteract(state.nearNpc.mission);
  }

  function bindControls() {
    canvas = document.getElementById('world-canvas');
    ctx = canvas.getContext('2d');
    dom.prompt = document.getElementById('world-prompt');
    dom.tracker = document.getElementById('world-tracker');
    dom.name = document.getElementById('world-region-name');
    dom.restoreFill = document.getElementById('world-restore-fill');
    dom.restoreText = document.getElementById('world-restore-text');
    dom.action = document.getElementById('btn-action');

    global.addEventListener('keydown', onKeyDown);
    global.addEventListener('keyup', onKeyUp);
    global.addEventListener('blur', function () { state.keys = {}; });
    global.addEventListener('resize', function () { if (state.active) resize(); });

    var pads = document.querySelectorAll('[data-dir]');
    Array.prototype.forEach.call(pads, function (btn) {
      var dir = btn.getAttribute('data-dir');
      function on(e) { e.preventDefault(); state.keys[dir] = true; btn.classList.add('pressed'); }
      function off() { state.keys[dir] = false; btn.classList.remove('pressed'); }
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointerleave', off);
      btn.addEventListener('pointercancel', off);
      btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });
    dom.action.addEventListener('click', interact);
  }

  var bound = false;

  function enter(regionId) {
    if (!bound) { bindControls(); bound = true; }
    state.regionId = regionId;
    state.map = getMap(regionId);
    state.r = G.regionProgress(regionId);
    var saved = S.get().regions[regionId];
    var p = state.player;
    if (saved && saved.lastPos && canStandSafe(saved.lastPos.x, saved.lastPos.y)) {
      p.x = saved.lastPos.x; p.y = saved.lastPos.y;
    } else {
      p.x = state.map.spawn.x + 0.5; p.y = state.map.spawn.y + 0.5;
    }
    p.dir = 'down';
    state.keys = {};
    state.nearNpc = undefined;
    state.particles = [];
    spawnCritters();
    state.active = true;
    state.last = 0;
    resize();
    updateHud();
    cancelAnimationFrame(state.raf);
    state.raf = requestAnimationFrame(loop);
  }

  function canStandSafe(x, y) {
    try { return canStand(x, y); } catch (e) { return false; }
  }

  function leave() {
    if (!state.active) return;
    G.savePosition(state.regionId, state.player.x, state.player.y);
    state.active = false;
    state.keys = {};
    cancelAnimationFrame(state.raf);
  }

  function refresh() {
    if (!state.map) return;
    var before = state.r;
    state.r = G.regionProgress(state.regionId);
    state.nearNpc = undefined;
    if (state.r > before) {
      spawnCritters();
      addParticles(state.player.x, state.player.y, 28, ['#6fd36b', '#ffcc4d', '#ff7aa8', '#ffffff']);
    }
    updateHud();
  }

  function renderThumbnail(regionId, cv) {
    var map = getMap(regionId);
    var r = G.regionProgress(regionId);
    var px = 4;
    cv.width = W * px; cv.height = H * px;
    var c = cv.getContext('2d');
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var cell = map.cells[y * W + x];
      c.fillStyle = tileColor(map.theme, cell.type, isHealthy(cell, r));
      c.fillRect(x * px, y * px, px, px);
    }
    map.npcs.forEach(function (n) {
      c.fillStyle = '#0e1916';
      c.fillRect(Math.floor(n.x) * px - 2, Math.floor(n.y) * px - 2, px + 4, px + 4);
      c.fillStyle = G.isMissionDone(n.mission.id) ? '#6fd36b' : '#ffcc4d';
      c.fillRect(Math.floor(n.x) * px - 1, Math.floor(n.y) * px - 1, px + 2, px + 2);
    });
  }

  global.EQ.World = {
    enter: enter,
    leave: leave,
    refresh: refresh,
    renderThumbnail: renderThumbnail,
    isActive: function () { return state.active; },
    setCallbacks: function (cb) { Object.keys(cb).forEach(function (k) { callbacks[k] = cb[k]; }); },
    avatars: AVATARS,
    drawAvatar: function (cv, index) {
      var c = cv.getContext('2d');
      cv.width = 16; cv.height = 16;
      c.clearRect(0, 0, 16, 16);
      personRects(AVATARS[index] || AVATARS[0], 'down', 0).forEach(function (r) {
        if (!r[3] || !r[4]) return;
        c.fillStyle = r[0];
        c.fillRect(r[1], r[2], r[3], r[4]);
      });
    }
  };
})(window);
