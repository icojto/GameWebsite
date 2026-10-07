import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeConfig } from '../games/orbit-break/src/game/config.ts';
import { RunState } from '../games/orbit-break/src/game/run.ts';
import { ProfileStore, LEGACY_BEST_KEY, PROFILE_KEY } from '../games/orbit-break/src/game/profile.ts';

function storage(initial = []) {
  const values = new Map(initial);
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
  };
  return values;
}

test('legacy best migrates into versioned profile without losing top score', () => {
  const values = storage([[LEGACY_BEST_KEY, '741']]);
  const profile = new ProfileStore(createRuntimeConfig());
  assert.equal(profile.bestScore, 741);
  assert.deepEqual(profile.data.scores, [741]);
  assert.equal(profile.data.quests.length, 5);
  assert.equal(JSON.parse(values.get(PROFILE_KEY)).version, 2);
  assert.equal(new ProfileStore(createRuntimeConfig()).bestScore, 741);
});

test('corrupt profile falls back safely while retaining legacy best', () => {
  storage([[PROFILE_KEY, '{bad-json'], [LEGACY_BEST_KEY, '77']]);
  const profile = new ProfileStore(createRuntimeConfig());
  assert.equal(profile.bestScore, 77);
  assert.equal(profile.data.quests.length, 5);
});

test('quest claim is manual, replaces one slot, and preserves reward and progress across reload', () => {
  storage();
  const profile = new ProfileStore(createRuntimeConfig());
  const id = profile.data.quests[0].id;
  assert.equal(profile.claimQuest(0), null);
  profile.data.quests[0].progress = profile.data.quests[0].target;
  const reward = profile.claimQuest(0);
  assert.equal(reward.xp, 20);
  assert.equal(reward.stars, 10);
  assert.equal(profile.data.quests.length, 5);
  assert.notEqual(profile.data.quests[0].id, id);
  const reloaded = new ProfileStore(createRuntimeConfig());
  assert.equal(reloaded.data.xp, 20);
  assert.equal(reloaded.data.stars, 10);
  assert.equal(reloaded.data.quests[0].id, profile.data.quests[0].id);
});

test('XP carries overflow to the next level and stops level at 10', () => {
  storage();
  const profile = new ProfileStore(createRuntimeConfig());
  assert.equal(profile.addXp(111), true);
  assert.equal(profile.level, 2);
  assert.equal(profile.xpIntoLevel, 11);
  profile.addXp(100000);
  assert.equal(profile.level, 10);
  assert.ok(profile.data.xp > 100000);
});

