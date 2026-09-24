export const CORE = ["energy", "oxygen", "food"] as const;
export const RESOURCES = [...CORE, "credits"] as const;
export type CoreResource = (typeof CORE)[number];
export type Resource = (typeof RESOURCES)[number];
export type Resources = Record<Resource, number>;
export const MODULE_IDS = [
  "reactor",
  "oxygen",
  "hydroponics",
  "support",
] as const;
export type ModuleId = (typeof MODULE_IDS)[number];
export const CREW_IDS = ["01", "02", "03"] as const;
export type CrewId = (typeof CREW_IDS)[number];
export const CONFIG = {
  gameId: "station-quartermaster",
  schemaVersion: 1,
  saveKey: "hs.game004.scenario",
  scenarioDays: 10,
  resourceMax: 100,
  startingResources: {
    energy: 60,
    oxygen: 52,
    food: 48,
    credits: 18,
  } satisfies Resources,
  dailyConsumption: {
    energy: 17,
    oxygen: 15,
    food: 13,
    credits: 0,
  } satisfies Resources,
  modules: {
    reactor: {
      label: "Reactor",
      resource: "energy",
      baseOutput: 3,
      staffedMultiplier: 4,
    },
    oxygen: {
      label: "Oxygen recycler",
      resource: "oxygen",
      baseOutput: 2,
      staffedMultiplier: 4,
    },
    hydroponics: {
      label: "Hydroponics",
      resource: "food",
      baseOutput: 2,
      staffedMultiplier: 4,
    },
    support: {
      label: "Support / trade",
      resource: "credits",
      baseOutput: 2,
      staffedMultiplier: 4,
    },
  } satisfies Record<
    ModuleId,
    {
      label: string;
      resource: Resource;
      baseOutput: number;
      staffedMultiplier: number;
    }
  >,
  resupplyCreditCost: 12,
  resupplyAmount: 12,
  resupplyPerDayLimit: 1,
  failureThresholds: { energy: 0, oxygen: 0, food: 0 },
  warningThreshold: 30,
  criticalThreshold: 15,
  feedback: { resolveMs: 850, pulseMs: 650, numberMs: 450 },
} as const;
