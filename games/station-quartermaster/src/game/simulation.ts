import { CONFIG, CORE, CREW_IDS, MODULE_IDS, RESOURCES } from "./config.ts";
import type { CoreResource, CrewId, ModuleId, Resources } from "./config.ts";

export type Outcome = "RESCUE" | "COLLAPSE" | null;
export type Scenario = {
  day: number;
  completedDays: number;
  phase: "PLAYING" | "RESULT";
  resources: Resources;
  assignments: Record<CrewId, ModuleId>;
  resupplyUsed: boolean;
  outcome: Outcome;
  failedResources: CoreResource[];
  lastReport: { day: number; delta: Resources } | null;
};
export const clone = <T>(state: T): T => structuredClone(state);
export function newScenario(): Scenario {
  return {
    day: 1,
    completedDays: 0,
    phase: "PLAYING",
    resources: { ...CONFIG.startingResources },
    assignments: { "01": "reactor", "02": "oxygen", "03": "hydroponics" },
    resupplyUsed: false,
    outcome: null,
    failedResources: [],
    lastReport: null,
  };
}
export function validAssignments(
  value: unknown,
): value is Scenario["assignments"] {
  if (!value || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  return (
    Object.keys(a).length === 3 &&
    CREW_IDS.every((id) => MODULE_IDS.includes(a[id] as ModuleId)) &&
    new Set(CREW_IDS.map((id) => a[id])).size === 3
  );
}
export function assignCrew(
  state: Scenario,
  crew: CrewId,
  module: ModuleId,
): Scenario {
  if (
    state.phase !== "PLAYING" ||
    !CREW_IDS.includes(crew) ||
    !MODULE_IDS.includes(module)
  )
    return state;
  const next = clone(state);
  const occupant = CREW_IDS.find((id) => state.assignments[id] === module);
  if (occupant) next.assignments[occupant] = state.assignments[crew];
  next.assignments[crew] = module;
  return next;
}
export function production(state: Scenario): Resources {
  const output: Resources = { energy: 0, oxygen: 0, food: 0, credits: 0 };
  for (const id of MODULE_IDS) {
    const module = CONFIG.modules[id];
    const staffed = Object.values(state.assignments).includes(id);
    output[module.resource] +=
      module.baseOutput * (staffed ? module.staffedMultiplier : 1);
  }
  return output;
}
export function forecast(state: Scenario): Resources {
  const output = production(state);
  for (const key of RESOURCES) output[key] -= CONFIG.dailyConsumption[key];
  return output;
}
export function survival(
  resources: Resources,
  completedDays: number,
): { outcome: Outcome; failedResources: CoreResource[] } {
  const failedResources = CORE.filter(
    (key) => resources[key] <= CONFIG.failureThresholds[key],
  );
  return {
    failedResources,
    outcome: failedResources.length
      ? "COLLAPSE"
      : completedDays >= CONFIG.scenarioDays
        ? "RESCUE"
        : null,
  };
}
export function resolveDay(state: Scenario): Scenario {
  if (state.phase !== "PLAYING") return state;
  const next = clone(state);
  const delta = forecast(state);
  for (const key of RESOURCES) {
    next.resources[key] = Math.max(
      0,
      Math.min(
        key === "credits" ? Number.MAX_SAFE_INTEGER : CONFIG.resourceMax,
        state.resources[key] + delta[key],
      ),
    );
    delta[key] = next.resources[key] - state.resources[key];
  }
  next.completedDays += 1;
  Object.assign(next, survival(next.resources, next.completedDays));
  next.phase = next.outcome ? "RESULT" : "PLAYING";
  next.day = next.outcome ? state.day : state.day + 1;
  next.resupplyUsed = next.outcome ? state.resupplyUsed : false;
  next.lastReport = { day: state.day, delta };
  return next;
}
export function resupply(state: Scenario, resource: CoreResource): Scenario {
  if (
    state.phase !== "PLAYING" ||
    !CORE.includes(resource) ||
    Number(state.resupplyUsed) >= CONFIG.resupplyPerDayLimit ||
    state.resources.credits < CONFIG.resupplyCreditCost ||
    state.resources[resource] >= CONFIG.resourceMax
  )
    return state;
  const next = clone(state);
  next.resources.credits -= CONFIG.resupplyCreditCost;
  next.resources[resource] = Math.min(
    CONFIG.resourceMax,
    next.resources[resource] + CONFIG.resupplyAmount,
  );
  next.resupplyUsed = true;
  return next;
}
