import { CONFIG, CORE, RESOURCES } from "./config.ts";
import { clone, survival, validAssignments } from "./simulation.ts";
import type { Scenario } from "./simulation.ts";

export type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type LoadResult =
  | { kind: "valid"; state: Scenario }
  | { kind: "empty" | "invalid" | "unavailable" };
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const exact = (v: Record<string, unknown>, keys: string[]) =>
  Object.keys(v).length === keys.length && keys.every((k) => k in v);
const integer = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= min && v <= max;

export function validateScenario(v: unknown): v is Scenario {
  if (
    !record(v) ||
    !exact(v, [
      "day",
      "completedDays",
      "phase",
      "resources",
      "assignments",
      "resupplyUsed",
      "outcome",
      "failedResources",
      "lastReport",
    ])
  )
    return false;
  if (
    !integer(v.day, 1, CONFIG.scenarioDays) ||
    !integer(v.completedDays, 0, CONFIG.scenarioDays) ||
    typeof v.resupplyUsed !== "boolean"
  )
    return false;
  if (
    !record(v.resources) ||
    !exact(v.resources, [...RESOURCES]) ||
    !validAssignments(v.assignments)
  )
    return false;
  const r = v.resources;
  if (
    !RESOURCES.every((key) =>
      integer(
        r[key],
        0,
        key === "credits" ? Number.MAX_SAFE_INTEGER : CONFIG.resourceMax,
      ),
    )
  )
    return false;
  if (
    !Array.isArray(v.failedResources) ||
    !v.failedResources.every((k) => CORE.includes(k))
  )
    return false;
  const expected = survival(r as Scenario["resources"], v.completedDays);
  if (
    v.outcome !== expected.outcome ||
    JSON.stringify(v.failedResources) !==
      JSON.stringify(expected.failedResources)
  )
    return false;
  if (v.phase === "PLAYING") {
    if (v.outcome !== null || v.day !== v.completedDays + 1) return false;
  } else if (v.phase === "RESULT") {
    if (!v.outcome || v.completedDays < 1 || v.day !== v.completedDays)
      return false;
  } else return false;
  if (v.completedDays === 0) return v.lastReport === null;
  const report = v.lastReport;
  return (
    record(report) &&
    exact(report, ["day", "delta"]) &&
    report.day === v.completedDays &&
    record(report.delta) &&
    exact(report.delta, [...RESOURCES]) &&
    RESOURCES.every((key) =>
      integer(
        (report.delta as Record<string, unknown>)[key],
        -CONFIG.resourceMax,
        key === "credits" ? Number.MAX_SAFE_INTEGER : CONFIG.resourceMax,
      ),
    )
  );
}
export class SaveCoordinator {
  private readonly storage: () => StoragePort;
  constructor(storage: () => StoragePort) {
    this.storage = storage;
  }
  load(): LoadResult {
    let raw: string | null;
    try {
      raw = this.storage().getItem(CONFIG.saveKey);
    } catch {
      return { kind: "unavailable" };
    }
    if (raw === null) return { kind: "empty" };
    try {
      const envelope: unknown = JSON.parse(raw);
      if (
        !record(envelope) ||
        !exact(envelope, [
          "schemaVersion",
          "gameId",
          "saveTimestamp",
          "scenarioState",
        ]) ||
        envelope.schemaVersion !== CONFIG.schemaVersion ||
        envelope.gameId !== CONFIG.gameId ||
        typeof envelope.saveTimestamp !== "string" ||
        !Number.isFinite(Date.parse(envelope.saveTimestamp)) ||
        !validateScenario(envelope.scenarioState)
      )
        return { kind: "invalid" };
      return { kind: "valid", state: clone(envelope.scenarioState) };
    } catch {
      return { kind: "invalid" };
    }
  }
  save(state: Scenario): boolean {
    if (!validateScenario(state)) return false;
    try {
      this.storage().setItem(
        CONFIG.saveKey,
        JSON.stringify({
          schemaVersion: CONFIG.schemaVersion,
          gameId: CONFIG.gameId,
          saveTimestamp: new Date().toISOString(),
          scenarioState: state,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
