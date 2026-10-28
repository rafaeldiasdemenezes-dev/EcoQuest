/*
 * EcoQuest — Perfil local, conquistas, configurações e gestão do save.
 */
(function (global) {
  'use strict';

  var EQ = global.EQ;
  var D = EQ.DATA;
  var G = EQ.Game;
  var S = EQ.Storage;
  var UI = EQ.UI;
  var esc = UI.esc;

  var AVATAR_NAMES = ['Guarda-florestal', 'Biólogo de campo', 'Botânica', 'Oceanógrafa'];

  function render() {
    var s = S.get();
    if (!s.profile) return;
    var info = G.levelInfo(s.stats.xp);
    EQ.World.drawAvatar(document.getElementById('profile-avatar'), s.profile.avatar);
    document.getElementById('profile-name').textContent = s.profile.name;
    document.getElementById('profile-role').textContent = AVATAR_NAMES[s.profile.avatar] + ' · Nível ' + info.level;
    document.getElementById('profile-xp-fill').style.width = Math.round(info.progress * 100) + '%';
    document.getElementById('profile-xp-text').textContent = s.stats.xp + ' XP no total · faltam ' + (info.needed - info.current) + ' para o nível ' + (info.level + 1);

    var restored = D.regions.filter(function (r) { return G.regionProgress(r.id) >= 1; }).length;
    var stats = [
      ['Missões concluídas', G.completedCount() + '/' + D.missions.length],
      ['Fichas de animais', G.unlockedAnimalsCount() + '/' + D.animals.length],
      ['Sementes', s.stats.seeds],
      ['Regiões restauradas', restored + '/' + D.regions.length],
      ['Itens encontrados', s.stats.itemsCollected],
      ['Quizzes perfeitos', s.stats.perfectQuizzes]
    ];
    document.getElementById('profile-stats').innerHTML = stats.map(function (st) {
      return '<div class="stat-box"><dt>' + esc(st[0]) + '</dt><dd>' + esc(st[1]) + '</dd></div>';
    }).join('');

    document.getElementById('profile-categories').innerHTML = Object.keys(D.categories).map(function (k) {
      var list = D.missions.filter(function (m) { return m.category === k; });
      var done = list.filter(function (m) { return G.isMissionDone(m.id); }).length;
      var pct = Math.round((done / list.length) * 100);
      return '<li><span class="cat-name"><span class="mission-dot" style="--cat:' + D.categories[k].color + '"></span>' + esc(D.categories[k].name) + '</span>' +
        '<span class="meter"><span class="meter-fill" style="width:' + pct + '%;background:' + D.categories[k].color + '"></span></span>' +
        '<span class="small">' + done + '/' + list.length + '</span></li>';
    }).join('');

    var got = Object.keys(s.achievements).length;
    document.getElementById('achievements-count').textContent = got + '/' + D.achievements.length;
    document.getElementById('achievement-list').innerHTML = D.achievements.map(function (a) {
      var when = s.achievements[a.id];
      return '<li class="achievement' + (when ? ' got' : '') + '">' +
        '<span class="ach-icon">' + UI.icon(when ? 'star' : 'lock') + '</span>' +
        '<span><strong>' + esc(a.name) + '</strong><span>' + esc(a.description) + '</span>' +
        (when ? '<span class="ach-date">Desbloqueada em ' + new Date(when).toLocaleDateString('pt-BR') + '</span>' : '') +
        '</span></li>';
    }).join('');

    var persistNote = document.getElementById('storage-note');
    persistNote.textContent = S.isPersistent()
      ? 'Seu progresso fica salvo no localStorage deste navegador. Ele não é sincronizado entre dispositivos e pode ser apagado se você limpar os dados do navegador. Use “Exportar save” para guardar uma cópia.'
      : 'O armazenamento local está indisponível (modo privado ou bloqueado). O progresso só dura enquanto esta aba estiver aberta. Use “Exportar save” para não perder nada.';
  }

  function avatarPicker(container, selected, onPick) {
    container.innerHTML = '';
    EQ.World.avatars.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'avatar-option';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', i === selected ? 'true' : 'false');
      b.setAttribute('aria-label', AVATAR_NAMES[i]);
      var cv = document.createElement('canvas');
      cv.className = 'avatar-canvas';
      EQ.World.drawAvatar(cv, i);
      b.appendChild(cv);
      var label = document.createElement('span');
      label.textContent = AVATAR_NAMES[i];
      b.appendChild(label);
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(container.children, function (x) { x.setAttribute('aria-checked', 'false'); });
        b.setAttribute('aria-checked', 'true');
        EQ.Audio.play('click');
        onPick(i);
      });
      container.appendChild(b);
    });
  }

  function openEditor(isNew, onDone) {
    var s = S.get();
    var avatar = s.profile ? s.profile.avatar : 0;
    UI.openDialog(function (body) {
      body.innerHTML =
        '<p class="eyebrow">' + (isNew ? 'Novo explorador' : 'Editar perfil') + '</p>' +
        '<h2 class="modal-title">' + (isNew ? 'Crie seu perfil' : 'Seu perfil') + '</h2>' +
        '<p class="note">Este é um perfil local, salvo apenas neste navegador e neste dispositivo. Não há conta, senha nem envio de dados.</p>' +
        '<form class="profile-form" novalidate>' +
          '<label class="field"><span>Nome do explorador</span>' +
          '<input id="profile-input" name="name" type="text" maxlength="20" autocomplete="nickname" required placeholder="Ex.: Ana da Mata"></label>' +
          '<p class="field-error" id="profile-error" role="alert"></p>' +
          '<fieldset class="field"><legend>Escolha seu personagem</legend><div class="avatar-grid" role="radiogroup" aria-label="Personagem"></div></fieldset>' +
          '<div class="modal-actions">' + (isNew ? '' : '<button type="button" class="btn btn-ghost" id="profile-cancel">Cancelar</button>') +
          '<button type="submit" class="btn btn-primary">' + (isNew ? 'Começar aventura' : 'Salvar') + '</button></div>' +
        '</form>';
      var input = body.querySelector('#profile-input');
      input.value = s.profile ? s.profile.name : '';
      input.setAttribute('autofocus', '');
      avatarPicker(body.querySelector('.avatar-grid'), avatar, function (i) { avatar = i; });
      var cancel = body.querySelector('#profile-cancel');
      if (cancel) cancel.addEventListener('click', UI.closeDialog);
      body.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        var name = input.value.replace(/[<>]/g, '').trim();
        var err = body.querySelector('#profile-error');
        if (name.length < 2) {
          err.textContent = 'Digite um nome com pelo menos 2 caracteres.';
          input.focus();
          return;
        }
        if (isNew) G.createProfile(name, avatar);
        else G.updateProfile(name, avatar);
        EQ.Audio.play('success');
        UI.closeDialog();
        UI.updateHud();
        if (onDone) onDone();
      });
    }, { label: 'Perfil' });
  }

  function openSettings() {
    var s = S.get();
    UI.openDialog(function (body) {
      body.innerHTML =
        '<p class="eyebrow">Configurações</p><h2 class="modal-title">Ajustes do jogo</h2>' +
        '<div class="settings">' +
          '<label class="switch-row"><span><strong>Efeitos sonoros</strong><span class="small">Sons 8-bit gerados pelo navegador</span></span>' +
          '<input type="checkbox" id="set-sound" class="switch"' + (s.settings.sound ? ' checked' : '') + '></label>' +
          '<label class="field"><span><strong>Animações</strong></span>' +
          '<select id="set-motion">' +
            '<option value="system">Seguir o sistema operacional</option>' +
            '<option value="reduce">Reduzidas</option>' +
            '<option value="full">Completas</option>' +
          '</select></label>' +
        '</div>' +
        '<h3 class="section-title">Seu save</h3>' +
        '<p class="note">Versão do esquema de dados: ' + S.SCHEMA_VERSION + '. Os dados ficam somente neste navegador.</p>' +
        '<div class="save-actions">' +
          '<button type="button" class="btn btn-small" id="set-export">Exportar save</button>' +
          '<label class="btn btn-small file-btn">Importar save<input type="file" id="set-import" accept="application/json,.json" class="sr-only"></label>' +
          '<button type="button" class="btn btn-small btn-danger" id="set-reset">Apagar progresso</button>' +
        '</div>' +
        '<div class="modal-actions"><button type="button" class="btn btn-primary" id="set-close">Fechar</button></div>';

      body.querySelector('#set-motion').value = s.settings.motion;
      body.querySelector('#set-sound').addEventListener('change', function (e) {
        S.update(function (st) { st.settings.sound = e.target.checked; });
        EQ.Audio.play('click');
      });
      body.querySelector('#set-motion').addEventListener('change', function (e) {
        S.update(function (st) { st.settings.motion = e.target.value; });
        UI.applyMotion();
      });
      body.querySelector('#set-export').addEventListener('click', exportSave);
      body.querySelector('#set-import').addEventListener('change', importSave);
      body.querySelector('#set-reset').addEventListener('click', confirmReset);
      body.querySelector('#set-close').addEventListener('click', UI.closeDialog);
    }, { label: 'Configurações' });
  }

  function exportSave() {
    try {
      var blob = new Blob([S.exportJSON()], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'ecoquest-save-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      UI.toast('Save exportado com sucesso.');
    } catch (e) {
      UI.toast('Não foi possível exportar o save.', 'error');
    }
  }

  function importSave(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 500000) { UI.toast('Arquivo grande demais para ser um save.', 'error'); return; }
    var reader = new FileReader();
    reader.onload = function () {
      try {
        S.importJSON(String(reader.result));
        UI.toast('Save importado! Bem-vindo de volta.');
        UI.closeDialog();
        UI.applyMotion();
        UI.updateHud();
        if (!S.get().profile) EQ.App.goTitle();
        else EQ.App.refreshCurrent();
      } catch (err) {
        UI.toast(err && err.message ? err.message : 'Arquivo inválido.', 'error');
      }
    };
    reader.onerror = function () { UI.toast('Não foi possível ler o arquivo.', 'error'); };
    reader.readAsText(file);
  }

  function confirmReset() {
    UI.openDialog(function (body) {
      body.innerHTML =
        '<p class="eyebrow">Atenção</p><h2 class="modal-title">Apagar todo o progresso?</h2>' +
        '<p class="lead">Perfil, XP, missões, regiões, fichas e conquistas serão apagados deste navegador. Esta ação não pode ser desfeita.</p>' +
        '<div class="modal-actions"><button type="button" class="btn btn-ghost" id="r-cancel">Cancelar</button>' +
        '<button type="button" class="btn btn-danger" id="r-ok">Apagar tudo</button></div>';
      body.querySelector('#r-cancel').addEventListener('click', openSettings);
      body.querySelector('#r-ok').addEventListener('click', function () {
        S.reset();
        UI.closeDialog();
        UI.toast('Progresso apagado.');
        EQ.App.goTitle();
      });
    }, { label: 'Confirmar exclusão' });
  }

  global.EQ.Profile = {
    render: render,
    openEditor: openEditor,
    openSettings: openSettings,
    exportSave: exportSave
  };
})(window);
