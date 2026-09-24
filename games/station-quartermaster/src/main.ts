import "./style.css";
import {
  CONFIG,
  CORE,
  CREW_IDS,
  MODULE_IDS,
  RESOURCES,
} from "./game/config.ts";
import type { CrewId, Resource } from "./game/config.ts";
import { ScenarioController } from "./game/controller.ts";
import { forecast, production } from "./game/simulation.ts";
import { SaveCoordinator } from "./game/save.ts";
import { createStation } from "./presentation/station.ts";

const icon: Record<Resource, string> = {
  energy: "ϟ",
  oxygen: "O₂",
  food: "♧",
  credits: "◇",
};
const label: Record<Resource, string> = {
  energy: "Energy",
  oxygen: "Oxygen",
  food: "Food",
  credits: "Credits",
};
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const controller = new ScenarioController(
  new SaveCoordinator(() => window.localStorage),
);
let selected: CrewId = "01";
let sound = false;
let audio: AudioContext | null = null;
let endConfirmed = false;
let replaceConfirmed = false;
let numberFrame = 0;
let displayed: Record<Resource, number> = { ...CONFIG.startingResources };
let feedback = "Three crew. Four modules. Choose what can wait.";
const signed = (n: number) => `${n > 0 ? "+" : ""}${n}`;

$("#app").innerHTML = `
  <div class="shell">
    <header class="masthead"><a class="brand" href="#" aria-label="Station Quartermaster home"><span class="brand-mark">H</span><span>HRISTO STUDIOS <b> / </b> FIELD OPERATIONS</span></a><div class="edition">GAME 004 <span>·</span> SOLO SCENARIO</div><button id="sound" class="quiet" aria-pressed="false">Sound off</button></header>
    <main>
      <div class="title-row"><div><p class="eyebrow">KEPLER OUTPOST <span> / </span> SECTOR 09</p><h1>Station Quartermaster<span>.</span></h1></div><button id="menu-button" class="quiet">Save & menu ↗</button></div>
      <div class="mission-strip"><div class="condition"><span class="status-dot"></span><div><span class="micro">STATION CONDITION</span><strong id="condition">Systems online</strong></div></div><div class="rescue-track"><div class="track-label"><span id="day-label">DAY 01 / 10</span><span id="rescue-label">RESCUE EN ROUTE</span></div><div id="progress" class="segments" aria-label="Rescue progress"></div></div></div>
      <div class="workspace">
        <section class="station-panel" aria-label="Station and crew assignments">
          <div class="panel-heading"><span class="eyebrow">01 / STATION SCHEMATIC</span><span class="live-label">● LIVE TELEMETRY</span></div>
          <div class="schematic"><div id="station-canvas" aria-hidden="true"></div><span class="map-coordinate">KPL–09<br>ORBIT 38.2°</span><span class="core-label">COMMAND<br><b>KEPLER</b></span>
            ${MODULE_IDS.map((id, i) => `<button class="module module-${id}" id="module-${id}" data-module="${id}"><span class="module-top"><span class="module-index">0${i + 1}</span><b>${CONFIG.modules[id].label}</b></span><span class="module-detail" id="detail-${id}"></span><span class="module-output" id="output-${id}"></span></button>`).join("")}
            <span class="map-footer">PRESSURIZED LINK <i></i> MODULE CONNECTION</span>
          </div>
          <div class="crew-dock"><div class="crew-heading"><span class="eyebrow">CREW ASSIGNMENT</span><span id="crew-instruction">Select crew → select a module</span></div><div class="crew-list">${CREW_IDS.map((id) => `<button class="crew" data-crew="${id}" id="crew-${id}" aria-pressed="false"><span class="crew-token"><i></i>${id}</span><span><b>Crew ${id}</b><small id="crew-location-${id}"></small></span><span class="crew-check">↗</span></button>`).join("")}</div></div>
        </section>
        <aside class="operations"><div class="panel-heading"><span class="eyebrow">02 / SHIFT BRIEFING</span><span id="phase-label" class="micro">DECISION PHASE</span></div><div class="briefing"><p class="eyebrow" id="priority-label">YOUR PRIORITY</p><h2 id="priority">Keep the station breathing.</h2><p id="priority-copy">Review your reserves before committing the next shift.</p></div>
          <div class="resource-list">${RESOURCES.map((key) => `<div class="resource resource-${key}" id="resource-${key}"><div class="resource-icon">${icon[key]}</div><div class="resource-main"><div class="resource-name"><b>${label[key]}</b><span id="status-${key}"></span></div><div class="resource-bar"><i id="bar-${key}"></i></div><small id="forecast-${key}"></small></div><div class="resource-value"><strong id="value-${key}">0</strong><small id="delta-${key}"></small></div></div>`).join("")}</div>
          <section class="resupply"><div class="resupply-heading"><b>Emergency resupply</b><span>${CONFIG.resupplyCreditCost} ◇ → +${CONFIG.resupplyAmount}</span></div><p id="resupply-copy">One delivery per day. Choose the reserve that needs it.</p><div class="resupply-buttons">${CORE.map((key) => `<button data-buy="${key}" id="buy-${key}" aria-label="Buy ${CONFIG.resupplyAmount} ${label[key]} for ${CONFIG.resupplyCreditCost} credits">${icon[key]} <span>${label[key]}</span></button>`).join("")}</div></section>
        </aside>
      </div>
      <footer class="shift-footer"><div class="shift-log"><span class="eyebrow">COMMAND LOG</span><p id="feedback" role="status" aria-live="polite"></p><span id="save-status" class="save-status"></span></div><div class="shift-actions"><button id="cancel-end" class="quiet" hidden>Keep planning</button><button id="end-day" class="primary">End day 01 <span>→</span></button><small id="end-hint">No time passes until you commit.</small></div></footer>
    </main><div class="page-foot"><span>H / S <b>STATION QUARTERMASTER</b></span><span>AN ISOLATED STATION. TEN DAYS TO HOLD.</span></div>
  </div>
  <dialog id="overlay" aria-labelledby="dialog-title"><div class="dialog-art" aria-hidden="true"><div class="orbital-ring"></div><span>KEPLER<br><b>09</b></span></div><div id="dialog-content"></div></dialog>`;
