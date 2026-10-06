import { gameStorage } from '../../../../shared/storage.mjs';
import type { FormationId, GameConfig } from './config';

export const PROFILE_KEY = 'orbitBreak.profile.v2';
export const LEGACY_BEST_KEY = 'orbitBreak.bestScore';
export const THEMES = ['default', 'water', 'nature', 'fire', 'light', 'chaos'] as const;
export type ThemeId = (typeof THEMES)[number];
export const COSMETIC_CATEGORIES = ['player', 'projectile', 'orbit', 'planet'] as const;
export type CosmeticCategory = (typeof COSMETIC_CATEGORIES)[number];
export type QuestKind = 'survive' | 'score' | 'dodge' | 'reverse' | 'formation' | 'double' | 'difficulty' | 'runs';

export interface Quest {
  id: string;
  kind: QuestKind;
  target: number;
  progress: number;
  xpReward: number;
  starReward: number;
}

export interface Profile {
  version: 2;
  xp: number;
  stars: number;
  quests: Quest[];
  unlockedSets: ThemeId[];
  equipped: Record<CosmeticCategory, ThemeId>;
  scores: number[];
  bestScore: number;
  questSerial: number;
}

export interface QuestTemplate {
  kind: QuestKind; title: string; enabled: boolean; weight: number;
  baseTarget: number; perLevel: number; min: number; max: number;
  xpMultiplier: number; starMultiplier: number;
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  { kind: 'survive', title: 'Survive {target} seconds', enabled: true, weight: 6, baseTarget: 35, perLevel: 8, min: 20, max: 150, xpMultiplier: 1, starMultiplier: 1 },
  { kind: 'score', title: 'Score {target} in one run', enabled: true, weight: 5, baseTarget: 250, perLevel: 100, min: 150, max: 1600, xpMultiplier: 1, starMultiplier: 1 },
  { kind: 'dodge', title: 'Dodge {target} projectiles', enabled: true, weight: 6, baseTarget: 12, perLevel: 3, min: 8, max: 45, xpMultiplier: 1, starMultiplier: 1 },
  { kind: 'reverse', title: 'Reverse {target} times', enabled: true, weight: 6, baseTarget: 15, perLevel: 4, min: 10, max: 60, xpMultiplier: 1, starMultiplier: 1 },
  { kind: 'formation', title: 'Survive {target} formations', enabled: true, weight: 5, baseTarget: 8, perLevel: 2, min: 5, max: 30, xpMultiplier: 1, starMultiplier: 1 },
  { kind: 'double', title: 'Survive {target} Double attacks', enabled: true, weight: 3, baseTarget: 3, perLevel: 1, min: 2, max: 12, xpMultiplier: 1, starMultiplier: 1 },
  { kind: 'difficulty', title: 'Reach difficulty {target}', enabled: true, weight: 3, baseTarget: 2, perLevel: 0.3, min: 2, max: 5, xpMultiplier: 1, starMultiplier: 1 },
  { kind: 'runs', title: 'Complete {target} runs', enabled: true, weight: 3, baseTarget: 3, perLevel: 1, min: 2, max: 12, xpMultiplier: 1, starMultiplier: 1 },
];

const QUEST_KINDS = new Set<QuestKind>(QUEST_TEMPLATES.map((template) => template.kind));

export class ProfileStore {
  data: Profile;
  devUnlockAll = false;
  devScores: number[] = [];
  preview: Partial<Record<CosmeticCategory, ThemeId>> = {};
  private storageAvailable = true;

  constructor(readonly config: GameConfig, private readonly storage = gameStorage) {
    this.data = this.load();
    this.ensureFiveQuests();
    this.save();
  }

  get level(): number { return levelForXp(this.data.xp, this.config); }
  get xpIntoLevel(): number { return this.data.xp - xpAtLevel(this.level, this.config); }
  get xpNeeded(): number { return this.level >= this.config.xp.levelCap ? 0 : xpRequirement(this.level, this.config); }
  get bestScore(): number { return Math.max(this.data.bestScore, this.data.scores[0] ?? 0); }
  activeTheme(category: CosmeticCategory): ThemeId { return this.preview[category] ?? this.data.equipped[category]; }

  save(): void {
    try {
      this.storage.setItem(PROFILE_KEY, JSON.stringify(this.data));
      this.storage.setItem(LEGACY_BEST_KEY, String(this.bestScore));
      this.storageAvailable = true;
    } catch { this.storageAvailable = false; }
  }

  get hasStorage(): boolean { return this.storageAvailable && this.storage.available; }

  addScore(score: number): void {
    const safe = Math.max(0, Math.floor(score));
    if (safe <= 0) return;
    this.data.scores.push(safe);
    this.data.scores.sort((a, b) => b - a);
    this.data.scores.length = Math.min(10, this.data.scores.length);
    this.data.bestScore = Math.max(this.data.bestScore, safe);
    this.save();
  }

