/*
 * EcoQuest — Mapa do mundo com regiões clicáveis.
 */
(function (global) {
  'use strict';

  var EQ = global.EQ;
  var D = EQ.DATA;
  var G = EQ.Game;
  var UI = EQ.UI;
  var esc = UI.esc;

  function statusText(region) {
    if (!G.isRegionUnlocked(region.id)) return 'Bloqueada · ' + region.unlock.text;
    var p = Math.round(G.regionProgress(region.id) * 100);
    if (p >= 100) return 'Restaurada · 100%';
    return 'Degradada · ' + p + '% restaurada';
  }

  function render() {
    var board = document.getElementById('map-board');
    board.innerHTML = '';
    D.regions.forEach(function (region) {
      var unlocked = G.isRegionUnlocked(region.id);
      var progress = G.regionProgress(region.id);
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'region-card area-' + region.id + (unlocked ? '' : ' locked') + (progress >= 1 ? ' restored' : '');
      card.setAttribute('aria-label', region.name + ': ' + statusText(region));
      var thumb = document.createElement('canvas');
      thumb.className = 'region-thumb';
      thumb.setAttribute('aria-hidden', 'true');
      EQ.World.renderThumbnail(region.id, thumb);
      var info = document.createElement('span');
      info.className = 'region-info';
      info.innerHTML =
        '<span class="region-name">' + (unlocked ? '' : UI.icon('lock')) + esc(region.name) + '</span>' +
        '<span class="region-tag">' + esc(region.tagline) + '</span>' +
        '<span class="meter" aria-hidden="true"><span class="meter-fill" style="width:' + Math.round(progress * 100) + '%"></span></span>' +
        '<span class="region-status">' + esc(statusText(region)) + '</span>';
      card.appendChild(thumb);
      card.appendChild(info);
      card.addEventListener('click', function () { EQ.Audio.play('click'); openRegion(region); });
      board.appendChild(card);
    });

    var total = D.missions.length;
    var done = G.completedCount();
    document.getElementById('planet-progress-fill').style.width = Math.round((done / total) * 100) + '%';
    document.getElementById('planet-progress-text').textContent = Math.round((done / total) * 100) + '% do planeta restaurado · ' + done + '/' + total + ' missões';
  }

  function openRegion(region) {
    var unlocked = G.isRegionUnlocked(region.id);
    var missions = D.missionsOf(region.id);
    var animalsHere = D.animals.filter(function (a) {
      return missions.some(function (m) { return m.unlocks.indexOf(a.id) >= 0; });
    });
    var found = animalsHere.filter(function (a) { return G.isAnimalUnlocked(a.id); }).length;

    UI.openDialog(function (body) {
      var progress = Math.round(G.regionProgress(region.id) * 100);
      body.innerHTML =
        '<p class="eyebrow">' + esc(region.tagline) + '</p>' +
        '<h2 class="modal-title">' + esc(region.name) + '</h2>' +
        '<canvas class="region-preview" aria-hidden="true"></canvas>' +
        '<p class="lead">' + esc(region.description) + '</p>' +
        '<div class="region-meta">' +
          '<div><span class="objective-label">Restauração</span><span class="meter"><span class="meter-fill" style="width:' + progress + '%"></span></span><span class="small">' + progress + '%</span></div>' +
          '<div><span class="objective-label">Fichas de animais</span><span class="small">' + found + '/' + animalsHere.length + ' descobertas</span></div>' +
          '<div><span class="objective-label">Desbloqueio</span><span class="small">' + esc(region.unlock.text) + '</span></div>' +
        '</div>' +
        '<div class="fact"><span class="objective-label">Você sabia?</span><p>' + esc(region.fact) + '</p></div>' +
        (unlocked ? '<h3 class="section-title">Missões</h3><ul class="mission-list"></ul>' : '<p class="note">' + UI.icon('lock') + ' Para liberar: ' + esc(region.unlock.text.toLowerCase()) + '. Você já concluiu ' + G.completedCount() + '.</p>') +
        '<div class="modal-actions"></div>';

      EQ.World.renderThumbnail(region.id, body.querySelector('.region-preview'));

      if (unlocked) {
        var list = body.querySelector('.mission-list');
        missions.forEach(function (m) {
          var done = G.isMissionDone(m.id);
          var cat = D.categories[m.category];
          var li = document.createElement('li');
          li.className = 'mission-row' + (done ? ' done' : '');
          li.innerHTML =
            '<span class="mission-dot" style="--cat:' + cat.color + '">' + (done ? UI.icon('check') : '') + '</span>' +
            '<span class="mission-text"><strong>' + esc(m.title) + '</strong><span>' + esc(cat.name) + ' · ' + esc(EQ.Missions.typeLabel(m.type)) + ' · ' + esc(m.difficulty) + '</span></span>';
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn btn-small';
          btn.textContent = done ? 'Ver' : 'Jogar';
          btn.addEventListener('click', function () { EQ.Missions.open(m); });
          li.appendChild(btn);
          list.appendChild(li);
        });
      }

      var actions = body.querySelector('.modal-actions');
      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'btn btn-ghost';
      close.textContent = 'Fechar';
      close.addEventListener('click', UI.closeDialog);
      actions.appendChild(close);
      if (unlocked) {
        var enter = document.createElement('button');
        enter.type = 'button';
        enter.className = 'btn btn-primary';
        enter.innerHTML = UI.icon('walk') + ' Explorar a região';
        enter.addEventListener('click', function () {
          UI.closeDialog();
          EQ.App.enterRegion(region.id);
        });
        actions.appendChild(enter);
      }
    }, { label: region.name });
  }

  global.EQ.MapScreen = { render: render, openRegion: openRegion };
})(window);
