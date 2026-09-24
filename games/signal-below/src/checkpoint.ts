import { DIALOGUES, LOCATIONS } from './content';
import { CLUE_IDS, FLAGS, initialState, LOCATION_IDS } from './model';
import type { LogicalState } from './model';
import { ConditionEvaluator, NarrativeEffects } from './narrative';

export const SAVE_KEY = 'hristo.signal-below.checkpoint';
export const GAME_ID = 'signal-below-005';
export const SCHEMA_VERSION = 1;
export interface Checkpoint { schemaVersion: number; gameId: string; timestamp: string; logicalState: LogicalState }
export type LoadResult = { kind: 'empty' } | { kind: 'ok'; state: LogicalState; timestamp: string } | { kind: 'invalid' | 'unavailable'; message: string };
export interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void }
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const uniqueStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string') && new Set(value).size === value.length;
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every(item => b.includes(item));

/** Reject incomplete, contradictory, or stale content references; never fill missing fields. */
export function validateLogicalState(value: unknown): value is LogicalState {
  if (!object(value) || !exactKeys(value, Object.keys(initialState()))) return false;
  if (!LOCATION_IDS.includes(value.currentLocationId as never)) return false;
  if (!object(value.flags) || !exactKeys(value.flags, [...FLAGS]) || !Object.values(value.flags).every(flag => typeof flag === 'boolean')) return false;
  if (!uniqueStrings(value.completedInteractions) || !uniqueStrings(value.discoveredClues)) return false;
  if (!value.discoveredClues.every(clue => CLUE_IDS.includes(clue as never))) return false;
  if (!object(value.relevantChoiceOutcomes)) return false;
  if (!['EXPLORING', 'DIALOGUE', 'ENDING'].includes(value.sessionState as string)) return false;
  if (value.ending !== null && value.ending !== 'silence' && value.ending !== 'answer') return false;
  const state = value as unknown as LogicalState;
  const hotspots = LOCATIONS.flatMap(location => location.hotspots);
  const knownCompleted = [...hotspots.filter(hotspot => !hotspot.dialogue).map(hotspot => hotspot.id), ...DIALOGUES.map(dialogue => dialogue.id)];
  if (state.completedInteractions.some(id => !knownCompleted.includes(id))) return false;
  const expected = initialState();
  for (const id of state.completedInteractions) {
    const hotspot = hotspots.find(hotspot => hotspot.id === id);
    if (hotspot) NarrativeEffects.apply(expected, hotspot.effects ?? []);
  }
  for (const [dialogueId, choiceId] of Object.entries(state.relevantChoiceOutcomes)) {
    if (typeof choiceId !== 'string' || !DIALOGUES.some(dialogue => dialogue.id === dialogueId)) return false;
  }
  // Encounter order is fixed. Replaying its explicit outcomes checks flags without an event log.
  for (const dialogue of DIALOGUES) {
    const chosen = state.relevantChoiceOutcomes[dialogue.id];
    if (Boolean(chosen) !== state.completedInteractions.includes(dialogue.id)) return false;
    if (!chosen) continue;
    const choice = dialogue.choices.find(choice => choice.id === chosen);
    const hotspot = hotspots.find(hotspot => hotspot.dialogue === dialogue.id)!;
    const location = LOCATIONS.find(location => location.id === dialogue.location)!;
    if (!choice || !ConditionEvaluator.meets(state, choice.when) || !ConditionEvaluator.meets(state, hotspot.when) || !ConditionEvaluator.meets(state, location.when)) return false;
    NarrativeEffects.apply(expected, choice.effects);
    NarrativeEffects.apply(expected, [{ complete: dialogue.id }]);
  }
  if (!sameSet(expected.discoveredClues, state.discoveredClues) || !sameSet(expected.completedInteractions, state.completedInteractions)) return false;
  if (FLAGS.some(flag => expected.flags[flag] !== state.flags[flag])) return false;
  for (const location of LOCATIONS) {
    if (location.hotspots.some(hotspot => state.completedInteractions.includes(hotspot.id) && !ConditionEvaluator.meets(state, hotspot.when))) return false;
    if (location.hotspots.some(hotspot => state.completedInteractions.includes(hotspot.id)) && !ConditionEvaluator.meets(state, location.when)) return false;
  }
  if (!ConditionEvaluator.meets(state, LOCATIONS.find(location => location.id === state.currentLocationId)!.when)) return false;
  if (state.sessionState === 'DIALOGUE') {
    const dialogue = DIALOGUES.find(dialogue => dialogue.id === state.currentDialogueId);
    const hotspot = hotspots.find(hotspot => hotspot.dialogue === state.currentDialogueId);
    if (!dialogue || !hotspot || dialogue.location !== state.currentLocationId || !ConditionEvaluator.meets(state, hotspot.when) || state.ending) return false;
    if (state.dialoguePhase !== (state.relevantChoiceOutcomes[dialogue.id] ? 'reply' : 'question')) return false;
  } else if (state.currentDialogueId !== null || state.dialoguePhase !== null) return false;
  if (state.sessionState === 'ENDING') {
    if (!state.ending || state.currentLocationId !== 'sublevel') return false;
    const endingChoice = DIALOGUES.find(dialogue => dialogue.id === 'final')!.choices.find(choice => choice.id === state.relevantChoiceOutcomes.final);
    if (endingChoice?.ending !== state.ending) return false;
  } else if (state.ending !== null || Object.hasOwn(state.relevantChoiceOutcomes, 'final')) return false;
  return true;
}

export function encodeCheckpoint(state: LogicalState): string {
  if (!validateLogicalState(state)) throw new Error('Refusing to save invalid narrative state');
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, gameId: GAME_ID, timestamp: new Date().toISOString(), logicalState: state } satisfies Checkpoint);
}
export function decodeCheckpoint(raw: string): LoadResult {
  try {
    const data: unknown = JSON.parse(raw);
    if (!object(data) || !exactKeys(data, ['schemaVersion', 'gameId', 'timestamp', 'logicalState'])) return { kind: 'invalid', message: 'The checkpoint is incomplete or damaged.' };
    if (data.gameId !== GAME_ID || data.schemaVersion !== SCHEMA_VERSION) return { kind: 'invalid', message: 'This checkpoint belongs to another game or an unsupported save version.' };
    if (typeof data.timestamp !== 'string' || !Number.isFinite(Date.parse(data.timestamp)) || new Date(data.timestamp).toISOString() !== data.timestamp) return { kind: 'invalid', message: 'The checkpoint timestamp is invalid.' };
    if (!validateLogicalState(data.logicalState)) return { kind: 'invalid', message: 'The checkpoint contains missing content or inconsistent narrative state.' };
    return { kind: 'ok', state: structuredClone(data.logicalState), timestamp: data.timestamp };
  } catch { return { kind: 'invalid', message: 'The checkpoint could not be read. It has been left untouched.' }; }
}
export class CheckpointSystem {
  constructor(private readonly storage: () => StoragePort = () => localStorage) {}
  load(): LoadResult {
    try { const raw = this.storage().getItem(SAVE_KEY); return raw === null ? { kind: 'empty' } : decodeCheckpoint(raw); }
    catch { return { kind: 'unavailable', message: 'Browser storage is unavailable. You can play, but this session cannot be resumed after closing the page.' }; }
  }
  save(state: LogicalState): { ok: boolean; message: string } {
    const raw = encodeCheckpoint(state);
    try { this.storage().setItem(SAVE_KEY, raw); return { ok: true, message: 'Checkpoint saved' }; }
    catch { return { ok: false, message: 'Save unavailable — keep this tab open to preserve your session.' }; }
  }
}
