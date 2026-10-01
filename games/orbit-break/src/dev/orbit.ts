import './dev.css';
import { DEFAULT_CONFIG, FORMATIONS, type FormationId } from '../game/config';
import type { OrbitBreakScene } from '../game/OrbitBreakScene';
import { COSMETIC_CATEGORIES, QUEST_TEMPLATES, THEMES, type ThemeId } from '../game/profile';
import { DevPanel, type DevCategory, type DevControl } from './DevPanel';

export function mountOrbitDev(scene: OrbitBreakScene, parent: HTMLElement): () => void {
  const controls: DevControl[] = [];
  const status = (category: DevCategory, path: string, label: string, get: () => string | number) =>
    controls.push({ category, path, label, type: 'status', get });
  const action = (category: DevCategory, path: string, label: string, run: () => void) =>
    controls.push({ category, path, label, type: 'action', get: () => '', action: run });
  const numeric = (category: DevCategory, path: string, label: string, get: () => number,
    set: (value: number) => void, min = 0, max = 999999, step = 1, baseline?: number) =>
    controls.push({ category, path, label, type: 'number', get, set: (value) => set(Number(value)), min, max, step, baseline });
  const boolean = (category: DevCategory, path: string, label: string, get: () => boolean,
    set: (value: boolean) => void, baseline?: boolean) =>
    controls.push({ category, path, label, type: 'boolean', get, set: (value) => set(Boolean(value)), baseline });
  const configValue = (category: DevCategory, path: string, label: string, min: number, max: number, step: number) => {
    const baseline = Number(readPath(DEFAULT_CONFIG, path));
    numeric(category, path, label, () => Number(readPath(scene.config, path)),
      (value) => writePath(scene.config, path, Math.min(max, Math.max(min, value))), min, max, step, baseline);
  };
  const configBool = (category: DevCategory, path: string, label: string) =>
    boolean(category, path, label, () => Boolean(readPath(scene.config, path)),
      (value) => writePath(scene.config, path, value), Boolean(readPath(DEFAULT_CONFIG, path)));

  status('Run', 'run.phase', 'Run state', () => scene.run.phase);
  status('Run', 'run.elapsed', 'Elapsed seconds', () => (scene.run.elapsedMs / 1000).toFixed(1));
  status('Run', 'run.score', 'Score', () => scene.run.score);
  status('Run', 'run.best', 'Best score', () => scene.profile.bestScore);
  status('Run', 'run.difficulty', 'Difficulty', () => scene.run.difficulty.toFixed(2));
  status('Run', 'run.tier', 'Tier', () => scene.run.tier);
  status('Run', 'run.attackRate', 'Attack interval ms', () => Math.round(scene.run.attackIntervalMs));
  status('Run', 'run.spawnRate', 'Spawned / sec', () => scene.run.elapsedMs ? (scene.run.totalProjectiles / scene.run.elapsedMs * 1000).toFixed(2) : '0');
  status('Run', 'run.active', 'Active projectiles', () => scene.run.activeProjectiles);
  status('Run', 'run.total', 'Total spawned', () => scene.run.totalProjectiles);
  status('Run', 'run.current', 'Current formation', () => scene.run.currentFormation);
  status('Run', 'run.next', 'Next formation', () => scene.run.nextFormation);
  status('Run', 'run.pool', 'Available pool', () => scene.run.availableFormations().join(', ') || 'none');
  status('Run', 'run.viewport', 'Viewport', () => `${scene.viewport.width} × ${scene.viewport.height}`);
  status('Run', 'run.orientation', 'Orientation', () => scene.viewport.width >= scene.viewport.height ? 'landscape' : 'portrait');
  status('Run', 'run.dpr', 'DPR', () => window.devicePixelRatio.toFixed(2));
  status('Run', 'run.fps', 'FPS', () => scene.game.loop.actualFps.toFixed(0));
  action('Run', 'action.pause', 'Pause', () => scene.openPause());
  action('Run', 'action.resume', 'Resume', () => scene.resume());
  action('Run', 'action.restart', 'Restart run', () => scene.startGame());
  action('Run', 'action.death', 'Force death', () => scene.forceDeath());
  action('Run', 'action.clear', 'Clear projectiles', () => scene.run.clearProjectiles());
  boolean('Run', 'run.infiniteLives', 'Infinite lives (session)', () => scene.run.infiniteLives,
    (value) => { scene.run.infiniteLives = value; }, false);

  numeric('Difficulty', 'run.override', 'Set difficulty', () => scene.run.difficulty,
    (value) => { scene.run.difficultyOverride = Math.min(scene.config.difficulty.maximum, Math.max(1, value)); }, 1, 5, 0.1, 1);
  action('Difficulty', 'action.difficultyUp', '+ difficulty', () => { scene.run.difficultyOverride = Math.min(scene.config.difficulty.maximum, scene.run.difficulty + 0.25); });
  action('Difficulty', 'action.difficultyDown', '− difficulty', () => { scene.run.difficultyOverride = Math.max(1, scene.run.difficulty - 0.25); });
  for (const [path, label, min, max, step] of [
    ['difficulty.initial', 'Initial difficulty', 1, 5, 0.1],
    ['difficulty.rampPerSecond', 'Ramp / second', 0, 0.2, 0.001],
    ['difficulty.maximum', 'Maximum difficulty', 1, 10, 0.1],
    ['difficulty.attackIntervalMaxMs', 'Attack interval max ms', 500, 4000, 50],
    ['difficulty.attackIntervalMinMs', 'Attack interval min ms', 400, 3000, 50],
  ] as const) configValue('Difficulty', path, label, min, max, step);
  for (let index = 1; index < 5; index += 1) configValue('Difficulty', `difficulty.tierThresholds.${index}`, `Tier ${index + 1} threshold`, 1, 10, 0.05);

  for (const [path, label, min, max, step] of [
    ['projectile.speedMin', 'Projectile speed min', 80, 600, 5],
    ['projectile.speedMax', 'Projectile speed max', 100, 800, 5],
    ['projectile.size', 'Projectile size', 5, 28, 1],
    ['projectile.spawnDistance', 'Spawn distance from orbit', 25, 300, 5],
    ['projectile.lifetimeMs', 'Projectile lifetime ms', 1000, 12000, 100],
    ['projectile.simultaneousLimit', 'Simultaneous limit', 1, 16, 1],
  ] as const) configValue('Projectiles', path, label, min, max, step);
  for (const [path, label, min, max, step] of [
    ['telegraph.leadMs', 'Lead time ms', 200, 2500, 25],
    ['telegraph.minimumLeadMs', 'Minimum lead ms', 300, 2500, 25],
    ['telegraph.pingCount', 'Ping count', 1, 6, 1],
    ['telegraph.pingIntervalMs', 'Ping interval ms', 80, 1000, 10],
    ['telegraph.holdMs', 'Warning hold ms', 0, 1000, 25],
    ['telegraph.opacity', 'Warning opacity', 0.2, 1, 0.05],
    ['telegraph.scale', 'Warning scale', 0.5, 2.5, 0.05],
    ['telegraph.launchDelayMs', 'Launch delay ms', 0, 1500, 25],
  ] as const) configValue('Telegraph', path, label, min, max, step);

  status('Formations', 'formations.current', 'Current', () => scene.run.currentFormation);
  status('Formations', 'formations.next', 'Next', () => scene.run.nextFormation);
  status('Formations', 'formations.pool', 'Available pool', () => scene.run.availableFormations().join(', ') || 'none');
  for (const id of FORMATIONS) {
    configBool('Formations', `formations.${id}.enabled`, `${id} enabled`);
    for (const [key, label, min, max, step] of [
      ['weight', 'weight', 0, 20, 0.1], ['minimumTier', 'unlock tier', 1, 5, 1],
      ['cooldownMs', 'cooldown ms', 0, 15000, 100], ['maxConsecutive', 'max consecutive', 1, 6, 1],
      ['count', 'shot count', 1, 8, 1], ['intervalMs', 'shot interval ms', 0, 1500, 25],
      ['arcRadians', 'arc radians', 0, 3, 0.05], ['speedMultiplier', 'speed ×', 0.5, 2, 0.05],
    ] as const) configValue('Formations', `formations.${id}.${key}`, `${id} ${label}`, min, max, step);
    for (let tier = 0; tier < 5; tier += 1) {
      configValue('Formations', `formations.${id}.weightByTier.${tier}`, `${id} tier ${tier + 1} weight ×`, 0, 3, 0.05);
    }
    if (id === 'bombardment') {
      configValue('Formations', 'formations.bombardment.arcMaximum', 'bombardment arc maximum', 0.4, 3, 0.05);
      configValue('Formations', 'formations.bombardment.minimumSeparation', 'bombardment min angle gap', 0.05, 0.5, 0.01);
    }
    if (id === 'line') configValue('Formations', 'formations.line.sweepDirection', 'line sweep direction (±1)', -1, 1, 2);
    action('Formations', `action.fire.${id}`, `FIRE ${id.toUpperCase()}`, () => scene.fireFormation(id as FormationId));
  }

  status('Profile', 'profile.storage', 'Storage', () => scene.profile.hasStorage ? 'localStorage' : 'session fallback');
  status('Profile', 'profile.level', 'Level', () => scene.profile.level);
  status('Profile', 'profile.xp', 'XP', () => scene.profile.data.xp);
  status('Profile', 'profile.stars', 'Stars', () => scene.profile.data.stars);
  status('Profile', 'profile.best', 'Best score', () => scene.profile.bestScore);
  numeric('Profile', 'profile.score', 'Set current score (session)', () => scene.run.score,
    (value) => { scene.run.scoreOffset = Math.floor(value) - Math.floor(scene.run.elapsedMs / 1000 * scene.config.scoreRate); scene.run.score = Math.floor(value); scene.refreshUI(); }, 0, 999999, 10);
  action('Profile', 'action.scorePlus', 'Add 100 current score', () => { scene.run.scoreOffset += 100; scene.run.score += 100; scene.refreshUI(); });
  action('Profile', 'action.devScore', 'Add artificial personal score (session)', () => { scene.profile.devScores.push(Math.max(1, scene.run.score)); scene.refreshUI(); });
  action('Profile', 'action.manyScores', 'Generate test scores (session)', () => { scene.profile.devScores = [250, 420, 700, 810, 1200]; scene.refreshUI(); });
  action('Profile', 'action.clearDevScores', 'Clear artificial scores', () => { scene.profile.devScores = []; scene.refreshUI(); });
  action('Profile', 'action.resetScores', 'Reset persistent scores…', () => {
    if (!window.confirm('Delete local personal scores and best score?')) return;
    scene.profile.data.scores = []; scene.profile.data.bestScore = 0;
    try { window.localStorage.removeItem('orbitBreak.bestScore'); } catch { /* storage unavailable */ }
    scene.profile.save(); scene.refreshUI();
  });
  action('Profile', 'action.resetProfile', 'Reset profile…', () => {
    if (!window.confirm('Reset local XP, Stars, quests, cosmetics and equipped themes? Best score is preserved.')) return;
    scene.profile.reset(); scene.refreshUI();
  });

  for (let index = 0; index < 5; index += 1) {
    const slot = index;
    status('Quests', `quest.${slot}.name`, `Slot ${slot + 1}`, () => scene.profile.data.quests[slot]?.kind ?? 'empty');
    numeric('Quests', `quest.${slot}.progress`, `Slot ${slot + 1} progress (persistent)`,
      () => scene.profile.data.quests[slot]?.progress ?? 0,
      (value) => { const quest = scene.profile.data.quests[slot]; if (quest) { quest.progress = Math.max(0, Math.min(quest.target, value)); scene.profile.save(); scene.refreshUI(); } }, 0, 9999);
    numeric('Quests', `quest.${slot}.target`, `Slot ${slot + 1} target (persistent)`,
      () => scene.profile.data.quests[slot]?.target ?? 1,
      (value) => { const quest = scene.profile.data.quests[slot]; if (quest) { quest.target = Math.max(1, Math.floor(value)); scene.profile.save(); scene.refreshUI(); } }, 1, 9999);
    action('Quests', `quest.${slot}.complete`, `Complete slot ${slot + 1}`, () => {
      const quest = scene.profile.data.quests[slot]; if (quest) { quest.progress = quest.target; scene.profile.save(); scene.refreshUI(); }
    });
    action('Quests', `quest.${slot}.refresh`, `Refresh slot ${slot + 1}`, () => { scene.profile.refreshQuest(slot); scene.refreshUI(); });
  }
  action('Quests', 'quest.refreshAll', 'Refresh all quests', () => { scene.profile.refreshAll(); scene.refreshUI(); });
  for (const template of QUEST_TEMPLATES) {
    boolean('Quests', `template.${template.kind}.enabled`, `${template.kind} enabled`,
      () => template.enabled, (value) => { template.enabled = value; }, true);
    numeric('Quests', `template.${template.kind}.weight`, `${template.kind} weight`,
      () => template.weight, (value) => { template.weight = Math.max(0, value); }, 0, 20, 0.5, template.weight);
  }

  numeric('XP / Economy', 'profile.xp.set', 'Set XP (persistent)', () => scene.profile.data.xp,
    (value) => { scene.profile.data.xp = Math.max(0, Math.floor(value)); scene.profile.save(); scene.refreshUI(); }, 0, 999999);
  action('XP / Economy', 'profile.xp.add', 'Add 20 XP (persistent)', () => { scene.profile.addXp(20); scene.refreshUI(); });
  numeric('XP / Economy', 'profile.level.set', 'Set Level (persistent)', () => scene.profile.level,
    (value) => { scene.profile.setLevel(value); scene.refreshUI(); }, 1, 10);
  action('XP / Economy', 'profile.level.test', 'Trigger level-up test', () => { scene.profile.addXp(scene.profile.xpNeeded); scene.refreshUI(); scene.audio.levelCue(); });
  numeric('XP / Economy', 'profile.stars.set', 'Set Stars (persistent)', () => scene.profile.data.stars,
    (value) => { scene.profile.setStars(value); scene.refreshUI(); }, 0, 999999);
  action('XP / Economy', 'profile.stars.add', 'Grant 100 Stars (persistent)', () => { scene.profile.setStars(scene.profile.data.stars + 100); scene.refreshUI(); });
  action('XP / Economy', 'profile.stars.remove', 'Remove 100 Stars (persistent)', () => { scene.profile.setStars(scene.profile.data.stars - 100); scene.refreshUI(); });
  for (const [path, label, min, max, step] of [
    ['xp.baseRequirement', 'XP base requirement', 10, 1000, 10],
    ['xp.growth', 'XP growth', 1, 3, 0.05],
    ['xp.questsPerLevel', 'Quests per level', 1, 20, 1],
    ['economy.baseStars', 'Base Stars', 1, 100, 1],
    ['economy.starsPerLevel', 'Stars per level', 0, 50, 1],
    ['economy.starCap', 'Star cap', 100, 999999, 100],
  ] as const) configValue('XP / Economy', path, label, min, max, step);

  boolean('Cosmetics', 'cosmetics.unlockAll', 'Unlock all (session only)', () => scene.profile.devUnlockAll,
    (value) => { scene.profile.devUnlockAll = value; scene.refreshUI(); }, false);
  action('Cosmetics', 'cosmetics.clearPreview', 'Clear session previews', () => { scene.profile.preview = {}; scene.refreshUI(); });
  action('Cosmetics', 'cosmetics.resetTest', 'Lock/reset session cosmetics', () => {
    scene.profile.devUnlockAll = false; scene.profile.preview = {}; scene.refreshUI();
  });
  for (const theme of THEMES) {
    status('Cosmetics', `cosmetics.${theme}.requirement`, `${theme} requirement`, () => scene.profile.themeRequirement(theme));
    for (const category of COSMETIC_CATEGORIES) {
      action('Cosmetics', `cosmetics.preview.${category}.${theme}`, `Preview ${theme} ${category} (session)`, () => {
        scene.profile.preview[category] = theme as ThemeId; scene.refreshUI();
      });
      action('Cosmetics', `cosmetics.equip.${category}.${theme}`, `Equip ${theme} ${category}`, () => {
        scene.profile.equip(category, theme); scene.refreshUI();
      });
    }
  }
  for (const [path, label, min, max] of [
    ['cosmetics.waterPrice', 'Water price', 0, 10000],
    ['cosmetics.naturePrice', 'Nature price', 0, 10000],
    ['cosmetics.firePrice', 'Fire price', 0, 10000],
    ['cosmetics.lightLevel', 'Light unlock level', 1, 10],
    ['cosmetics.chaosLevel', 'Chaos unlock level', 1, 10],
  ] as const) configValue('Cosmetics', path, label, min, max, 1);

  for (const [path, label, min, max, step] of [
    ['playerAngularSpeed', 'Angular speed', 0.5, 6, 0.1],
    ['orbitRadius', 'Orbit radius ratio', 0.15, 0.4, 0.01],
    ['playerRadius', 'Player radius', 4, 20, 1],
    ['scoreRate', 'Score rate', 1, 50, 1],
  ] as const) configValue('Visual', path, label, min, max, step);
  for (const [path, label, min, max, step] of [
    ['audio.bpm', 'Music BPM', 60, 180, 1],
    ['audio.musicVolume', 'Music volume', 0, 1, 0.01],
    ['audio.sfxVolume', 'SFX volume', 0, 1, 0.01],
  ] as const) configValue('Audio', path, label, min, max, step);
  status('QA', 'qa.collisions', 'Collision events', () => scene.run.collisionCount);
  status('QA', 'qa.storage', 'Profile storage', () => scene.profile.hasStorage ? 'available' : 'memory fallback');
  action('QA', 'qa.forceDeath', 'Force death', () => scene.forceDeath());
  action('QA', 'qa.fireBombardment', 'Test bombardment', () => scene.fireFormation('bombardment'));

  const panel = new DevPanel(parent, controls, () => ({
    runTime: Number((scene.run.elapsedMs / 1000).toFixed(1)),
    difficulty: Number(scene.run.difficulty.toFixed(2)), score: scene.run.score,
    formation: scene.run.currentFormation, viewport: `${scene.viewport.width}x${scene.viewport.height}`,
    fps: Math.round(scene.game.loop.actualFps),
  }));
  return () => panel.destroy();
}

function readPath(root: object, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => (value as Record<string, unknown>)[key], root);
}

function writePath(root: object, path: string, value: number | boolean): void {
  const keys = path.split('.');
  const last = keys.pop()!;
  const parent = keys.reduce<unknown>((object, key) => (object as Record<string, unknown>)[key], root);
  (parent as Record<string, number | boolean>)[last] = value;
}
