export const LOCATION_IDS = ['operations', 'yard', 'archive', 'sublevel'] as const;
export type LocationId = typeof LOCATION_IDS[number];
export const FLAGS = ['asked_identity', 'asked_below', 'challenged_signal', 'trusted_signal', 'rejected_signal'] as const;
export type Flag = typeof FLAGS[number];
export const CLUE_IDS = ['direction', 'history', 'isolation'] as const;
export type ClueId = typeof CLUE_IDS[number];
export type SessionState = 'BOOT' | 'MENU' | 'EXPLORING' | 'DIALOGUE' | 'TRANSITION' | 'ENDING';
export type EndingId = 'silence' | 'answer';
export type Condition =
  | { flag: Flag; value?: boolean }
  | { completed: string }
  | { clue: ClueId }
  | { allClues: true };
export type Effect = { flag: Flag; value: boolean } | { clue: ClueId } | { complete: string };
export type Variant = { when: Condition[]; text: string };
export interface Choice {
  id: string; label: string; reply: string; variants?: Variant[]; when?: Condition[]; effects: Effect[];
  ending?: EndingId;
}
export interface Dialogue { id: string; location: LocationId; source: string; text: string; variants?: Variant[]; choices: Choice[] }
export interface Hotspot {
  id: string; label: string; subtitle: string; x: number; y: number; when?: Condition[];
  text?: string; effects?: Effect[]; dialogue?: string;
}
export interface Location {
  id: LocationId; number: string; name: string; caption: string; description: string; objective: string;
  when: Condition[]; background: string; hotspots: Hotspot[];
}
export interface LogicalState {
  currentLocationId: LocationId;
  currentDialogueId: string | null;
  dialoguePhase: 'question' | 'reply' | null;
  flags: Record<Flag, boolean>;
  completedInteractions: string[];
  discoveredClues: ClueId[];
  relevantChoiceOutcomes: Record<string, string>;
  sessionState: 'EXPLORING' | 'DIALOGUE' | 'ENDING';
  ending: EndingId | null;
}
export const TIMING = { roomFade: 360, pulse: 1700, notice: 4500 } as const;
export function initialState(): LogicalState {
  return {
    currentLocationId: 'operations', currentDialogueId: null, dialoguePhase: null,
    flags: { asked_identity: false, asked_below: false, challenged_signal: false, trusted_signal: false, rejected_signal: false },
    completedInteractions: [], discoveredClues: [], relevantChoiceOutcomes: {}, sessionState: 'EXPLORING', ending: null,
  };
}
