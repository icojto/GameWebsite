import { COSMETIC_CATEGORIES, THEMES, type CosmeticCategory, type ProfileStore, type ThemeId } from './profile';
import type { RunPhase } from './run';
import type { OrbitAudio } from './audio';

type Panel = 'pause' | 'settings' | 'confirm-menu' | 'quests' | 'locker' | 'scores' | 'why-ads' | null;

export interface UIActions {
  start(): void;
  revive(): void;
  pause(): void;
  resume(): void;
  mainMenu(): void;
  notify(message: string, levelUp?: boolean): void;
  profileChanged(): void;
}

export class OrbitUI {
  private root: HTMLDivElement;
  private panel: Panel = null;
  private phase: RunPhase = 'menu';
  private lockerCategory: CosmeticCategory = 'player';
  private toastTimer: number | null = null;
  private scoreEl: HTMLElement;
  private bestEl: HTMLElement;
  private levelEl: HTMLElement;
  private starsEl: HTMLElement;
  private xpFill: HTMLElement;
  private xpLabel: HTMLElement;
  private metaEl: HTMLElement;
  private pauseEl: HTMLButtonElement;
  private panelEl: HTMLElement;
  private toastEl: HTMLElement;
  private blocked = false;
  private adsAvailable = false;

  constructor(parent: HTMLElement, private readonly profile: ProfileStore,
    private readonly audio: OrbitAudio, private readonly actions: UIActions) {
    this.root = document.createElement('div');
    this.root.className = 'orbit-ui';
    this.root.innerHTML = `
      <header class="orbit-hud" aria-label="Orbit Break status">
        <div class="hud-title">ORBIT BREAK</div>
        <div class="hud-score"><span class="hud-caption">SCORE</span><strong data-score>000000</strong><small data-best>BEST 000000</small></div>
        <div class="hud-progress"><span data-level>LV 01</span><div class="xp-track" role="progressbar" aria-label="Experience to next level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i data-xp-fill></i></div><small data-xp-label>0 / 100 XP</small></div>
        <div class="hud-stars" aria-label="Star balance"><span aria-hidden="true">★</span> <b data-stars>0</b></div>
        <button class="hud-pause" type="button" data-ui="pause" aria-label="Pause game">Ⅱ <span>PAUSE</span></button>
      </header>
      <nav class="orbit-meta" aria-label="Orbit Break menu" data-meta>
        <button type="button" data-ui="quests"><span aria-hidden="true">◇</span> QUESTS</button>
        <button type="button" data-ui="locker"><span aria-hidden="true">✦</span> LOCKER</button>
        <button type="button" data-ui="scores"><span aria-hidden="true">▤</span> SCORES</button>
        <button type="button" data-ui="why-ads" hidden>WHY ADS?</button>
      </nav>
      <div class="orbit-start" data-start><button type="button" data-ui="start">▶ PLAY</button></div>
      <section class="orbit-death" data-death hidden aria-label="Run ended">
        <h2>SIGNAL LOST</h2><p data-revive-message></p>
        <button type="button" data-ui="revive" hidden><img src="${new URL('../assets/ad-badge.svg', import.meta.url).href}" alt="Ad"> WATCH TO REVIVE <span data-offer-time></span></button>
        <div class="death-actions"><button type="button" data-ui="start">RESTART</button><button type="button" data-ui="main-menu">MAIN MENU</button></div>
      </section>
      <div class="orbit-modal" data-panel hidden></div>
      <div class="orbit-toast" data-toast role="status" aria-live="polite"></div>`;
    parent.append(this.root);
    this.scoreEl = this.must('[data-score]');
    this.bestEl = this.must('[data-best]');
    this.levelEl = this.must('[data-level]');
    this.starsEl = this.must('[data-stars]');
    this.xpFill = this.must('[data-xp-fill]');
    this.xpLabel = this.must('[data-xp-label]');
    this.metaEl = this.must('[data-meta]');
    this.pauseEl = this.must<HTMLButtonElement>('[data-ui="pause"]');
    this.panelEl = this.must('[data-panel]');
    this.toastEl = this.must('[data-toast]');
    this.root.addEventListener('click', this.onClick);
    this.root.addEventListener('input', this.onInput);
    window.addEventListener('keydown', this.onKeyDown);
    this.refreshProfile();
    this.setPhase('menu');
  }

