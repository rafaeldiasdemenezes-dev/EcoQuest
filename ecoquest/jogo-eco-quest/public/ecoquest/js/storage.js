/*
 * EcoQuest — Armazenamento centralizado (localStorage)
 *
 * Limitações: o localStorage guarda dados apenas neste navegador e nesta
 * origem (ex.: file:// ou http://localhost). Não sincroniza entre
 * dispositivos e não impede que o próprio jogador edite os dados.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'ecoquest.save';
  var SCHEMA_VERSION = 2;

  var memoryFallback = null;
  var available = checkAvailability();
  var state = null;
  var listeners = [];
  var errorHandler = function () {};

  function checkAvailability() {
    try {
      var probe = '__ecoquest_probe__';
      global.localStorage.setItem(probe, '1');
      global.localStorage.removeItem(probe);
      return true;
    } catch (e) {
      return false;
    }
  }

  function now() {
    return new Date().toISOString();
  }

  function createDefaultState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      createdAt: now(),
      updatedAt: now(),
      profile: null,
      stats: { xp: 0, seeds: 0, perfectQuizzes: 0, itemsCollected: 0 },
      missions: {},
      regions: {},
      animals: {},
      achievements: {},
      settings: { sound: true, motion: 'system' }
    };
  }

  /* Migrações: cada função leva o save da versão N para N+1. */
  var migrations = {
    1: function (data) {
      // v1 usava "coins" no topo; v2 move para stats.seeds.
      data.stats = data.stats || {};
      if (typeof data.coins === 'number') {
        data.stats.seeds = data.coins;
        delete data.coins;
      }
      data.settings = data.settings || {};
      if (typeof data.settings.reducedMotion === 'boolean') {
        data.settings.motion = data.settings.reducedMotion ? 'reduce' : 'system';
        delete data.settings.reducedMotion;
      }
      data.schemaVersion = 2;
      return data;
    }
  };

  function migrate(data) {
    var version = Number(data.schemaVersion) || 1;
    while (version < SCHEMA_VERSION) {
      if (typeof migrations[version] !== 'function') break;
      data = migrations[version](data);
      version = Number(data.schemaVersion) || version + 1;
    }
    data.schemaVersion = SCHEMA_VERSION;
    return data;
  }

  function isObj(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  function safeNum(v, fallback) {
    var n = Number(v);
    return isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
  }

  function safeStr(v, max) {
    if (typeof v !== 'string') return '';
    return v.replace(/[<>]/g, '').trim().slice(0, max || 60);
  }

  /* Garante que o save possua o formato esperado, descartando lixo. */
  function sanitize(raw) {
    var base = createDefaultState();
    if (!isObj(raw)) return base;

    base.createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : base.createdAt;

    if (isObj(raw.profile) && safeStr(raw.profile.name)) {
      base.profile = {
        name: safeStr(raw.profile.name, 20),
        avatar: safeNum(raw.profile.avatar, 0) % 4,
        createdAt: typeof raw.profile.createdAt === 'string' ? raw.profile.createdAt : now()
      };
    }

    if (isObj(raw.stats)) {
      base.stats.xp = safeNum(raw.stats.xp, 0);
      base.stats.seeds = safeNum(raw.stats.seeds, 0);
      base.stats.perfectQuizzes = safeNum(raw.stats.perfectQuizzes, 0);
      base.stats.itemsCollected = safeNum(raw.stats.itemsCollected, 0);
    }

    if (isObj(raw.missions)) {
      Object.keys(raw.missions).forEach(function (id) {
        var m = raw.missions[id];
        if (!isObj(m)) return;
        base.missions[id] = {
          completed: m.completed === true,
          completedAt: typeof m.completedAt === 'string' ? m.completedAt : null,
          attempts: safeNum(m.attempts, 0),
          bestScore: safeNum(m.bestScore, 0),
          progress: Array.isArray(m.progress)
            ? m.progress.filter(function (n) { return typeof n === 'number'; }).slice(0, 50)
            : []
        };
      });
    }

    if (isObj(raw.regions)) {
      Object.keys(raw.regions).forEach(function (id) {
        var r = raw.regions[id];
        if (!isObj(r)) return;
        var pos = isObj(r.lastPos) ? r.lastPos : null;
        base.regions[id] = {
          visited: r.visited === true,
          lastPos: pos && isFinite(pos.x) && isFinite(pos.y) ? { x: Number(pos.x), y: Number(pos.y) } : null
        };
      });
    }

    if (isObj(raw.animals)) {
      Object.keys(raw.animals).forEach(function (id) {
        var a = raw.animals[id];
        if (!isObj(a)) return;
        base.animals[id] = {
          unlockedAt: typeof a.unlockedAt === 'string' ? a.unlockedAt : now(),
          seen: a.seen === true
        };
      });
    }

    if (isObj(raw.achievements)) {
      Object.keys(raw.achievements).forEach(function (id) {
        if (typeof raw.achievements[id] === 'string') base.achievements[id] = raw.achievements[id];
      });
    }

    if (isObj(raw.settings)) {
      base.settings.sound = raw.settings.sound !== false;
      base.settings.motion = ['system', 'reduce', 'full'].indexOf(raw.settings.motion) >= 0
        ? raw.settings.motion
        : 'system';
    }

    return base;
  }

  function readRaw() {
    if (!available) return memoryFallback;
    try {
      return global.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      errorHandler('read', e);
      return null;
    }
  }

  function writeRaw(str) {
    if (!available) {
      memoryFallback = str;
      return true;
    }
    try {
      global.localStorage.setItem(STORAGE_KEY, str);
      return true;
    } catch (e) {
      errorHandler(e && e.name === 'QuotaExceededError' ? 'quota' : 'write', e);
      return false;
    }
  }

  function load() {
    var raw = readRaw();
    if (!raw) {
      state = createDefaultState();
      return state;
    }
    try {
      var parsed = JSON.parse(raw);
      state = sanitize(migrate(parsed));
    } catch (e) {
      errorHandler('corrupt', e);
      try {
        if (available) global.localStorage.setItem(STORAGE_KEY + '.backup', raw);
      } catch (ignored) { /* sem espaço para backup */ }
      state = createDefaultState();
    }
    return state;
  }

  function save() {
    if (!state) return false;
    state.updatedAt = now();
    var ok = writeRaw(JSON.stringify(state));
    listeners.forEach(function (fn) {
      try { fn(state); } catch (e) { /* ouvinte com erro não quebra o save */ }
    });
    return ok;
  }

  function get() {
    return state || load();
  }

  /* Aplica uma alteração e salva de forma atômica. */
  function update(mutator) {
    var s = get();
    mutator(s);
    save();
    return s;
  }

  function reset() {
    var keepSettings = state ? state.settings : null;
    state = createDefaultState();
    if (keepSettings) state.settings = keepSettings;
    try {
      if (available) global.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      errorHandler('write', e);
    }
    save();
    return state;
  }

  function exportJSON() {
    return JSON.stringify(get(), null, 2);
  }

  function importJSON(text) {
    var parsed = JSON.parse(text);
    if (!isObj(parsed) || !('schemaVersion' in parsed)) {
      throw new Error('Arquivo não reconhecido como save do EcoQuest.');
    }
    if (Number(parsed.schemaVersion) > SCHEMA_VERSION) {
      throw new Error('Este save é de uma versão mais nova do jogo.');
    }
    state = sanitize(migrate(parsed));
    save();
    return state;
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  function onError(fn) {
    errorHandler = typeof fn === 'function' ? fn : function () {};
  }

  global.EQ = global.EQ || {};
  global.EQ.Storage = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    isPersistent: function () { return available; },
    load: load,
    save: save,
    get: get,
    update: update,
    reset: reset,
    exportJSON: exportJSON,
    importJSON: importJSON,
    onChange: onChange,
    onError: onError
  };
})(window);
