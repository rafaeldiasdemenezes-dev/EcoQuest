/*
 * EcoQuest — Enciclopédia de animais com busca e filtros.
 */
(function (global) {
  'use strict';

  var EQ = global.EQ;
  var D = EQ.DATA;
  var G = EQ.Game;
  var UI = EQ.UI;
  var esc = UI.esc;

  var filters = { q: '', group: 'all', habitat: 'all', onlyUnlocked: false };
  var initialized = false;

  function normalize(str) {
    return String(str).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function unlockSource(animalId) {
    if (animalId === D.finalReward) return 'Conquista “Planeta Vivo” (todas as missões)';
    var m = D.missions.filter(function (x) { return x.unlocks.indexOf(animalId) >= 0; })[0];
    return m ? 'Missão “' + m.title + '” · ' + D.region(m.region).name : 'Missão especial';
  }

  function statusBadge(code) {
    return '<span class="status st-' + code + '" title="' + esc(D.statusLabels[code]) + '">' + code + '<span class="status-text"> · ' + esc(D.statusLabels[code]) + '</span></span>';
  }

  function animalImage(animal) {
    return 'images/animals/species/' + animal.id + '.jpg';
  }

  function animalImageAlt(animal) {
    return 'Fotografia de ' + animal.name + ' (' + animal.scientific + ')';
  }

  function init() {
    if (initialized) return;
    initialized = true;
    var groupSel = document.getElementById('filter-group');
    Object.keys(D.groups).forEach(function (k) {
      var o = document.createElement('option');
      o.value = k; o.textContent = D.groups[k].name;
      groupSel.appendChild(o);
    });
    var habSel = document.getElementById('filter-habitat');
    Object.keys(D.habitats).forEach(function (k) {
      var o = document.createElement('option');
      o.value = k; o.textContent = D.habitats[k];
      habSel.appendChild(o);
    });
    document.getElementById('filter-search').addEventListener('input', function (e) { filters.q = e.target.value; render(); });
    groupSel.addEventListener('change', function (e) { filters.group = e.target.value; render(); });
    habSel.addEventListener('change', function (e) { filters.habitat = e.target.value; render(); });
    document.getElementById('filter-unlocked').addEventListener('change', function (e) { filters.onlyUnlocked = e.target.checked; render(); });
  }

  function render() {
    init();
    var grid = document.getElementById('animal-grid');
    var s = EQ.Storage.get();
    var q = normalize(filters.q.trim());
    var list = D.animals.filter(function (a) {
      var unlocked = G.isAnimalUnlocked(a.id);
      if (filters.onlyUnlocked && !unlocked) return false;
      if (filters.group !== 'all' && a.group !== filters.group) return false;
      if (filters.habitat !== 'all' && a.habitats.indexOf(filters.habitat) < 0) return false;
      if (q && normalize(a.name + ' ' + a.scientific).indexOf(q) < 0) return false;
      return true;
    });

    document.getElementById('encyclopedia-count').textContent =
      G.unlockedAnimalsCount() + ' de ' + D.animals.length + ' fichas desbloqueadas · exibindo ' + list.length;

    grid.innerHTML = '';
    if (!list.length) {
      grid.innerHTML = '<p class="empty">Nenhum animal encontrado com esses filtros.</p>';
      return;
    }

    list.forEach(function (a) {
      var unlocked = G.isAnimalUnlocked(a.id);
      var isNew = unlocked && s.animals[a.id] && !s.animals[a.id].seen;
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'animal-card' + (unlocked ? '' : ' locked');
      card.innerHTML =
        '<span class="animal-art">' +
          '<img src="' + animalImage(a) + '" alt="' + esc(animalImageAlt(a)) + '" loading="lazy" width="256" height="256">' +
          (isNew ? '<span class="new-badge">Novo</span>' : '') +
          (unlocked ? '' : '<span class="lock-badge">' + UI.icon('lock') + '</span>') +
        '</span>' +
        '<span class="animal-body">' +
          '<span class="animal-group">' + esc(D.groups[a.group].name) + '</span>' +
          '<strong class="animal-name">' + esc(a.name) + '</strong>' +
          (unlocked
            ? '<em class="animal-sci">' + esc(a.scientific) + '</em>' + statusBadge(a.status)
            : '<span class="animal-hint">' + esc(unlockSource(a.id)) + '</span>') +
        '</span>';
      var img = card.querySelector('img');
      img.addEventListener('error', function () {
        img.replaceWith(fallbackArt(a.group));
      });
      card.addEventListener('click', function () {
        if (unlocked) openAnimal(a);
        else UI.toast('Ficha bloqueada. Desbloqueie em: ' + unlockSource(a.id), 'error');
      });
      grid.appendChild(card);
    });
  }

  function fallbackArt(group) {
    var span = document.createElement('span');
    span.className = 'art-fallback';
    span.innerHTML = UI.icon('paw');
    span.setAttribute('data-group', group);
    return span;
  }

  function openAnimal(a) {
    G.markAnimalSeen(a.id);
    UI.updateHud();
    UI.openDialog(function (body) {
      body.innerHTML =
        '<div class="animal-sheet">' +
          '<div class="sheet-art"><img src="' + animalImage(a) + '" alt="' + esc(animalImageAlt(a)) + '" width="256" height="256"></div>' +
          '<div class="sheet-head">' +
            '<p class="eyebrow">' + esc(D.groups[a.group].name) + '</p>' +
            '<h2 class="modal-title">' + esc(a.name) + '</h2>' +
            '<p class="sci"><em>' + esc(a.scientific) + '</em></p>' +
            statusBadge(a.status) +
          '</div>' +
        '</div>' +
        '<p class="lead">' + esc(a.description) + '</p>' +
        '<dl class="sheet-data">' +
          '<div><dt>Habitat</dt><dd>' + esc(a.habitats.map(function (h) { return D.habitats[h]; }).join(', ')) + '</dd></div>' +
          '<div><dt>Alimentação</dt><dd>' + esc(a.diet) + '</dd></div>' +
          '<div><dt>Tamanho</dt><dd>' + esc(a.size) + '</dd></div>' +
          '<div><dt>Ameaças</dt><dd>' + esc(a.threats) + '</dd></div>' +
        '</dl>' +
        '<div class="fact"><span class="objective-label">Curiosidade</span><p>' + esc(a.curiosity) + '</p></div>' +
        '<p class="note">Status de conservação global segundo a Lista Vermelha da IUCN.</p>' +
        '<div class="modal-actions"><button type="button" class="btn btn-primary" id="sheet-close">Fechar</button></div>';
      var img = body.querySelector('.sheet-art img');
      img.addEventListener('error', function () { img.replaceWith(fallbackArt(a.group)); });
      body.querySelector('#sheet-close').addEventListener('click', UI.closeDialog);
    }, { label: 'Ficha: ' + a.name, onClose: render });
  }

  global.EQ.Encyclopedia = { render: render };
})(window);
