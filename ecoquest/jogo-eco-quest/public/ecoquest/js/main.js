/*
 * EcoQuest — Inicialização e navegação principal.
 */
(function (global) {
  'use strict';

  var EQ = global.EQ;
  var S = EQ.Storage;
  var UI = EQ.UI;
  var G = EQ.Game;
  var D = EQ.DATA;

  S.onError(function (kind) {
    var messages = {
      quota: 'Sem espaço no armazenamento local. Exporte seu save em Configurações.',
      corrupt: 'O save estava corrompido e foi reiniciado. Uma cópia de segurança foi guardada.',
      write: 'Não foi possível salvar o progresso neste navegador.',
      read: 'Não foi possível ler o progresso salvo.'
    };
    setTimeout(function () { if (EQ.UI) EQ.UI.toast(messages[kind] || 'Erro de armazenamento.', 'error'); }, 50);
  });

  S.load();

  function goTitle() {
    UI.closeDialog();
    renderTitle();
    UI.showScreen('title');
  }

  function renderTitle() {
    var s = S.get();
    var start = document.getElementById('btn-start');
    var welcome = document.getElementById('title-welcome');
    if (s.profile) {
      start.textContent = 'Continuar aventura';
      welcome.textContent = 'Bem-vindo de volta, ' + s.profile.name + ' · Nível ' + G.levelInfo(s.stats.xp).level;
      welcome.hidden = false;
    } else {
      start.textContent = 'Iniciar aventura';
      welcome.hidden = true;
    }
  }

  function startGame() {
    EQ.Audio.play('click');
    if (!S.get().profile) {
      EQ.Profile.openEditor(true, function () {
        UI.showScreen('map');
        setTimeout(howToPlay, 250);
      });
    } else {
      UI.updateHud();
      UI.showScreen('map');
    }
  }

  function enterRegion(regionId) {
    if (!G.isRegionUnlocked(regionId)) {
      UI.toast('Região bloqueada: ' + D.region(regionId).unlock.text + '.', 'error');
      return;
    }
    UI.showScreen('world');
    var newAch = G.visitRegion(regionId);
    EQ.World.enter(regionId);
    newAch.forEach(function (id, i) {
      var ach = D.achievements.filter(function (a) { return a.id === id; })[0];
      setTimeout(function () { UI.toast('Conquista: ' + ach.name, 'achievement'); EQ.Audio.play('unlock'); }, 400 + i * 600);
    });
    var canvas = document.getElementById('world-canvas');
    canvas.focus({ preventScroll: true });
  }

  function refreshCurrent() {
    var name = UI.currentScreen();
    UI.updateHud();
    if (name === 'map') EQ.MapScreen.render();
    else if (name === 'encyclopedia') EQ.Encyclopedia.render();
    else if (name === 'profile') EQ.Profile.render();
  }

  function howToPlay() {
    UI.openDialog(function (body) {
      body.innerHTML =
        '<p class="eyebrow">Guia do explorador</p><h2 class="modal-title">Como jogar</h2>' +
        '<ol class="howto">' +
          '<li><strong>Escolha uma região no mapa.</strong> Cada uma tem cenário, animais e missões próprias. Novas regiões são liberadas conforme você conclui missões.</li>' +
          '<li><strong>Explore andando.</strong> Use as setas ou WASD (ou o direcional na tela). A seta amarela aponta para o guia mais próximo com missão pendente.</li>' +
          '<li><strong>Fale com os guias.</strong> Aproxime-se de quem tem “!” e pressione E, Espaço ou o botão Ação.</li>' +
          '<li><strong>Complete as missões.</strong> Quizzes, plantio, limpeza da água, reciclagem, memória e buscas de exploração.</li>' +
          '<li><strong>Veja o mundo se recuperar.</strong> A cada missão, árvores crescem, flores aparecem, a água fica limpa e os animais retornam.</li>' +
          '<li><strong>Complete a enciclopédia.</strong> Cada missão libera fichas reais de animais brasileiros.</li>' +
        '</ol>' +
        '<p class="note">As recompensas são dadas apenas na primeira conclusão de cada missão. Repetir conta como treino.</p>' +
        '<div class="modal-actions"><button type="button" class="btn btn-primary" id="howto-ok">Vamos lá!</button></div>';
      body.querySelector('#howto-ok').addEventListener('click', UI.closeDialog);
    }, { label: 'Como jogar' });
  }

  EQ.App = {
    enterRegion: enterRegion,
    refreshCurrent: refreshCurrent,
    goTitle: goTitle,
    howToPlay: howToPlay
  };

  UI.onScreen('map', function () { UI.updateHud(); EQ.MapScreen.render(); });
  UI.onScreen('encyclopedia', function () { UI.updateHud(); EQ.Encyclopedia.render(); });
  UI.onScreen('profile', function () { UI.updateHud(); EQ.Profile.render(); });

  EQ.World.setCallbacks({
    onInteract: function (mission) { EQ.Missions.open(mission); },
    onExploreItem: function (mission, count) {
      UI.toast(mission.config.label + ': ' + count + '/' + mission.config.count);
    },
    onExploreComplete: function (mission) { EQ.Missions.finishExplore(mission); }
  });

  function init() {
    UI.initDialog();
    UI.applyMotion();

    var titleImg = document.getElementById('title-img');
    if (titleImg) {
      var dropImg = function () { titleImg.remove(); };
      if (titleImg.complete && titleImg.naturalWidth === 0) dropImg();
      else titleImg.addEventListener('error', dropImg);
    }
    renderTitle();

    document.getElementById('btn-start').addEventListener('click', startGame);
    document.getElementById('btn-howto').addEventListener('click', function () { EQ.Audio.play('click'); howToPlay(); });
    document.getElementById('btn-title-settings').addEventListener('click', function () { EQ.Audio.play('click'); EQ.Profile.openSettings(); });

    Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (b) {
      b.addEventListener('click', function () {
        EQ.Audio.play('click');
        UI.showScreen(b.getAttribute('data-nav'));
      });
    });
    document.getElementById('btn-settings').addEventListener('click', function () { EQ.Audio.play('click'); EQ.Profile.openSettings(); });
    document.getElementById('btn-world-back').addEventListener('click', function () { EQ.Audio.play('click'); UI.showScreen('map'); });
    document.getElementById('btn-world-help').addEventListener('click', howToPlay);
    document.getElementById('btn-edit-profile').addEventListener('click', function () {
      EQ.Profile.openEditor(false, function () { EQ.Profile.render(); });
    });
    document.getElementById('btn-export').addEventListener('click', EQ.Profile.exportSave);
    document.getElementById('btn-profile-settings').addEventListener('click', EQ.Profile.openSettings);
    document.getElementById('btn-title').addEventListener('click', goTitle);

    S.onChange(function () { if (UI.currentScreen() !== 'title') UI.updateHud(); });

    UI.showScreen('title');
    document.documentElement.classList.add('js-ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