  recordFinishedRun(score: number): void {
    this.addProgress('runs', 1);
    this.addProgress('score', score, 'max');
    this.addScore(score);
    // A zero-score run still has permanent quest progress to save.
    if (score <= 0) this.save();
  }

  addProgress(kind: QuestKind, amount: number, mode: 'add' | 'max' = 'add'): boolean {
    let changed = false;
    for (const quest of this.data.quests) {
      if (quest.kind !== kind || quest.progress >= quest.target) continue;
      const next = Math.min(quest.target, mode === 'max' ? Math.max(quest.progress, amount) : quest.progress + amount);
      if (next !== quest.progress) { quest.progress = next; changed = true; }
    }
    return changed;
  }

  formationSurvived(id: FormationId): boolean {
    const a = this.addProgress('formation', 1);
    const b = id === 'double' && this.addProgress('double', 1);
    return a || b;
  }

  questTitle(quest: Quest): string {
    const template = QUEST_TEMPLATES.find((item) => item.kind === quest.kind);
    return (template?.title ?? quest.kind).replace('{target}', String(quest.target));
  }

  claimQuest(index: number): { xp: number; stars: number; leveled: boolean } | null {
    const quest = this.data.quests[index];
    if (!quest || quest.progress < quest.target) return null;
    const before = this.level;
    this.data.xp = Math.max(0, this.data.xp + quest.xpReward);
    this.data.stars = Math.min(this.config.economy.starCap, this.data.stars + quest.starReward);
    this.data.quests.splice(index, 1, this.generateQuest(this.data.quests.map((item) => item.kind)));
    this.save();
    return { xp: quest.xpReward, stars: quest.starReward, leveled: this.level > before };
  }

  refreshQuest(index: number): void {
    if (index < 0 || index >= this.data.quests.length) return;
    const other = this.data.quests.filter((_, slot) => slot !== index).map((quest) => quest.kind);
    this.data.quests[index] = this.generateQuest(other);
    this.save();
  }

  refreshAll(): void {
    this.data.quests = [];
    this.ensureFiveQuests();
    this.save();
  }

  addXp(amount: number): boolean {
    const before = this.level;
    this.data.xp = Math.max(0, Math.floor(this.data.xp + amount));
    this.save();
    return this.level > before;
  }

  setLevel(level: number): void {
    const safe = Math.min(this.config.xp.levelCap, Math.max(1, Math.floor(level)));
    this.data.xp = xpAtLevel(safe, this.config);
    this.save();
  }

  setStars(stars: number): void {
    this.data.stars = Math.max(0, Math.min(this.config.economy.starCap, Math.floor(stars)));
    this.save();
  }

  isUnlocked(theme: ThemeId): boolean {
    return this.devUnlockAll || this.isGenuinelyUnlocked(theme);
  }

  private isGenuinelyUnlocked(theme: ThemeId): boolean {
    if (theme === 'default') return true;
    if (theme === 'light') return this.level >= this.config.cosmetics.lightLevel;
    if (theme === 'chaos') return this.level >= this.config.cosmetics.chaosLevel;
    return this.data.unlockedSets.includes(theme);
  }

  themeState(theme: ThemeId): 'visible' | 'locked-visible' | 'mystery' | 'unlocked' {
    if (this.isUnlocked(theme)) return 'unlocked';
    if (theme === 'chaos' && this.level < 5) return 'mystery';
    if ((theme === 'water' || theme === 'nature' || theme === 'fire')
      && this.data.stars >= this.themePrice(theme)) return 'visible';
    return 'locked-visible';
  }

  themeRequirement(theme: ThemeId): string {
    if (theme === 'default') return 'Included';
    if (theme === 'light') return `Level ${this.config.cosmetics.lightLevel}`;
    if (theme === 'chaos') return `Level ${this.config.cosmetics.chaosLevel}`;
    return `${this.themePrice(theme)} Stars`;
  }

  themePrice(theme: ThemeId): number {
    return theme === 'water' ? this.config.cosmetics.waterPrice
      : theme === 'nature' ? this.config.cosmetics.naturePrice
        : theme === 'fire' ? this.config.cosmetics.firePrice : 0;
  }

  unlock(theme: ThemeId): boolean {
    if (this.isGenuinelyUnlocked(theme) || theme === 'default' || theme === 'light' || theme === 'chaos') return false;
    const price = this.themePrice(theme);
    if (this.data.stars < price) return false;
    this.data.stars -= price;
    this.data.unlockedSets.push(theme);
    this.save();
    return true;
  }

  equip(category: CosmeticCategory, theme: ThemeId): boolean {
    if (!this.isUnlocked(theme)) return false;
    if (!this.isGenuinelyUnlocked(theme)) { this.preview[category] = theme; return true; }
    this.data.equipped[category] = theme;
    delete this.preview[category];
    this.save();
    return true;
  }

  reset(): void {
    this.data = freshProfile(this.legacyBest());
    this.devUnlockAll = false; this.devScores = []; this.preview = {};
    this.ensureFiveQuests();
    this.save();
  }

