/*
 * EcoQuest — Regras de progressão: XP, nível, regiões, animais e conquistas.
 */
(function (global) {
  'use strict';

  var S = global.EQ.Storage;
  var D = global.EQ.DATA;

  function xpForLevel(level) {
    return 50 * level * (level - 1);
  }

  function levelInfo(xp) {
    var level = 1;
    while (xp >= xpForLevel(level + 1)) level++;
    var base = xpForLevel(level);
    var next = xpForLevel(level + 1);
    return {
      level: level,
      current: xp - base,
      needed: next - base,
      progress: (xp - base) / (next - base)
    };
  }

  function isMissionDone(id) {
    var m = S.get().missions[id];
    return !!(m && m.completed);
  }

  function completedCount() {
    return D.missions.filter(function (m) { return isMissionDone(m.id); }).length;
  }

  function regionProgress(regionId) {
    var list = D.missionsOf(regionId);
    if (!list.length) return 0;
    var done = list.filter(function (m) { return isMissionDone(m.id); }).length;
    return done / list.length;
  }

  function isRegionUnlocked(regionId) {
    var region = D.region(regionId);
    return !!region && completedCount() >= region.unlock.missions;
  }

  function isAnimalUnlocked(id) {
    return !!S.get().animals[id];
  }

  function unlockedAnimalsCount() {
    return D.animals.filter(function (x) { return isAnimalUnlocked(x.id); }).length;
  }

  function missionRecord(s, id) {
    if (!s.missions[id]) {
      s.missions[id] = { completed: false, completedAt: null, attempts: 0, bestScore: 0, progress: [] };
    }
    return s.missions[id];
  }

  function recordAttempt(id) {
    S.update(function (s) { missionRecord(s, id).attempts++; });
  }

  function visitRegion(id) {
    S.update(function (s) {
      s.regions[id] = s.regions[id] || { visited: false, lastPos: null };
      s.regions[id].visited = true;
    });
    return checkAchievements();
  }

  function savePosition(regionId, x, y) {
    S.update(function (s) {
      s.regions[regionId] = s.regions[regionId] || { visited: true, lastPos: null };
      s.regions[regionId].lastPos = { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
    });
  }

  function exploreProgress(missionId) {
    var m = S.get().missions[missionId];
    return m ? m.progress.slice() : [];
  }

  function addExploreProgress(missionId, index) {
    var mission = D.mission(missionId);
    var result = { count: 0, done: false };
    S.update(function (s) {
      var rec = missionRecord(s, missionId);
      if (rec.progress.indexOf(index) < 0) {
        rec.progress.push(index);
        s.stats.itemsCollected++;
      }
      result.count = rec.progress.length;
    });
    result.done = result.count >= mission.config.count;
    return result;
  }

  function resetExploreProgress(missionId) {
    S.update(function (s) { missionRecord(s, missionId).progress = []; });
  }

  /*
   * Concede recompensas apenas na primeira conclusão válida.
   * Repetições atualizam a melhor pontuação, mas não dão XP nem sementes.
   */
  function completeMission(id, score, meta) {
    var mission = D.mission(id);
    var before = levelInfo(S.get().stats.xp).level;
    var regionsBefore = D.regions.filter(function (r) { return isRegionUnlocked(r.id); }).map(function (r) { return r.id; });
    var result = {
      firstTime: false, xp: 0, seeds: 0, animals: [], achievements: [],
      leveledUp: false, level: before, unlockedRegions: []
    };
    if (!mission) return result;

    S.update(function (s) {
      var rec = missionRecord(s, id);
      rec.bestScore = Math.max(rec.bestScore, Math.round(score || 0));
      if (!rec.completed) {
        rec.completed = true;
        rec.completedAt = new Date().toISOString();
        s.stats.xp += mission.xp;
        s.stats.seeds += mission.seeds;
        result.firstTime = true;
        result.xp = mission.xp;
        result.seeds = mission.seeds;
        mission.unlocks.forEach(function (animalId) {
          if (!s.animals[animalId]) {
            s.animals[animalId] = { unlockedAt: new Date().toISOString(), seen: false };
            result.animals.push(animalId);
          }
        });
      }
      if (meta && meta.perfectQuiz) s.stats.perfectQuizzes++;
    });

    var after = levelInfo(S.get().stats.xp).level;
    result.level = after;
    result.leveledUp = after > before;
    result.unlockedRegions = D.regions
      .filter(function (r) { return isRegionUnlocked(r.id) && regionsBefore.indexOf(r.id) < 0; })
      .map(function (r) { return r.id; });
    result.achievements = checkAchievements(result);
    return result;
  }

  function markAnimalSeen(id) {
    var rec = S.get().animals[id];
    if (rec && !rec.seen) S.update(function (s) { s.animals[id].seen = true; });
  }

  var rules = {
    'primeiro-passo': function () { return completedCount() >= 1; },
    explorador: function (s) {
      return Object.keys(s.regions).filter(function (k) { return s.regions[k].visited; }).length >= 3;
    },
    'guardiao-5': function () { return completedCount() >= 5; },
    'regiao-viva': function () {
      return D.regions.some(function (r) { return regionProgress(r.id) >= 1; });
    },
    sabio: function (s) { return s.stats.perfectQuizzes >= 1; },
    pesquisador: function () {
      return D.missions.filter(function (m) { return m.type === 'explore'; }).every(function (m) { return isMissionDone(m.id); });
    },
    naturalista: function () { return unlockedAnimalsCount() >= 15; },
    'nivel-5': function (s) { return levelInfo(s.stats.xp).level >= 5; },
    'planeta-vivo': function () { return completedCount() >= D.missions.length; },
    enciclopedia: function () { return unlockedAnimalsCount() >= D.animals.length; }
  };

  function checkAchievements(result) {
    var unlocked = [];
    var guard = 0;
    var changed = true;
    while (changed && guard++ < 3) {
      changed = false;
      var s = S.get();
      D.achievements.forEach(function (ach) {
        if (s.achievements[ach.id]) return;
        var rule = rules[ach.id];
        if (rule && rule(s)) {
          S.update(function (st) {
            st.achievements[ach.id] = new Date().toISOString();
            if (ach.id === 'planeta-vivo' && !st.animals[D.finalReward]) {
              st.animals[D.finalReward] = { unlockedAt: new Date().toISOString(), seen: false };
              if (result) result.animals.push(D.finalReward);
            }
          });
          unlocked.push(ach.id);
          changed = true;
        }
      });
    }
    return unlocked;
  }

  function createProfile(name, avatar) {
    S.update(function (s) {
      s.profile = { name: name, avatar: avatar, createdAt: new Date().toISOString() };
    });
  }

  function updateProfile(name, avatar) {
    S.update(function (s) {
      if (!s.profile) s.profile = { createdAt: new Date().toISOString() };
      s.profile.name = name;
      s.profile.avatar = avatar;
    });
  }

  global.EQ.Game = {
    levelInfo: levelInfo,
    xpForLevel: xpForLevel,
    isMissionDone: isMissionDone,
    completedCount: completedCount,
    regionProgress: regionProgress,
    isRegionUnlocked: isRegionUnlocked,
    isAnimalUnlocked: isAnimalUnlocked,
    unlockedAnimalsCount: unlockedAnimalsCount,
    recordAttempt: recordAttempt,
    visitRegion: visitRegion,
    savePosition: savePosition,
    exploreProgress: exploreProgress,
    addExploreProgress: addExploreProgress,
    resetExploreProgress: resetExploreProgress,
    completeMission: completeMission,
    markAnimalSeen: markAnimalSeen,
    checkAchievements: checkAchievements,
    createProfile: createProfile,
    updateProfile: updateProfile
  };
})(window);
