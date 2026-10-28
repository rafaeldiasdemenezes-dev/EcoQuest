/*
 * EcoQuest — Efeitos sonoros 8-bit gerados com Web Audio API (sem arquivos).
 */
(function (global) {
  'use strict';

  var ctx = null;

  function enabled() {
    return global.EQ.Storage.get().settings.sound;
  }

  function getCtx() {
    if (!ctx) {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, vol) {
    var c = getCtx();
    if (!c) return;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, c.currentTime + start);
    gain.gain.setValueAtTime(0.0001, c.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(vol || 0.06, c.currentTime + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + 0.02);
  }

  var sounds = {
    click: function () { tone(660, 0, 0.05, 'square', 0.04); },
    collect: function () { tone(880, 0, 0.07); tone(1320, 0.06, 0.1); },
    correct: function () { tone(523, 0, 0.08); tone(784, 0.08, 0.14); },
    wrong: function () { tone(220, 0, 0.12, 'sawtooth', 0.05); tone(165, 0.1, 0.18, 'sawtooth', 0.05); },
    success: function () {
      [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.09, 0.16); });
    },
    levelup: function () {
      [392, 523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, i * 0.07, 0.14, 'triangle', 0.08); });
    },
    unlock: function () { tone(740, 0, 0.1, 'triangle', 0.07); tone(988, 0.1, 0.2, 'triangle', 0.07); },
    step: function () { tone(120, 0, 0.03, 'triangle', 0.02); }
  };

  global.EQ.Audio = {
    play: function (name) {
      if (!enabled() || !sounds[name]) return;
      try { sounds[name](); } catch (e) { /* áudio é opcional */ }
    }
  };
})(window);