  private load(): Profile {
    const legacy = this.legacyBest();
    try {
      const raw = this.storage.getItem(PROFILE_KEY);
      if (!raw) return freshProfile(legacy);
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed) || parsed.version !== 2 || !Number.isSafeInteger(parsed.xp)
        || !Number.isSafeInteger(parsed.stars) || !Array.isArray(parsed.quests)
        || !Array.isArray(parsed.scores) || !isRecord(parsed.equipped)) return freshProfile(legacy);
      const scores = parsed.scores.filter((value): value is number => Number.isSafeInteger(value) && value > 0)
        .sort((a: number, b: number) => b - a).slice(0, 10);
      const best = Math.max(legacy, validNonnegative(parsed.bestScore), scores[0] ?? 0);
      if (best > 0 && !scores.includes(best)) scores.unshift(best);
      const quests = parsed.quests.filter(isQuest).slice(0, 5);
      const storedEquipped = parsed.equipped as Record<string, unknown>;
      const equipped = Object.fromEntries(COSMETIC_CATEGORIES.map((category) => [category,
        THEMES.includes(storedEquipped[category] as ThemeId) ? storedEquipped[category] : 'default'])) as Record<CosmeticCategory, ThemeId>;
      const unlockedSets = Array.isArray(parsed.unlockedSets)
        ? parsed.unlockedSets.filter((value): value is ThemeId => THEMES.includes(value as ThemeId)) : [];
      return { version: 2, xp: validNonnegative(parsed.xp), stars: Math.min(this.config.economy.starCap, validNonnegative(parsed.stars)),
        quests, scores: scores.slice(0, 10), bestScore: best,
        questSerial: validNonnegative(parsed.questSerial), unlockedSets, equipped };
    } catch { this.storageAvailable = false; return freshProfile(legacy); }
  }

  private legacyBest(): number {
    try { return validNonnegative(Number(this.storage.getItem(LEGACY_BEST_KEY))); }
    catch { this.storageAvailable = false; return 0; }
  }

  private ensureFiveQuests(): void {
    while (this.data.quests.length < 5) this.data.quests.push(this.generateQuest(this.data.quests.map((quest) => quest.kind)));
  }

  private generateQuest(exclude: QuestKind[]): Quest {
    let pool = QUEST_TEMPLATES.filter((template) => template.enabled && template.weight > 0 && !exclude.includes(template.kind));
    if (!pool.length) pool = QUEST_TEMPLATES.filter((template) => template.enabled && template.weight > 0);
    if (!pool.length) pool = [QUEST_TEMPLATES[0]];
    const total = pool.reduce((sum, template) => sum + template.weight, 0);
    let roll = Math.random() * total;
    let selected = pool[pool.length - 1];
    for (const template of pool) { roll -= template.weight; if (roll <= 0) { selected = template; break; } }
    const level = this.level;
    const target = Math.round(Math.min(selected.max, Math.max(selected.min, selected.baseTarget + selected.perLevel * (level - 1))));
    const xpReward = Math.max(1, Math.round(xpRequirement(level, this.config) / this.config.xp.questsPerLevel * selected.xpMultiplier));
    const starReward = Math.max(1, Math.round((this.config.economy.baseStars + (level - 1) * this.config.economy.starsPerLevel) * selected.starMultiplier));
    this.data.questSerial += 1;
    return { id: `${selected.kind}:${this.data.questSerial}`, kind: selected.kind, target, progress: 0, xpReward, starReward };
  }
}

export function xpRequirement(level: number, config: GameConfig): number {
  return Math.round(config.xp.baseRequirement * config.xp.growth ** (level - 1));
}

export function xpAtLevel(level: number, config: GameConfig): number {
  let total = 0;
  for (let current = 1; current < level; current += 1) total += xpRequirement(current, config);
  return total;
}

export function levelForXp(xp: number, config: GameConfig): number {
  let level = 1;
  while (level < config.xp.levelCap && xp >= xpAtLevel(level + 1, config)) level += 1;
  return level;
}

function freshProfile(best: number): Profile {
  return { version: 2, xp: 0, stars: 0, quests: [], unlockedSets: [],
    equipped: { player: 'default', projectile: 'default', orbit: 'default', planet: 'default' },
    scores: best > 0 ? [best] : [], bestScore: best, questSerial: 0 };
}

function validNonnegative(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000 ? value : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isQuest(value: unknown): value is Quest {
  return isRecord(value) && typeof value.id === 'string' && value.id.length <= 80 && QUEST_KINDS.has(value.kind as QuestKind)
    && Number.isSafeInteger(value.target) && (value.target as number) > 0 && (value.target as number) <= 100000
    && Number.isSafeInteger(value.progress) && (value.progress as number) >= 0 && (value.progress as number) <= (value.target as number)
    && Number.isSafeInteger(value.xpReward) && (value.xpReward as number) >= 0 && (value.xpReward as number) <= 100000
    && Number.isSafeInteger(value.starReward) && (value.starReward as number) >= 0 && (value.starReward as number) <= 100000;
}
