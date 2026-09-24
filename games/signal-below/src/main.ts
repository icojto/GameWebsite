import './style.css';
import { AtmosphereAudio } from './audio';
import { CheckpointSystem } from './checkpoint';
import { CLUES, ENDINGS, LOCATIONS, endingDetail } from './content';
import type { ClueId, LocationId, SessionState } from './model';
import { TIMING } from './model';
import { ConditionEvaluator, DialogueController, InteractionSystem, LocationController, NarrativeSession, validateContent } from './narrative';
import { Presentation } from './scene';

validateContent();
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header class="topbar"><a class="wordmark" href="#" data-action="menu" aria-label="Signal Below menu"><span class="brand-icon">⌁</span> HRISTO<span class="brand-light">STUDIOS</span></a><span class="edition">A SHORT NARRATIVE MYSTERY <i>/</i> 005</span><div class="top-actions"><button class="quiet" data-action="audio" id="audio" aria-pressed="true">Sound on</button><button class="quiet" data-action="menu" id="menu-button">Menu <span>Ⅱ</span></button></div></header>
  <main id="world" class="world">
    <div class="location-bar"><div><p class="eyebrow" id="location-caption"></p><h1 id="location-title"></h1></div><div class="connection"><span class="status-dot"></span><span id="connection-label">LOCAL SYSTEM / STANDBY</span><div class="waveform" aria-hidden="true">${Array.from({ length: 17 }, (_, i) => `<i style="--h:${6 + (i * 13) % 24}px"></i>`).join('')}</div></div></div>
    <div class="play-space"><div class="viewport"><div id="stage" class="stage"><div id="canvas" aria-hidden="true"></div><div class="scene-shade"></div><div class="scene-note"><span class="tiny-line"></span><p id="scene-description"></p></div><span class="coordinate" aria-hidden="true">62° 14′ N / 06° 08′ E</span><div id="hotspots"></div><div id="fade" class="fade"></div></div></div><div id="interaction-rail" class="interaction-rail" aria-label="Room interactions"></div></div>
    <footer class="bottom-deck"><div class="objective"><p class="eyebrow">FIELD OBJECTIVE</p><p id="objective"></p></div><nav id="locations" aria-label="Facility locations"></nav><div class="evidence-strip"><span class="eyebrow">EVIDENCE <b id="clue-count">0 / 3</b></span><div id="clues"></div></div></footer>
  </main>
  <div class="statusbar"><span>RELAY 06 <i>/</i> FIELD SERVICE</span><span id="checkpoint" role="status">Local checkpoint ready</span></div>
  <div id="overlay" class="overlay" hidden></div><div id="notice" class="notice" role="status"></div>`;

const element = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const paragraphs = (value: string) => value.split('\n\n').map(p => `<p>${escape(p).replace(/\n/g, '<br>')}</p>`).join('');
const audio = new AtmosphereAudio();
const checkpoints = new CheckpointSystem();
const presentation = new Presentation('canvas');
let session: NarrativeSession | null = null;
let phase: SessionState = 'BOOT';
let loaded = checkpoints.load();
let inspection: { title: string; text: string; clue?: ClueId } | null = null;
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
let returnFocus = 'menu-button';
let saveWarning = '';
let previousSignal = false;
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

function fitStage() {
  const viewport = document.querySelector<HTMLElement>('.viewport')!;
  const width = Math.min(viewport.clientWidth, viewport.clientHeight * 16 / 9);
  element('stage').style.width = `${width}px`;
  element('stage').style.height = `${width * 9 / 16}px`;
}
new ResizeObserver(fitStage).observe(document.querySelector('.viewport')!);

function notify(message: string) {
  element('notice').textContent = message;
  element('notice').classList.add('visible');
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => element('notice').classList.remove('visible'), TIMING.notice);
}
function checkpoint() {
  if (!session) return;
  const saved = checkpoints.save(session.snapshot());
  saveWarning = saved.ok ? '' : saved.message;
  element('checkpoint').textContent = saved.message;
  element('checkpoint').classList.toggle('warning', !saved.ok);
  loaded = checkpoints.load();
}
function setOverlay(html: string, className = '', focus = true) {
  const overlay = element('overlay');
  overlay.className = `overlay ${className}`;
  overlay.hidden = !html;
  overlay.innerHTML = html;
  element('world').inert = Boolean(html);
  // Header stays visible; the modal owns keyboard focus until it closes.
  document.querySelector<HTMLElement>('.topbar')!.inert = Boolean(html);
  if (html && focus) requestAnimationFrame(() => overlay.querySelector<HTMLElement>('[autofocus], h2, button')?.focus());
}
function showMenu(confirmNew = false) {
  phase = 'MENU';
  audio.setActive(false);
  const canContinue = Boolean(session || loaded.kind === 'ok');
  const error = loaded.kind === 'invalid' || loaded.kind === 'unavailable' ? loaded.message : saveWarning;
  setOverlay(`<section class="menu-card" role="dialog" aria-modal="true" aria-labelledby="menu-title"><p class="eyebrow">HRISTO STUDIOS <i>/</i> NARRATIVE 005</p><div class="menu-rule"></div><p class="menu-pretitle">A TRANSMISSION WITHOUT A SOURCE.</p><h2 id="menu-title" tabindex="-1">Signal<br><em>Below</em><span class="title-period">.</span></h2><p class="menu-description">An empty relay station. A message from beneath it.<br>Someone has been waiting for you to answer.</p><div class="menu-meta"><span>04 LOCATIONS</span><span>03 CLUES</span><span>02 ENDINGS</span></div>${error ? `<p class="storage-warning">${escape(error)}${loaded.kind === 'invalid' ? ' Start a new visit to replace it explicitly.' : ''}</p>` : ''}${confirmNew ? `<div class="confirm"><p>Begin a new visit? This replaces the local checkpoint and your current choices.</p><button class="primary" data-action="new-confirm">Begin new visit</button><button data-action="menu">Keep current visit</button></div>` : `<div class="menu-buttons">${canContinue ? `<button class="primary" data-action="resume">${session ? 'Return to station' : 'Continue checkpoint'} <span>↗</span></button>` : ''}<button class="${canContinue ? 'secondary' : 'primary'}" data-action="new">${canContinue ? 'Start a new visit' : 'Enter the station'} <span>↗</span></button></div>`}<p class="menu-foot">10–20 MINUTES · HEADPHONES RECOMMENDED<br>Touch or click illuminated markers. Your choices save automatically.</p><button class="quiet menu-audio" data-action="audio" aria-pressed="${audio.on}">Sound ${audio.on ? 'on' : 'off'}</button></section><div class="menu-transmission" aria-hidden="true"><div class="signal-symbol">│<span>│</span>│</div><p>INBOUND / NO CARRIER</p><span>“YOU TOOK LONGER<br>THAN THE OTHERS.”</span></div>`, 'menu-overlay');
}
function renderWorld() {
  const state = session?.snapshot() ?? new NarrativeSession().snapshot();
  const location = LocationController.get(state.currentLocationId);
  element('location-caption').textContent = location.caption;
  element('location-title').innerHTML = `<span>${location.number}</span> ${escape(location.name)}`;
  element('scene-description').textContent = location.description;
  const contactsDone = state.completedInteractions.includes('contact');
  element('connection-label').textContent = state.ending ? 'SESSION / COMPLETE' : contactsDone ? 'UNREGISTERED SIGNAL / ACTIVE' : 'LOCAL SYSTEM / STANDBY';
  document.querySelector('.connection')!.classList.toggle('anomaly', contactsDone);
  let objective = location.objective;
  if (state.completedInteractions.includes('console') && !contactsDone) objective = 'Open the incoming transmission on the communications console.';
  if (contactsDone && state.currentLocationId === 'operations') objective = 'Visit the antenna yard to measure the signal bearing.';
  if (state.currentLocationId === 'yard' && state.discoveredClues.includes('direction')) objective = state.completedInteractions.includes('bearing-call') ? 'Continue to archive & power. Check the record and the transmitter.' : 'Answer the local receiver. It knows what you measured.';
  if (state.currentLocationId === 'archive' && state.discoveredClues.length === 3) objective = state.completedInteractions.includes('memory') ? 'Go to the sublevel access. The lower relay is waiting.' : 'Read the live register. The isolated channel is still receiving.';
  if (state.currentLocationId === 'sublevel' && state.completedInteractions.includes('hatch')) objective = 'Open the final channel and choose a position for the lower relay.';
  element('objective').textContent = objective;
  const hotspots = InteractionSystem.available(state);
  const hotspotButton = (hotspot: typeof hotspots[number], index: number, rail = false) => {
    const done = state.completedInteractions.includes(hotspot.dialogue ?? hotspot.id);
    const label = done ? hotspot.dialogue ? 'Review transmission' : hotspot.id === 'console' ? 'Inspect console' : hotspot.label : hotspot.label;
    return `<button id="${rail ? 'rail' : 'hotspot'}-${hotspot.id}" class="hotspot ${hotspot.dialogue ? 'signal-hotspot' : ''} ${done ? 'visited' : ''}" style="--x:${hotspot.x}%;--y:${hotspot.y}%" data-action="interact" data-id="${hotspot.id}" aria-label="${escape(label)}${done ? ', reviewed' : ''}"><span class="hotspot-marker">${done ? '✓' : String(index + 1).padStart(2, '0')}</span><span class="hotspot-label">${escape(label)}<small>${escape(hotspot.subtitle)}</small></span></button>`;
  };
  element('hotspots').innerHTML = hotspots.map((h, i) => hotspotButton(h, i)).join('');
  element('interaction-rail').innerHTML = `<p class="eyebrow">ROOM INTERACTIONS</p>${hotspots.map((h, i) => hotspotButton(h, i, true)).join('')}`;
  element('locations').innerHTML = LOCATIONS.map(room => {
    const available = ConditionEvaluator.meets(state, room.when);
    return `<button data-action="travel" data-id="${room.id}" ${!available ? 'disabled' : ''} ${room.id === location.id ? 'aria-current="location"' : ''} title="${available ? room.name : 'Continue the current investigation to unlock'}"><span>${room.number}</span><b>${escape(room.name)}</b><i aria-hidden="true">${available ? room.id === location.id ? '●' : '↗' : '⌁'}</i></button>`;
  }).join('');
  element('clue-count').textContent = `${state.discoveredClues.length} / 3`;
  element('clues').innerHTML = Object.entries(CLUES).map(([id, clue], index) => `<button data-action="clue" data-id="${id}" ${state.discoveredClues.includes(id as ClueId) ? 'class="found"' : 'disabled'} aria-label="${state.discoveredClues.includes(id as ClueId) ? escape(clue.title) : `Undiscovered clue ${index + 1}`}" title="${state.discoveredClues.includes(id as ClueId) ? escape(clue.title) : 'Not yet discovered'}">${['↧', '≡', 'ϟ'][index]}</button>`).join('');
  if (contactsDone && !previousSignal) { previousSignal = true; void presentation.show(location.id, true, true); }
}
function panel(title: string, source: string, text: string, buttons: string, extra = '') {
  setOverlay(`<section class="story-panel ${extra}" role="dialog" aria-modal="true" aria-labelledby="panel-title"><div class="panel-top"><span class="eyebrow">${escape(source)}</span><button class="close-button" data-action="close" aria-label="Close panel">×</button></div><h2 id="panel-title" tabindex="-1">${escape(title)}</h2><div class="story-text">${paragraphs(text)}</div><div class="panel-actions">${buttons}</div><p class="panel-checkpoint">${escape(saveWarning || 'LOCAL CHECKPOINT / SAVED')}</p></section>`, 'story-overlay');
}
function renderDialogue() {
  if (!session) return;
  const state = session.snapshot();
  const dialogue = DialogueController.get(state.currentDialogueId!);
  const isReply = state.dialoguePhase === 'reply';
  const selected = dialogue.choices.find(choice => choice.id === state.relevantChoiceOutcomes[dialogue.id]);
  const text = isReply && selected ? ConditionEvaluator.text(state, selected.reply, selected.variants) : ConditionEvaluator.text(state, dialogue.text, dialogue.variants);
  const buttons = isReply ? `<p class="chosen-reply">YOUR RESPONSE <span>${escape(selected!.label)}</span></p><button class="primary" data-action="close">Return to the room <span>↗</span></button>` : `${dialogue.id === 'final' ? '<p class="final-note">This choice ends your visit. Each position reveals something different.</p>' : '<p class="choice-note">CHOOSE YOUR RESPONSE · THIS REPLY WILL BE REMEMBERED</p>'}${DialogueController.choices(state).map((choice, i) => `<button class="choice ${choice.ending ? 'final-choice' : ''}" data-action="choose" data-id="${choice.id}"><span class="choice-number">0${i + 1}</span>${escape(choice.label)}<span class="choice-arrow">↗</span></button>`).join('')}`;
  panel(isReply ? 'The signal answers.' : dialogue.id === 'final' ? 'The next part is yours.' : 'Something is listening.', dialogue.source, text, buttons, 'signal-panel');
}
function renderEnding() {
  const state = session!.snapshot(), ending = ENDINGS[state.ending!];
  setOverlay(`<section class="ending-card ${state.ending}" role="dialog" aria-modal="true" aria-labelledby="ending-title"><p class="eyebrow">${ending.kicker}</p><h2 id="ending-title" tabindex="-1">${ending.title}<em>.</em></h2><div class="ending-body">${paragraphs(ending.body)}<p class="ending-detail">${escape(endingDetail(state))}</p></div><p class="final-message">${ending.final}</p><p class="ending-caption">Your choice: ${state.ending === 'silence' ? 'SEAL / communications severed' : 'BRIDGE / lower path opened'}</p><button class="primary" data-action="menu">End visit <span>↗</span></button><p class="panel-checkpoint">${escape(saveWarning || 'ENDING SAVED / THANK YOU FOR LISTENING')}</p></section>`, 'ending-overlay');
}
async function start(fresh: boolean) {
  if (fresh) session = new NarrativeSession();
  else if (!session && loaded.kind === 'ok') session = new NarrativeSession(loaded.state);
  if (!session) return;
  inspection = null;
  phase = session.snapshot().sessionState;
  await presentation.show(session.snapshot().currentLocationId, session.snapshot().completedInteractions.includes('contact'));
  audio.setActive(true); audio.setRoom(LOCATIONS.findIndex(location => location.id === session!.snapshot().currentLocationId));
  renderWorld(); checkpoint();
  if (phase === 'DIALOGUE') renderDialogue();
  else if (phase === 'ENDING') renderEnding();
  else { setOverlay(''); element('location-title').tabIndex = -1; element('location-title').focus(); }
}
function closePanel() {
  if (phase === 'MENU' || phase === 'ENDING') return;
  inspection = null;
  session?.closeDialogue(); phase = 'EXPLORING'; checkpoint(); renderWorld(); setOverlay('');
  element(returnFocus)?.focus();
}
async function travel(id: LocationId) {
  if (!session || phase !== 'EXPLORING' || inspection || id === session.snapshot().currentLocationId) return;
  phase = 'TRANSITION'; element('world').inert = true; element('fade').classList.add('active');
  const ms = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : TIMING.roomFade;
  await delay(ms);
  session.enter(id); // No checkpoint may contain a half-finished presentation fade.
  await presentation.show(id, session.snapshot().completedInteractions.includes('contact'));
  audio.setRoom(LOCATIONS.findIndex(location => location.id === id)); renderWorld(); checkpoint();
  element('fade').classList.remove('active'); await delay(ms);
  phase = 'EXPLORING'; element('world').inert = false;
  element('location-title').tabIndex = -1; element('location-title').focus();
}

app.addEventListener('click', async event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
  if (!button || button.disabled || phase === 'TRANSITION') return;
  event.preventDefault();
  await audio.unlock();
  const action = button.dataset.action, id = button.dataset.id!;
  audio.cue('click');
  try {
    if (action === 'audio') {
      audio.toggle(); element('audio').textContent = `Sound ${audio.on ? 'on' : 'off'}`; element('audio').setAttribute('aria-pressed', String(audio.on));
      if (phase === 'MENU') showMenu();
    } else if (action === 'menu') showMenu();
    else if (action === 'new') {
      if (session || loaded.kind === 'ok' || loaded.kind === 'invalid') showMenu(true);
      else await start(true);
    } else if (action === 'new-confirm') await start(true);
    else if (action === 'resume') await start(false);
    else if (action === 'close') closePanel();
    else if (action === 'travel') await travel(id as LocationId);
    else if (action === 'interact' && session && phase === 'EXPLORING' && !inspection) {
      returnFocus = button.id;
      const oldClues = session.snapshot().discoveredClues.length;
      const hotspot = session.interact(id); phase = session.snapshot().sessionState;
      checkpoint(); renderWorld();
      if (hotspot.dialogue) { audio.cue('signal'); presentation.signal(); renderDialogue(); }
      else {
        const clue = hotspot.effects?.find(effect => 'clue' in effect);
        inspection = { title: hotspot.label, text: hotspot.text!, clue: clue && 'clue' in clue ? clue.clue : undefined };
        const discovered = session.snapshot().discoveredClues.length > oldClues;
        if (discovered) { audio.cue('clue'); notify(`Evidence ${session.snapshot().discoveredClues.length} / 3 — ${CLUES[inspection.clue!].title}`); }
        panel(inspection.title, discovered ? 'EVIDENCE RECORDED / CHECKPOINT SAVED' : 'FIELD OBSERVATION', inspection.text, `<button class="primary" data-action="close">${discovered ? 'Keep the evidence' : 'Return to the room'} <span>↗</span></button>`, discovered ? 'clue-panel' : '');
      }
    } else if (action === 'choose' && session && phase === 'DIALOGUE') {
      session.choose(id); phase = session.snapshot().sessionState; checkpoint(); renderWorld();
      if (phase === 'ENDING') { audio.cue(session.snapshot().ending!); renderEnding(); }
      else { audio.cue('signal'); presentation.signal(); renderDialogue(); }
    } else if (action === 'clue' && session && phase === 'EXPLORING') {
      const clue = CLUES[id as ClueId]; returnFocus = 'location-title';
      inspection = { title: clue.title, text: clue.detail };
      panel(clue.title, clue.code, clue.detail, '<button class="primary" data-action="close">Return to the room <span>↗</span></button>', 'clue-panel');
    }
  } catch (error) { console.error(error); notify('This action could not be completed. Your last checkpoint is safe.'); }
});

document.addEventListener('keydown', event => {
  const overlay = element('overlay');
  if (event.key === 'Escape') {
    if (inspection || phase === 'DIALOGUE') closePanel();
    else if (phase === 'EXPLORING') showMenu();
    else if (phase === 'MENU' && session) void start(false);
  }
  if (event.key === 'Tab' && !overlay.hidden) {
    const buttons = Array.from(overlay.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]'));
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement?.tagName === 'H2')) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
});
document.addEventListener('visibilitychange', () => { audio.setVisible(!document.hidden); if (document.hidden) checkpoint(); });
window.addEventListener('pagehide', checkpoint);
renderWorld(); showMenu();