  get isPanelOpen(): boolean { return this.panel !== null; }

  setBlocked(value: boolean): void { this.blocked = value; this.root.inert = value; }

  updateAds(available: boolean, offer: boolean, seconds: number, pending: boolean): void {
    this.adsAvailable = available;
    this.must<HTMLButtonElement>('[data-ui="why-ads"]').hidden = !available || this.phase !== 'menu';
    this.must<HTMLButtonElement>('[data-ui="revive"]').hidden = !offer;
    this.must('[data-offer-time]').textContent = `(${Math.ceil(seconds)}s)`;
    this.must('[data-revive-message]').textContent = pending ? 'Please wait…' : offer ? 'One more chance. Finish the ad to continue this run.' : 'Your run is complete.';
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-ui="start"], [data-ui="revive"], [data-ui="main-menu"]')) button.disabled = pending;
  }

  destroy(): void {
    this.root.removeEventListener('click', this.onClick);
    this.root.removeEventListener('input', this.onInput);
    window.removeEventListener('keydown', this.onKeyDown);
    if (this.toastTimer !== null) window.clearTimeout(this.toastTimer);
    this.root.remove();
  }

  setPhase(phase: RunPhase): void {
    if (phase !== 'paused' && ['pause', 'settings', 'confirm-menu'].includes(this.panel ?? '')) {
      this.panel = null; this.panelEl.hidden = true; this.panelEl.replaceChildren();
    }
    this.phase = phase;
    this.root.dataset.phase = phase;
    this.pauseEl.hidden = phase !== 'playing';
    this.must('[data-start]').hidden = phase !== 'menu';
    this.must('[data-death]').hidden = phase !== 'game-over';
    this.must<HTMLButtonElement>('[data-ui="why-ads"]').hidden = phase !== 'menu' || !this.adsAvailable;
    this.metaEl.setAttribute('aria-hidden', String(phase === 'playing' || phase === 'paused'));
    for (const button of this.metaEl.querySelectorAll<HTMLButtonElement>('button')) {
      button.tabIndex = phase === 'playing' || phase === 'paused' ? -1 : 0;
    }
  }

  updateScore(score: number): void { this.scoreEl.textContent = formatScore(score); }

  refreshProfile(): void {
    this.bestEl.textContent = `BEST ${formatScore(this.profile.bestScore)}`;
    this.levelEl.textContent = `LV ${String(this.profile.level).padStart(2, '0')}`;
    this.starsEl.textContent = String(this.profile.data.stars);
    const max = this.profile.xpNeeded;
    const value = this.profile.xpIntoLevel;
    const track = this.must<HTMLElement>('.xp-track');
    track.setAttribute('aria-valuemax', String(max || 1));
    track.setAttribute('aria-valuenow', String(max ? value : 1));
    this.xpFill.style.width = `${max ? Math.min(100, value / max * 100) : 100}%`;
    this.xpLabel.textContent = max ? `${value} / ${max} XP` : 'MAX LEVEL';
    if (this.panel) this.renderPanel();
  }

  open(panel: Exclude<Panel, null>): void {
    if (this.blocked || (panel === 'why-ads' && this.phase !== 'menu')) return;
    if ((panel === 'quests' || panel === 'locker' || panel === 'scores')
      && (this.phase === 'playing' || this.phase === 'paused')) return;
    this.panel = panel;
    this.renderPanel();
    this.audio.uiCue();
    this.panelEl.querySelector<HTMLButtonElement>('[data-ui="close"]')?.focus();
  }

  close(): void {
    const wasWhyAds = this.panel === 'why-ads';
    if (this.panel === 'settings' || this.panel === 'confirm-menu') { this.open('pause'); return; }
    if (this.panel === 'pause') {
      this.panel = null; this.panelEl.hidden = true; this.panelEl.innerHTML = '';
      this.actions.resume(); return;
    }
    this.panel = null;
    this.panelEl.hidden = true;
    this.panelEl.innerHTML = '';
    this.audio.uiCue();
    if (wasWhyAds) this.must<HTMLButtonElement>('[data-ui="why-ads"]').focus();
  }

  notify(message: string, levelUp = false): void {
    this.toastEl.textContent = message;
    this.toastEl.classList.toggle('level-up', levelUp);
    this.toastEl.classList.add('show');
    if (this.toastTimer !== null) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), 1400);
  }

  private renderPanel(): void {
    if (!this.panel) return;
    this.panelEl.hidden = false;
    let title = '';
    let body = '';
    if (this.panel === 'pause') {
      title = 'PAUSED';
      body = '<p class="modal-lead">The orbit is on hold.</p><div class="modal-actions"><button type="button" data-ui="resume">▶ RESUME</button><button type="button" data-ui="settings">⚙ SETTINGS</button><button type="button" data-ui="confirm-menu">⌂ MAIN MENU</button></div>';
    } else if (this.panel === 'settings') {
      title = 'SETTINGS';
      const settings = this.audio.settings;
      body = `<div class="settings-list">${(['master', 'music', 'sfx'] as const).map((key) => `<label>${key.toUpperCase()} <input type="range" min="0" max="1" step="0.05" value="${settings[key]}" data-audio="${key}" aria-label="${key} volume"><output>${Math.round(settings[key] * 100)}%</output></label>`).join('')}<label class="mute-line"><input type="checkbox" data-audio="mute" ${settings.mute ? 'checked' : ''}> MUTE</label></div><div class="modal-actions"><button type="button" data-ui="back-pause">← BACK</button></div>`;
    } else if (this.panel === 'confirm-menu') {
      title = 'END RUN?';
      body = '<p class="modal-lead">End the current run and return to Orbit Break menu?</p><div class="modal-actions"><button type="button" data-ui="main-menu">END RUN</button><button type="button" data-ui="back-pause">CANCEL</button></div>';
    } else if (this.panel === 'why-ads') {
      title = 'WHY ADS?';
      body = '<p class="modal-lead">Ads can help keep Orbit Break free to play. Optional rewarded ads let you continue a run once; you can always choose Restart instead.</p><p class="modal-lead">This integration is in a mock testing phase. No real advertising provider is connected. Privacy and provider information will be added before real ads launch.</p>';
    } else if (this.panel === 'quests') {
      title = 'QUESTS';
      body = `<p class="modal-lead">Five repeatable missions. Claim rewards when complete.</p><div class="quest-list">${this.profile.data.quests.map((quest, index) => {
        const complete = quest.progress >= quest.target;
        return `<div class="quest-row"><div><strong>${escapeText(this.profile.questTitle(quest))}</strong><small>${Math.floor(quest.progress)} / ${quest.target} · +${quest.xpReward} XP · +${quest.starReward} ★</small></div><button type="button" data-quest="${index}" data-ui="${complete ? 'claim' : 'reroll'}">${complete ? 'CLAIM' : '↻'}</button></div>`;
      }).join('')}</div><div class="modal-actions"><button type="button" data-ui="reroll-all">↻ REFRESH ALL</button></div>`;
    } else if (this.panel === 'locker') {
      title = 'LOCKER';
      body = `<p class="modal-lead">★ ${this.profile.data.stars} Stars · Themes change appearance only.</p><div class="locker-tabs" role="tablist" aria-label="Cosmetic category">${COSMETIC_CATEGORIES.map((category) => `<button type="button" role="tab" aria-selected="${this.lockerCategory === category}" data-category="${category}" data-ui="category">${category === 'orbit' ? 'ORBIT / CORE' : category.toUpperCase()}</button>`).join('')}</div><div class="locker-grid">${THEMES.map((theme) => {
        const state = this.profile.themeState(theme);
        const equipped = this.profile.activeTheme(this.lockerCategory) === theme;
        const name = state === 'mystery' ? '???' : theme.toUpperCase();
        const action = equipped ? 'EQUIPPED' : state === 'unlocked' ? 'EQUIP' : state === 'visible' ? 'UNLOCK' : 'LOCKED';
        return `<div class="locker-card theme-${theme}"><div class="theme-preview" aria-hidden="true"><i></i></div><strong>${name}</strong><small>${state === 'mystery' ? 'MYSTERY · reveal later' : this.profile.themeRequirement(theme)}</small><button type="button" data-theme="${theme}" data-ui="theme" ${equipped || (state !== 'unlocked' && state !== 'visible') ? 'disabled' : ''}>${action}</button></div>`;
      }).join('')}</div>`;
    } else {
      title = 'YOUR BEST RUNS';
      const scores = [...this.profile.data.scores, ...this.profile.devScores].sort((a, b) => b - a).slice(0, 10);
      body = scores.length
        ? `<ol class="score-list">${scores.map((score) => `<li><span>${formatScore(score)}</span></li>`).join('')}</ol>`
        : '<p class="modal-lead">Finish a run to place a score here.</p>';
    }
    this.panelEl.innerHTML = `<section class="orbit-modal-card" role="dialog" aria-modal="true" aria-label="${title}"><header><h2>${title}</h2><button type="button" data-ui="close" aria-label="Close ${title}">×</button></header>${body}</section>`;
  }

  private onClick = (event: MouseEvent): void => {
    if (this.blocked) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('button[data-ui]');
    if (!button) return;
    event.stopPropagation();
    const action = button.dataset.ui;
    if (action === 'start') this.actions.start();
    else if (action === 'revive') this.actions.revive();
    else if (action === 'pause') { this.actions.pause(); this.open('pause'); }
    else if (action === 'resume') { this.panel = null; this.panelEl.hidden = true; this.actions.resume(); }
    else if (action === 'close') this.close();
    else if (action === 'settings' || action === 'confirm-menu' || action === 'quests' || action === 'locker' || action === 'scores' || action === 'why-ads') this.open(action);
    else if (action === 'back-pause') this.open('pause');
    else if (action === 'main-menu') { this.panel = null; this.panelEl.hidden = true; this.actions.mainMenu(); }
    else if (action === 'claim') {
      const reward = this.profile.claimQuest(Number(button.dataset.quest));
      if (reward) {
        this.audio.rewardCue();
        this.actions.notify(`+${reward.xp} XP  ·  +${reward.stars} ★`, reward.leveled);
        if (reward.leveled) this.audio.levelCue();
        this.actions.profileChanged();
      }
    } else if (action === 'reroll') { this.profile.refreshQuest(Number(button.dataset.quest)); this.renderPanel(); }
    else if (action === 'reroll-all') { this.profile.refreshAll(); this.renderPanel(); }
    else if (action === 'category') { this.lockerCategory = button.dataset.category as CosmeticCategory; this.renderPanel(); }
    else if (action === 'theme') {
      const theme = button.dataset.theme as ThemeId;
      if (this.profile.isUnlocked(theme) || this.profile.unlock(theme)) {
        this.profile.equip(this.lockerCategory, theme);
        this.audio.rewardCue(); this.actions.profileChanged();
      }
    }
  };

  private onInput = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.dataset.audio) return;
    const key = target.dataset.audio;
    if (key === 'mute') this.audio.setMuted(target.checked);
    else if (key === 'master' || key === 'music' || key === 'sfx') {
      this.audio.settings[key] = Number(target.value);
      const output = target.nextElementSibling;
      if (output) output.textContent = `${Math.round(Number(target.value) * 100)}%`;
    }
    this.audio.applySettings();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (this.blocked) return;
    if (event.key === 'Tab' && this.panel) {
      const focusable = [...this.panelEl.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)')];
      if (focusable.length) {
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return;
    }
    if (event.key !== 'Escape') return;
    if (this.panel) { event.preventDefault(); this.close(); }
    else if (this.phase === 'playing') { event.preventDefault(); this.actions.pause(); this.open('pause'); }
  };

  private must<T extends HTMLElement = HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Orbit UI element missing: ${selector}`);
    return element;
  }
}

function escapeText(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}

function formatScore(score: number): string { return Math.max(0, Math.floor(score)).toString().padStart(6, '0'); }
