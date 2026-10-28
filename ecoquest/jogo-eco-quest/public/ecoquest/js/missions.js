/*
 * EcoQuest — Fluxo das missões: briefing, minijogo, recompensas.
 */
(function (global) {
  'use strict';

  var EQ = global.EQ;
  var D = EQ.DATA;
  var G = EQ.Game;
  var UI = EQ.UI;
  var esc = UI.esc;

  var TYPE_LABELS = {
    quiz: 'Quiz', plant: 'Plantio', clean: 'Minijogo de limpeza',
    sort: 'Separação de resíduos', memory: 'Jogo da memória', explore: 'Exploração'
  };

  function animalNames(ids) {
    return ids.map(function (id) { var a = D.animal(id); return a ? a.name : id; });
  }

  function badge(mission) {
    var cat = D.categories[mission.category];
    return '<span class="cat-badge" style="--cat:' + cat.color + '">' + esc(cat.name) + '</span>' +
      '<span class="tag">' + esc(TYPE_LABELS[mission.type]) + '</span>' +
      '<span class="tag">' + esc(mission.difficulty) + '</span>';
  }

  function open(mission) {
    if (!G.isRegionUnlocked(mission.region)) {
      UI.toast('Região bloqueada: ' + D.region(mission.region).unlock.text + '.', 'error');
      return;
    }
    var done = G.isMissionDone(mission.id);
    var region = D.region(mission.region);

    UI.openDialog(function (body) {
      var progressHtml = '';
      if (mission.type === 'explore') {
        var got = G.exploreProgress(mission.id).length;
        var started = (EQ.Storage.get().missions[mission.id] || {}).attempts > 0;
        if (started && !done) {
          progressHtml = '<p class="mission-progress">' + UI.icon('walk') + ' Progresso: ' + got + '/' + mission.config.count + ' encontrados</p>';
        }
      }
      body.innerHTML =
        '<p class="eyebrow">' + esc(region.name) + ' · ' + esc(region.guide) + '</p>' +
        '<h2 class="modal-title">' + esc(mission.title) + '</h2>' +
        '<div class="badges">' + badge(mission) + (done ? '<span class="tag tag-done">' + UI.icon('check') + ' Concluída</span>' : '') + '</div>' +
        '<p class="lead">' + esc(mission.description) + '</p>' +
        '<div class="objective"><span class="objective-label">Objetivo</span><p>' + esc(mission.objective) + '</p></div>' +
        progressHtml +
        '<div class="rewards">' +
          '<span class="reward">' + UI.icon('bolt') + ' ' + mission.xp + ' XP</span>' +
          '<span class="reward">' + UI.icon('leaf') + ' ' + mission.seeds + ' sementes</span>' +
          '<span class="reward">' + UI.icon('paw') + ' ' + esc(animalNames(mission.unlocks).join(', ')) + '</span>' +
        '</div>' +
        (done ? '<p class="note">Você já recebeu as recompensas desta missão. ' + (mission.type === 'explore' ? '' : 'Pode jogar de novo como treino, sem ganhar XP.') + '</p>' : '') +
        '<div class="modal-actions"></div>';

      var actions = body.querySelector('.modal-actions');
      var cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'btn btn-ghost';
      cancel.textContent = 'Voltar';
      cancel.addEventListener('click', UI.closeDialog);

      if (mission.type === 'explore') {
        if (!done) {
          var go = document.createElement('button');
          go.type = 'button';
          go.className = 'btn btn-primary';
          var started = (EQ.Storage.get().missions[mission.id] || {}).attempts > 0;
          go.textContent = started ? 'Continuar exploração' : 'Aceitar e explorar';
          go.addEventListener('click', function () { startExplore(mission); });
          actions.appendChild(cancel);
          actions.appendChild(go);
        } else {
          actions.appendChild(cancel);
        }
      } else {
        var play = document.createElement('button');
        play.type = 'button';
        play.className = 'btn btn-primary';
        play.textContent = done ? 'Jogar como treino' : 'Iniciar missão';
        play.addEventListener('click', function () { play_(mission, done); });
        actions.appendChild(cancel);
        actions.appendChild(play);
      }
    }, { label: mission.title });
  }

  function startExplore(mission) {
    var rec = EQ.Storage.get().missions[mission.id];
    if (!rec || rec.attempts === 0) G.recordAttempt(mission.id);
    UI.closeDialog();
    if (UI.currentScreen() !== 'world' || !EQ.World.isActive()) {
      EQ.App.enterRegion(mission.region);
    }
    UI.toast('Use o rastreador para encontrar: ' + mission.config.label + '.', '');
  }

  function play_(mission, practice) {
    G.recordAttempt(mission.id);
    UI.openDialog(function (body) {
      body.innerHTML =
        '<p class="eyebrow">' + esc(D.region(mission.region).name) + (practice ? ' · Treino' : '') + '</p>' +
        '<h2 class="modal-title">' + esc(mission.title) + '</h2>' +
        '<div class="minigame"></div>';
      var root = body.querySelector('.minigame');
      var cleanup = EQ.Minigames.run(mission, root, function (result) {
        UI.setCleanup(null);
        if (cleanup) cleanup();
        showResult(mission, result, practice);
      });
      UI.setCleanup(cleanup);
    }, { label: mission.title, wide: true });
  }

  function showResult(mission, result, practice) {
    var reward = null;
    if (result.passed) reward = G.completeMission(mission.id, result.score, { perfectQuiz: mission.type === 'quiz' && result.perfect });

    UI.openDialog(function (body) {
      var html = '';
      if (result.passed) {
        html += '<p class="eyebrow">Missão cumprida</p><h2 class="modal-title result-win">' + esc(mission.title) + '</h2>';
      } else {
        html += '<p class="eyebrow">Ainda não foi desta vez</p><h2 class="modal-title result-lose">Tente novamente</h2>';
      }
      if (result.summary) html += '<p class="lead">' + esc(result.summary) + '</p>';

      if (reward && reward.firstTime) {
        html += '<div class="rewards big">' +
          '<span class="reward">' + UI.icon('bolt') + ' +' + reward.xp + ' XP</span>' +
          '<span class="reward">' + UI.icon('leaf') + ' +' + reward.seeds + ' sementes</span></div>';
        if (reward.animals.length) {
          html += '<div class="unlocked-list"><span class="objective-label">Novas fichas na enciclopédia</span><ul>' +
            reward.animals.map(function (id) { return '<li>' + UI.icon('paw') + ' ' + esc(D.animal(id).name) + '</li>'; }).join('') + '</ul></div>';
        }
        if (reward.leveledUp) html += '<p class="levelup">' + UI.icon('star') + ' Você subiu para o nível ' + reward.level + '!</p>';
        reward.unlockedRegions.forEach(function (rid) {
          html += '<p class="levelup">' + UI.icon('map') + ' Nova região liberada: ' + esc(D.region(rid).name) + '</p>';
        });
        html += '<p class="note">' + esc(D.region(mission.region).name) + ' está ' + Math.round(G.regionProgress(mission.region) * 100) + '% restaurada.</p>';
      } else if (reward && !reward.firstTime) {
        html += '<p class="note">Treino concluído. As recompensas desta missão já foram recebidas antes.</p>';
      }

      html += '<div class="fact"><span class="objective-label">Você sabia?</span><p>' + esc(mission.fact) + '</p></div>';
      html += '<div class="modal-actions"></div>';
      body.innerHTML = html;

      var actions = body.querySelector('.modal-actions');
      if (!result.passed) {
        var retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'btn btn-ghost';
        retry.textContent = 'Tentar de novo';
        retry.addEventListener('click', function () { play_(mission, practice); });
        actions.appendChild(retry);
      }
      var ok = document.createElement('button');
      ok.type = 'button';
      ok.className = 'btn btn-primary';
      ok.textContent = 'Continuar';
      ok.addEventListener('click', UI.closeDialog);
      actions.appendChild(ok);
    }, { label: 'Resultado da missão', onClose: afterReward });

    if (result.passed) {
      EQ.Audio.play(reward && reward.leveledUp ? 'levelup' : 'success');
      UI.burst(document.querySelector('#modal .modal-title'));
    } else {
      EQ.Audio.play('wrong');
    }
    if (reward) announce(reward);
  }

  function announce(reward) {
    reward.achievements.forEach(function (id, i) {
      var ach = EQ.DATA.achievements.filter(function (a) { return a.id === id; })[0];
      setTimeout(function () {
        UI.toast('Conquista: ' + ach.name, 'achievement');
        EQ.Audio.play('unlock');
      }, 600 + i * 700);
    });
  }

  function afterReward() {
    UI.updateHud();
    if (EQ.World.isActive()) EQ.World.refresh();
    EQ.App.refreshCurrent();
  }

  function finishExplore(mission) {
    showResult(mission, {
      passed: true,
      score: 100,
      summary: 'Você encontrou todos os itens: ' + mission.config.count + ' × ' + mission.config.label.toLowerCase() + '.'
    }, false);
  }

  global.EQ.Missions = {
    open: open,
    finishExplore: finishExplore,
    typeLabel: function (t) { return TYPE_LABELS[t]; },
    announce: announce
  };
})(window);
