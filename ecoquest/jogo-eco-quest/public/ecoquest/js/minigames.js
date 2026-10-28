/*
 * EcoQuest — Minijogos das missões.
 * Cada minijogo recebe (missão, container, finish) e devolve uma função de limpeza.
 * finish({ passed, score, perfect, summary })
 */
(function (global) {
  'use strict';

  var EQ = global.EQ;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- QUIZ ---------- */
  function quiz(mission, root, finish) {
    var qs = mission.config.questions;
    var index = 0, correct = 0;

    function render() {
      root.innerHTML = '';
      var q = qs[index];
      var head = el('div', 'mg-head');
      head.appendChild(el('span', 'mg-chip', 'Pergunta ' + (index + 1) + ' de ' + qs.length));
      head.appendChild(el('span', 'mg-chip', 'Acertos: ' + correct));
      root.appendChild(head);
      var title = el('h3', 'mg-question', q.q);
      title.id = 'quiz-q';
      root.appendChild(title);
      var list = el('div', 'mg-options');
      list.setAttribute('role', 'group');
      list.setAttribute('aria-labelledby', 'quiz-q');
      var feedback = el('p', 'mg-feedback');
      feedback.setAttribute('aria-live', 'polite');
      q.options.forEach(function (opt, i) {
        var b = el('button', 'btn btn-option', opt);
        b.type = 'button';
        b.addEventListener('click', function () {
          var buttons = list.querySelectorAll('button');
          Array.prototype.forEach.call(buttons, function (x) { x.disabled = true; });
          if (i === q.answer) {
            correct++;
            b.classList.add('is-correct');
            feedback.textContent = 'Correto!';
            feedback.className = 'mg-feedback ok';
            EQ.Audio.play('correct');
          } else {
            b.classList.add('is-wrong');
            buttons[q.answer].classList.add('is-correct');
            feedback.textContent = 'Resposta certa: ' + q.options[q.answer];
            feedback.className = 'mg-feedback bad';
            EQ.Audio.play('wrong');
          }
          var next = el('button', 'btn btn-primary', index + 1 < qs.length ? 'Próxima' : 'Ver resultado');
          next.type = 'button';
          next.addEventListener('click', function () {
            index++;
            if (index < qs.length) render();
            else {
              var passed = correct >= mission.config.pass;
              finish({
                passed: passed,
                score: Math.round((correct / qs.length) * 100),
                perfect: correct === qs.length,
                summary: 'Você acertou ' + correct + ' de ' + qs.length + ' perguntas.' + (passed ? '' : ' É preciso acertar pelo menos ' + mission.config.pass + '.')
              });
            }
          });
          root.appendChild(next);
          next.focus();
        });
        list.appendChild(b);
      });
      root.appendChild(list);
      root.appendChild(feedback);
    }
    render();
    return function () {};
  }

  /* ---------- PLANTIO ---------- */
  function plant(mission, root, finish) {
    var cfg = mission.config;
    var errors = 0;
    var tool = 'pa';
    var TOOLS = [
      { id: 'pa', label: 'Pá (cavar)', step: 0 },
      { id: 'muda', label: 'Muda (plantar)', step: 1 },
      { id: 'regador', label: 'Regador (regar)', step: 2 }
    ];

    function chooseSpecies() {
      root.innerHTML = '';
      root.appendChild(el('h3', 'mg-question', cfg.question));
      var fb = el('p', 'mg-feedback');
      fb.setAttribute('aria-live', 'polite');
      var list = el('div', 'mg-options');
      cfg.options.forEach(function (opt, i) {
        var b = el('button', 'btn btn-option', opt);
        b.type = 'button';
        b.addEventListener('click', function () {
          if (i === cfg.answer) {
            EQ.Audio.play('correct');
            fb.textContent = 'Boa escolha! ' + cfg.explain;
            fb.className = 'mg-feedback ok';
            Array.prototype.forEach.call(list.querySelectorAll('button'), function (x) { x.disabled = true; });
            b.classList.add('is-correct');
            var go = el('button', 'btn btn-primary', 'Ir para o plantio');
            go.type = 'button';
            go.addEventListener('click', field);
            root.appendChild(go);
            go.focus();
          } else {
            errors++;
            EQ.Audio.play('wrong');
            b.classList.add('is-wrong');
            b.disabled = true;
            fb.textContent = opt + ' não é nativa desta região. Tente outra.';
            fb.className = 'mg-feedback bad';
          }
        });
        list.appendChild(b);
      });
      root.appendChild(list);
      root.appendChild(fb);
    }

    function field() {
      root.innerHTML = '';
      var cols = 6, rows = 4, total = cols * rows;
      var targets = shuffle(Array.from({ length: total }, function (_, i) { return i; })).slice(0, cfg.targets);
      var stage = {};
      targets.forEach(function (t) { stage[t] = 0; });

      var head = el('div', 'mg-head');
      var progress = el('span', 'mg-chip', '');
      var errChip = el('span', 'mg-chip', '');
      head.appendChild(progress);
      head.appendChild(errChip);
      root.appendChild(head);
      root.appendChild(el('p', 'mg-help', 'Para cada solo degradado: cave com a pá, plante a muda e depois regue.'));

      var toolbar = el('div', 'mg-tools');
      toolbar.setAttribute('role', 'radiogroup');
      toolbar.setAttribute('aria-label', 'Ferramenta');
      TOOLS.forEach(function (t) {
        var b = el('button', 'btn btn-tool tool-' + t.id, t.label);
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', t.id === tool ? 'true' : 'false');
        b.addEventListener('click', function () {
          tool = t.id;
          EQ.Audio.play('click');
          Array.prototype.forEach.call(toolbar.children, function (x) { x.setAttribute('aria-checked', 'false'); });
          b.setAttribute('aria-checked', 'true');
        });
        toolbar.appendChild(b);
      });
      root.appendChild(toolbar);

      var grid = el('div', 'plant-grid');
      grid.style.setProperty('--cols', cols);
      var fb = el('p', 'mg-feedback');
      fb.setAttribute('aria-live', 'polite');
      var names = ['Solo degradado', 'Cova aberta', 'Muda plantada', 'Muda regada'];

      for (var i = 0; i < total; i++) {
        (function (idx) {
          var cell = el('button', 'plant-cell');
          cell.type = 'button';
          var isTarget = idx in stage;
          function paint() {
            cell.className = 'plant-cell ' + (isTarget ? 'st-' + stage[idx] : 'st-ok');
            cell.setAttribute('aria-label', isTarget ? names[stage[idx]] : 'Vegetação saudável');
          }
          paint();
          cell.addEventListener('click', function () {
            if (!isTarget) {
              fb.textContent = 'Esta área já tem vegetação. Procure o solo degradado.';
              fb.className = 'mg-feedback';
              return;
            }
            var s = stage[idx];
            if (s >= 3) return;
            var needed = TOOLS[s].id;
            if (tool === needed) {
              stage[idx] = s + 1;
              EQ.Audio.play(s === 2 ? 'collect' : 'click');
              fb.textContent = '';
              paint();
              update();
            } else {
              errors++;
              EQ.Audio.play('wrong');
              cell.classList.add('shake');
              setTimeout(function () { cell.classList.remove('shake'); }, 300);
              fb.textContent = 'Agora é a vez de usar: ' + TOOLS[s].label + '.';
              fb.className = 'mg-feedback bad';
              update();
            }
          });
          grid.appendChild(cell);
        })(i);
      }
      root.appendChild(grid);
      root.appendChild(fb);

      function update() {
        var done = targets.filter(function (t) { return stage[t] === 3; }).length;
        progress.textContent = 'Mudas: ' + done + '/' + targets.length;
        errChip.textContent = 'Erros: ' + errors;
        if (done === targets.length) {
          setTimeout(function () {
            finish({
              passed: true,
              score: Math.max(30, 100 - errors * 8),
              summary: 'Você plantou ' + targets.length + ' mudas nativas com ' + errors + ' erro(s).'
            });
          }, 450);
        }
      }
      update();
    }

    chooseSpecies();
    return function () {};
  }

  /* ---------- LIMPEZA DA ÁGUA ---------- */
  var TRASH = {
    garrafa: [['#d8ecf2', 3, 6, 9, 4], ['#4fa3d9', 12, 7, 2, 2], ['#ffffff', 4, 7, 3, 1]],
    sacola: [['#f4f4f4', 4, 4, 8, 8], ['#c9c9c9', 5, 10, 6, 1], ['#f4f4f4', 5, 2, 2, 2], ['#f4f4f4', 9, 2, 2, 2]],
    lata: [['#d94a3a', 5, 4, 6, 9], ['#cfd3d6', 5, 4, 6, 1], ['#cfd3d6', 5, 12, 6, 1], ['#ffffff', 6, 6, 1, 4]]
  };
  var CRITTERS = {
    boto: [['#f2a0b4', 2, 7, 11, 4], ['#f2a0b4', 13, 8, 2, 2], ['#f2a0b4', 0, 6, 2, 2], ['#f2a0b4', 6, 5, 3, 2], ['#1d1d1d', 11, 8, 1, 1]],
    peixe: [['#ffcc4d', 5, 6, 7, 5], ['#e0a020', 2, 6, 3, 5], ['#1d1d1d', 10, 7, 1, 1]],
    tartaruga: [['#4f8a4a', 4, 5, 8, 6], ['#6faa5a', 5, 6, 6, 4], ['#a8c47a', 12, 7, 2, 2], ['#4f8a4a', 3, 4, 2, 2], ['#4f8a4a', 11, 4, 2, 2], ['#4f8a4a', 3, 10, 2, 2], ['#4f8a4a', 11, 10, 2, 2]],
    jacare: [['#4a6a2a', 1, 7, 14, 3], ['#3a5a1a', 2, 6, 2, 1], ['#3a5a1a', 6, 6, 2, 1], ['#3a5a1a', 10, 6, 2, 1], ['#1d1d1d', 13, 7, 1, 1]]
  };
  var SCENES = {
    rio: { water: '#2f7fb0', light: '#5aa3d1', bank: '#3e8e3a' },
    baia: { water: '#3f8fc0', light: '#6db3dd', bank: '#6aa84a' },
    mar: { water: '#1d6f9c', light: '#3a93c2', bank: '#ead7a0' }
  };

  function clean(mission, root, finish) {
    var cfg = mission.config;
    var scene = SCENES[cfg.scene] || SCENES.rio;
    var collected = 0, timeLeft = cfg.time, ended = false, raf = 0, spawnT = 0, last = 0;
    var items = [];
    var reduce = EQ.UI.reducedMotion();

    root.innerHTML = '';
    var head = el('div', 'mg-head');
    var chipTrash = el('span', 'mg-chip', '');
    var chipTime = el('span', 'mg-chip', '');
    head.appendChild(chipTrash);
    head.appendChild(chipTime);
    root.appendChild(head);
    root.appendChild(el('p', 'mg-help', 'Toque ou clique no lixo. Não toque nos animais: isso os assusta e você perde 1 item.'));

    var wrap = el('div', 'clean-wrap');
    var cv = el('canvas', 'clean-canvas');
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', 'Água com lixo flutuando e animais nadando');
    wrap.appendChild(cv);
    root.appendChild(wrap);
    var fb = el('p', 'mg-feedback');
    fb.setAttribute('aria-live', 'polite');
    root.appendChild(fb);

    var ctx = cv.getContext('2d');
    var dpr = Math.min(2, global.devicePixelRatio || 1);
    var cssW = Math.max(280, wrap.clientWidth || 560), cssH = 300;
    cv.width = cssW * dpr; cv.height = cssH * dpr;
    cv.style.height = cssH + 'px';
    var s = Math.round(3 * dpr);
    var size = 16 * s;

    function spawn() {
      var isTrash = Math.random() < 0.68;
      var kinds = isTrash ? Object.keys(TRASH) : cfg.critters;
      var kind = kinds[Math.floor(Math.random() * kinds.length)];
      var laneTop = 30 * dpr, laneH = cv.height - 60 * dpr - size;
      items.push({
        trash: isTrash, kind: kind,
        x: -size, y: laneTop + Math.random() * laneH, base: 0,
        vx: (reduce ? 40 : 60 + Math.random() * 60) * dpr * (isTrash ? 1 : 1.2),
        phase: Math.random() * 6
      });
    }

    function draw(time) {
      ctx.fillStyle = scene.water;
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = scene.bank;
      ctx.fillRect(0, 0, cv.width, 18 * dpr);
      ctx.fillRect(0, cv.height - 18 * dpr, cv.width, 18 * dpr);
      ctx.fillStyle = scene.light;
      for (var i = 0; i < 14; i++) {
        var wx = ((i * 97 + (reduce ? 0 : time * 30)) % (cv.width + 60)) - 30;
        var wy = 30 * dpr + ((i * 53) % (cv.height - 70 * dpr));
        ctx.fillRect(Math.round(wx), Math.round(wy), 18 * dpr, 2 * dpr);
      }
      items.forEach(function (it) {
        var rects = it.trash ? TRASH[it.kind] : CRITTERS[it.kind];
        var bob = reduce ? 0 : Math.sin(time * 2 + it.phase) * 3 * dpr;
        rects.forEach(function (r) {
          ctx.fillStyle = r[0];
          ctx.fillRect(Math.round(it.x + r[1] * s), Math.round(it.y + bob + r[2] * s), r[3] * s, r[4] * s);
        });
      });
    }

    function hud() {
      chipTrash.textContent = 'Lixo: ' + collected + '/' + cfg.goal;
      chipTime.textContent = 'Tempo: ' + Math.ceil(timeLeft) + 's';
    }

    function end(passed) {
      if (ended) return;
      ended = true;
      cancelAnimationFrame(raf);
      setTimeout(function () {
        finish({
          passed: passed,
          score: passed ? Math.min(100, 60 + Math.round(timeLeft)) : Math.round((collected / cfg.goal) * 100),
          summary: passed
            ? 'Você recolheu ' + collected + ' itens com ' + Math.ceil(timeLeft) + 's de sobra.'
            : 'O tempo acabou com ' + collected + ' de ' + cfg.goal + ' itens recolhidos.'
        });
      }, 300);
    }

    function frame(ts) {
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      timeLeft -= dt;
      spawnT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = reduce ? 0.9 : 0.6; }
      items.forEach(function (it) { it.x += it.vx * dt; });
      items = items.filter(function (it) { return it.x < cv.width + size; });
      draw(ts / 1000);
      hud();
      if (timeLeft <= 0) { timeLeft = 0; hud(); end(false); return; }
      raf = requestAnimationFrame(frame);
    }

    cv.addEventListener('pointerdown', function (e) {
      if (ended) return;
      var rect = cv.getBoundingClientRect();
      var x = (e.clientX - rect.left) * (cv.width / rect.width);
      var y = (e.clientY - rect.top) * (cv.height / rect.height);
      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        if (x >= it.x - 6 * dpr && x <= it.x + size + 6 * dpr && y >= it.y - 6 * dpr && y <= it.y + size + 6 * dpr) {
          items.splice(i, 1);
          if (it.trash) {
            collected++;
            EQ.Audio.play('collect');
            fb.textContent = '';
            if (collected >= cfg.goal) { hud(); end(true); }
          } else {
            collected = Math.max(0, collected - 1);
            EQ.Audio.play('wrong');
            fb.textContent = 'Cuidado! Você assustou um animal.';
            fb.className = 'mg-feedback bad';
          }
          hud();
          return;
        }
      }
    });

    hud();
    raf = requestAnimationFrame(frame);
    return function () { ended = true; cancelAnimationFrame(raf); };
  }

  /* ---------- SEPARAÇÃO DE RESÍDUOS ---------- */
  var BINS = [
    { id: 'papel', label: 'Papel', color: '#2f6fd1' },
    { id: 'plastico', label: 'Plástico', color: '#d93a3a' },
    { id: 'metal', label: 'Metal', color: '#e8b820' },
    { id: 'vidro', label: 'Vidro', color: '#2f9e4a' },
    { id: 'organico', label: 'Orgânico', color: '#7a5230' }
  ];

  function sort(mission, root, finish) {
    var items = shuffle(mission.config.items);
    var index = 0, correct = 0;

    function render() {
      root.innerHTML = '';
      var head = el('div', 'mg-head');
      head.appendChild(el('span', 'mg-chip', 'Item ' + (index + 1) + ' de ' + items.length));
      head.appendChild(el('span', 'mg-chip', 'Acertos: ' + correct));
      root.appendChild(head);

      var card = el('div', 'sort-item');
      card.appendChild(el('span', 'sort-label', 'Para qual lixeira vai:'));
      var name = el('strong', 'sort-name', items[index].name);
      name.id = 'sort-name';
      card.appendChild(name);
      root.appendChild(card);

      var bins = el('div', 'sort-bins');
      bins.setAttribute('role', 'group');
      bins.setAttribute('aria-labelledby', 'sort-name');
      var fb = el('p', 'mg-feedback');
      fb.setAttribute('aria-live', 'polite');
      BINS.forEach(function (bin) {
        var b = el('button', 'sort-bin');
        b.type = 'button';
        b.style.setProperty('--bin', bin.color);
        b.appendChild(el('span', 'bin-lid'));
        b.appendChild(el('span', 'bin-body'));
        b.appendChild(el('span', 'bin-label', bin.label));
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(bins.querySelectorAll('button'), function (x) { x.disabled = true; });
          var right = BINS.filter(function (x) { return x.id === items[index].bin; })[0];
          if (bin.id === items[index].bin) {
            correct++;
            b.classList.add('is-correct');
            fb.textContent = 'Certo! ' + items[index].name + ' vai no ' + right.label.toLowerCase() + '.';
            fb.className = 'mg-feedback ok';
            EQ.Audio.play('correct');
          } else {
            b.classList.add('is-wrong');
            fb.textContent = 'Ops! ' + items[index].name + ' vai na lixeira de ' + right.label.toLowerCase() + '.';
            fb.className = 'mg-feedback bad';
            EQ.Audio.play('wrong');
          }
          setTimeout(function () {
            index++;
            if (index < items.length) render();
            else {
              finish({
                passed: correct >= mission.config.pass,
                score: Math.round((correct / items.length) * 100),
                summary: 'Você separou corretamente ' + correct + ' de ' + items.length + ' resíduos.' +
                  (correct >= mission.config.pass ? '' : ' É preciso acertar pelo menos ' + mission.config.pass + '.')
              });
            }
          }, 1100);
        });
        bins.appendChild(b);
      });
      root.appendChild(bins);
      root.appendChild(fb);
    }
    render();
    return function () {};
  }

  /* ---------- MEMÓRIA ---------- */
  function memory(mission, root, finish) {
    var pairs = mission.config.pairs;
    var cards = [];
    pairs.forEach(function (p, i) {
      cards.push({ pair: i, text: p[0], kind: 'animal' });
      cards.push({ pair: i, text: p[1], kind: 'fato' });
    });
    cards = shuffle(cards);
    var open = [], matched = 0, moves = 0, lock = false;

    root.innerHTML = '';
    var head = el('div', 'mg-head');
    var chipPairs = el('span', 'mg-chip', '');
    var chipMoves = el('span', 'mg-chip', '');
    head.appendChild(chipPairs);
    head.appendChild(chipMoves);
    root.appendChild(head);
    root.appendChild(el('p', 'mg-help', 'Vire duas cartas por vez e combine cada animal com sua característica.'));
    var grid = el('div', 'memory-grid');
    root.appendChild(grid);

    function hud() {
      chipPairs.textContent = 'Pares: ' + matched + '/' + pairs.length;
      chipMoves.textContent = 'Jogadas: ' + moves;
    }

    cards.forEach(function (c, i) {
      var b = el('button', 'memory-card');
      b.type = 'button';
      b.setAttribute('aria-label', 'Carta virada ' + (i + 1));
      var face = el('span', 'memory-face ' + c.kind, c.text);
      face.setAttribute('aria-hidden', 'true');
      b.appendChild(el('span', 'memory-back'));
      b.appendChild(face);
      c.btn = b;
      b.addEventListener('click', function () {
        if (lock || b.classList.contains('flipped')) return;
        b.classList.add('flipped');
        b.setAttribute('aria-label', c.text);
        face.removeAttribute('aria-hidden');
        EQ.Audio.play('click');
        open.push(c);
        if (open.length === 2) {
          moves++;
          var a = open[0], z = open[1];
          if (a.pair === z.pair) {
            matched++;
            a.btn.classList.add('matched'); z.btn.classList.add('matched');
            a.btn.disabled = true; z.btn.disabled = true;
            open = [];
            EQ.Audio.play('correct');
            hud();
            if (matched === pairs.length) {
              setTimeout(function () {
                finish({
                  passed: true,
                  score: Math.max(40, 100 - (moves - pairs.length) * 5),
                  summary: 'Você encontrou todos os pares em ' + moves + ' jogadas.'
                });
              }, 500);
            }
          } else {
            lock = true;
            setTimeout(function () {
              [a, z].forEach(function (x) {
                x.btn.classList.remove('flipped');
                x.btn.setAttribute('aria-label', 'Carta virada');
              });
              open = [];
              lock = false;
            }, 850);
            hud();
          }
        }
      });
      grid.appendChild(b);
    });
    hud();
    return function () {};
  }

  global.EQ.Minigames = {
    run: function (mission, root, finish) {
      var games = { quiz: quiz, plant: plant, clean: clean, sort: sort, memory: memory };
      var fn = games[mission.type];
      if (!fn) return function () {};
      return fn(mission, root, finish);
    }
  };
})(window);
