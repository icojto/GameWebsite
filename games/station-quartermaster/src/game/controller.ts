import type { CoreResource, CrewId, ModuleId } from "./config.ts";
import {
  assignCrew,
  clone,
  newScenario,
  resolveDay,
  resupply,
} from "./simulation.ts";
import type { Scenario } from "./simulation.ts";
import { SaveCoordinator } from "./save.ts";

export type Phase = "BOOT" | "MENU" | "PLAYING" | "RESOLVING_DAY" | "RESULT";
export class ScenarioController {
  private scenario: Scenario = newScenario();
  private ticket = 0;
  phase: Phase = "BOOT";
  saveStatus: "saved" | "unavailable" | "invalid" | "empty" = "empty";
  hasSave = false;
  private readonly saves: SaveCoordinator;
  constructor(saves: SaveCoordinator) {
    this.saves = saves;
  }
  get state(): Scenario {
    return clone(this.scenario);
  }
  boot() {
    const loaded = this.saves.load();
    this.hasSave = loaded.kind === "valid";
    if (loaded.kind === "valid") {
      this.scenario = loaded.state;
      this.saveStatus = "saved";
    } else this.saveStatus = loaded.kind;
    this.phase = "MENU";
  }
  private persist() {
    const success = this.saves.save(this.scenario);
    this.saveStatus = success ? "saved" : "unavailable";
    this.hasSave = this.hasSave || success;
  }
  startNew() {
    if (this.phase === "RESOLVING_DAY") return;
    this.ticket++;
    this.scenario = newScenario();
    this.phase = "PLAYING";
    this.hasSave = true;
    this.persist();
  }
  resume() {
    if (this.phase === "MENU" && this.hasSave) this.phase = this.scenario.phase;
  }
  menu() {
    if (this.phase === "RESOLVING_DAY") return;
    this.persist();
    this.phase = "MENU";
  }
  assign(crew: CrewId, module: ModuleId) {
    if (this.phase !== "PLAYING") return;
    this.scenario = assignCrew(this.scenario, crew, module);
    this.persist();
  }
  buy(resource: CoreResource): boolean {
    if (this.phase !== "PLAYING") return false;
    const next = resupply(this.scenario, resource);
    if (next === this.scenario) return false;
    this.scenario = next;
    this.persist();
    return true;
  }
  beginDay(): number | null {
    if (this.phase !== "PLAYING") return null;
    // Persist the entire pre-transition state. A close during animation resumes this decision.
    this.persist();
    this.phase = "RESOLVING_DAY";
    return ++this.ticket;
  }
  finishDay(ticket: number): boolean {
    if (this.phase !== "RESOLVING_DAY" || ticket !== this.ticket) return false;
    // Pure calculation, then one state replacement, then one complete snapshot.
    this.scenario = resolveDay(this.scenario);
    this.phase = this.scenario.phase;
    this.persist();
    return true;
  }
}