const scene = createStation("station-canvas");

function cue(kind: "click" | "day" | "warning" | "rescue" | "collapse") {
  if (!sound) return;
  try {
    audio ??= new AudioContext();
    void audio.resume().catch(() => {});
    const notes =
      kind === "rescue"
        ? [440, 554, 659, 880]
        : kind === "collapse"
          ? [220, 165, 110]
          : kind === "warning"
            ? [220, 220]
            : kind === "day"
              ? [280, 420]
              : [520];
    notes.forEach((frequency, i) => {
      const o = audio!.createOscillator(),
        g = audio!.createGain(),
        t = audio!.currentTime + i * 0.13;
      o.connect(g);
      g.connect(audio!.destination);
      o.frequency.value = frequency;
      o.type = "sine";
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.055, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
      o.start(t);
      o.stop(t + 0.2);
    });
  } catch {
    sound = false;
    $("#sound").textContent = "Sound unavailable";
  }
}
function animateNumbers(target: Record<Resource, number>) {
  cancelAnimationFrame(numberFrame);
  const from = { ...displayed },
    start = performance.now();
  const duration = matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : CONFIG.feedback.numberMs;
  const tick = (now: number) => {
    const t = duration ? Math.min(1, (now - start) / duration) : 1;
    for (const k of RESOURCES) {
      displayed[k] = from[k] + (target[k] - from[k]) * t;
      $(`#value-${k}`).textContent = String(Math.round(displayed[k]));
    }
    if (t < 1) numberFrame = requestAnimationFrame(tick);
  };
  numberFrame = requestAnimationFrame(tick);
}
function render() {
  const s = controller.state,
    delta = forecast(s),
    outputs = production(s),
    playing = controller.phase === "PLAYING",
    resolving = controller.phase === "RESOLVING_DAY";
  const lowest = CORE.reduce((a, b) =>
    s.resources[a] <= s.resources[b] ? a : b,
  );
  const imminent = CORE.filter(
    (k) => s.resources[k] + delta[k] <= CONFIG.failureThresholds[k],
  );
  const critical = s.resources[lowest] <= CONFIG.criticalThreshold,
    warning = s.resources[lowest] <= CONFIG.warningThreshold;
  document.body.dataset.condition =
    s.outcome === "COLLAPSE"
      ? "collapse"
      : s.outcome === "RESCUE"
        ? "rescue"
        : critical
          ? "critical"
          : warning
            ? "warning"
            : "stable";
  document.body.classList.toggle("resolving", resolving);
  $("#condition").textContent =
    s.outcome === "RESCUE"
      ? "Rescue docked"
      : s.outcome === "COLLAPSE"
        ? "Station lost"
        : critical
          ? "Critical reserves"
          : warning
            ? "Reserves under pressure"
            : "Systems holding";
  $("#day-label").textContent =
    `DAY ${String(s.day).padStart(2, "0")} / ${CONFIG.scenarioDays}`;
  $("#rescue-label").textContent =
    s.outcome === "RESCUE"
      ? "RESCUE DOCKED"
      : `${CONFIG.scenarioDays - s.completedDays} SHIFTS UNTIL RESCUE`;
  $("#progress").innerHTML = Array.from(
    { length: CONFIG.scenarioDays },
    (_, i) =>
      `<i class="${i < s.completedDays ? "done" : i === s.completedDays ? "current" : ""}"></i>`,
  ).join("");
  $("#progress").setAttribute(
    "aria-label",
    `${s.completedDays} of ${CONFIG.scenarioDays} days completed`,
  );
  $("#priority-label").textContent = imminent.length
    ? "COLLAPSE PROJECTED"
    : critical
      ? "CRITICAL RESERVE"
      : "LOWEST RESERVE";
  $("#priority").textContent = imminent.length
    ? `${imminent.map((k) => label[k]).join(" / ")} won’t last the shift.`
    : `${label[lowest]} needs your attention.`;
  $("#priority-copy").textContent = imminent.length
    ? "Move crew or order resupply before ending this day."
    : `${s.resources[lowest]} units remain. Current assignments project ${signed(delta[lowest])} ${label[lowest].toLowerCase()} this shift.`;
  $("#phase-label").textContent = resolving
    ? "RESOLVING DAY"
    : s.phase === "RESULT"
      ? "MISSION COMPLETE"
      : "DECISION PHASE";
  for (const key of RESOURCES) {
    const value = s.resources[key],
      level =
        key === "credits"
          ? value < CONFIG.resupplyCreditCost
            ? "LOW RESERVES"
            : "AVAILABLE"
          : value <= CONFIG.criticalThreshold
            ? "CRITICAL"
            : value <= CONFIG.warningThreshold
              ? "LOW"
              : "STABLE";
    $(`#status-${key}`).textContent = level;
    $(`#resource-${key}`).dataset.level = level;
    $(`#bar-${key}`).style.width = `${Math.min(100, value)}%`;
    $(`#forecast-${key}`).textContent =
      `${outputs[key]} produced${key === "credits" ? "" : ` − ${CONFIG.dailyConsumption[key]} consumed`} · ${signed(delta[key])} / day`;
    $(`#delta-${key}`).textContent = s.lastReport
      ? `${signed(s.lastReport.delta[key])} last shift`
      : key === "credits"
        ? "RESERVE"
        : "/ 100";
  }
  animateNumbers(s.resources);
  for (const id of MODULE_IDS) {
    const module = CONFIG.modules[id],
      crew = CREW_IDS.find((c) => s.assignments[c] === id),
      value = s.resources[module.resource];
    const condition =
      id === "support"
        ? value < CONFIG.resupplyCreditCost
          ? "Low reserves"
          : "Online"
        : value <= CONFIG.criticalThreshold
          ? "Critical"
          : value <= CONFIG.warningThreshold
            ? "Low reserve"
            : "Online";
    const button = $<HTMLButtonElement>(`#module-${id}`);
    button.disabled = !playing;
    button.classList.toggle("selected", s.assignments[selected] === id);
    button.dataset.level = condition;
    button.setAttribute(
      "aria-label",
      `${module.label}, ${crew ? `crew ${crew}` : "unstaffed"}, ${condition}. Assign selected crew ${selected}${crew && crew !== selected ? " and swap occupants" : ""}`,
    );
    $(`#detail-${id}`).innerHTML =
      `<span class="assignment-dot ${crew ? "staffed" : ""}"></span>${crew ? `CREW ${crew}` : "UNSTAFFED"} <span>· ${condition}</span>`;
    $(`#output-${id}`).textContent =
      `${icon[module.resource]} +${outputs[module.resource]} ${label[module.resource].toLowerCase()} / day`;
  }
  for (const id of CREW_IDS) {
    $(`#crew-location-${id}`).textContent =
      CONFIG.modules[s.assignments[id]].label;
    const button = $<HTMLButtonElement>(`#crew-${id}`);
    button.setAttribute("aria-pressed", String(selected === id));
    button.disabled = !playing;
  }
  $("#crew-instruction").textContent =
    `Crew ${selected} selected → tap a module to move or swap`;
  for (const key of CORE)
    $<HTMLButtonElement>(`#buy-${key}`).disabled =
      !playing ||
      s.resupplyUsed ||
      s.resources.credits < CONFIG.resupplyCreditCost ||
      s.resources[key] >= CONFIG.resourceMax;
  $("#resupply-copy").textContent = s.resupplyUsed
    ? "Delivery received. Next delivery available tomorrow."
    : s.resources.credits < CONFIG.resupplyCreditCost
      ? `Need ${CONFIG.resupplyCreditCost - s.resources.credits} more credits. Staff Support to earn faster.`
      : "One delivery per day. Choose the reserve that needs it.";
  $("#feedback").textContent = feedback;
  $("#save-status").textContent =
    controller.saveStatus === "saved"
      ? "✓ Scenario saved on this browser"
      : controller.saveStatus === "unavailable"
        ? "! Save unavailable. Progress is only held in this tab."
        : controller.saveStatus === "invalid"
          ? "! Saved scenario could not be read."
          : "Local scenario storage · no offline progression";
  $("#save-status").classList.toggle(
    "save-error",
    controller.saveStatus === "unavailable" ||
      controller.saveStatus === "invalid",
  );
  $<HTMLButtonElement>("#end-day").disabled = !playing;
  $("#end-day").innerHTML = resolving
    ? "Resolving shift…"
    : endConfirmed
      ? `Confirm day ${String(s.day).padStart(2, "0")} <span>→</span>`
      : `End day ${String(s.day).padStart(2, "0")} <span>→</span>`;
  $("#cancel-end").hidden = !endConfirmed;
  $("#end-hint").textContent = endConfirmed
    ? imminent.length
      ? "Warning: this shift will cause collapse."
      : "Assignments lock when you confirm."
    : "No time passes until you commit.";
  $<HTMLButtonElement>("#menu-button").disabled = resolving;
  scene.present(s, resolving);
  if (controller.phase === "MENU" || controller.phase === "RESULT")
    showOverlay();
}
function showOverlay() {
  const s = controller.state,
    result = controller.phase === "RESULT",
    rescued = s.outcome === "RESCUE";
  const content = $("#dialog-content");
  if (result)
    content.innerHTML = `<p class="eyebrow">MISSION ${rescued ? "COMPLETE / RESCUE" : "ENDED / COLLAPSE"}</p><h2 id="dialog-title">${rescued ? "You brought them home." : "The station fell silent."}</h2><p class="dialog-copy">${rescued ? "Ten days held. The rescue vessel has docked at Kepler. All three crew are going home." : `${s.failedResources.map((k) => label[k]).join(" and ")} reached zero after day ${s.day}. Your final shift is saved. A different crew allocation can change the outcome.`}</p><div class="result-reserves">${CORE.map((k) => `<div><span>${icon[k]} ${label[k]}</span><b>${s.resources[k]}</b></div>`).join("")}</div><button class="primary" id="new-game">Command another station <span>↗</span></button><button class="quiet" id="result-menu">Return to menu</button>`;
  else
    content.innerHTML = `<p class="eyebrow">HRISTO STUDIOS / GAME 004</p><h2 id="dialog-title">Ten days.<br>Three crew.<br>One station.</h2><p class="dialog-copy">Rescue is on its way. Keep Kepler’s energy, oxygen and food above zero until the end of day ten.</p><ol class="instructions"><li><b>Assign your crew.</b> Select a token, then a module. Occupied modules swap crew.</li><li><b>Watch the forecast.</b> Every module produces; staffing increases its output.</li><li><b>Commit the shift.</b> Use credits for one emergency delivery per day.</li></ol>${controller.saveStatus === "invalid" ? '<p class="save-warning">The saved scenario is corrupt or incompatible. It has been left untouched. Start new to replace it, or ignore it.</p><button id="ignore-save" class="quiet">Ignore invalid save</button>' : ""}${controller.saveStatus === "unavailable" ? '<p class="save-warning">Browser storage is unavailable. You can play, but progress may not survive closing this tab.</p>' : ""}${controller.hasSave ? `<button class="primary" id="resume-game">${s.phase === "RESULT" ? "View saved result" : `Resume day ${String(s.day).padStart(2, "0")}`} <span>→</span></button>` : ""}<button class="${controller.hasSave ? "quiet new-secondary" : "primary"}" id="new-game">${replaceConfirmed ? "Confirm: replace saved scenario" : "Take command · New game"} <span>↗</span></button>${replaceConfirmed ? '<button id="cancel-new" class="quiet">Keep saved scenario</button>' : ""}<p class="dialog-foot">10 DAYS · ABOUT 8–15 MIN WITH DELIBERATE PLANNING<br>Saved automatically on this browser. No time passes away.</p>`;
  $("#new-game").onclick = () => {
    if (controller.hasSave && !result && !replaceConfirmed) {
      replaceConfirmed = true;
      showOverlay();
      return;
    }
    replaceConfirmed = false;
    selected = "01";
    endConfirmed = false;
    feedback =
      "Shift 01. Review output, consumption and your one unstaffed module.";
    controller.startNew();
    $<HTMLDialogElement>("#overlay").close();
    render();
    cue("click");
    $("h1").setAttribute("tabindex", "-1");
    $("h1").focus({ preventScroll: true });
    window.scrollTo(0, 0);
  };
  const resume = document.querySelector<HTMLButtonElement>("#resume-game");
  if (resume)
    resume.onclick = () => {
      replaceConfirmed = false;
      controller.resume();
      $<HTMLDialogElement>("#overlay").close();
      feedback = `Resumed day ${s.day}. No shifts passed while you were away.`;
      render();
    };
  const ignore = document.querySelector<HTMLButtonElement>("#ignore-save");
  if (ignore)
    ignore.onclick = () => {
      controller.saveStatus = "empty";
      showOverlay();
    };
  const cancel = document.querySelector<HTMLButtonElement>("#cancel-new");
  if (cancel)
    cancel.onclick = () => {
      replaceConfirmed = false;
      showOverlay();
    };
  const menu = document.querySelector<HTMLButtonElement>("#result-menu");
  if (menu)
    menu.onclick = () => {
      controller.menu();
      render();
    };
  const dialog = $<HTMLDialogElement>("#overlay");
  if (!dialog.open) dialog.showModal();
}
for (const id of CREW_IDS)
  $(`#crew-${id}`).onclick = () => {
    selected = id;
    endConfirmed = false;
    render();
    cue("click");
  };