test('personal scores sort and cap at ten; cosmetic unlocks and equipment persist', () => {
  storage();
  const profile = new ProfileStore(createRuntimeConfig());
  for (let score = 1; score <= 12; score += 1) profile.addScore(score);
  assert.deepEqual(profile.data.scores, [12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);
  profile.setStars(50);
  assert.equal(profile.unlock('water'), true);
  assert.equal(profile.equip('player', 'water'), true);
  assert.equal(profile.equip('projectile', 'water'), true);
  profile.preview.planet = 'chaos';
  const reloaded = new ProfileStore(createRuntimeConfig());
  assert.equal(reloaded.data.stars, 0);
  assert.equal(reloaded.data.equipped.player, 'water');
  assert.equal(reloaded.data.equipped.projectile, 'water');
  assert.equal(reloaded.activeTheme('planet'), 'default');
});

test('run score, pause and difficulty ramp stay within configured limits', () => {
  const config = createRuntimeConfig();
  const run = new RunState(config);
  run.start();
  run.nextAttackMs = Infinity;
  for (let index = 0; index < 100; index += 1) run.update(50, 100, 190);
  assert.equal(run.score, 50);
  const before = run.elapsedMs;
  run.phase = 'paused';
  run.update(1000, 100, 190);
  assert.equal(run.elapsedMs, before);
  run.phase = 'playing';
  run.difficultyOverride = 100;
  assert.equal(run.difficulty, config.difficulty.maximum);
  assert.equal(run.tier, 5);
});

test('formation tiers, disabled entries, and bombardment angular spacing are bounded', () => {
  const config = createRuntimeConfig();
  const run = new RunState(config);
  run.start();
  assert.deepEqual(run.availableFormations(), ['single']);
  config.formations.single.enabled = false;
  assert.deepEqual(run.availableFormations(), []);
  config.formations.single.enabled = true;
  run.difficultyOverride = 5;
  assert.equal(run.availableFormations().length, 5);
  assert.equal(run.fire('bombardment', 190, () => 0.5), true);
  assert.ok(run.projectiles.length <= config.projectile.simultaneousLimit);
  const sorted = run.projectiles.map((shot) => shot.angle).sort((a, b) => a - b);
  for (let index = 1; index < sorted.length; index += 1) {
    assert.ok(sorted[index] - sorted[index - 1] >= config.formations.bombardment.minimumSeparation - 0.0001);
  }
  assert.ok(run.projectiles.every((shot) => shot.warningMs >= config.telegraph.minimumLeadMs));
});

test('collision ends a run, while infinite lives records it and continues', () => {
  const run = new RunState(createRuntimeConfig());
  run.start();
  run.nextAttackMs = Infinity;
  run.projectiles.push({ angle: -Math.PI / 2, distance: 100, warningMs: 0, ageMs: 0,
    speed: 0, group: 0, crossed: false, hit: false });
  const hit = run.update(16, 100, 190);
  assert.equal(hit.collision, true);
  assert.equal(run.phase, 'game-over');
  run.start();
  run.nextAttackMs = Infinity;
  run.infiniteLives = true;
  run.projectiles.push({ angle: -Math.PI / 2, distance: 100, warningMs: 0, ageMs: 0,
    speed: 0, group: 0, crossed: false, hit: false });
  assert.equal(run.update(16, 100, 190).collision, true);
  assert.equal(run.phase, 'playing');
});

test('one-action reverse, restart, and single-only opening remain playable', () => {
  const run = new RunState(createRuntimeConfig());
  run.start();
  assert.equal(run.direction, 1);
  run.reverse();
  assert.equal(run.direction, -1);
  assert.equal(run.reversals, 1);
  for (let index = 0; index < 4; index += 1) {
    run.elapsedMs += 3000;
    assert.ok(run.availableFormations().includes('single'));
    assert.equal(run.fire('single', 190, () => 0.5), true);
    run.clearProjectiles();
  }
  run.phase = 'game-over';
  run.start();
  assert.equal(run.phase, 'playing');
  assert.equal(run.score, 0);
  assert.equal(run.reversals, 0);
  assert.equal(run.projectiles.length, 0);
});

test('all five formation families produce their configured patterns and telegraphs', () => {
  const config = createRuntimeConfig();
  const run = new RunState(config);
  run.start();
  run.difficultyOverride = 5;
  for (const id of ['single', 'double', 'arrow', 'line', 'bombardment']) {
    run.clearProjectiles();
    assert.equal(run.fire(id, 190, () => 0.5), true, `${id} can be triggered`);
    assert.ok(run.projectiles.length > 0, `${id} spawned`);
    assert.ok(run.projectiles.every((shot) => shot.warningMs >= config.telegraph.minimumLeadMs));
    if (id === 'double' || id === 'line') {
      assert.ok(run.projectiles[1].warningMs > run.projectiles[0].warningMs, `${id} staggers arrivals`);
    }
    if (id === 'arrow' || id === 'bombardment') {
      assert.ok(new Set(run.projectiles.map((shot) => shot.angle)).size > 1, `${id} spans angles`);
    }
  }
  run.clearProjectiles();
  run.difficultyOverride = config.difficulty.tierThresholds[4];
  assert.equal(run.fire('bombardment', 190, () => 0.5), true);
  assert.ok(run.projectiles.length <= 4, 'first bombardment is the narrow variant');
});

test('developer unlock-all and artificial scores are session-only', () => {
  storage();
  const profile = new ProfileStore(createRuntimeConfig());
  profile.devUnlockAll = true;
  assert.equal(profile.equip('player', 'chaos'), true);
  profile.devScores.push(999);
  profile.save();
  const reloaded = new ProfileStore(createRuntimeConfig());
  assert.equal(reloaded.data.equipped.player, 'default');
  assert.equal(reloaded.devUnlockAll, false);
  assert.deepEqual(reloaded.devScores, []);
});


import { allowsBackgroundAction } from '../games/orbit-break/src/game/input-policy.ts';
test('terminal and paused UI own pointer/keyboard input; only menu/playing accept background actions',()=>{
 for(const phase of ['game-over','paused'])assert.equal(allowsBackgroundAction(phase,false),false);
 for(const phase of ['menu','playing']){assert.equal(allowsBackgroundAction(phase,false),true);assert.equal(allowsBackgroundAction(phase,true),false);}
 const run=new RunState(createRuntimeConfig());run.start();run.phase='game-over';const before=JSON.stringify(run);
 for(let i=0;i<20;i++){if(allowsBackgroundAction(run.phase,false))run.start();}
 assert.equal(JSON.stringify(run),before,'background taps/Space never start a terminal run');
 run.start();assert.equal(run.phase,'playing','explicit result start remains available');
});