for (const id of MODULE_IDS)
  $(`#module-${id}`).onclick = () => {
    controller.assign(selected, id);
    endConfirmed = false;
    feedback = `Crew ${selected} assigned to ${CONFIG.modules[id].label}. Check the updated daily forecast.`;
    render();
    cue("click");
  };
for (const key of CORE)
  $(`#buy-${key}`).onclick = () => {
    const before = controller.state.resources[key];
    if (controller.buy(key)) {
      feedback = `Delivery received: +${controller.state.resources[key] - before} ${label[key].toLowerCase()}, −${CONFIG.resupplyCreditCost} credits. Today’s resupply is used.`;
      endConfirmed = false;
      render();
      cue("click");
    }
  };
$("#end-day").onclick = () => {
  if (controller.phase !== "PLAYING") return;
  if (!endConfirmed) {
    endConfirmed = true;
    render();
    return;
  }
  const ticket = controller.beginDay();
  if (ticket === null) return;
  endConfirmed = false;
  feedback = "Shift committed. Resolving production and station consumption…";
  render();
  cue("day");
  window.setTimeout(() => {
    if (!controller.finishDay(ticket)) return;
    const s = controller.state;
    feedback = `Day ${s.completedDays} complete. ${RESOURCES.map((k) => `${label[k]} ${signed(s.lastReport!.delta[k])}`).join(" · ")}.`;
    render();
    cue(
      s.outcome === "RESCUE"
        ? "rescue"
        : s.outcome === "COLLAPSE"
          ? "collapse"
          : CORE.some((k) => s.resources[k] <= CONFIG.criticalThreshold)
            ? "warning"
            : "day",
    );
  }, CONFIG.feedback.resolveMs);
};
$("#cancel-end").onclick = () => {
  endConfirmed = false;
  render();
};
$("#menu-button").onclick = () => {
  controller.menu();
  endConfirmed = false;
  render();
};
$(".brand").onclick = (e) => {
  e.preventDefault();
  if (controller.phase !== "RESOLVING_DAY") {
    controller.menu();
    render();
  }
};
$("#sound").onclick = () => {
  sound = !sound;
  $("#sound").textContent = sound ? "Sound on" : "Sound off";
  $("#sound").setAttribute("aria-pressed", String(sound));
  cue("click");
};
$<HTMLDialogElement>("#overlay").addEventListener("cancel", (e) =>
  e.preventDefault(),
);
controller.boot();
render();
